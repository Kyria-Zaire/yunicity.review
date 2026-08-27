import type { FeedPost } from "@yunicity/types";
import { mergeFeedItems } from "@yunicity/utils";

export type FeedPageMode = "initial" | "refresh" | "more";

export type FeedPaginationState = {
  items: FeedPost[];
  nextCursor: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  error: string | null;
  appendError: string | null;
};

export const INITIAL_FEED_PAGINATION_STATE: FeedPaginationState = {
  items: [],
  nextCursor: null,
  isLoading: true,
  isRefreshing: false,
  isLoadingMore: false,
  error: null,
  appendError: null,
};

export function beginFeedPage(
  state: FeedPaginationState,
  mode: FeedPageMode,
): FeedPaginationState {
  return {
    ...state,
    isLoading: mode === "initial" ? true : state.isLoading,
    isRefreshing: mode === "refresh" ? true : state.isRefreshing,
    isLoadingMore: mode === "more" ? true : state.isLoadingMore,
    error: mode === "more" ? state.error : null,
    appendError: null,
  };
}

export function resolveFeedPage(
  state: FeedPaginationState,
  mode: FeedPageMode,
  response: { items: FeedPost[]; next_cursor: string | null },
): FeedPaginationState {
  return {
    ...state,
    items: mode === "more" ? mergeFeedItems(state.items, response.items) : response.items,
    nextCursor: response.next_cursor,
  };
}

export function rejectFeedPage(
  state: FeedPaginationState,
  mode: FeedPageMode,
  message: string,
  exposeInitialError: boolean,
): FeedPaginationState {
  if (mode === "more") {
    return { ...state, appendError: message };
  }
  return exposeInitialError ? { ...state, error: message } : state;
}

export function finishFeedPage(
  state: FeedPaginationState,
  mode: FeedPageMode,
): FeedPaginationState {
  return {
    ...state,
    isLoading: mode === "initial" ? false : state.isLoading,
    isRefreshing: mode === "refresh" ? false : state.isRefreshing,
    isLoadingMore: mode === "more" ? false : state.isLoadingMore,
  };
}
