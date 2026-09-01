import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type ScrollVideoProps = {
  disabled: boolean;
  posterSrc: string;
  preload: "auto" | "metadata";
  scrollAreaRef: RefObject<HTMLElement | null>;
  videoSrc: string;
  onProgressChange: (progress: number) => void;
};

function clampProgress(value: number) {
  return Math.min(1, Math.max(0, value));
}

function getViewportHeight() {
  return window.visualViewport?.height ?? window.innerHeight;
}

const MIN_SEEK_DELTA_SECONDS = 1 / 30;

export function ScrollVideo({
  disabled,
  posterSrc,
  preload,
  scrollAreaRef,
  videoSrc,
  onProgressChange,
}: ScrollVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const initializedRef = useRef(false);
  const hasFirstFrameRef = useRef(false);
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
    let isSeeking = false;
    let seekFrameId: number | null = null;
    let requestedTime: number | null = null;

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

    const flushSeek = () => {
      seekFrameId = null;

      if (isSeeking || requestedTime === null) {
        return;
      }

      const targetTime = requestedTime;
      if (Math.abs(video.currentTime - targetTime) < MIN_SEEK_DELTA_SECONDS) {
        return;
      }

      isSeeking = true;

      try {
        video.currentTime = targetTime;
      } catch (error) {
        isSeeking = false;
        console.warn("Unable to seek scroll video.", error);
      }
    };

    const requestSeek = (nextTime: number) => {
      requestedTime = nextTime;

      if (seekFrameId !== null || isSeeking) {
        return;
      }

      seekFrameId = window.requestAnimationFrame(flushSeek);
    };

    const handleSeeked = () => {
      isSeeking = false;
      markFrameReady();
      requestSeek(requestedTime ?? video.currentTime);
    };

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
      requestSeek(duration * initialProgress);

      trigger = ScrollTrigger.create({
        id: "villa-scroll-video",
        trigger: scrollArea,
        start: "top top",
        end: "bottom bottom",
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const progress = clampProgress(self.progress);
          onProgressChange(progress);
          requestSeek(duration * progress);
        },
        onRefresh: (self) => {
          const progress = clampProgress(self.progress);
          onProgressChange(progress);
          requestSeek(duration * progress);
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

    prepareVideoForMobile();
    video.addEventListener("loadedmetadata", initializeScrollTrigger);
    video.addEventListener("loadeddata", markFrameReady);
    video.addEventListener("canplay", markFrameReady);
    video.addEventListener("canplaythrough", markFrameReady);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("error", handleError);
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
      initializedRef.current = false;
      video.removeEventListener("loadedmetadata", initializeScrollTrigger);
      video.removeEventListener("loadeddata", markFrameReady);
      video.removeEventListener("canplay", markFrameReady);
      video.removeEventListener("canplaythrough", markFrameReady);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("error", handleError);
      window.removeEventListener("touchstart", primeVideoDecode);
      window.removeEventListener("pointerdown", primeVideoDecode);
      window.removeEventListener("scroll", primeVideoDecode);
      if (seekFrameId !== null) {
        window.cancelAnimationFrame(seekFrameId);
      }
      trigger?.kill();
    };
  }, [disabled, hasVideoError, onProgressChange, scrollAreaRef, videoSrc]);

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
