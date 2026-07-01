/** Scroll + focus sur le composeur feed — partagé Create Hub / sidebar. */

export function focusFeedComposer(): void {
  const el = document.getElementById("feed-composer");
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
  const textarea = el?.querySelector("textarea");
  if (textarea instanceof HTMLTextAreaElement) {
    textarea.focus();
  }
}
