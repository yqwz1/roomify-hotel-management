CREATE TABLE IF NOT EXISTS inventory_items (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(40) NOT NULL,
    unit_of_measure VARCHAR(30) NOT NULL,
    current_stock_quantity NUMERIC(15, 3) NOT NULL DEFAULT 0.000,
    minimum_stock_threshold NUMERIC(15, 3) NOT NULL DEFAULT 0.000,
    default_unit_cost NUMERIC(16, 4),
    average_unit_cost NUMERIC(16, 4),
    supplier VARCHAR(150),
    sku VARCHAR(100),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    notes VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
    id BIGSERIAL PRIMARY KEY,
    inventory_item_id BIGINT NOT NULL,
    transaction_type VARCHAR(40) NOT NULL,
    quantity_change NUMERIC(15, 3) NOT NULL,
    stock_before NUMERIC(15, 3),
    stock_after NUMERIC(15, 3),
    unit_cost NUMERIC(16, 4),
    total_value NUMERIC(16, 2),
    occurred_at TIMESTAMP NOT NULL,
    source_reference_type VARCHAR(80),
    source_reference_id VARCHAR(120),
    source_reference_label VARCHAR(255),
    notes VARCHAR(1000),
    created_by_user_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inventory_transactions_item
        FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id),
    CONSTRAINT fk_inventory_transactions_created_by
        FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS service_usage_templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    service_type VARCHAR(40) NOT NULL,
    room_type_id BIGINT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    notes VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_service_usage_templates_room_type
        FOREIGN KEY (room_type_id) REFERENCES room_types(id)
);

CREATE TABLE IF NOT EXISTS service_usage_template_items (
    id BIGSERIAL PRIMARY KEY,
    template_id BIGINT NOT NULL,
    inventory_item_id BIGINT NOT NULL,
    standard_quantity NUMERIC(15, 3) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    notes VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_service_usage_template_items_template
        FOREIGN KEY (template_id) REFERENCES service_usage_templates(id),
    CONSTRAINT fk_service_usage_template_items_inventory_item
        FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id)
);

CREATE TABLE IF NOT EXISTS service_usage_records (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT,
    room_type_id BIGINT,
    service_type VARCHAR(40) NOT NULL,
    template_id BIGINT,
    applied_standard_template BOOLEAN NOT NULL DEFAULT TRUE,
    source_room_status VARCHAR(30),
    service_date DATE NOT NULL,
    performed_at TIMESTAMP NOT NULL,
    total_cost NUMERIC(16, 2) NOT NULL DEFAULT 0.00,
    notes VARCHAR(1000),
    created_by_user_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_service_usage_records_room
        FOREIGN KEY (room_id) REFERENCES rooms(id),
    CONSTRAINT fk_service_usage_records_room_type
        FOREIGN KEY (room_type_id) REFERENCES room_types(id),
    CONSTRAINT fk_service_usage_records_template
        FOREIGN KEY (template_id) REFERENCES service_usage_templates(id),
    CONSTRAINT fk_service_usage_records_created_by
        FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS service_usage_record_items (
    id BIGSERIAL PRIMARY KEY,
    usage_record_id BIGINT NOT NULL,
    inventory_item_id BIGINT NOT NULL,
    template_item_id BIGINT,
    standard_quantity NUMERIC(15, 3),
    actual_quantity NUMERIC(15, 3) NOT NULL,
    unit_cost NUMERIC(16, 4) NOT NULL,
    total_cost NUMERIC(16, 2) NOT NULL,
    notes VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_service_usage_record_items_usage_record
        FOREIGN KEY (usage_record_id) REFERENCES service_usage_records(id),
    CONSTRAINT fk_service_usage_record_items_inventory_item
        FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id),
    CONSTRAINT fk_service_usage_record_items_template_item
        FOREIGN KEY (template_item_id) REFERENCES service_usage_template_items(id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_active ON inventory_items(active);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item ON inventory_transactions(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_occurred_at ON inventory_transactions(occurred_at);
CREATE INDEX IF NOT EXISTS idx_service_usage_templates_room_type ON service_usage_templates(room_type_id);
CREATE INDEX IF NOT EXISTS idx_service_usage_template_items_template ON service_usage_template_items(template_id);
CREATE INDEX IF NOT EXISTS idx_service_usage_template_items_inventory_item ON service_usage_template_items(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_service_usage_records_service_date ON service_usage_records(service_date);
CREATE INDEX IF NOT EXISTS idx_service_usage_records_room ON service_usage_records(room_id);
CREATE INDEX IF NOT EXISTS idx_service_usage_record_items_usage_record ON service_usage_record_items(usage_record_id);
CREATE INDEX IF NOT EXISTS idx_service_usage_record_items_inventory_item ON service_usage_record_items(inventory_item_id);
