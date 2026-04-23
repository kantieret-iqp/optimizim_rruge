-- supabase/migrations/20240101000000_init_pgrouting.sql
-- Ekzekuto në: Supabase Dashboard → SQL Editor

-- Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgrouting;

-- Tabela: vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  capacity   INTEGER NOT NULL DEFAULT 50,
  active     BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: depot
CREATE TABLE IF NOT EXISTS depot (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Depot kryesor',
  lat  DOUBLE PRECISION NOT NULL,
  lng  DOUBLE PRECISION NOT NULL,
  geom GEOMETRY(Point, 4326)
);

-- Tabela: stops
CREATE TABLE IF NOT EXISTS stops (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  address     TEXT,
  geom        GEOMETRY(Point, 4326),
  lat         DOUBLE PRECISION NOT NULL,
  lng         DOUBLE PRECISION NOT NULL,
  demand      INTEGER DEFAULT 1,
  tw_open     TIME,
  tw_close    TIME,
  service_sec INTEGER DEFAULT 300,
  priority    INTEGER DEFAULT 0,
  active      BOOLEAN DEFAULT true,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: routes
CREATE TABLE IF NOT EXISTS routes (
  id            SERIAL PRIMARY KEY,
  vehicle_id    INTEGER REFERENCES vehicles(id),
  date          DATE DEFAULT CURRENT_DATE,
  stop_sequence JSONB,
  total_dist_km DOUBLE PRECISION,
  total_stops   INTEGER,
  status        TEXT DEFAULT 'pending',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: sinkronizo geom nga lat/lng
CREATE OR REPLACE FUNCTION sync_geom() RETURNS TRIGGER AS $$
BEGIN
  NEW.geom := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stops_sync_geom
  BEFORE INSERT OR UPDATE OF lat, lng ON stops
  FOR EACH ROW EXECUTE FUNCTION sync_geom();

CREATE TRIGGER depot_sync_geom
  BEFORE INSERT OR UPDATE OF lat, lng ON depot
  FOR EACH ROW EXECUTE FUNCTION sync_geom();

-- Funksioni TSP
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
  dist_matrix AS (
    SELECT a.id AS from_id, b.id AS to_id,
      6371 * 2 * ASIN(SQRT(
        POWER(SIN(RADIANS(b.lat - a.lat) / 2), 2) +
        COS(RADIANS(a.lat)) * COS(RADIANS(b.lat)) *
        POWER(SIN(RADIANS(b.lng - a.lng) / 2), 2)
      )) AS dist_km
    FROM all_points a CROSS JOIN all_points b WHERE a.id != b.id
  ),
  tsp_result AS (
    SELECT * FROM pgr_tsp(
      'SELECT id, lat AS y, lng AS x FROM ('
      'SELECT 0 AS id, ' || v_depot_lat || ' AS lat, ' || v_depot_lng || ' AS lng '
      'UNION ALL SELECT id, lat, lng FROM stops WHERE active = true) pts',
      0, directed => false
    )
  )
  SELECT
    t.seq::INTEGER, p.id, p.name, p.lat, p.lng,
    COALESCE(d.dist_km, 0),
    p.tw_open, p.tw_close, p.priority
  FROM tsp_result t
  JOIN all_points p ON p.id = t.node
  LEFT JOIN dist_matrix d ON (
    d.from_id = LAG(t.node) OVER (ORDER BY t.seq) AND d.to_id = t.node
  )
  ORDER BY t.seq;
END;
$$ LANGUAGE plpgsql;

-- Funksioni VRP me clustering
CREATE OR REPLACE FUNCTION calculate_route_vrp(
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  vehicle_id   INTEGER,
  vehicle_name TEXT,
  seq          INTEGER,
  stop_id      INTEGER,
  stop_name    TEXT,
  lat          DOUBLE PRECISION,
  lng          DOUBLE PRECISION,
  dist_km      DOUBLE PRECISION
) AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM vehicles WHERE active = true;

  RETURN QUERY
  WITH clustered AS (
    SELECT s.id, s.name, s.lat, s.lng,
      ST_ClusterKMeans(s.geom, v_count) OVER () AS cluster_id
    FROM stops s WHERE s.active = true
  ),
  vlist AS (
    SELECT id, name, ROW_NUMBER() OVER (ORDER BY id) - 1 AS cluster_idx
    FROM vehicles WHERE active = true
  )
  SELECT vl.id, vl.name,
    ROW_NUMBER() OVER (PARTITION BY c.cluster_id ORDER BY c.id)::INTEGER,
    c.id, c.name, c.lat, c.lng, 0.0::DOUBLE PRECISION
  FROM clustered c
  JOIN vlist vl ON vl.cluster_idx = c.cluster_id
  ORDER BY vl.id, 3;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies (opsionale — aktivizo nëse keni auth)
-- ALTER TABLE stops ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Public read" ON stops FOR SELECT USING (true);
-- CREATE POLICY "Auth write" ON stops FOR ALL USING (auth.role() = 'authenticated');

-- Të dhëna demo
INSERT INTO depot (name, lat, lng) VALUES ('Depot Tiranë', 41.3275, 19.8187);

INSERT INTO vehicles (name, capacity) VALUES
  ('Shoferi 1 — Furgon i madh', 60),
  ('Shoferi 2 — Furgon i mesëm', 40),
  ('Shoferi 3 — Makinë e vogël', 25);

INSERT INTO stops (name, address, lat, lng, demand, tw_open, tw_close, priority) VALUES
  ('Klienti A — Blloku',   'Rruga e Elbasanit', 41.3300, 19.8200, 3, '08:00', '10:00', 0),
  ('Klienti B — Kombinat', 'Kombinat',           41.3100, 19.7900, 5, '09:00', '12:00', 0),
  ('Klienti C — Vora',     'Vora',               41.3900, 19.6600, 2, '08:30', '11:00', 1),
  ('Klienti D — Kamëz',    'Kamëz',              41.3800, 19.7700, 4, NULL,    NULL,    0),
  ('Klienti E — Durrës',   'Durrës qendër',      41.3234, 19.4412, 6, '10:00', '14:00', 0),
  ('Klienti F — Farkë',    'Farkë',              41.3600, 19.8900, 2, NULL,    NULL,    0);
