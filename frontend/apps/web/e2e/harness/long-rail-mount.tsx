import type { FeedStoryShortcut } from "@yunicity/utils";
import { createRoot } from "react-dom/client";

import { FeedStoriesRail } from "@/components/feed/portal/feed-stories-rail";

const items: FeedStoryShortcut[] = [
  { id: "s0", kind: "publish", name: "Vous", subtitle: "", imageUrl: null, href: "/stories/new", hasActivity: false },
  { id: "s1", kind: "tribe", name: "Tribu 1", subtitle: "Culture", imageUrl: null, href: "/t/1", hasActivity: false },
  { id: "s2", kind: "tribe", name: "Tribu 2", subtitle: "Sport", imageUrl: null, href: "/t/2", hasActivity: true },
  { id: "s3", kind: "tribe", name: "Tribu 3", subtitle: "Nature", imageUrl: null, href: "/t/3", hasActivity: false },
  { id: "s4", kind: "event", name: "Event 1", subtitle: "20h30", imageUrl: null, href: "/e/1", hasActivity: true },
  { id: "s5", kind: "event", name: "Event 2", subtitle: "21h00", imageUrl: null, href: "/e/2", hasActivity: true },
  { id: "s6", kind: "place", name: "Lieu 1", subtitle: "Centre", imageUrl: null, href: "/p/1", hasActivity: false },
];

createRoot(document.getElementById("yn-long-rail-root")!).render(
  <FeedStoriesRail items={items} seeAllHref="/stories" />,
);
