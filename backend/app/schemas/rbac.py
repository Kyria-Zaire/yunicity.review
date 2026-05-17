from pydantic import BaseModel, Field


class EffectivePermissionsResponse(BaseModel):
    roles: list[str] = Field(default_factory=list)
    permissions: list[str] = Field(default_factory=list)


class PermissionCheckResponse(BaseModel):
    ok: bool = True
    permission: str


class InactiveAccessProbeResponse(BaseModel):
    ok: bool = True
    message: str = "Utilisateur actif — accès autorisé."
