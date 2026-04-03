-- ============================================================
-- Migration 002 — GHL OAuth Tokens + Site Config
-- Groupe Djamiyah
-- ============================================================

-- ── Table des tokens OAuth GHL ───────────────────────────────

CREATE TABLE IF NOT EXISTS ghl_oauth_tokens (
  id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id   TEXT        NOT NULL UNIQUE,
  access_token  TEXT        NOT NULL,
  refresh_token TEXT        NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  scope         TEXT        NOT NULL DEFAULT '',
  token_type    TEXT        NOT NULL DEFAULT 'Bearer',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour recherche rapide par location_id
CREATE INDEX IF NOT EXISTS idx_ghl_oauth_tokens_location
  ON ghl_oauth_tokens (location_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER ghl_oauth_tokens_updated_at
  BEFORE UPDATE ON ghl_oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS : accès uniquement via service_role (jamais côté client)
ALTER TABLE ghl_oauth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON ghl_oauth_tokens
  USING (auth.role() = 'service_role');

-- ── Table de configuration du site ───────────────────────────

CREATE TABLE IF NOT EXISTS site_config (
  key        TEXT        NOT NULL PRIMARY KEY,
  value      TEXT        NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger updated_at
CREATE TRIGGER site_config_updated_at
  BEFORE UPDATE ON site_config
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS : lecture publique, écriture service_role uniquement
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON site_config
  FOR SELECT USING (true);

CREATE POLICY "Service role write" ON site_config
  FOR ALL USING (auth.role() = 'service_role');

-- ── Seed : clés de configuration par défaut ──────────────────

INSERT INTO site_config (key, value) VALUES
  ('salematou_avatar_url', ''),
  ('concierge_online', 'true'),
  ('concierge_welcome_message', 'Bonjour ! Je suis Salematou, votre concierge au Groupe Djamiyah. Comment puis-je vous aider ? 🌟')
ON CONFLICT (key) DO NOTHING;
