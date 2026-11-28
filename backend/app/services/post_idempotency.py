"""Empreinte de contenu d'une tentative de publication (FEED-NEW-UX-01).

Calculée SERVEUR, sur le payload déjà validé : le client n'envoie que sa clé.
Deux tentatives portant la même clé sont « le même contenu » si et seulement si
cette empreinte coïncide.

L'empreinte couvre l'INTÉGRALITÉ du payload validé, à la seule exception de
`client_request_id` — qui identifie la tentative, non son contenu. Aucune liste de
champs n'est maintenue à la main : un champ ajouté demain à `PostCreateRequest` entre
dans l'empreinte sans qu'on y pense, et c'est précisément le but. Une empreinte plus
étroite que le payload laissait passer en silence une modification de l'audience
(`visibility="custom"`) ou de la programmation : le serveur rendait 200 avec la
première publication en abandonnant la seconde tentative.
"""

from __future__ import annotations

import hashlib
import json

from app.schemas.post import PostCreateRequest


def compute_request_fingerprint(payload: PostCreateRequest) -> str:
    """Empreinte SHA-256 stable du contenu d'une tentative de publication.

    Déterminisme, vérifié empiriquement y compris entre deux processus de graines de
    hachage différentes :

    - `mode="json"` normalise UUID, dates et énumérations en primitives JSON ;
    - `sort_keys=True` trie les clés à TOUS les niveaux, donc l'ordre de parcours des
      dictionnaires n'influe pas ;
    - l'ordre des LISTES est préservé — il est significatif (`media_urls` notamment) ;
    - les champs absents de la requête sont dumpés à leur valeur par défaut, donc une
      requête qui omet un champ et une qui le pose à sa valeur par défaut coïncident.

    Limite connue : l'empreinte porte sur la représentation issue de la validation, pas
    sur une valeur sémantique. Deux écritures du même instant avec des décalages
    horaires différents (`10:00:00+00:00` et `11:00:00+01:00`) donnent deux empreintes
    distinctes, car le validateur ne normalise pas le décalage. Un réessai renvoie le
    même corps, donc ce cas n'est pas atteint par un client conforme.
    """
    materiel = payload.model_dump(mode="json", exclude={"client_request_id"})
    canonique = json.dumps(materiel, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(canonique.encode("utf-8")).hexdigest()
