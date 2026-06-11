import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ContactSection } from "./components/ContactSection";
import { Header } from "./components/Header";
import { PrevNextControls } from "./components/PrevNextControls";
import { SceneCaption } from "./components/SceneCaption";
import { SceneNavigation } from "./components/SceneNavigation";
import { ScrollVideo } from "./components/ScrollVideo";
import { scenes } from "./data/scenes";

gsap.registerPlugin(ScrollTrigger);

const SCRUB_LENGTH = 7.8;

function assetPath(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}

function getViewportHeight() {
  return window.visualViewport?.height ?? window.innerHeight;
}

function getSceneIndex(progress: number) {
  const index = scenes.findIndex((scene, sceneIndex) => {
    const isLast = sceneIndex === scenes.length - 1;
    return progress >= scene.start && (isLast ? progress <= scene.end : progress < scene.end);
  });

  return index >= 0 ? index : scenes.length - 1;
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  return prefersReducedMotion;
}

function useViewportHeightVariable() {
  useEffect(() => {
    let frameId: number | null = null;

    const updateViewportHeight = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        document.documentElement.style.setProperty("--app-height", `${getViewportHeight()}px`);
        ScrollTrigger.refresh();
      });
    };

    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);
    window.addEventListener("orientationchange", updateViewportHeight);
    window.visualViewport?.addEventListener("resize", updateViewportHeight);

    return () => {
      window.removeEventListener("resize", updateViewportHeight);
      window.removeEventListener("orientationchange", updateViewportHeight);
      window.visualViewport?.removeEventListener("resize", updateViewportHeight);

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);
}

function useResponsiveAsset(desktopSrc: string, mobileSrc: string) {
  const [useMobileAsset, setUseMobileAsset] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia("(max-width: 760px)").matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 760px)");
    const updateAssetPreference = () => setUseMobileAsset(mediaQuery.matches);

    updateAssetPreference();
    mediaQuery.addEventListener("change", updateAssetPreference);

    return () => mediaQuery.removeEventListener("change", updateAssetPreference);
  }, []);

  return useMobileAsset ? mobileSrc : desktopSrc;
}

