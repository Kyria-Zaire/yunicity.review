"use client";

import { STORIES_VIDEO_MAX_SECONDS } from "@yunicity/utils";
import { useCallback, useEffect, useRef, useState } from "react";

export type StoryCameraMode = "photo" | "video" | "story";

type UseStoryCameraOptions = {
  enabled: boolean;
  mode: StoryCameraMode;
  onCapture: (file: File) => void;
  onError: (message: string) => void;
};

function pickRecorderMimeType(): string | undefined {
  const candidates = [
    "video/mp4",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

function extensionForMime(mime: string): string {
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("webm")) return "webm";
  return "bin";
}

/** Caméra native (getUserMedia) — photo, vidéo courte, retournement. */
export function useStoryCamera({ enabled, mode, onCapture, onError }: UseStoryCameraOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [ready, setReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [galleryThumbUrl, setGalleryThumbUrl] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    if (recordTimeoutRef.current) {
      clearTimeout(recordTimeoutRef.current);
      recordTimeoutRef.current = null;
    }
    recorderRef.current?.stop();
    recorderRef.current = null;
    chunksRef.current = [];
    setRecording(false);

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setReady(false);
  }, []);

  const startStream = useCallback(async () => {
    stopStream();
    if (!enabled || typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: mode === "video",
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.muted = true;
        await video.play();
      }
      setReady(true);
    } catch {
      onError("Impossible d'accéder à la caméra. Autorisez l'accès ou utilisez la galerie.");
    }
  }, [enabled, facingMode, mode, onError, stopStream]);

  useEffect(() => {
    if (enabled) {
      void startStream();
    } else {
      stopStream();
    }
    return stopStream;
  }, [enabled, facingMode, mode, startStream, stopStream]);

  const flipCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video || !ready) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) {
      onError("Caméra non prête. Réessayez dans un instant.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          onError("Échec de la capture photo.");
          return;
        }
        const file = new File([blob], `story-${Date.now()}.jpg`, { type: "image/jpeg" });
        setGalleryThumbUrl(URL.createObjectURL(blob));
        onCapture(file);
      },
      "image/jpeg",
      0.92,
    );
  }, [onCapture, onError, ready]);

  const stopRecording = useCallback(() => {
    if (recordTimeoutRef.current) {
      clearTimeout(recordTimeoutRef.current);
      recordTimeoutRef.current = null;
    }
    recorderRef.current?.stop();
  }, []);

  const startRecording = useCallback(() => {
    const stream = streamRef.current;
    if (!stream || recording) return;

    const mimeType = pickRecorderMimeType();
    if (!mimeType) {
      onError("Enregistrement vidéo non supporté sur cet appareil. Utilisez la galerie.");
      return;
    }

    try {
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        if (blob.size === 0) {
          onError("Vidéo vide. Réessayez.");
          return;
        }
        const ext = extensionForMime(mimeType);
        const file = new File([blob], `story-${Date.now()}.${ext}`, { type: mimeType });
        onCapture(file);
      };

      recorder.start(200);
      setRecording(true);

      recordTimeoutRef.current = setTimeout(() => {
        stopRecording();
      }, STORIES_VIDEO_MAX_SECONDS * 1000);
    } catch {
      onError("Impossible de démarrer l'enregistrement.");
    }
  }, [onCapture, onError, recording, stopRecording]);

  const handleCapturePress = useCallback(() => {
    if (mode === "video") {
      if (recording) {
        stopRecording();
      } else {
        startRecording();
      }
      return;
    }
    capturePhoto();
  }, [capturePhoto, mode, recording, startRecording, stopRecording]);

  return {
    videoRef,
    ready,
    recording,
    facingMode,
    galleryThumbUrl,
    flipCamera,
    handleCapturePress,
    stopStream,
  };
}
