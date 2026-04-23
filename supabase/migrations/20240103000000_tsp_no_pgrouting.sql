-- TSP me nearest-neighbor (pa pgRouting) — zgjedhë pikaën më të afërt radhazi
DROP FUNCTION IF EXISTS calculate_route_tsp(integer, date);

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
  v_depot_lat   DOUBLE PRECISION;
  v_depot_lng   DOUBLE PRECISION;
  v_current_lat DOUBLE PRECISION;
  v_current_lng DOUBLE PRECISION;
  v_visited     INTEGER[] := '{}';
  v_seq         INTEGER   := 1;
  v_rec         RECORD;
BEGIN
  SELECT d.lat, d.lng INTO v_depot_lat, v_depot_lng FROM depot d LIMIT 1;
  v_current_lat := v_depot_lat;
  v_current_lng := v_depot_lng;

  LOOP
    SELECT
      s.id, s.name, s.lat, s.lng, s.tw_open, s.tw_close, s.priority,
      6371.0 * 2.0 * ASIN(SQRT(
        POWER(SIN(RADIANS(s.lat - v_current_lat) / 2.0), 2) +
        COS(RADIANS(v_current_lat)) * COS(RADIANS(s.lat)) *
        POWER(SIN(RADIANS(s.lng - v_current_lng) / 2.0), 2)
      )) AS dist_km
    INTO v_rec
    FROM stops s
    WHERE s.active = true
      AND NOT (s.id = ANY(v_visited))
    ORDER BY dist_km
    LIMIT 1;

    EXIT WHEN NOT FOUND;

    seq               := v_seq;
    stop_id           := v_rec.id;
    stop_name         := v_rec.name;
    lat               := v_rec.lat;
    lng               := v_rec.lng;
    dist_from_prev_km := v_rec.dist_km;
    tw_open           := v_rec.tw_open;
    tw_close          := v_rec.tw_close;
    priority          := v_rec.priority;
    RETURN NEXT;

    v_visited     := array_append(v_visited, v_rec.id);
    v_current_lat := v_rec.lat;
    v_current_lng := v_rec.lng;
    v_seq         := v_seq + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