function App() {
  const scrollAreaRef = useRef<HTMLElement | null>(null);
  const contactRef = useRef<HTMLElement | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useViewportHeightVariable();

  const desktopPosterSrc = useMemo(() => assetPath("assets/images/poster-exterior-day.webp"), []);
  const mobilePosterSrc = useMemo(
    () => assetPath("assets/images/poster-exterior-day-mobile.webp"),
    [],
  );
  const desktopVideoSrc = useMemo(() => assetPath("assets/videos/villa_walkthrough.mp4"), []);
  const mobileVideoSrc = useMemo(
    () => assetPath("assets/videos/villa_walkthrough-mobile.mp4"),
    [],
  );
  const posterSrc = useResponsiveAsset(desktopPosterSrc, mobilePosterSrc);
  const videoSrc = useResponsiveAsset(desktopVideoSrc, mobileVideoSrc);
  const activeScene = scenes[activeIndex] ?? scenes[0];

  const updateProgress = useCallback((nextProgress: number) => {
    setProgress(nextProgress);
    setActiveIndex(getSceneIndex(nextProgress));
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      return undefined;
    }

    const lenis = new Lenis({
      smoothWheel: true,
      lerp: 0.08,
    });

    const raf = (time: number) => {
      lenis.raf(time * 1000);
    };

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    lenisRef.current = lenis;

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!prefersReducedMotion) {
      return undefined;
    }

    const sceneSections = Array.from(document.querySelectorAll<HTMLElement>(".reduced-scene"));
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visibleEntry) {
          return;
        }

        const target = visibleEntry.target as HTMLElement;
        const index = Number(target.dataset.sceneIndex);
        setActiveIndex(index);
        setProgress(scenes[index]?.start ?? 0);
      },
      { threshold: [0.44, 0.62, 0.78] },
    );

    sceneSections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  const getScrollTargetForProgress = useCallback((targetProgress: number) => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) {
      return 0;
    }

    const scrollableDistance = Math.max(0, scrollArea.offsetHeight - getViewportHeight());
    return scrollArea.offsetTop + scrollableDistance * Math.min(1, Math.max(0, targetProgress));
  }, []);

  const scrollToY = useCallback(
    (targetY: number) => {
      if (lenisRef.current && !prefersReducedMotion) {
        lenisRef.current.scrollTo(targetY, {
          duration: 1.25,
          easing: (time: number) => 1 - Math.pow(1 - time, 3),
        });
        return;
      }

      window.scrollTo({
        top: targetY,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    },
    [prefersReducedMotion],
  );

  const scrollToScene = useCallback(
    (sceneIndex: number) => {
      const boundedIndex = Math.min(scenes.length - 1, Math.max(0, sceneIndex));

      if (prefersReducedMotion) {
        document
          .getElementById(`reduced-${scenes[boundedIndex].id}`)
          ?.scrollIntoView({ behavior: "auto", block: "start" });
        return;
      }

      const scene = scenes[boundedIndex];
      const targetProgress = scene.anchor;
      scrollToY(getScrollTargetForProgress(targetProgress));
    },
    [getScrollTargetForProgress, prefersReducedMotion, scrollToY],
  );

  const scrollToContact = useCallback(() => {
    if (!contactRef.current) {
      return;
    }

    if (lenisRef.current && !prefersReducedMotion) {
      lenisRef.current.scrollTo(contactRef.current, {
        duration: 1.35,
        easing: (time: number) => 1 - Math.pow(1 - time, 3),
      });
      return;
    }

    contactRef.current.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [prefersReducedMotion]);

  const handlePrev = useCallback(() => {
    scrollToScene(activeIndex - 1);
  }, [activeIndex, scrollToScene]);

  const handleNext = useCallback(() => {
    if (activeIndex >= scenes.length - 1) {
      scrollToContact();
      return;
    }

    scrollToScene(activeIndex + 1);
  }, [activeIndex, scrollToContact, scrollToScene]);

  return (
    <div className={`app-shell${prefersReducedMotion ? " is-reduced-motion" : ""}`}>
      <ScrollVideo
        disabled={prefersReducedMotion}
        posterSrc={posterSrc}
        scrollAreaRef={scrollAreaRef}
        videoSrc={videoSrc}
        onProgressChange={updateProgress}
      />

      <div className="ambient-overlay" aria-hidden="true" />
      <Header />

      {!prefersReducedMotion && (
        <SceneCaption scene={activeScene} index={activeIndex} total={scenes.length} />
      )}

      <SceneNavigation
        activeIndex={activeIndex}
        scenes={scenes}
        onSelectScene={scrollToScene}
      />
      <PrevNextControls
        activeIndex={activeIndex}
        totalScenes={scenes.length}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      <main className="page-flow">
        {prefersReducedMotion ? (
          <div className="reduced-sequence" aria-label="Private villa scenes">
            {scenes.map((scene, index) => (
              <section
                className="reduced-scene"
                data-scene-index={index}
                id={`reduced-${scene.id}`}
                key={scene.id}
              >
                <p>{String(index + 1).padStart(2, "0")} / 07</p>
                <h1>{scene.title}</h1>
                <span>{scene.copy}</span>
              </section>
            ))}
          </div>
        ) : (
          <section
            className="scroll-sequence"
            ref={scrollAreaRef}
            style={{ minHeight: `calc(var(--app-height) * ${SCRUB_LENGTH})` }}
            aria-label="Scroll controlled villa walkthrough"
          >
            <span className="scroll-progress" style={{ transform: `scaleY(${progress})` }} />
          </section>
        )}

        <ContactSection ref={contactRef} />
      </main>
    </div>
  );
}

export default App;
