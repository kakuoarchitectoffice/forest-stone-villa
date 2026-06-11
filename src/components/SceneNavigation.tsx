import type { Scene } from "../data/scenes";

type SceneNavigationProps = {
  activeIndex: number;
  scenes: Scene[];
  onSelectScene: (index: number) => void;
};

export function SceneNavigation({
  activeIndex,
  scenes,
  onSelectScene,
}: SceneNavigationProps) {
  return (
    <>
      <nav className="scene-navigation" aria-label="Scene navigation">
        {scenes.map((scene, index) => {
          const isActive = index === activeIndex;

          return (
            <button
              className="scene-navigation__item"
              type="button"
              key={scene.id}
              aria-current={isActive ? "step" : undefined}
              onClick={() => onSelectScene(index)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <span>{scene.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mobile-scene-indicator" aria-hidden="true">
        {scenes.map((scene, index) => (
          <span
            className={index === activeIndex ? "is-active" : undefined}
            key={scene.id}
          />
        ))}
      </div>
    </>
  );
}
