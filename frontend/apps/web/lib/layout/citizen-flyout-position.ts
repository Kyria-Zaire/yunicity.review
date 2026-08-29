export type CitizenFlyoutVariant = "sidebar" | "top-nav" | "fab" | "bottom-nav";

export type CitizenFlyoutPosition = {
  top: number;
  left: number;
  transform?: string;
};

const MENU_WIDTH_PX = 320;

/** Position fixe d'un panneau flyout (compte, Menu Yunicity) ancré au trigger. */
export function computeCitizenFlyoutPosition(
  trigger: HTMLElement,
  variant: CitizenFlyoutVariant,
): CitizenFlyoutPosition {
  const rect = trigger.getBoundingClientRect();
  const menuWidth = Math.min(MENU_WIDTH_PX, window.innerWidth - 32);
  const maxLeft = window.innerWidth - menuWidth - 16;

  if (variant === "top-nav") {
    return {
      top: rect.bottom + 8,
      left: Math.max(16, Math.min(rect.right - menuWidth, maxLeft)),
    };
  }

  if (variant === "fab") {
    return {
      top: rect.top - 8,
      left: Math.max(16, Math.min(rect.right - menuWidth, maxLeft)),
      transform: "translateY(-100%)",
    };
  }

  if (variant === "bottom-nav") {
    const centeredLeft = rect.left + rect.width / 2 - menuWidth / 2;
    return {
      top: rect.top - 8,
      left: Math.max(16, Math.min(centeredLeft, maxLeft)),
      transform: "translateY(-100%)",
    };
  }

  const compactSidebar = window.matchMedia("(max-width: 1023.98px)").matches;

  if (compactSidebar) {
    return {
      top: rect.bottom,
      left: Math.max(16, Math.min(rect.right + 12, maxLeft)),
      transform: "translateY(-100%)",
    };
  }

  return {
    top: rect.top - 8,
    left: Math.max(16, Math.min(rect.left, maxLeft)),
    transform: "translateY(-100%)",
  };
}
