CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    PRIMARY KEY (user_id, role)
);

INSERT INTO user_roles (user_id, role)
SELECT id, role
FROM users
WHERE role IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM user_roles
      WHERE user_roles.user_id = users.id
        AND user_roles.role = users.role
  );

INSERT INTO user_roles (user_id, role)
SELECT id, 'MANAGER'
FROM users
WHERE email = 'admin@roomify.com'
  AND NOT EXISTS (
      SELECT 1
      FROM user_roles
      WHERE user_roles.user_id = users.id
        AND user_roles.role = 'MANAGER'
  );
