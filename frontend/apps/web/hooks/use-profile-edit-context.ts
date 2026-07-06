"use client";

import type {
  FeedPost,
  LocalEvent,
  PassportMe,
  PassportStamp,
  ProfileMe,
  Tribe,
} from "@yunicity/types";
import {
  buildProfileEditCompletion,
  buildProfileEditDraft,
  buildProfileEditPreview,
  buildProfileEditSavePayload,
  buildProfileTribeCards,
  humanizeAuthFailure,
  profileEditDraftEquals,
  PROFILE_EDIT_AVATAR_UPLOAD_SUCCESS,
  PROFILE_EDIT_BANNER_UPLOAD_SUCCESS,
  PROFILE_EDIT_MEDIA_UPLOAD_ERROR,
  type ProfileEditDraft,
  type ProfileEditPreviewView,
} from "@yunicity/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

export function useProfileEditContext() {
  const api = useYunicityApi();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [profile, setProfile] = useState<ProfileMe | null>(null);
  const [savedDraft, setSavedDraft] = useState<ProfileEditDraft | null>(null);
  const [draft, setDraft] = useState<ProfileEditDraft | null>(null);
  const [passport, setPassport] = useState<PassportMe | null>(null);
  const [stamps, setStamps] = useState<PassportStamp[]>([]);
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [savedEvents, setSavedEvents] = useState<LocalEvent[]>([]);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveMessageIsError, setSaveMessageIsError] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const profileData = await api.getProfileMe();
      setProfile(profileData);
      const nextDraft = buildProfileEditDraft(profileData);
      setDraft(nextDraft);
      setSavedDraft(nextDraft);

      const city = profileData.city?.trim() || "Reims";

      // Passport + tampons uniquement si le profil indique un passeport actif.
      const passportData = await api.getPassportMeIfActive(profileData);

      const [tribesRes, eventsRes, savedRes, feedRes] = await Promise.allSettled([
        api.tribes.listTribes({ city, page_size: 40 }),
        api.events.listEvents({ city }),
        api.events.listSavedEvents(),
        api.listFeed({ limit: 40 }),
      ]);

      setPassport(passportData);
      if (passportData) {
        try {
          const stampData = await api.listPassportStamps();
          setStamps(stampData.items);
        } catch {
          setStamps([]);
        }
      } else {
        setStamps([]);
      }
      setTribes(
        tribesRes.status === "fulfilled"
          ? tribesRes.value.items.filter((tribe) => !tribe.is_archived)
          : [],
      );
      setEvents(eventsRes.status === "fulfilled" ? eventsRes.value.items : []);
      setSavedEvents(savedRes.status === "fulfilled" ? savedRes.value.items : []);
      setFeedPosts(feedRes.status === "fulfilled" ? feedRes.value.items : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const completion = useMemo(
    () => (profile ? buildProfileEditCompletion(profile) : null),
    [profile],
  );

  const preview: ProfileEditPreviewView | null = useMemo(() => {
    if (!profile || !draft) return null;
    return buildProfileEditPreview({
      profile,
      draft,
      passport,
      stamps,
      tribes,
      savedEvents,
      feedPosts,
    });
  }, [draft, feedPosts, passport, profile, savedEvents, stamps, tribes]);

  const tribeCards = useMemo(() => {
    const city = profile?.city?.trim() || "Reims";
    return buildProfileTribeCards({ city, tribes, events, maxItems: 4 });
  }, [events, profile?.city, tribes]);

  const isDirty = useMemo(() => {
    if (!draft || !savedDraft) return false;
    return !profileEditDraftEquals(draft, savedDraft);
  }, [draft, savedDraft]);

  const updateDraft = useCallback((patch: Partial<ProfileEditDraft>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
    setSaveMessage(null);
    setSaveMessageIsError(false);
  }, []);

  const save = useCallback(async () => {
    if (!profile || !draft) return null;
    setIsSaving(true);
    setSaveMessage(null);
    setSaveMessageIsError(false);
    try {
      const payload = buildProfileEditSavePayload(profile, draft);
      let updated = await api.updateProfileMe(payload);
      const city = (payload.city ?? draft.city).trim();
      const interests = payload.interests ?? draft.interests;
      if (!updated.onboarding_completed && city && interests.length > 0) {
        updated = await api.completeProfileOnboarding({ city, interests });
      }
      const nextDraft = buildProfileEditDraft(updated);
      setProfile(updated);
      setDraft(nextDraft);
      setSavedDraft(nextDraft);
      return updated;
    } finally {
      setIsSaving(false);
    }
  }, [api, draft, profile]);

  const uploadAvatar = useCallback(
    async (file: File) => {
      setIsUploadingAvatar(true);
      setSaveMessage(null);
      setSaveMessageIsError(false);
      try {
        const updated = await api.uploadProfileAvatar(file);
        setProfile(updated);
        setSaveMessage(PROFILE_EDIT_AVATAR_UPLOAD_SUCCESS);
        setSaveMessageIsError(false);
        return updated;
      } catch (err) {
        setSaveMessage(
          humanizeAuthFailure(err, PROFILE_EDIT_MEDIA_UPLOAD_ERROR),
        );
        setSaveMessageIsError(true);
        return null;
      } finally {
        setIsUploadingAvatar(false);
      }
    },
    [api],
  );

  const uploadBanner = useCallback(
    async (file: File) => {
      setIsUploadingBanner(true);
      setSaveMessage(null);
      setSaveMessageIsError(false);
      try {
        const updated = await api.uploadProfileBanner(file);
        setProfile(updated);
        setSaveMessage(PROFILE_EDIT_BANNER_UPLOAD_SUCCESS);
        setSaveMessageIsError(false);
        return updated;
      } catch (err) {
        setSaveMessage(
          humanizeAuthFailure(err, PROFILE_EDIT_MEDIA_UPLOAD_ERROR),
        );
        setSaveMessageIsError(true);
        return null;
      } finally {
        setIsUploadingBanner(false);
      }
    },
    [api],
  );

  const removeAvatar = useCallback(async () => {
    const updated = await api.updateProfileMe({ avatar_url: null });
    setProfile(updated);
    return updated;
  }, [api]);

  const removeBanner = useCallback(async () => {
    const updated = await api.updateProfileMe({ banner_url: null });
    setProfile(updated);
    return updated;
  }, [api]);

  return {
    loading,
    error,
    profile,
    draft,
    completion,
    preview,
    tribeCards,
    isDirty,
    isSaving,
    isUploadingAvatar,
    isUploadingBanner,
    saveMessage,
    saveMessageIsError,
    setSaveMessage,
    updateDraft,
    save,
    uploadAvatar,
    uploadBanner,
    removeAvatar,
    removeBanner,
    reload,
  };
}
