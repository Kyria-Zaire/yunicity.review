-- DATA-CLEANUP-01 — Smoke Data Inventory (READ-ONLY)
-- Run on Railway prod Postgres only. No DELETE/UPDATE.

-- 1) Users pilot-m00-*
SELECT id, email, full_name, city, is_active, created_at
FROM users
WHERE email ILIKE 'pilot-m00-%@example.com'
ORDER BY created_at;

-- 2) All @example.com users (broader test accounts)
SELECT id, email, full_name, city, is_active, created_at
FROM users
WHERE email ILIKE '%@example.com'
ORDER BY created_at;

-- 3) INFRA-01 smoke video
SELECT
  lv.id,
  lv.title,
  lv.status,
  lv.storage_key,
  lv.media_url,
  lv.thumbnail_url,
  lv.published_at,
  lv.created_at,
  u.email AS author_email
FROM local_videos lv
JOIN users u ON u.id = lv.author_user_id
WHERE lv.title ILIKE 'INFRA-01 R2 smoke test%'
ORDER BY lv.created_at;

-- 4) Pilote M-00 videos
SELECT
  lv.id,
  lv.title,
  lv.status,
  lv.storage_key,
  lv.media_url,
  lv.thumbnail_url,
  lv.published_at,
  lv.created_at,
  u.email AS author_email
FROM local_videos lv
JOIN users u ON u.id = lv.author_user_id
WHERE lv.title ILIKE 'Pilote M-00%'
ORDER BY lv.created_at;

-- 5) All published local videos by pilot-m00 / example.com authors
SELECT
  lv.id,
  lv.title,
  lv.status,
  lv.storage_key,
  lv.media_url,
  lv.published_at,
  lv.created_at,
  u.email AS author_email
FROM local_videos lv
JOIN users u ON u.id = lv.author_user_id
WHERE u.email ILIKE '%@example.com'
   OR u.email ILIKE 'pilot-m00-%@example.com'
ORDER BY lv.created_at;

-- 6) Orphan uploads (no linked local_video)
SELECT
  upl.id,
  upl.storage_key,
  upl.status,
  upl.content_type,
  upl.expected_size_bytes,
  upl.expires_at,
  upl.created_at,
  usr.email AS author_email
FROM local_video_uploads upl
JOIN users usr ON usr.id = upl.author_user_id
LEFT JOIN local_videos lv ON lv.upload_id = upl.id
WHERE lv.id IS NULL
ORDER BY upl.created_at;

-- 7) Orphan uploads from test accounts
SELECT
  upl.id,
  upl.storage_key,
  upl.status,
  upl.created_at,
  usr.email AS author_email
FROM local_video_uploads upl
JOIN users usr ON usr.id = upl.author_user_id
LEFT JOIN local_videos lv ON lv.upload_id = upl.id
WHERE lv.id IS NULL
  AND (usr.email ILIKE '%@example.com' OR usr.email ILIKE 'pilot-m00-%@example.com')
ORDER BY upl.created_at;

-- 8) Posts by @example.com authors (citizen posts)
SELECT
  p.id,
  p.type,
  p.title,
  p.body,
  p.is_story,
  p.is_active,
  p.created_at,
  u.email AS author_email
FROM posts p
JOIN users u ON u.id = p.author_id AND p.author_type = 'user'
WHERE u.email ILIKE '%@example.com'
ORDER BY p.created_at;

-- 9) Stories (@example.com, is_story = true)
SELECT
  p.id,
  p.story_category,
  p.story_media_type,
  p.story_expires_at,
  p.created_at,
  u.email AS author_email
FROM posts p
JOIN users u ON u.id = p.author_id AND p.author_type = 'user'
WHERE p.is_story IS TRUE
  AND u.email ILIKE '%@example.com'
ORDER BY p.created_at;

-- 10) Summary counts
SELECT 'users_pilot_m00' AS bucket, COUNT(*)::bigint AS n
FROM users WHERE email ILIKE 'pilot-m00-%@example.com'
UNION ALL
SELECT 'users_example_com', COUNT(*)::bigint
FROM users WHERE email ILIKE '%@example.com'
UNION ALL
SELECT 'videos_infra01', COUNT(*)::bigint
FROM local_videos WHERE title ILIKE 'INFRA-01 R2 smoke test%'
UNION ALL
SELECT 'videos_pilote_m00', COUNT(*)::bigint
FROM local_videos WHERE title ILIKE 'Pilote M-00%'
UNION ALL
SELECT 'videos_example_authors', COUNT(*)::bigint
FROM local_videos lv
JOIN users u ON u.id = lv.author_user_id
WHERE u.email ILIKE '%@example.com'
UNION ALL
SELECT 'uploads_orphan_all', COUNT(*)::bigint
FROM local_video_uploads upl
LEFT JOIN local_videos lv ON lv.upload_id = upl.id
WHERE lv.id IS NULL
UNION ALL
SELECT 'uploads_orphan_example', COUNT(*)::bigint
FROM local_video_uploads upl
JOIN users usr ON usr.id = upl.author_user_id
LEFT JOIN local_videos lv ON lv.upload_id = upl.id
WHERE lv.id IS NULL AND usr.email ILIKE '%@example.com'
UNION ALL
SELECT 'posts_example', COUNT(*)::bigint
FROM posts p
JOIN users u ON u.id = p.author_id AND p.author_type = 'user'
WHERE u.email ILIKE '%@example.com'
UNION ALL
SELECT 'stories_example', COUNT(*)::bigint
FROM posts p
JOIN users u ON u.id = p.author_id AND p.author_type = 'user'
WHERE p.is_story IS TRUE AND u.email ILIKE '%@example.com';
