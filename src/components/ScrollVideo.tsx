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

const MIN_SEEK_DELTA_SECONDS = 1 / 20;

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
  const [hasFirstFrame, setHasFirstFrame] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);

  useEffect(() => {
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
    let playheadTween: gsap.core.Tween | null = null;
    let isPrimingVideo = false;
    let didPrimeVideo = false;

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
      setHasFirstFrame(true);
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
      const initialTime = duration * initialProgress;
      const playhead = { time: initialTime };

      onProgressChange(initialProgress);
      video.currentTime = initialTime;

      playheadTween = gsap.to(playhead, {
        time: duration,
        ease: "none",
        onUpdate: () => {
          if (Math.abs(video.currentTime - playhead.time) < MIN_SEEK_DELTA_SECONDS) {
            return;
          }

          try {
            video.currentTime = playhead.time;
          } catch (error) {
            console.warn("Unable to seek scroll video.", error);
          }
        },
        scrollTrigger: {
          id: "villa-scroll-video",
          trigger: scrollArea,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.28,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            onProgressChange(clampProgress(self.progress));
          },
          onRefresh: (self) => {
            const progress = clampProgress(self.progress);
            onProgressChange(progress);
            playhead.time = duration * progress;
            video.currentTime = playhead.time;
          },
        },
      });

      trigger = playheadTween.scrollTrigger ?? null;
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
    video.addEventListener("seeked", markFrameReady);
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
      video.removeEventListener("seeked", markFrameReady);
      video.removeEventListener("error", handleError);
      window.removeEventListener("touchstart", primeVideoDecode);
      window.removeEventListener("pointerdown", primeVideoDecode);
      window.removeEventListener("scroll", primeVideoDecode);
      playheadTween?.kill();
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
