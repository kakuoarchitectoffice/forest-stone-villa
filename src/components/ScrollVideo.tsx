import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type ScrollVideoProps = {
  disabled: boolean;
  posterSrc: string;
  scrollAreaRef: RefObject<HTMLElement | null>;
  videoSrc: string;
  onProgressChange: (progress: number) => void;
};

function clampProgress(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function ScrollVideo({
  disabled,
  posterSrc,
  scrollAreaRef,
  videoSrc,
  onProgressChange,
}: ScrollVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const frameRequestRef = useRef<number | null>(null);
  const targetTimeRef = useRef(0);
  const [hasFirstFrame, setHasFirstFrame] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const scrollArea = scrollAreaRef.current;

    if (!video || !scrollArea || disabled || hasVideoError) {
      return undefined;
    }

    let trigger: ScrollTrigger | null = null;

    const seekVideo = (targetTime: number) => {
      targetTimeRef.current = targetTime;

      if (frameRequestRef.current !== null) {
        return;
      }

      frameRequestRef.current = window.requestAnimationFrame(() => {
        frameRequestRef.current = null;

        if (!video || hasVideoError) {
          return;
        }

        const safeTime = Math.min(video.duration || 0, Math.max(0, targetTimeRef.current));
        if (Number.isFinite(safeTime) && Math.abs(video.currentTime - safeTime) > 0.01) {
          video.currentTime = safeTime;
        }
      });
    };

    const initializeScrollTrigger = () => {
      const duration = video.duration;

      if (!Number.isFinite(duration) || duration <= 0) {
        setHasVideoError(true);
        return;
      }

      video.pause();
      seekVideo(0);

      trigger = ScrollTrigger.create({
        id: "villa-scroll-video",
        trigger: scrollArea,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const progress = clampProgress(self.progress);
          onProgressChange(progress);
          seekVideo(duration * progress);
        },
      });

      ScrollTrigger.refresh();
    };

    const handleLoadedData = () => {
      setHasFirstFrame(true);
    };

    const handleError = () => {
      setHasVideoError(true);
    };

    video.addEventListener("loadedmetadata", initializeScrollTrigger);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("canplay", handleLoadedData);
    video.addEventListener("error", handleError);

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      initializeScrollTrigger();
    }

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      handleLoadedData();
    }

    return () => {
      video.removeEventListener("loadedmetadata", initializeScrollTrigger);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("canplay", handleLoadedData);
      video.removeEventListener("error", handleError);
      trigger?.kill();

      if (frameRequestRef.current !== null) {
        window.cancelAnimationFrame(frameRequestRef.current);
        frameRequestRef.current = null;
      }
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
        preload="auto"
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
