import type { SearchPostCardModel } from "@yunicity/utils";

/**
 * Texte d'une carte de publication des résultats (desktop, medium et mobile).
 *
 * Une carte de publication montre ce que dit la publication : titre s'il existe, sinon
 * l'extrait comme contenu principal ; « Publication sans texte » seulement sans titre ni texte.
 * Aucun bloc décoratif, aucun emplacement de média, aucun lien : la recherche n'offre
 * aujourd'hui aucune destination pour une publication (SEARCH-POST-NAVIGATION-01).
 * Le texte est rendu en nœud texte React uniquement — jamais interprété comme du HTML.
 */
export function SearchPostCardContent({
  post,
  titleAs: Title,
}: {
  post: SearchPostCardModel;
  titleAs: "h3" | "p";
}) {
  const meta = post.meta ? <p className="text-xs text-neutral-500">{post.meta}</p> : null;

  return (
    <div className="min-w-0 flex-1 space-y-1">
      {post.title ? (
        <Title className="text-sm font-bold text-neutral-950 [overflow-wrap:anywhere]">{post.title}</Title>
      ) : null}
      {post.title ? meta : null}
      {post.excerpt ? (
        <p
          className={`line-clamp-3 text-sm leading-relaxed [overflow-wrap:anywhere] ${
            post.title ? "pt-1 text-neutral-700" : "text-neutral-900"
          }`}
          data-search-post-excerpt=""
        >
          {post.excerpt}
        </p>
      ) : null}
      {post.emptyLabel ? <p className="text-sm text-neutral-500">{post.emptyLabel}</p> : null}
      {post.title ? null : meta}
    </div>
  );
}
