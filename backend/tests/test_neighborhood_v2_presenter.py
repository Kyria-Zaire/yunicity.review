"""Unit tests for Quartiers V2 presenter."""

from app.services.neighborhood_v2_presenter import slugify_alias_name


def test_slugify_alias_name() -> None:
    assert slugify_alias_name("Halles du Boulingrin") == "halles-du-boulingrin"
    assert slugify_alias_name("Place d'Erlon") == "place-d-erlon"
