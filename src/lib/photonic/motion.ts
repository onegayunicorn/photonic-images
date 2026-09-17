import { EMA_ALPHA } from "./constants";

export type MotionSample = {
  x: number;
  depth: number;
  source: "pointer" | "camera" | "idle";
};

type Listener = (sample: MotionSample) => void;

export class MotionTracker {
  private filteredX = 0.5;
  private filteredDepth = 0.52;
  private pointerX = 0.5;
  private pointerY = 0.5;
  private hasPointer = false;
  private cameraOn = false;
  private video: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private camCanvas: HTMLCanvasElement | null = null;
  private camCtx: CanvasRenderingContext2D | null = null;
  private listeners = new Set<Listener>();
  private target: HTMLElement | null = null;
  private disposed = false;

  attach(el: HTMLElement) {
    this.target = el;
    el.addEventListener("pointermove", this.onPointer);
    el.addEventListener("pointerdown", this.onPointer);
    el.addEventListener("pointerleave", this.onLeave);
  }

  onChange(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  async enableCamera() {
    if (this.cameraOn) return true;
    if (!navigator.mediaDevices?.getUserMedia) return false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      const video = document.createElement("video");
      video.setAttribute("playsinline", "true");
      video.muted = true;
      video.autoplay = true;
      video.srcObject = stream;
      await video.play();
      const canvas = document.createElement("canvas");
      canvas.width = 16;
      canvas.height = 12;
      this.camCtx = canvas.getContext("2d", { willReadFrequently: true });
      this.camCanvas = canvas;
      this.video = video;
      this.stream = stream;
      this.cameraOn = true;
      return true;
    } catch {
      this.cameraOn = false;
      return false;
    }
  }

  disableCamera() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }
    this.camCanvas = null;
    this.camCtx = null;
    this.cameraOn = false;
  }

  get cameraEnabled() {
    return this.cameraOn;
  }

  tick(time: number) {
    if (this.disposed) return;
    let rawX = this.pointerX;
    let rawDepth = 1 - this.pointerY;
    let source: MotionSample["source"] = this.hasPointer ? "pointer" : "idle";

    if (this.cameraOn) {
      const cam = this.sampleCamera();
      if (cam) {
        rawX = cam.x;
        rawDepth = cam.depth;
        source = "camera";
      }
    } else if (!this.hasPointer) {
      rawX = 0.5 + Math.sin(time * 0.22) * 0.18;
      rawDepth = 0.5 + Math.sin(time * 0.14 + 1.2) * 0.12;
    }

    this.filteredX = EMA_ALPHA * rawX + (1 - EMA_ALPHA) * this.filteredX;
    this.filteredDepth = EMA_ALPHA * rawDepth + (1 - EMA_ALPHA) * this.filteredDepth;

    const sample: MotionSample = {
      x: this.filteredX,
      depth: this.filteredDepth,
      source,
    };
    this.listeners.forEach((fn) => fn(sample));
    return sample;
  }

  dispose() {
    this.disposed = true;
    this.disableCamera();
    this.target?.removeEventListener("pointermove", this.onPointer);
    this.target?.removeEventListener("pointerdown", this.onPointer);
    this.target?.removeEventListener("pointerleave", this.onLeave);
    this.listeners.clear();
  }

  private onPointer = (ev: PointerEvent) => {
    const el = this.target;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    this.pointerX = Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width));
    this.pointerY = Math.min(1, Math.max(0, (ev.clientY - rect.top) / rect.height));
    this.hasPointer = true;
  };

  private onLeave = () => {
    this.hasPointer = false;
  };

  private sampleCamera(): { x: number; depth: number } | null {
    const video = this.video;
    const ctx = this.camCtx;
    if (!video || !ctx || video.readyState < 2) return null;
    ctx.drawImage(video, 0, 0, 16, 12);
    const img = ctx.getImageData(0, 0, 16, 12).data;
    let sumX = 0;
    let total = 0;
    let luma = 0;
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 16; x++) {
        const i = (y * 16 + x) * 4;
        const L = (img[i] + img[i + 1] + img[i + 2]) / 3;
        luma += L;
        if (L > 45) {
          sumX += x;
          total++;
        }
      }
    }
    const x = total > 0 ? 1 - sumX / total / 16 : 0.5;
    const depth = Math.min(1, Math.max(0, luma / (16 * 12) / 180));
    return { x, depth };
  }
}
