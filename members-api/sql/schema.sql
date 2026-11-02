-- Applied automatically on API startup (only when DB_HOST is set). Everything here must be idempotent.

-- Membership sign-ups from /member-signup. payment starts FALSE and is flipped
-- by hand by the board once the 10€ transfer has come in.
CREATE TABLE IF NOT EXISTS members (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  first_name     VARCHAR(64)  NOT NULL,
  last_name      VARCHAR(64)  NOT NULL,
  student_number VARCHAR(16)  NULL,
  email          VARCHAR(254) NOT NULL,
  discord        VARCHAR(64)  NULL,
  payment        BOOLEAN      NOT NULL DEFAULT FALSE,
  submitted_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (email),
  INDEX (student_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
