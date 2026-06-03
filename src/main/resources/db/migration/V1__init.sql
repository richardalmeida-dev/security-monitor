-- Flyway é a fonte única do schema. spring.jpa.hibernate.ddl-auto=none.
-- LGPD: tabelas events/alerts contêm dado pessoal (IP, login). Logs próprios
-- também precisam de proteção, retenção e base legal definida no uso real.

CREATE TABLE events (
    id              BIGSERIAL    PRIMARY KEY,
    event_type      VARCHAR(32)  NOT NULL,
    source_system   VARCHAR(32)  NOT NULL,
    username        VARCHAR(128),
    ip              VARCHAR(64)  NOT NULL,
    country         VARCHAR(64),
    city            VARCHAR(128),
    user_agent      VARCHAR(512),
    details         VARCHAR(2000),
    occurred_at     TIMESTAMPTZ  NOT NULL,
    received_at     TIMESTAMPTZ  NOT NULL
);

CREATE INDEX idx_events_ip                ON events (ip);
CREATE INDEX idx_events_occurred_at       ON events (occurred_at);
CREATE INDEX idx_events_event_type        ON events (event_type);
CREATE INDEX idx_events_ip_type_occurred  ON events (ip, event_type, occurred_at);

CREATE TABLE alerts (
    id              BIGSERIAL    PRIMARY KEY,
    alert_type      VARCHAR(48)  NOT NULL,
    ip              VARCHAR(64)  NOT NULL,
    username        VARCHAR(128),
    country         VARCHAR(64),
    city            VARCHAR(128),
    message         VARCHAR(1000) NOT NULL,
    occurrences     INTEGER      NOT NULL DEFAULT 1,
    created_at      TIMESTAMPTZ  NOT NULL,
    window_start    TIMESTAMPTZ  NOT NULL,
    window_end      TIMESTAMPTZ  NOT NULL
);

CREATE INDEX idx_alerts_created_at        ON alerts (created_at);
CREATE INDEX idx_alerts_ip                ON alerts (ip);
CREATE INDEX idx_alerts_type_ip_window    ON alerts (alert_type, ip, window_end);
