-- calculate_route_vrp me parametër opsional p_vehicle_count
DROP FUNCTION IF EXISTS calculate_route_vrp(date);

CREATE OR REPLACE FUNCTION calculate_route_vrp(
  p_date          DATE    DEFAULT CURRENT_DATE,
  p_vehicle_count INTEGER DEFAULT NULL
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
  IF p_vehicle_count IS NOT NULL AND p_vehicle_count > 0 THEN
    v_count := p_vehicle_count;
  ELSE
    SELECT COUNT(*)::INTEGER INTO v_count FROM vehicles WHERE active = true;
  END IF;

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
    ORDER BY id
    LIMIT v_count
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
