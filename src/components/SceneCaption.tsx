import type { Scene } from "../data/scenes";

type SceneCaptionProps = {
  scene: Scene;
  index: number;
  total: number;
};

export function SceneCaption({ scene, index, total }: SceneCaptionProps) {
  return (
    <section className="scene-caption" aria-live="polite" key={scene.id}>
      <p className="scene-caption__count">
        {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </p>
      <h1>{scene.title}</h1>
      <p>{scene.copy}</p>
    </section>
  );
}
