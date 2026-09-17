import { useCallback, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PhotonicCanvas } from "@/components/photonic/canvas";
import { PhotonicHud } from "@/components/photonic/hud";
import { DEFAULT_PARAMS, type PhotonicParams, type SceneId } from "@/lib/photonic/constants";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [entered, setEntered] = useState(false);
  const [scene, setScene] = useState<SceneId>("sovereign");
  const [params, setParams] = useState<PhotonicParams>(DEFAULT_PARAMS);
  const [cameraLock, setCameraLock] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [stats, setStats] = useState({ motion: 0.5, depth: 0.52, fps: 60 });

  const patchParams = useCallback((next: Partial<PhotonicParams>) => {
    setParams((prev) => ({ ...prev, ...next }));
  }, []);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
      <PhotonicCanvas
        scene={scene}
        params={params}
        cameraLock={entered && cameraLock}
        onStats={setStats}
        onCameraStatus={setCameraReady}
      />
      <PhotonicHud
        entered={entered}
        scene={scene}
        params={params}
        cameraLock={cameraLock}
        cameraReady={cameraReady}
        settingsOpen={settingsOpen}
        stats={stats}
        onEnter={() => setEntered(true)}
        onScene={setScene}
        onParams={patchParams}
        onCameraLock={setCameraLock}
        onSettings={setSettingsOpen}
      />
    </main>
  );
}
