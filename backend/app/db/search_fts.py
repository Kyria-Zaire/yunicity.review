"""PostgreSQL FTS functions, triggers, and backfill (FEATURE-B / TICKET-B.4)."""

from __future__ import annotations

from sqlalchemy import Connection, text

_CREATE_FUNCTIONS: tuple[str, ...] = (
    """
    CREATE OR REPLACE FUNCTION yunicity_posts_search_vector(p_title text, p_body text)
    RETURNS tsvector LANGUAGE sql IMMUTABLE AS $$
      SELECT
        setweight(to_tsvector('french', coalesce(p_title, '')), 'A')
        || setweight(to_tsvector('french', coalesce(p_body, '')), 'B');
    $$;
    """,
    """
    CREATE OR REPLACE FUNCTION yunicity_local_events_search_vector(
      p_title text,
      p_description text,
      p_location_name text,
      p_district text,
      p_event_type text
    )
    RETURNS tsvector LANGUAGE sql IMMUTABLE AS $$
      SELECT
        setweight(to_tsvector('french', coalesce(p_title, '')), 'A')
        || setweight(to_tsvector('french', coalesce(p_description, '')), 'B')
        || setweight(to_tsvector('french', coalesce(p_location_name, '')), 'B')
        || setweight(to_tsvector('french', coalesce(p_district, '')), 'C')
        || setweight(to_tsvector('french', coalesce(p_event_type, '')), 'C');
    $$;
    """,
    """
    CREATE OR REPLACE FUNCTION yunicity_organizations_search_vector(
      p_name text, p_description text, p_category text, p_slug text
    )
    RETURNS tsvector LANGUAGE sql IMMUTABLE AS $$
      SELECT
        setweight(to_tsvector('french', coalesce(p_name, '')), 'A')
        || setweight(to_tsvector('french', coalesce(p_description, '')), 'B')
        || setweight(to_tsvector('french', coalesce(p_category, '')), 'C')
        || setweight(to_tsvector('french', coalesce(p_slug, '')), 'C');
    $$;
    """,
    """
    CREATE OR REPLACE FUNCTION yunicity_partner_offers_search_vector(
      p_title text, p_description text
    )
    RETURNS tsvector LANGUAGE sql IMMUTABLE AS $$
      SELECT
        setweight(to_tsvector('french', coalesce(p_title, '')), 'A')
        || setweight(to_tsvector('french', coalesce(p_description, '')), 'B');
    $$;
    """,
    """
    CREATE OR REPLACE FUNCTION yunicity_tribes_search_vector(
      p_name text, p_description text, p_slug text, p_category text
    )
    RETURNS tsvector LANGUAGE sql IMMUTABLE AS $$
      SELECT
        setweight(to_tsvector('french', coalesce(p_name, '')), 'A')
        || setweight(to_tsvector('french', coalesce(p_description, '')), 'B')
        || setweight(to_tsvector('french', coalesce(p_slug, '')), 'C')
        || setweight(to_tsvector('french', coalesce(p_category, '')), 'C');
    $$;
    """,
    """
    CREATE OR REPLACE FUNCTION yunicity_user_profiles_search_vector(
      p_username text, p_display_name text, p_bio text
    )
    RETURNS tsvector LANGUAGE sql IMMUTABLE AS $$
      SELECT
        setweight(to_tsvector('french', coalesce(p_username, '')), 'A')
        || setweight(to_tsvector('french', coalesce(p_display_name, '')), 'B')
        || setweight(to_tsvector('french', coalesce(p_bio, '')), 'C');
    $$;
    """,
    """
    CREATE OR REPLACE FUNCTION yunicity_neighborhoods_search_vector(
      p_display_name text, p_short_description text, p_slug text, p_ambiance text
    )
    RETURNS tsvector LANGUAGE sql IMMUTABLE AS $$
      SELECT
        setweight(to_tsvector('french', coalesce(p_display_name, '')), 'A')
        || setweight(to_tsvector('french', coalesce(p_short_description, '')), 'B')
        || setweight(to_tsvector('french', coalesce(p_slug, '')), 'C')
        || setweight(to_tsvector('french', coalesce(p_ambiance, '')), 'C');
    $$;
    """,
)

