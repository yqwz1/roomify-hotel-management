CREATE TABLE IF NOT EXISTS price_elasticity_forecasts (
    id BIGSERIAL PRIMARY KEY,
    generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    room_type_id BIGINT NOT NULL,
    current_price NUMERIC(10, 2) NOT NULL,
    suggested_price NUMERIC(10, 2) NOT NULL,
    price_delta_percentage NUMERIC(7, 2) NOT NULL,
    expected_occupancy NUMERIC(5, 2) NOT NULL,
    expected_bookings INTEGER NOT NULL,
    expected_revenue NUMERIC(14, 2) NOT NULL,
    expected_profit NUMERIC(14, 2) NOT NULL,
    confidence_score NUMERIC(5, 2) NOT NULL,
    is_recommended BOOLEAN NOT NULL DEFAULT FALSE,
    source VARCHAR(40) NOT NULL,
    CONSTRAINT fk_price_elasticity_forecasts_room_type
        FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_price_elasticity_forecasts_room_type_id
    ON price_elasticity_forecasts(room_type_id);
CREATE INDEX IF NOT EXISTS idx_price_elasticity_forecasts_generated_at
    ON price_elasticity_forecasts(generated_at);

CREATE TABLE IF NOT EXISTS ai_price_recommendations (
    id BIGSERIAL PRIMARY KEY,
    generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    room_type_id BIGINT NOT NULL,
    current_price NUMERIC(10, 2) NOT NULL,
    suggested_price NUMERIC(10, 2) NOT NULL,
    expected_occupancy NUMERIC(5, 2) NOT NULL,
    expected_bookings INTEGER NOT NULL,
    expected_revenue NUMERIC(14, 2) NOT NULL,
    expected_profit NUMERIC(14, 2) NOT NULL,
    confidence_score NUMERIC(5, 2) NOT NULL,
    source VARCHAR(40) NOT NULL,
    CONSTRAINT fk_ai_price_recommendations_room_type
        FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_price_recommendations_room_type_id
    ON ai_price_recommendations(room_type_id);
CREATE INDEX IF NOT EXISTS idx_ai_price_recommendations_generated_at
    ON ai_price_recommendations(generated_at);
