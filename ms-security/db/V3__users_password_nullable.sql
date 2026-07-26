-- Nullable password for OAuth-only accounts (GitHub/Google without local password)
ALTER TABLE security.users
    ALTER COLUMN password DROP NOT NULL;
