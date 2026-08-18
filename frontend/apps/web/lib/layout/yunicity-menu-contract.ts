import type { WebNavIconId } from "@/lib/layout/web-layout-config";

export type YunicityMenuGroupId = "discover" | "my-space" | "exchange" | "account";

export type YunicityMenuItemKind = "link" | "logout";

export type YunicityMenuAccess = "public" | "authenticated";

export type YunicityMenuItem = {
  id: string;
  label: string;
  icon: WebNavIconId;
  kind: YunicityMenuItemKind;
  href?: string;
  access: YunicityMenuAccess;
  match?: "exact" | "prefix";
};

export type YunicityMenuGroup = {
  id: YunicityMenuGroupId;
  title: string;
  items: YunicityMenuItem[];
};

const DISCOVER_ITEMS: readonly YunicityMenuItem[] = [
  {
    id: "neighborhoods",
    label: "Quartiers",
    icon: "neighborhoods",
    kind: "link",
    href: "/neighborhoods",
    access: "public",
    match: "prefix",
  },
  {
    id: "tribes",
    label: "Tribus",
    icon: "tribes",
    kind: "link",
    href: "/tribes",
    access: "public",
    match: "prefix",
  },
  {
    id: "places",
    label: "Lieux",
    icon: "place",
    kind: "link",
    href: "/places",
    access: "public",
    match: "prefix",
  },
];

const AUTHENTICATED_GROUPS: readonly YunicityMenuGroup[] = [
  { id: "discover", title: "Découvrir", items: [...DISCOVER_ITEMS] },
  {
    id: "my-space",
    title: "Mon espace",
    items: [
      {
        id: "passport",
        label: "Passport",
        icon: "passport",
        kind: "link",
        href: "/passport",
        access: "authenticated",
        match: "prefix",
      },
      {
        id: "notifications",
        label: "Notifications",
        icon: "notifications",
        kind: "link",
        href: "/notifications",
        access: "authenticated",
        match: "prefix",
      },
    ],
  },
  {
    id: "exchange",
    title: "Échanger",
    items: [
      {
        id: "discussions",
        label: "Discussions",
        icon: "feed",
        kind: "link",
        href: "/discussions",
        access: "authenticated",
        match: "prefix",
      },
    ],
  },
  {
    id: "account",
    title: "Compte",
    items: [
      {
        id: "profile",
        label: "Profil",
        icon: "profile",
        kind: "link",
        href: "/profile/me",
        access: "authenticated",
        match: "prefix",
      },
      {
        id: "settings",
        label: "Paramètres",
        icon: "settings",
        kind: "link",
        href: "/settings",
        access: "authenticated",
        match: "prefix",
      },
      {
        id: "logout",
        label: "Se déconnecter",
        icon: "settings",
        kind: "logout",
        access: "authenticated",
      },
    ],
  },
];

const VISITOR_GROUPS: readonly YunicityMenuGroup[] = [
  { id: "discover", title: "Découvrir", items: [...DISCOVER_ITEMS] },
  {
    id: "account",
    title: "Compte",
    items: [
      {
        id: "login",
        label: "Se connecter",
        icon: "profile",
        kind: "link",
        href: "/login",
        access: "public",
        match: "exact",
      },
      {
        id: "register",
        label: "Créer un compte",
        icon: "profile",
        kind: "link",
        href: "/register",
        access: "public",
        match: "exact",
      },
    ],
  },
];

export function buildYunicityMenuGroups(input: { isAuthenticated: boolean }): YunicityMenuGroup[] {
  return input.isAuthenticated ? [...AUTHENTICATED_GROUPS] : [...VISITOR_GROUPS];
}

export function flattenYunicityMenuLabels(groups: YunicityMenuGroup[]): string[] {
  return groups.flatMap((group) => group.items.map((item) => item.label));
}
