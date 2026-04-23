-- Shto shoferë shtesë (total 6)
INSERT INTO vehicles (name, capacity) VALUES
  ('Shoferi 4 — Furgon i vogël', 30),
  ('Shoferi 5 — Makinë', 20),
  ('Shoferi 6 — Kamion i madh', 100)
ON CONFLICT DO NOTHING;