_CREATE_TRIGGER_FUNCTIONS: tuple[str, ...] = (
    """
    CREATE OR REPLACE FUNCTION yunicity_posts_search_vector_trigger()
    RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      NEW.search_vector := yunicity_posts_search_vector(NEW.title, NEW.body);
      RETURN NEW;
    END;
    $$;
    """,
    """
    CREATE OR REPLACE FUNCTION yunicity_local_events_search_vector_trigger()
    RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      NEW.search_vector := yunicity_local_events_search_vector(
        NEW.title, NEW.description, NEW.location_name, NEW.district, NEW.event_type
      );
      RETURN NEW;
    END;
    $$;
    """,
    """
    CREATE OR REPLACE FUNCTION yunicity_organizations_search_vector_trigger()
    RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      NEW.search_vector := yunicity_organizations_search_vector(
        NEW.name, NEW.description, NEW.category, NEW.slug
      );
      RETURN NEW;
    END;
    $$;
    """,
    """
    CREATE OR REPLACE FUNCTION yunicity_partner_offers_search_vector_trigger()
    RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      NEW.search_vector := yunicity_partner_offers_search_vector(
        NEW.title, NEW.description
      );
      RETURN NEW;
    END;
    $$;
    """,
    """
    CREATE OR REPLACE FUNCTION yunicity_tribes_search_vector_trigger()
    RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      NEW.search_vector := yunicity_tribes_search_vector(
        NEW.name, NEW.description, NEW.slug, NEW.category
      );
      RETURN NEW;
    END;
    $$;
    """,
    """
    CREATE OR REPLACE FUNCTION yunicity_user_profiles_search_vector_trigger()
    RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      NEW.search_vector := yunicity_user_profiles_search_vector(
        NEW.username, NEW.display_name, NEW.bio
      );
      RETURN NEW;
    END;
    $$;
    """,
    """
    CREATE OR REPLACE FUNCTION yunicity_neighborhoods_search_vector_trigger()
    RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      NEW.search_vector := yunicity_neighborhoods_search_vector(
        NEW.display_name, NEW.short_description, NEW.slug, NEW.ambiance
      );
      RETURN NEW;
    END;
    $$;
    """,
)

_BACKFILL: tuple[str, ...] = (
    "UPDATE posts SET search_vector = yunicity_posts_search_vector(title, body);",
    """
    UPDATE local_events SET search_vector = yunicity_local_events_search_vector(
      title, description, location_name, district, event_type
    );
    """,
    """
    UPDATE organizations SET search_vector = yunicity_organizations_search_vector(
      name, description, category, slug
    );
    """,
    "UPDATE partner_offers SET search_vector = yunicity_partner_offers_search_vector(title, description);",
    "UPDATE tribes SET search_vector = yunicity_tribes_search_vector(name, description, slug, category);",
    """
    UPDATE user_profiles SET search_vector = yunicity_user_profiles_search_vector(
      username, display_name, bio
    );
    """,
    """
    UPDATE neighborhoods SET search_vector = yunicity_neighborhoods_search_vector(
      display_name, short_description, slug, ambiance
    );
    """,
)

_TABLE_SPECS: tuple[tuple[str, str], ...] = (
    ("posts", "yunicity_posts_search_vector_trigger"),
    ("local_events", "yunicity_local_events_search_vector_trigger"),
    ("organizations", "yunicity_organizations_search_vector_trigger"),
    ("partner_offers", "yunicity_partner_offers_search_vector_trigger"),
    ("tribes", "yunicity_tribes_search_vector_trigger"),
    ("user_profiles", "yunicity_user_profiles_search_vector_trigger"),
    ("neighborhoods", "yunicity_neighborhoods_search_vector_trigger"),
)


def _exec_many(connection: Connection, statements: tuple[str, ...]) -> None:
    for stmt in statements:
        connection.execute(text(stmt))


def install_search_fts(connection: Connection) -> None:
    """Create FTS functions, triggers, and backfill (idempotent for tests)."""
    _exec_many(connection, _CREATE_FUNCTIONS)
    _exec_many(connection, _CREATE_TRIGGER_FUNCTIONS)
    for table, fn in _TABLE_SPECS:
        connection.execute(text(f"DROP TRIGGER IF EXISTS trg_{table}_search_vector ON {table}"))
        connection.execute(
            text(
                f"""
                CREATE TRIGGER trg_{table}_search_vector
                BEFORE INSERT OR UPDATE ON {table}
                FOR EACH ROW EXECUTE FUNCTION {fn}()
                """
            )
        )
    _exec_many(connection, _BACKFILL)


def uninstall_search_fts(connection: Connection) -> None:
    """Drop triggers and functions (migration downgrade helper)."""
    for table, _fn in _TABLE_SPECS:
        connection.execute(text(f"DROP TRIGGER IF EXISTS trg_{table}_search_vector ON {table}"))
    for name in (
        "yunicity_neighborhoods_search_vector_trigger",
        "yunicity_user_profiles_search_vector_trigger",
        "yunicity_tribes_search_vector_trigger",
        "yunicity_partner_offers_search_vector_trigger",
        "yunicity_organizations_search_vector_trigger",
        "yunicity_local_events_search_vector_trigger",
        "yunicity_posts_search_vector_trigger",
        "yunicity_neighborhoods_search_vector",
        "yunicity_user_profiles_search_vector",
        "yunicity_tribes_search_vector",
        "yunicity_partner_offers_search_vector",
        "yunicity_organizations_search_vector",
        "yunicity_local_events_search_vector",
        "yunicity_posts_search_vector",
    ):
        connection.execute(text(f"DROP FUNCTION IF EXISTS {name}() CASCADE"))
