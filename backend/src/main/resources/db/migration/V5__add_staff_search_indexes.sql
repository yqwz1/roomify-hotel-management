-- Staff search optimization
CREATE INDEX idx_staff_name ON staff (name);
CREATE INDEX idx_staff_department ON staff (department);
CREATE INDEX idx_staff_active ON staff (is_active);

-- User filters optimization
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_email ON users (email);
