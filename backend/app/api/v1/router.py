from fastapi import APIRouter

from app.api.v1 import (
    admin_partner_offers,
    auth,
    health,
    organizations,
    partner_leads,
    passport,
    profile,
    rbac_validation,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(profile.router)
api_router.include_router(organizations.router)
api_router.include_router(partner_leads.router)
api_router.include_router(admin_partner_offers.router)
api_router.include_router(passport.router)
api_router.include_router(rbac_validation.router)
