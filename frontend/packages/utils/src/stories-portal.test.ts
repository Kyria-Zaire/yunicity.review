import { describe, expect, it } from "vitest";

import { buildStoryRingDisplay } from "./stories-portal";

describe("buildStoryRingDisplay", () => {
  it("shows publish slot when user has no active story", () => {
    const items = buildStoryRingDisplay({
      profile: {
        display_name: "Kyria",
        username: "kyria",
        avatar_url: null,
        user_id: "user-1",
      },
      rings: [],
    });

    expect(items[0]).toMatchObject({
      kind: "publish",
      href: "/stories/new",
      hasActivity: false,
    });
  });

  it("shows mine slot when user has an active story", () => {
    const items = buildStoryRingDisplay({
      profile: {
        display_name: "Kyria",
        username: "kyria",
        avatar_url: null,
        user_id: "user-1",
      },
      rings: [
        {
          author_id: "user-1",
          author_name: "Kyria",
          author_avatar_url: null,
          subtitle: "Reims centre",
          latest_story_id: "story-1",
          latest_media_url: "https://media.example/story.jpg",
          has_recent: true,
        },
      ],
    });

    expect(items[0]).toMatchObject({
      kind: "mine",
      href: "/stories#story-story-1",
      hasActivity: true,
      imageUrl: "https://media.example/story.jpg",
    });
    expect(items.some((item) => item.id === "user-1")).toBe(false);
  });
});
