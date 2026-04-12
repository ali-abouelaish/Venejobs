-- Migration: drop legacy messages.read_at column
-- Per-user read state is now tracked in message_reads(message_id, user_id, read_at).
-- Safe to re-run (IF EXISTS).

ALTER TABLE messages DROP COLUMN IF EXISTS read_at;
