/** Routes canoniques profil citoyen. */

export const PROFILE_ME_HREF = "/profile/me";

type CitizenPublicProfileInput = {
  userId: string;
  username?: string | null;
};

/** Profil public d'un autre citoyen — préfère /profile/{username}, sinon /user/{id}. */
export function buildCitizenPublicProfileHref(input: CitizenPublicProfileInput): string {
  const username = input.username?.trim();
  if (username) {
    return `/profile/${encodeURIComponent(username)}`;
  }
  return `/user/${input.userId}`;
}
