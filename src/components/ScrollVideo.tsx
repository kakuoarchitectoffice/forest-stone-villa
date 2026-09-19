import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SEEK_EPSILON, smoothVideoTime, videoTimeForProgress } from "../lib/videoScrub";

gsap.registerPlugin(ScrollTrigger);

type ScrollVideoProps = {
  disabled: boolean;
  posterSrc: string;
  preload: "auto" | "metadata";
  scrollAreaRef: RefObject<HTMLElement | null>;
  videoSrc: string;
  resetSignal: number;
  onProgressChange: (progress: number) => void;
};

function clampProgress(value: number) {
  return Math.min(1, Math.max(0, value));
}

function getViewportHeight() {
  return window.visualViewport?.height ?? window.innerHeight;
}

export function ScrollVideo({
  disabled,
  posterSrc,
  preload,
  scrollAreaRef,
  videoSrc,
  resetSignal,
  onProgressChange,
}: ScrollVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const initializedRef = useRef(false);
  const hasFirstFrameRef = useRef(false);
  const resetToStartRef = useRef<() => void>(() => undefined);
  const [hasFirstFrame, setHasFirstFrame] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);

  useEffect(() => {
    hasFirstFrameRef.current = false;
    setHasFirstFrame(false);
    setHasVideoError(false);
    initializedRef.current = false;
  }, [videoSrc]);

  useEffect(() => {
    const video = videoRef.current;
    const scrollArea = scrollAreaRef.current;

    if (!video || !scrollArea || disabled || hasVideoError) {
      return undefined;
    }

    let trigger: ScrollTrigger | null = null;
    let isPrimingVideo = false;
    let didPrimeVideo = false;
    let seekFrameId: number | null = null;
    let requestedTime: number | null = null;
    let smoothedTime = video.currentTime;
    let lastFrameTime: number | null = null;
    let disposed = false;

    const prepareVideoForMobile = () => {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.setAttribute("x5-playsinline", "");
      video.setAttribute("x5-video-player-type", "h5");
      video.setAttribute("disablepictureinpicture", "");
    };

    const getScrollProgress = () => {
      const scrollableDistance = Math.max(0, scrollArea.offsetHeight - getViewportHeight());

      if (scrollableDistance === 0) {
        return 0;
      }

      return clampProgress((window.scrollY - scrollArea.offsetTop) / scrollableDistance);
    };

    const markFrameReady = () => {
      if (hasFirstFrameRef.current) {
        return;
      }

      hasFirstFrameRef.current = true;
      setHasFirstFrame(true);
    };

    const flushSeek = (now: number) => {
      seekFrameId = null;

      if (disposed || requestedTime === null || document.hidden) {
        lastFrameTime = null;
        return;
      }

      const elapsed = lastFrameTime === null ? 1000 / 60 : now - lastFrameTime;
      lastFrameTime = now;
      smoothedTime = smoothVideoTime(smoothedTime, requestedTime, elapsed);

      // Only one decode at a time. Read the browser's actual state rather than
      // holding a lock that can remain stuck after a missed seeked event.
      if (!video.seeking && video.readyState >= HTMLMediaElement.HAVE_METADATA &&
          Math.abs(video.currentTime - smoothedTime) >= SEEK_EPSILON) {
        try {
          video.currentTime = smoothedTime;
        } catch (error) {
          console.warn("Unable to seek scroll video.", error);
        }
      }

      if (video.seeking || Math.abs(video.currentTime - requestedTime) >= SEEK_EPSILON) {
        seekFrameId = window.requestAnimationFrame(flushSeek);
      } else {
        lastFrameTime = null;
      }
    };

    const requestSeek = (nextTime: number) => {
      requestedTime = nextTime;

      if (seekFrameId !== null || disposed || document.hidden) {
        return;
      }

      seekFrameId = window.requestAnimationFrame(flushSeek);
    };

    const handleSeeked = () => {
      markFrameReady();
      requestSeek(requestedTime ?? video.currentTime);
    };

    const resetToStart = () => {
      requestedTime = 0;

      if (seekFrameId !== null) {
        window.cancelAnimationFrame(seekFrameId);
        seekFrameId = null;
      }

      smoothedTime = 0;
      lastFrameTime = null;
      video.pause();

      try {
        video.currentTime = 0;
        onProgressChange(0);
      } catch (error) {
        requestSeek(0);
        console.warn("Unable to reset scroll video.", error);
      }
    };

    resetToStartRef.current = resetToStart;

    const initializeScrollTrigger = () => {
      if (initializedRef.current) {
        return;
      }

      const duration = video.duration;

      if (!Number.isFinite(duration) || duration <= 0) {
        setHasVideoError(true);
        return;
      }

      initializedRef.current = true;
      video.pause();

      const initialProgress = getScrollProgress();

      onProgressChange(initialProgress);
      smoothedTime = videoTimeForProgress(duration, initialProgress);
      requestSeek(smoothedTime);

      trigger = ScrollTrigger.create({
        id: "villa-scroll-video",
        trigger: scrollArea,
        start: "top top",
        end: "bottom bottom",
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const progress = clampProgress(self.progress);
          onProgressChange(progress);
          requestSeek(videoTimeForProgress(duration, progress));
        },
        onRefresh: (self) => {
          const progress = clampProgress(self.progress);
          onProgressChange(progress);
          requestSeek(videoTimeForProgress(duration, progress));
        },
      });

      ScrollTrigger.refresh();
    };

    const primeVideoDecode = () => {
      if (didPrimeVideo || isPrimingVideo || hasVideoError) {
        return;
      }

      prepareVideoForMobile();
      isPrimingVideo = true;

      if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
        video.load();
      }

      const playPromise = video.play();

      if (!playPromise) {
        isPrimingVideo = false;
        didPrimeVideo = true;
        video.pause();
        initializeScrollTrigger();
        markFrameReady();
        return;
      }

      playPromise
        .then(() => {
          if (disposed) return;
          video.pause();
          isPrimingVideo = false;
          didPrimeVideo = true;
          initializeScrollTrigger();
          markFrameReady();
        })
        .catch(() => {
          isPrimingVideo = false;
        });
    };

    const handleError = () => {
      setHasVideoError(true);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (seekFrameId !== null) window.cancelAnimationFrame(seekFrameId);
        seekFrameId = null;
        lastFrameTime = null;
      } else if (Number.isFinite(video.duration)) {
        requestSeek(videoTimeForProgress(video.duration, getScrollProgress()));
      }
    };

    prepareVideoForMobile();
    video.addEventListener("loadedmetadata", initializeScrollTrigger);
    video.addEventListener("loadeddata", markFrameReady);
    video.addEventListener("canplay", markFrameReady);
    video.addEventListener("canplaythrough", markFrameReady);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("error", handleError);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("touchstart", primeVideoDecode, { passive: true });
    window.addEventListener("pointerdown", primeVideoDecode, { passive: true });
    window.addEventListener("scroll", primeVideoDecode, { passive: true });

    try {
      video.load();
    } catch (error) {
      console.warn("Unable to load scroll video.", error);
    }

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      initializeScrollTrigger();
    }

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      markFrameReady();
    }

    return () => {
      disposed = true;
      resetToStartRef.current = () => undefined;
      initializedRef.current = false;
      video.removeEventListener("loadedmetadata", initializeScrollTrigger);
      video.removeEventListener("loadeddata", markFrameReady);
      video.removeEventListener("canplay", markFrameReady);
      video.removeEventListener("canplaythrough", markFrameReady);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("error", handleError);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("touchstart", primeVideoDecode);
      window.removeEventListener("pointerdown", primeVideoDecode);
      window.removeEventListener("scroll", primeVideoDecode);
      if (seekFrameId !== null) {
        window.cancelAnimationFrame(seekFrameId);
      }
      trigger?.kill();
    };
  }, [disabled, hasVideoError, onProgressChange, scrollAreaRef, videoSrc]);

  useEffect(() => {
    if (resetSignal === 0 || disabled) {
      return;
    }

    resetToStartRef.current();
  }, [disabled, resetSignal]);

  const showPoster = disabled || !hasFirstFrame || hasVideoError;

  return (
    <div className="video-stage" aria-hidden="true">
      <video
        ref={videoRef}
        className="scroll-video"
        src={videoSrc}
        poster={posterSrc}
        muted
        playsInline
        preload={preload}
      />
      <img
        className={`poster-fallback${showPoster ? " is-visible" : ""}`}
        src={posterSrc}
        alt=""
        decoding="async"
      />
    </div>
  );
}
