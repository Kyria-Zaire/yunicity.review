"""Local stamp slugs & triggers (TICKET-504)."""

from enum import StrEnum


class LocalStampSlug(StrEnum):
    FIRST_LOCAL_PLACE = "first_local_place"
    FIRST_SCAN_VALIDATED = "first_scan_validated"
    FIRST_FLASH_MEMORY = "first_flash_memory"
