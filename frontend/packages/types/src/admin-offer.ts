/** Admin offers workspace types (ADMIN-04B). */

import type {
  PartnerOfferAdmin,
  PartnerOfferAdminListParams,
  PartnerOfferAdminListResponse,
  PartnerOfferAdminStatus,
} from "./admin_partner_offer";

/** Alias staff — même enum que modération partenaire. */
export type AdminOfferStatus = PartnerOfferAdminStatus;

export type AdminOfferListItem = PartnerOfferAdmin;

export type AdminOfferListResponse = PartnerOfferAdminListResponse;

export type AdminOfferListParams = PartnerOfferAdminListParams;
