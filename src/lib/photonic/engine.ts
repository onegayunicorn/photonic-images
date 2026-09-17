import * as THREE from "three";
import {
  FRAG_BLUR,
  FRAG_COMPOSITE,
  FRAG_LUMINANCE,
  FRAG_SCENE,
  VERT,
} from "./shaders";
import { DEFAULT_PARAMS, type PhotonicParams, type SceneId } from "./constants";

export type EngineStats = {
  motion: number;
  depth: number;
  fps: number;
};

type EngineOptions = {
  canvas: HTMLCanvasElement;
  onStats?: (stats: EngineStats) => void;
};

function makeFBO(w: number, h: number, type: THREE.TextureDataType) {
  return new THREE.WebGLRenderTarget(w, h, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type,
    depthBuffer: false,
    stencilBuffer: false,
  });
}

export class PhotonicEngine {
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.OrthographicCamera;
  private rtScene: THREE.Scene;
  private quad: THREE.Mesh;
  private sceneMat: THREE.ShaderMaterial;
  private lumMat: THREE.ShaderMaterial;
  private blurHMat: THREE.ShaderMaterial;
  private blurVMat: THREE.ShaderMaterial;
  private compMat: THREE.ShaderMaterial;
  private fboSource: THREE.WebGLRenderTarget;
  private fboBright: THREE.WebGLRenderTarget;
  private fboBlurH: THREE.WebGLRenderTarget;
  private fboBlurV: THREE.WebGLRenderTarget;
  private textures = new Map<SceneId, THREE.Texture>();
  private loader = new THREE.TextureLoader();
  private params: PhotonicParams = { ...DEFAULT_PARAMS };
  private sceneId: SceneId = "sovereign";
  private motion = 0.5;
  private depth = 0.52;
  private lastT = 0;
  private fps = 60;
  private fpsAccum = 0;
  private fpsFrames = 0;
  private disposed = false;
  private onStats?: (stats: EngineStats) => void;
  private statsClock = 0;
  private resizeObs: ResizeObserver;

