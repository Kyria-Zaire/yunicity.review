"""Push notification constants (TICKET-307)."""

from enum import StrEnum


class PushPlatform(StrEnum):
    IOS = "ios"
    ANDROID = "android"


EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
EXPO_ERROR_DEVICE_NOT_REGISTERED = "DeviceNotRegistered"
