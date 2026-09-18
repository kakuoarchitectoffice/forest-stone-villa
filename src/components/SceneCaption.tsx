import type { Scene } from "../data/scenes";

type SceneCaptionProps = { scene: Scene; index: number; total: number };

export function ContactDetails() {
  return <div className="contact-details">
    <a href="mailto:info@kakuo-ai.com">info@kakuo-ai.com</a>
    <a href="https://www.google.com/maps/search/?api=1&query=Forestgate%20DAIKANYAMA" target="_blank" rel="noopener noreferrer">Google Maps ↗</a>
  </div>;
}

export function SceneCaption({ scene, index, total }: SceneCaptionProps) {
  return <section className="scene-caption" aria-live="polite" key={scene.id}>
    <p className="scene-caption__count">{String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</p>
    <h1>{scene.title}</h1>
    <div className="scene-caption__body">
      <p>{scene.copy}</p>
      {scene.id === "night" && <ContactDetails />}
    </div>
  </section>;
}
