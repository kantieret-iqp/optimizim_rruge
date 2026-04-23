-- DROP first because return type changed
DROP FUNCTION IF EXISTS calculate_route_tsp(integer, date);
DROP FUNCTION IF EXISTS calculate_route_vrp(date);

-- Fix #1: TSP function — pgr_euclideanTSP + LAG in CTE (not in JOIN)
CREATE OR REPLACE FUNCTION calculate_route_tsp(
  p_vehicle_id INTEGER DEFAULT NULL,
  p_date       DATE    DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  seq               INTEGER,
  stop_id           INTEGER,
  stop_name         TEXT,
  lat               DOUBLE PRECISION,
  lng               DOUBLE PRECISION,
  dist_from_prev_km DOUBLE PRECISION,
  tw_open           TIME,
  tw_close          TIME,
  priority          INTEGER
) AS $$
DECLARE
  v_depot_lat DOUBLE PRECISION;
  v_depot_lng DOUBLE PRECISION;
BEGIN
  SELECT d.lat, d.lng INTO v_depot_lat, v_depot_lng FROM depot d LIMIT 1;

  RETURN QUERY
  WITH all_points AS (
    SELECT 0 AS id, 'Depot'::TEXT AS name,
           v_depot_lat AS lat, v_depot_lng AS lng,
           NULL::TIME AS tw_open, NULL::TIME AS tw_close,
           -1 AS priority
    UNION ALL
    SELECT s.id, s.name, s.lat, s.lng, s.tw_open, s.tw_close, s.priority
    FROM stops s WHERE s.active = true
  ),
  -- pgr_euclideanTSP expects: id bigint, x float8, y float8
  tsp_raw AS (
    SELECT * FROM pgr_euclideanTSP(
      'SELECT id::BIGINT, lng::FLOAT8 AS x, lat::FLOAT8 AS y FROM ('
      'SELECT 0 AS id, ' || v_depot_lat || '::FLOAT8 AS lat, ' || v_depot_lng || '::FLOAT8 AS lng '
      'UNION ALL SELECT id, lat, lng FROM stops WHERE active = true) pts',
      0
    )
  ),
  -- LAG must live in its own CTE, not inside a JOIN condition
  tsp_seq AS (
    SELECT
      seq,
      node::INTEGER                               AS cur_node,
      LAG(node::INTEGER) OVER (ORDER BY seq)      AS prev_node
    FROM tsp_raw
  )
  SELECT
    ts.seq::INTEGER,
    p.id::INTEGER,
    p.name,
    p.lat,
    p.lng,
    COALESCE(
      6371.0 * 2.0 * ASIN(SQRT(
        POWER(SIN(RADIANS(p.lat  - pp.lat)  / 2.0), 2) +
        COS(RADIANS(pp.lat)) * COS(RADIANS(p.lat)) *
        POWER(SIN(RADIANS(p.lng  - pp.lng)  / 2.0), 2)
      )),
      0.0
    )::DOUBLE PRECISION,
    p.tw_open,
    p.tw_close,
    p.priority::INTEGER
  FROM tsp_seq ts
  JOIN      all_points p  ON p.id = ts.cur_node
  LEFT JOIN all_points pp ON pp.id = ts.prev_node
  ORDER BY ts.seq;
END;
$$ LANGUAGE plpgsql;


-- Fix #2: VRP function — rename dist_km → dist_from_prev_km
CREATE OR REPLACE FUNCTION calculate_route_vrp(
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  vehicle_id        INTEGER,
  vehicle_name      TEXT,
  seq               INTEGER,
  stop_id           INTEGER,
  stop_name         TEXT,
  lat               DOUBLE PRECISION,
  lng               DOUBLE PRECISION,
  dist_from_prev_km DOUBLE PRECISION
) AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count FROM vehicles WHERE active = true;

  RETURN QUERY
  WITH clustered AS (
    SELECT s.id, s.name, s.lat, s.lng,
      ST_ClusterKMeans(s.geom, v_count) OVER () AS cluster_id
    FROM stops s WHERE s.active = true
  ),
  vlist AS (
    SELECT id, name,
           (ROW_NUMBER() OVER (ORDER BY id) - 1)::INTEGER AS cluster_idx
    FROM vehicles WHERE active = true
  )
  SELECT
    vl.id::INTEGER,
    vl.name,
    ROW_NUMBER() OVER (PARTITION BY c.cluster_id ORDER BY c.id)::INTEGER,
    c.id::INTEGER,
    c.name,
    c.lat,
    c.lng,
    0.0::DOUBLE PRECISION
  FROM clustered c
  JOIN vlist vl ON vl.cluster_idx = c.cluster_id
  ORDER BY vl.id, c.id;
END;
$$ LANGUAGE plpgsql;
