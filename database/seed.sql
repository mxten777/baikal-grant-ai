-- Default admin user (password: admin1234 - bcrypt hash)
INSERT INTO users (email, password_hash, full_name, role)
VALUES (
  'admin@baikal.ai',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RKe.9RYLC',
  'BAIKAL 관리자',
  'admin'
) ON CONFLICT (email) DO NOTHING;
