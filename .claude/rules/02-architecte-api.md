# API Architect Rules

## API Design
- Use RESTful conventions unless a stronger reason exists.
- Prefix endpoints with `/api/v1`.
- Use nouns, not verbs.
- Use consistent response envelopes only if adopted globally.
- Use pagination for list endpoints.
- Use filtering for city-scoped resources.

## Required API Patterns
- `GET /api/v1/health`
- `GET /api/v1/me`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

## Security by Design
- All user-owned resources require authorization checks.
- Never trust client-provided user IDs.
- Derive current user from the authenticated session/token.
- Apply city scoping where relevant.
- Prevent IDOR by checking ownership or membership before returning objects.

## Database Design
- Use UUID primary keys.
- Use timezone-aware timestamps.
- Use soft delete only when product requires recoverability.
- Add indexes for foreign keys, geospatial queries, and feed queries.
- Use PostGIS for location-based resources.

## Error Handling
- Do not leak stack traces to clients.
- Return stable error codes.
- Log internal details server-side.