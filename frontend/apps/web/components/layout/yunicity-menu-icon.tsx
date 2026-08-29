type YunicityMenuIconProps = {
  className?: string;
};

/**
 * Grille Menu Yunicity — 3×3 de carrés arrondis pleins (maquette rail medium).
 */
export function YunicityMenuIcon({ className = "h-5 w-5 shrink-0" }: YunicityMenuIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="3" y="3" width="5" height="5" rx="1.25" />
      <rect x="9.5" y="3" width="5" height="5" rx="1.25" />
      <rect x="16" y="3" width="5" height="5" rx="1.25" />
      <rect x="3" y="9.5" width="5" height="5" rx="1.25" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1.25" />
      <rect x="16" y="9.5" width="5" height="5" rx="1.25" />
      <rect x="3" y="16" width="5" height="5" rx="1.25" />
      <rect x="9.5" y="16" width="5" height="5" rx="1.25" />
      <rect x="16" y="16" width="5" height="5" rx="1.25" />
    </svg>
  );
}
