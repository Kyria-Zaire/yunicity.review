import type { FeedPost } from "@yunicity/types";
import { createRoot } from "react-dom/client";

import { CitizenPostCard } from "@/components/feed/citizen-post-card";
import { FeedCardShell } from "@/components/feed/feed-card-shell";
import { PUBLICATION_IMAGE_FIXTURE_DATA_URL } from "@/e2e/harness/publication-image-fixture";

const post: FeedPost = {
  id: "00000000-0000-4000-8000-000000000099",
  type: "post",
  author: {
    type: "citizen",
    id: "00000000-0000-4000-8000-000000000001",
    display_name: "Citoyen QA Image",
    username: "citoyen_qa",
    logo_url: null,
  },
  city: "reims",
  title: null,
  body: "Publication image — harnais M8 (composant et CSS réels).",
  media_url: PUBLICATION_IMAGE_FIXTURE_DATA_URL,
  location: null,
  like_count: 2,
  comment_count: 1,
  liked_by_me: false,
  offer: null,
  event: null,
  creator_content: null,
  neighborhood_summary: { slug: "centre-ville", display_name: "Centre-ville" },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

createRoot(document.getElementById("yn-publication-image-root")!).render(
  <FeedCardShell footer={null}>
    <CitizenPostCard post={post} currentUserId={null} />
  </FeedCardShell>,
);
