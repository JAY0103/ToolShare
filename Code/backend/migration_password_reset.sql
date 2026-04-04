-- migration: add password_reset_tokens table
-- Run this once against your MySQL database to support DB-backed password resets

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token      VARCHAR(64)  PRIMARY KEY,
  user_id    INT          NOT NULL,
  email      VARCHAR(255) NOT NULL,
  expires_at DATETIME     NOT NULL,
  INDEX idx_user_id (user_id)
);
