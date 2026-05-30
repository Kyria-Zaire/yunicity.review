"use client";

import {
  LOGIN_FOOTER_CONTACT,
  LOGIN_FOOTER_COPYRIGHT,
  LOGIN_FOOTER_HELP,
  LOGIN_FOOTER_PRIVACY,
  LOGIN_FOOTER_RIGHTS,
  LOGIN_FOOTER_TERMS,
} from "@yunicity/utils";
import Link from "next/link";

const LINKS = [
  { href: "/settings", label: LOGIN_FOOTER_TERMS },
  { href: "/settings", label: LOGIN_FOOTER_PRIVACY },
  { href: "/settings", label: LOGIN_FOOTER_HELP },
  { href: "/settings", label: LOGIN_FOOTER_CONTACT },
] as const;

export function LoginFooter() {
  return (
    <footer className="mt-8 text-center text-xs text-neutral-500">
      <p className="font-semibold uppercase tracking-wide text-neutral-400">{LOGIN_FOOTER_COPYRIGHT}</p>
      <p className="mt-1">{LOGIN_FOOTER_RIGHTS}</p>
      <nav aria-label="Liens légaux" className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        {LINKS.map((link) => (
          <Link key={link.label} href={link.href} className="hover:text-yunicity-primary hover:underline">
            {link.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
