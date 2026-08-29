import type { FeedDesktopMoment } from "@yunicity/utils";
import { createRoot } from "react-dom/client";

import { FeedDesktopMoments } from "@/components/feed/desktop/feed-desktop-moments";

const moments: FeedDesktopMoment[] = [
  { id: "s1", name: "Tribu 1", timeLabel: "Culture", imageUrl: null, href: "/t/1" },
  { id: "s2", name: "Tribu 2", timeLabel: "Sport", imageUrl: null, href: "/t/2" },
  { id: "s3", name: "Tribu 3", timeLabel: "Nature", imageUrl: null, href: "/t/3" },
  { id: "s4", name: "Event 1", timeLabel: "20h30", imageUrl: null, href: "/e/1" },
  { id: "s5", name: "Event 2", timeLabel: "21h00", imageUrl: null, href: "/e/2" },
  { id: "s6", name: "Lieu 1", timeLabel: "Centre", imageUrl: null, href: "/p/1" },
];

createRoot(document.getElementById("yn-long-rail-root")!).render(
  <FeedDesktopMoments moments={moments} />,
);
