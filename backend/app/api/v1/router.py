from fastapi import APIRouter

from app.api.v1 import auth, health, organizations, partner_leads, profile, rbac_validation

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(profile.router)
api_router.include_router(organizations.router)
api_router.include_router(partner_leads.router)
api_router.include_router(rbac_validation.router)
