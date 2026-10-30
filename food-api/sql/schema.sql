-- Applied automatically on API startup. Everything here must be idempotent.

-- Food & drinks shown on /lokaal. Prices are in cents: 0 = free, NULL = N/A.
CREATE TABLE IF NOT EXISTS food_categories (
  id         VARCHAR(32) PRIMARY KEY,
  title      VARCHAR(64) NOT NULL,
  emoji      VARCHAR(16) NOT NULL DEFAULT '',
  sort_order INT         NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS food_items (
  id                       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug                     VARCHAR(32)  NOT NULL UNIQUE,
  category_id              VARCHAR(32)  NOT NULL,
  name                     VARCHAR(128) NOT NULL,
  price_non_member_cents   INT UNSIGNED NULL,
  price_member_cents       INT UNSIGNED NULL,
  available                BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order               INT          NOT NULL DEFAULT 0,
  INDEX (category_id),
  FOREIGN KEY (category_id) REFERENCES food_categories(id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- How many are left. NULL = not tracked; 0 = shown as unavailable.
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS amount INT UNSIGNED NULL AFTER price_member_cents;

-- Mainframe Breach leaderboard. score = game_score + flags_found * flag points.
-- version = scoring rules version; the board only shows the current one.
CREATE TABLE IF NOT EXISTS game_scores (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  version     TINYINT UNSIGNED NOT NULL DEFAULT 1,
  name        VARCHAR(16)  NOT NULL,
  class_name  VARCHAR(16)  NOT NULL,
  floor       TINYINT UNSIGNED NOT NULL,
  won         BOOLEAN      NOT NULL DEFAULT FALSE,
  game_score  INT UNSIGNED NOT NULL,
  flags_found TINYINT UNSIGNED NOT NULL DEFAULT 0,
  badge       VARCHAR(16)  NULL,
  score       INT UNSIGNED NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (version, score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
