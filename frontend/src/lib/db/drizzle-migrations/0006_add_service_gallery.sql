-- Phase: gallery images for services.
-- Adds gallery_image_urls (JSONB array of public URLs) to services so a
-- service can show a carousel on its detail page. The existing
-- cover_image_url stays as the primary / OG-card hero; gallery is the rest.
--
-- Idempotent: safe to replay. See MIGRATION.md "Reconciliation drift".

ALTER TABLE "services"
  ADD COLUMN IF NOT EXISTS "gallery_image_urls" jsonb NOT NULL DEFAULT '[]'::jsonb;
