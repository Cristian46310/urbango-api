-- ms-security schema on shared Supabase (business uses public)
-- Apply with: psql "$DB_URL" -f ms-security/db/V1__security_schema.sql
-- Or via node/pg against the IPv4 pooler.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SCHEMA IF NOT EXISTS security;
COMMENT ON SCHEMA security IS 'ms-security: auth, RBAC, GitHub OAuth, 2FA (auth_factors); JWT is stateless';

-- ---------------------------------------------------------------------------
-- Core: login / RBAC
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS security.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS security.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(128) NOT NULL,
    description TEXT,
    CONSTRAINT roles_name_unique UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS security.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url VARCHAR(512) NOT NULL,
    method VARCHAR(16) NOT NULL,
    CONSTRAINT permissions_url_method_unique UNIQUE (url, method)
);

CREATE TABLE IF NOT EXISTS security.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES security.users (id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES security.roles (id) ON DELETE CASCADE,
    CONSTRAINT user_roles_user_role_unique UNIQUE (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON security.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON security.user_roles (role_id);

CREATE TABLE IF NOT EXISTS security.role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES security.roles (id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES security.permissions (id) ON DELETE CASCADE,
    CONSTRAINT role_permissions_role_perm_unique UNIQUE (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON security.role_permissions (role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON security.role_permissions (permission_id);

-- ---------------------------------------------------------------------------
-- 2FA / password-reset challenges
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS security.auth_factors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES security.users (id) ON DELETE CASCADE,
    code VARCHAR(128) NOT NULL,
    expiration TIMESTAMPTZ,
    token TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    type VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_factors_user_id ON security.auth_factors (user_id);
CREATE INDEX IF NOT EXISTS idx_auth_factors_token ON security.auth_factors (token);

-- ---------------------------------------------------------------------------
-- GitHub OAuth
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS security.github_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES security.users (id) ON DELETE CASCADE,
    provider_user_id BIGINT NOT NULL,
    username VARCHAR(255),
    display_name VARCHAR(255),
    email VARCHAR(255),
    avatar_url TEXT,
    profile_url TEXT,
    linked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT github_accounts_provider_user_id_unique UNIQUE (provider_user_id),
    CONSTRAINT github_accounts_user_id_unique UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS security.github_auth_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state VARCHAR(255) NOT NULL,
    mode VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    user_id UUID REFERENCES security.users (id) ON DELETE SET NULL,
    expiration TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    github_user_id BIGINT,
    github_username VARCHAR(255),
    github_name VARCHAR(255),
    github_email VARCHAR(255),
    github_avatar_url TEXT,
    github_profile_url TEXT,
    CONSTRAINT github_auth_requests_state_unique UNIQUE (state)
);

-- ---------------------------------------------------------------------------
-- Seed roles (stable names for ms-business MS_SECURITY_ROLE_*_ID later)
-- ---------------------------------------------------------------------------

INSERT INTO security.roles (id, name, description)
VALUES
    (uuid_generate_v4(), 'ADMIN', 'Administrador del sistema'),
    (uuid_generate_v4(), 'USER', 'Usuario básico'),
    (uuid_generate_v4(), 'CITIZEN', 'Ciudadano / pasajero'),
    (uuid_generate_v4(), 'DRIVER', 'Conductor'),
    (uuid_generate_v4(), 'BUSINESS_ADMIN', 'Administrador de empresa de transporte'),
    (uuid_generate_v4(), 'SUPERVISOR', 'Supervisor de operaciones')
ON CONFLICT (name) DO NOTHING;
