"use client";

import type { DiscussionCategoryId, FeedComment, FeedReportReason } from "@yunicity/types";
import type { DiscussionInboxTab } from "@yunicity/utils";
import {
  buildDiscussionChatMessages,
  filterInboxItems,
  mapThreadToInboxItem,
} from "@yunicity/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useDiscussionsList } from "@/hooks/use-discussions-list";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";

export function useDiscussionsInboxScreen(
  category: DiscussionCategoryId = "all",
  options?: { autoSelectFirst?: boolean },
) {
  const autoSelectFirst = options?.autoSelectFirst ?? true;
  const api = useYunicityApi();
  const { user } = useAuth();
  const list = useDiscussionsList(category);

  const [activeTab, setActiveTab] = useState<DiscussionInboxTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inboxItems = useMemo(
    () => list.items.map((thread) => mapThreadToInboxItem(thread)),
    [list.items],
  );

  const filteredItems = useMemo(
    () => filterInboxItems(inboxItems, activeTab, searchQuery),
    [activeTab, inboxItems, searchQuery],
  );

  const selectedThread = useMemo(
    () => list.items.find((item) => item.id === selectedId) ?? null,
    [list.items, selectedId],
  );

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#thread-")) {
      const threadId = hash.slice("#thread-".length);
      if (threadId) setSelectedId(threadId);
    }
  }, [list.items]);

  useEffect(() => {
    if (!autoSelectFirst || selectedId) return;
    const first = filteredItems[0];
    if (first) setSelectedId(first.id);
  }, [autoSelectFirst, filteredItems, selectedId]);

  const loadComments = useCallback(
    async (postId: string) => {
      setCommentsLoading(true);
      try {
        const response = await api.listFeedComments(postId, { limit: 100 });
        setComments(response.items);
      } catch {
        setComments([]);
      } finally {
        setCommentsLoading(false);
      }
    },
    [api],
  );

  useEffect(() => {
    if (!selectedId) {
      setComments([]);
      return;
    }
    void loadComments(selectedId);
  }, [loadComments, selectedId]);

  const messages = useMemo(() => {
    if (!selectedThread) return [];
    return buildDiscussionChatMessages(selectedThread, comments, user?.id ?? null);
  }, [comments, selectedThread, user?.id]);

  async function handleSendMessage(body: string) {
    if (!selectedThread) return;
    setIsSubmitting(true);
    try {
      const created = await api.createFeedComment(selectedThread.id, { body });
      setComments((prev) => [...prev, created]);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReport() {
    if (!selectedThread) return;
    await api.reportFeedPost(selectedThread.id, { reason: "inappropriate" satisfies FeedReportReason });
  }

  function handleSelect(id: string) {
    setSelectedId(id);
    window.history.replaceState(null, "", `#thread-${id}`);
  }

  function handleClearSelection() {
    setSelectedId(null);
    window.history.replaceState(null, "", window.location.pathname);
  }

  return {
    list,
    activeTab,
    searchQuery,
    selectedId,
    filteredItems,
    selectedThread,
    messages,
    commentsLoading,
    isSubmitting,
    setActiveTab,
    setSearchQuery,
    handleSelect,
    handleClearSelection,
    handleSendMessage,
    handleReport,
  };
}
