"use client";

import type { MutableRefObject } from "react";
import { useEffect, useRef, useState } from "react";

/**
 * D1.2-R3A — active un module UNIQUEMENT quand son emplacement devient
 * reellement visible.
 *
 * Pourquoi pas un breakpoint JavaScript : la CSS reste la seule source de verite
 * du responsive (contrat D1.1, verrouille par 33 assertions statiques). Un
 * `matchMedia` reintroduirait une seconde definition du Desktop, qui pourrait
 * diverger de la CSS. `IntersectionObserver` observe le RESULTAT du layout :
 * un slot `display:none` n'intersecte jamais, donc rien ne se monte et rien ne
 * fetche tant que le rail desktop n'est pas visible (≥1280px).
 *
 * Fail-closed : si `IntersectionObserver` n'existe pas, on n'active JAMAIS.
 * Activer par defaut declencherait les requetes Desktop sur mobile — exactement
 * ce que ce mecanisme existe pour empecher.
 *
 * L'activation est definitive pour la duree du montage : une fois le module
 * charge, retrecir la fenetre ne le demonte pas et ne provoque aucun refetch.
 */
export function useVisibleActivation<T extends HTMLElement = HTMLDivElement>(): {
  /** `MutableRefObject` : assignable a `ref` d'un element sous React 18. */
  ref: MutableRefObject<T | null>;
  activated: boolean;
} {
  const ref = useRef<T | null>(null);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    if (activated) return;

    const node = ref.current;
    if (!node) return;

    // Fail-closed : pas d'API, pas d'activation.
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver((entries) => {
      const visible = entries.some((entry) => entry.isIntersecting);
      if (!visible) return;
      setActivated(true);
      observer.disconnect();
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [activated]);

  return { ref, activated };
}