  constructor({ canvas, onStats }: EngineOptions) {
    this.onStats = onStats;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x05050a, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geo = new THREE.PlaneGeometry(2, 2);

    const fboType = this.renderer.capabilities.isWebGL2
      ? THREE.HalfFloatType
      : THREE.UnsignedByteType;

    const w = Math.max(1, canvas.clientWidth || 1);
    const h = Math.max(1, canvas.clientHeight || 1);

    this.fboSource = makeFBO(w, h, fboType);
    this.fboBright = makeFBO(w, h, fboType);
    this.fboBlurH = makeFBO(w, h, fboType);
    this.fboBlurV = makeFBO(w, h, fboType);

    this.sceneMat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG_SCENE,
      uniforms: {
        tArt: { value: null },
        uResolution: { value: new THREE.Vector2(w, h) },
        uTexSize: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 },
        uMotion: { value: 0.5 },
        uDepth: { value: 0.5 },
        uParallax: { value: this.params.parallax },
        uMode: { value: 0 },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.lumMat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG_LUMINANCE,
      uniforms: {
        tSource: { value: null },
        uThreshold: { value: this.params.threshold },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.blurHMat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG_BLUR,
      uniforms: {
        tGlow: { value: null },
        uResolution: { value: new THREE.Vector2(w, h) },
        uDirection: { value: new THREE.Vector2(1, 0) },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.blurVMat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG_BLUR,
      uniforms: {
        tGlow: { value: null },
        uResolution: { value: new THREE.Vector2(w, h) },
        uDirection: { value: new THREE.Vector2(0, 1) },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.compMat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG_COMPOSITE,
      uniforms: {
        tScene: { value: null },
        tGlow: { value: null },
        uTime: { value: 0 },
        uBloom: { value: this.params.bloom },
        uPipeline: { value: 1 },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.quad = new THREE.Mesh(geo, this.sceneMat);
    this.rtScene = new THREE.Scene();
    this.rtScene.add(this.quad);

    const boot = this.makeFallback();
    this.bindTexture(boot);

    this.resize();
    this.resizeObs = new ResizeObserver(() => this.resize());
    this.resizeObs.observe(canvas.parentElement ?? canvas);

    this.preload("sovereign", "/art/sovereign.png");
    this.preload("field", "/art/mandala.jpg");

    this.renderer.setAnimationLoop(this.loop);
  }

  setScene(id: SceneId) {
    this.sceneId = id;
    this.sceneMat.uniforms.uMode.value = id === "field" ? 1 : 0;
    const tex = this.textures.get(id);
    if (tex) this.bindTexture(tex);
  }

  setParams(next: Partial<PhotonicParams>) {
    this.params = { ...this.params, ...next };
    this.lumMat.uniforms.uThreshold.value = this.params.threshold;
    this.compMat.uniforms.uBloom.value = this.params.bloom;
    this.compMat.uniforms.uPipeline.value = this.params.pipeline ? 1 : 0;
    this.sceneMat.uniforms.uParallax.value = this.params.parallax;
  }

  setMotion(x: number, depth: number) {
    this.motion = x;
    this.depth = depth;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.resizeObs.disconnect();
    this.quad.geometry.dispose();
    this.sceneMat.dispose();
    this.lumMat.dispose();
    this.blurHMat.dispose();
    this.blurVMat.dispose();
    this.compMat.dispose();
    this.fboSource.dispose();
    this.fboBright.dispose();
    this.fboBlurH.dispose();
    this.fboBlurV.dispose();
    this.textures.forEach((t) => t.dispose());
    this.renderer.dispose();
  }

  private preload(id: SceneId, url: string) {
    this.loader.load(
      url,
      (tex) => {
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        tex.colorSpace = THREE.SRGBColorSpace;
        this.textures.set(id, tex);
        if (this.sceneId === id) this.bindTexture(tex);
      },
      undefined,
      () => {
        const fallback = this.makeFallback();
        this.textures.set(id, fallback);
        if (this.sceneId === id) this.bindTexture(fallback);
      },
    );
  }

  private bindTexture(tex: THREE.Texture) {
    this.sceneMat.uniforms.tArt.value = tex;
    const img = tex.image as { width?: number; height?: number } | undefined;
    const w = img?.width ?? 1;
    const h = img?.height ?? 1;
    (this.sceneMat.uniforms.uTexSize.value as THREE.Vector2).set(w, h);
  }

  private makeFallback() {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const g = ctx.createRadialGradient(512, 512, 0, 512, 512, 512);
      g.addColorStop(0, "#ffd700");
      g.addColorStop(0.22, "#7dff9a");
      g.addColorStop(0.45, "#40c0ff");
      g.addColorStop(0.7, "#8040ff");
      g.addColorStop(1, "#05050a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1024, 1024);
      for (let i = 0; i < 5; i++) {
        const ang = (i / 5) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(512, 512);
        ctx.lineTo(512 + Math.cos(ang) * 500, 512 + Math.sin(ang) * 500);
        ctx.strokeStyle = "rgba(255,255,255,0.85)";
        ctx.lineWidth = 8;
        ctx.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private resize = () => {
    if (this.disposed) return;
    const canvas = this.renderer.domElement;
    const parent = canvas.parentElement ?? canvas;
    const w = Math.max(1, parent.clientWidth);
    const h = Math.max(1, parent.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    const bw = Math.max(1, Math.floor(w * dpr));
    const bh = Math.max(1, Math.floor(h * dpr));
    this.fboSource.setSize(bw, bh);
    this.fboBright.setSize(bw, bh);
    this.fboBlurH.setSize(bw, bh);
    this.fboBlurV.setSize(bw, bh);
    (this.sceneMat.uniforms.uResolution.value as THREE.Vector2).set(bw, bh);
    (this.blurHMat.uniforms.uResolution.value as THREE.Vector2).set(bw, bh);
    (this.blurVMat.uniforms.uResolution.value as THREE.Vector2).set(bw, bh);
  };

  private loop = (timeMs: number) => {
    if (this.disposed) return;
    const t = timeMs * 0.001;
    const dt = Math.min(0.1, Math.max(0, t - this.lastT || 0.016));
    this.lastT = t;
    this.fpsAccum += dt;
    this.fpsFrames += 1;
    if (this.fpsAccum >= 0.4) {
      this.fps = this.fpsFrames / this.fpsAccum;
      this.fpsAccum = 0;
      this.fpsFrames = 0;
    }

    this.sceneMat.uniforms.uTime.value = t;
    this.sceneMat.uniforms.uMotion.value = this.motion;
    this.sceneMat.uniforms.uDepth.value = this.depth;
    this.compMat.uniforms.uTime.value = t;

    const { renderer, camera, rtScene, quad } = this;

    quad.material = this.sceneMat;
    renderer.setRenderTarget(this.fboSource);
    renderer.render(rtScene, camera);

    this.lumMat.uniforms.tSource.value = this.fboSource.texture;
    quad.material = this.lumMat;
    renderer.setRenderTarget(this.fboBright);
    renderer.render(rtScene, camera);

    this.blurHMat.uniforms.tGlow.value = this.fboBright.texture;
    quad.material = this.blurHMat;
    renderer.setRenderTarget(this.fboBlurH);
    renderer.render(rtScene, camera);

    this.blurVMat.uniforms.tGlow.value = this.fboBlurH.texture;
    quad.material = this.blurVMat;
    renderer.setRenderTarget(this.fboBlurV);
    renderer.render(rtScene, camera);

    this.compMat.uniforms.tScene.value = this.fboSource.texture;
    this.compMat.uniforms.tGlow.value = this.fboBlurV.texture;
    quad.material = this.compMat;
    renderer.setRenderTarget(null);
    renderer.render(rtScene, camera);

    this.statsClock += dt;
    if (this.statsClock > 0.12) {
      this.statsClock = 0;
      this.onStats?.({ motion: this.motion, depth: this.depth, fps: this.fps });
    }
  };
}
