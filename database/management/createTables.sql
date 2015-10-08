-- useful things --

CREATE TABLE IF NOT EXISTS lifecycle(
    created_at  timestamp without time zone DEFAULT current_timestamp,
    updated_at  timestamp without time zone DEFAULT current_timestamp
);

CREATE TYPE wifi_status AS ENUM ('sleeping', 'monitoring', 'recording');
CREATE TYPE blue_status AS ENUM ('uninitialized', 'initialized', 'recording');
CREATE TYPE signal_status AS ENUM ('NODATA', 'GPRS', 'EDGE', '3G', 'H/H+');
CREATE TYPE client_status AS ENUM ('disconnected', 'connected', 'tunnelling');

-- http://www.revsys.com/blog/2006/aug/04/automatically-updating-a-timestamp-column-in-postgresql/
CREATE OR REPLACE FUNCTION update_updated_at_column()	
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;	
END;
$$ language 'plpgsql';


-- Business tables --

CREATE TABLE IF NOT EXISTS places (
    id           SERIAL PRIMARY KEY,
    name         text NOT NULL,
    type         text DEFAULT NULL,
    lat          real NOT NULL,
    lon          real NOT NULL
) INHERITS(lifecycle);
CREATE TRIGGER updated_at_places BEFORE UPDATE ON places FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();


CREATE TABLE IF NOT EXISTS sensors (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    -- type         some_enum -- affluence/bin-level
    installed_at    integer REFERENCES places (id) DEFAULT NULL,
    project         text DEFAULT NULL,
    sim             text UNIQUE NOT NULL,
    client_status   client_status DEFAULT NULL, 
    wifi_status     wifi_status DEFAULT NULL,
    blue_status     blue_status DEFAULT NULL,
    signal_status   signal_status DEFAULT NULL,
    latest_input    text DEFAULT NULL, --Command
    latest_output   text DEFAULT NULL, --Result
    period          real DEFAULT 300, --One measurement every 300 seconds
    start_hour      real DEFAULT 7, --Start at 7h UTC
    stop_hour       real DEFAULT 16 --End at 16h UTC
) INHERITS(lifecycle);
CREATE TRIGGER updated_at_sensors BEFORE UPDATE ON sensors FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();


CREATE TABLE IF NOT EXISTS measurements (
    id                  SERIAL PRIMARY KEY,
    sensor_sim          text REFERENCES sensors (sim) NOT NULL,
    type                text NOT NULL, -- This can be signal_strength, temperature, pressure, ... but we can't presuppose it in an enum.
    "value"             real[] NOT NULL, -- This was changed from signal_strengths to measurements
    "date"              timestamp without time zone NOT NULL
) INHERITS(lifecycle);
CREATE TRIGGER updated_at_measurements BEFORE UPDATE ON measurements FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE INDEX type ON measurements (type);
CREATE INDEX project ON sensors (project);

