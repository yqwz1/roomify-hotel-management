CREATE TABLE IF NOT EXISTS room_types (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100)   NOT NULL,
    base_price  NUMERIC(10, 2) NOT NULL,
    max_guests  INTEGER        NOT NULL,
    amenities   TEXT,
    description TEXT,
    CONSTRAINT uk_room_type_name UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS guests (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(120) NOT NULL,
    email       VARCHAR(255) NOT NULL,
    phone       VARCHAR(30)  NOT NULL,
    id_number   VARCHAR(50)  NOT NULL,
    nationality VARCHAR(100) NOT NULL,
    CONSTRAINT uk_guest_email     UNIQUE (email),
    CONSTRAINT uk_guest_id_number UNIQUE (id_number)
);

CREATE TABLE IF NOT EXISTS rooms (
    id           BIGSERIAL PRIMARY KEY,
    room_number  VARCHAR(50) NOT NULL,
    room_type_id BIGINT      NOT NULL,
    floor        INTEGER,
    status       VARCHAR(20) NOT NULL,
    CONSTRAINT uk_room_number    UNIQUE (room_number),
    CONSTRAINT fk_rooms_room_type FOREIGN KEY (room_type_id) REFERENCES room_types(id)
);

CREATE INDEX IF NOT EXISTS idx_rooms_room_type_id ON rooms(room_type_id);

-- Base reservations table; V7/V8/V9 add lifecycle, financial, and payment columns.
CREATE TABLE IF NOT EXISTS reservations (
    id                  BIGSERIAL PRIMARY KEY,
    guest_id            BIGINT         NOT NULL,
    room_id             BIGINT         NOT NULL,
    check_in_date       DATE           NOT NULL,
    check_out_date      DATE           NOT NULL,
    total_price         NUMERIC(10, 2) NOT NULL,
    status              VARCHAR(20)    NOT NULL,
    confirmation_number VARCHAR(100)   NOT NULL,
    invoice_number      VARCHAR(100),
    created_at          TIMESTAMP      NOT NULL,
    CONSTRAINT uk_reservation_confirmation_number UNIQUE (confirmation_number),
    CONSTRAINT uk_reservation_invoice_number      UNIQUE (invoice_number),
    CONSTRAINT fk_reservations_guest FOREIGN KEY (guest_id) REFERENCES guests(id),
    CONSTRAINT fk_reservations_room  FOREIGN KEY (room_id)  REFERENCES rooms(id)
);

CREATE INDEX IF NOT EXISTS idx_reservations_check_in_date  ON reservations(check_in_date);
CREATE INDEX IF NOT EXISTS idx_reservations_check_out_date ON reservations(check_out_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status         ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_room_id        ON reservations(room_id);

CREATE TABLE IF NOT EXISTS services (
    id       BIGSERIAL PRIMARY KEY,
    name     VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    price    NUMERIC(19, 2),
    active   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS payments (
    id                BIGSERIAL PRIMARY KEY,
    reservation_id    BIGINT         NOT NULL,
    amount            NUMERIC(10, 2) NOT NULL,
    payment_method    VARCHAR(20)    NOT NULL,
    payment_status    VARCHAR(20)    NOT NULL,
    gateway_reference VARCHAR(100),
    failure_reason    VARCHAR(500),
    created_at        TIMESTAMP      NOT NULL,
    CONSTRAINT fk_payments_reservation FOREIGN KEY (reservation_id) REFERENCES reservations(id)
);

CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

CREATE TABLE IF NOT EXISTS service_charges (
    id             BIGSERIAL PRIMARY KEY,
    reservation_id BIGINT         NOT NULL,
    service_id     BIGINT         NOT NULL,
    price          NUMERIC(19, 2),
    quantity       INTEGER        NOT NULL DEFAULT 0,
    total          NUMERIC(19, 2),
    created_at     TIMESTAMP,
    CONSTRAINT fk_service_charges_reservation FOREIGN KEY (reservation_id) REFERENCES reservations(id),
    CONSTRAINT fk_service_charges_service     FOREIGN KEY (service_id)     REFERENCES services(id)
);

CREATE TABLE IF NOT EXISTS email_log (
    id                  BIGSERIAL PRIMARY KEY,
    recipient           VARCHAR(255),
    subject             VARCHAR(255),
    status              VARCHAR(255),
    error_message       VARCHAR(255),
    confirmation_number VARCHAR(255),
    created_at          TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoice (
    id                  BIGSERIAL PRIMARY KEY,
    invoice_number      VARCHAR(255),
    confirmation_number VARCHAR(255),
    pdf_file_name       VARCHAR(255),
    created_at          TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoice_delivery_logs (
    id                  BIGSERIAL PRIMARY KEY,
    recipient           VARCHAR(255)  NOT NULL,
    subject             VARCHAR(255)  NOT NULL,
    confirmation_number VARCHAR(255)  NOT NULL,
    status              VARCHAR(255)  NOT NULL,
    error_message       VARCHAR(1000),
    created_at          TIMESTAMP     NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invoice_delivery_confirmation ON invoice_delivery_logs(confirmation_number);
CREATE INDEX IF NOT EXISTS idx_invoice_delivery_created      ON invoice_delivery_logs(created_at);

CREATE TABLE IF NOT EXISTS notifications (
    id                BIGSERIAL PRIMARY KEY,
    event_type        VARCHAR(40)   NOT NULL,
    target_role       VARCHAR(20)   NOT NULL,
    target_department VARCHAR(50),
    title             VARCHAR(150)  NOT NULL,
    message           VARCHAR(1000) NOT NULL,
    reference_type    VARCHAR(40),
    reference_id      VARCHAR(80),
    is_read           BOOLEAN       NOT NULL DEFAULT FALSE,
    read_at           TIMESTAMP,
    created_at        TIMESTAMP     NOT NULL
);
