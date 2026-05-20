from fastapi import APIRouter

from app.api.v1 import (
    admin_local_events,
    admin_neighborhoods,
    admin_partner_offers,
    admin_tribes,
    auth,
    comments,
    events,
    feed,
    health,
    neighborhoods,
    notifications,
    organizations,
    partner_leads,
    passport,
    posts,
    profile,
    rbac_validation,
    scan,
    tribe_invitations,
    tribes,
    users,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(profile.router)
api_router.include_router(organizations.router)
api_router.include_router(partner_leads.router)
api_router.include_router(admin_partner_offers.router)
api_router.include_router(admin_local_events.router)
api_router.include_router(admin_neighborhoods.router)
api_router.include_router(events.router)
api_router.include_router(neighborhoods.router)
api_router.include_router(tribes.router)
api_router.include_router(tribe_invitations.router)
api_router.include_router(admin_tribes.router)
api_router.include_router(passport.router)
api_router.include_router(notifications.router)
api_router.include_router(users.router)
api_router.include_router(feed.router)
api_router.include_router(posts.router)
api_router.include_router(comments.router)
api_router.include_router(scan.router)
api_router.include_router(rbac_validation.router)
