import { useEffect, useRef } from "react";
import { PhotonicEngine } from "@/lib/photonic/engine";
import type { EngineStats } from "@/lib/photonic/engine";
import type { PhotonicParams, SceneId } from "@/lib/photonic/constants";
import { MotionTracker } from "@/lib/photonic/motion";

type Props = {
  scene: SceneId;
  params: PhotonicParams;
  cameraLock: boolean;
  onStats: (stats: EngineStats) => void;
  onCameraStatus: (ok: boolean) => void;
};

export function PhotonicCanvas({
  scene,
  params,
  cameraLock,
  onStats,
  onCameraStatus,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<PhotonicEngine | null>(null);
  const motionRef = useRef<MotionTracker | null>(null);
  const onStatsRef = useRef(onStats);
  const onCamRef = useRef(onCameraStatus);
  onStatsRef.current = onStats;
  onCamRef.current = onCameraStatus;

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;

    const engine = new PhotonicEngine({
      canvas,
      onStats: (s) => onStatsRef.current(s),
    });
    const motion = new MotionTracker();
    motion.attach(host);
    engineRef.current = engine;
    motionRef.current = motion;

    let raf = 0;
    const pump = (now: number) => {
      const sample = motion.tick(now * 0.001);
      if (sample) engine.setMotion(sample.x, sample.depth);
      raf = requestAnimationFrame(pump);
    };
    raf = requestAnimationFrame(pump);

    return () => {
      cancelAnimationFrame(raf);
      motion.dispose();
      engine.dispose();
      engineRef.current = null;
      motionRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setScene(scene);
  }, [scene]);

  useEffect(() => {
    engineRef.current?.setParams(params);
  }, [params]);

  useEffect(() => {
    const motion = motionRef.current;
    if (!motion) return;
    let cancelled = false;
    if (cameraLock) {
      motion.enableCamera().then((ok) => {
        if (!cancelled) onCamRef.current(ok);
      });
    } else {
      motion.disableCamera();
      onCamRef.current(false);
    }
    return () => {
      cancelled = true;
    };
  }, [cameraLock]);

  return (
    <div ref={hostRef} className="absolute inset-0 touch-none">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
