import { Aperture, Camera, CameraOff, Settings2 } from "lucide-react";
import { CHANNELS, SCENES, type PhotonicParams, type SceneId } from "@/lib/photonic/constants";
import { cn } from "@/lib/utils";

type Stats = { motion: number; depth: number; fps: number };

type Props = {
  entered: boolean;
  scene: SceneId;
  params: PhotonicParams;
  cameraLock: boolean;
  cameraReady: boolean;
  settingsOpen: boolean;
  stats: Stats;
  onEnter: () => void;
  onScene: (id: SceneId) => void;
  onParams: (next: Partial<PhotonicParams>) => void;
  onCameraLock: (on: boolean) => void;
  onSettings: (open: boolean) => void;
};

export function PhotonicHud({
  entered,
  scene,
  params,
  cameraLock,
  cameraReady,
  settingsOpen,
  stats,
  onEnter,
  onScene,
  onParams,
  onCameraLock,
  onSettings,
}: Props) {
  const shift = 1 - stats.motion;

  return (
    <>
      {!entered && (
        <div className="absolute inset-0 z-20 flex items-end justify-start bg-gradient-to-t from-bg via-bg/55 to-transparent p-6 sm:p-10">
          <div className="max-w-xl pb-[env(safe-area-inset-bottom)]">
            <p className="mb-3 font-mono text-xs tracking-[0.28em] text-fg-muted uppercase">
              Five-channel dual-pass field
            </p>
            <h1 className="font-display text-5xl leading-none tracking-tight text-fg sm:text-7xl">
              Photonic-Ω
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-fg-muted sm:text-base">
              Per-pixel luminance gate, 5D photonic bloom, inverse motion lock.
              Move left and the field slides right. Lean in and the mandala expands.
            </p>
            <button
              type="button"
              onClick={onEnter}
              className="mt-8 min-h-11 rounded-sm bg-accent px-6 py-3 text-sm font-medium text-accent-fg transition-transform duration-[var(--motion-quick)] ease-[var(--ease-out)] hover:opacity-90 active:scale-[0.98]"
            >
              Enter the field
            </button>
          </div>
        </div>
      )}

      {entered && (
        <>
          <header className="pointer-events-none absolute top-0 left-0 z-10 flex w-full items-start justify-between gap-3 p-4 sm:p-6">
            <div className="pointer-events-auto rounded-lg border border-border bg-bg-elevated/80 px-4 py-3 backdrop-blur-sm">
              <p className="font-display text-lg leading-none text-fg">Photonic-Ω</p>
              <p className="mt-1 font-mono text-[0.68rem] tracking-wide text-fg-muted uppercase">
                Dual-pass FBO · luminance gate
              </p>
            </div>

            <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
              {SCENES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onScene(s.id)}
                  className={cn(
                    "min-h-11 rounded-md border px-3 font-mono text-xs tracking-wide uppercase sm:px-4",
                    scene === s.id
                      ? "border-border-strong bg-fg text-bg"
                      : "border-border bg-bg-elevated/80 text-fg-muted hover:text-fg",
                  )}
                >
                  {s.label}
                </button>
              ))}
              <button
                type="button"
                aria-label={cameraLock ? "Release camera" : "Lock camera"}
                aria-pressed={cameraLock}
                onClick={() => onCameraLock(!cameraLock)}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border bg-bg-elevated/80 text-fg backdrop-blur-sm hover:opacity-90"
                title={cameraLock ? "Release camera" : "Lock camera"}
              >
                {cameraLock && cameraReady ? (
                  <Camera className="size-4" strokeWidth={1.75} />
                ) : (
                  <CameraOff className="size-4" strokeWidth={1.75} />
                )}
              </button>
              <button
                type="button"
                aria-label="Tune pipeline"
                aria-pressed={settingsOpen}
                onClick={() => onSettings(!settingsOpen)}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border bg-bg-elevated/80 text-fg backdrop-blur-sm hover:opacity-90"
                title="Tune pipeline"
              >
                <Settings2 className="size-4" strokeWidth={1.75} />
              </button>
            </div>
          </header>

          <div className="pointer-events-none absolute bottom-0 left-0 z-10 flex w-full items-end justify-between gap-3 p-4 sm:p-6">
            <div className="pointer-events-auto rounded-lg border border-border bg-bg-elevated/80 px-3 py-2.5 backdrop-blur-sm">
              <ul className="flex flex-wrap gap-x-4 gap-y-2">
                {CHANNELS.map((ch, i) => {
                  const pulse = 0.35 + 0.65 * absWave(stats.motion, i);
                  return (
                    <li key={ch.id} className="flex items-center gap-2">
                      <span
                        className="size-1.5 shrink-0 rounded-full"
                        style={{ background: ch.color, opacity: 0.5 + pulse * 0.5 }}
                      />
                      <span className="font-mono text-[0.65rem] tracking-wide text-fg uppercase">
                        {ch.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <aside className="rounded-md border border-border bg-bg-elevated/75 px-3 py-2 font-mono text-[0.65rem] text-fg-muted backdrop-blur-sm">
              <p>
                offset <span className="tabular-nums text-fg">{stats.motion.toFixed(2)}</span>
                <span className="mx-2 text-fg-subtle">·</span>
                depth <span className="tabular-nums text-fg">{stats.depth.toFixed(2)}</span>
              </p>
              <p className="text-fg-subtle">
                shift {shift.toFixed(2)} · {Math.round(stats.fps)} fps ·{" "}
                {cameraLock && cameraReady ? "camera" : "pointer"}
              </p>
            </aside>
          </div>
        </>
      )}

      {entered && settingsOpen && (
        <div className="absolute top-24 right-4 z-20 w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-border bg-bg-elevated p-4 shadow-lg sm:right-6">
          <div className="mb-3 flex items-center gap-2 text-fg">
            <Aperture className="size-4" strokeWidth={1.75} />
            <p className="font-display text-sm">Pipeline</p>
          </div>
          <label className="mb-4 flex min-h-11 items-center justify-between gap-3 text-sm text-fg">
            Dual-pass bloom
            <input
              type="checkbox"
              checked={params.pipeline}
              onChange={(e) => onParams({ pipeline: e.target.checked })}
              className="size-4 accent-fg"
            />
          </label>
          <Slider
            label="Bloom"
            value={params.bloom}
            onChange={(v) => onParams({ bloom: v })}
          />
          <Slider
            label="Luminance gate"
            value={params.threshold}
            onChange={(v) => onParams({ threshold: v })}
          />
          <Slider
            label="Parallax"
            value={params.parallax}
            onChange={(v) => onParams({ parallax: v })}
          />
          <p className="mt-3 text-[0.7rem] leading-relaxed text-fg-subtle">
            {cameraLock && !cameraReady
              ? "Camera was blocked — pointer still drives inverse shift."
              : "Move across the field. Inverse mapping: you go left, light goes right."}
          </p>
        </div>
      )}
    </>
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 flex justify-between font-mono text-[0.65rem] text-fg-muted uppercase">
        {label}
        <span className="tabular-nums text-fg">{value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-bg-subtle accent-fg"
      />
    </label>
  );
}

function absWave(motion: number, i: number) {
  const t = motion * 6.283 + i * 1.256;
  return 0.5 + 0.5 * Math.sin(t);
}
