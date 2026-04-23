CREATE TABLE IF NOT EXISTS expenses (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description VARCHAR(1000),
    category VARCHAR(40) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    expense_date DATE NOT NULL,
    vendor VARCHAR(150),
    payment_method VARCHAR(20),
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    receipt_file_name VARCHAR(255),
    receipt_file_url VARCHAR(500),
    created_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_vendor ON expenses(vendor);
