import type { FeedPost } from "@yunicity/types";

import { FeedAuthorHeader } from "@/components/feed/feed-author-header";

export function CitizenPostCard({ post }: { post: FeedPost }) {
  return (
    <>
      <FeedAuthorHeader post={post} />
      {post.body ? (
        <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-800">
          {post.body}
        </p>
      ) : null}
      {post.media_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.media_url}
          alt=""
          className="mt-4 max-h-80 w-full rounded-xl border border-yunicity-border object-cover"
        />
      ) : null}
    </>
  );
}
