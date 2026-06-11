type PrevNextControlsProps = {
  activeIndex: number;
  totalScenes: number;
  onPrev: () => void;
  onNext: () => void;
};

export function PrevNextControls({
  activeIndex,
  totalScenes,
  onPrev,
  onNext,
}: PrevNextControlsProps) {
  return (
    <div className="scene-controls" aria-label="Scene controls">
      <button
        className="text-control"
        type="button"
        disabled={activeIndex === 0}
        onClick={onPrev}
      >
        Prev
      </button>
      <button className="text-control" type="button" onClick={onNext}>
        {activeIndex === totalScenes - 1 ? "Contact" : "Next"}
      </button>
    </div>
  );
}
