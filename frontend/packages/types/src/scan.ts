import type { PartnerOfferType, PassportTierCode } from "./passport";

export interface PassportQr {
  qr_payload: string;
  passport_number: string;
  expires_at: string | null;
}

export interface ScanResolveRequest {
  qr_secret: string;
}

export interface ScanRedeemableOffer {
  id: string;
  title: string;
  offer_type: PartnerOfferType;
  organization_id: string;
  organization_name: string;
  already_redeemed: boolean;
}

export interface ScanPassportPreview {
  passport_id: string;
  passport_number: string;
  city: string;
  tier_code: PassportTierCode;
  display_label: string;
}

export interface ScanResolveResponse {
  passport: ScanPassportPreview;
  offers: ScanRedeemableOffer[];
}

export interface ScanRedeemRequest {
  offer_id: string;
  qr_secret: string;
}

export interface ScanRedeemResponse {
  success: boolean;
  redemption_id: string;
  offer_id: string;
  offer_title: string;
  offer_type: PartnerOfferType;
  message: string;
  stamp_added: boolean;
}
