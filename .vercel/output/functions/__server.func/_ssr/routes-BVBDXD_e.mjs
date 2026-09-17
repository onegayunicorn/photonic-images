import { i as __toESM } from "../_runtime.mjs";
import { L as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Aperture, i as CameraOff, n as Settings2, r as Camera } from "../_libs/lucide-react.mjs";
import { a as Mesh, c as RGBAFormat, d as ShaderMaterial, f as TextureLoader, h as WebGLRenderTarget, i as LinearFilter, l as SRGBColorSpace, m as Vector2, n as CanvasTexture, o as OrthographicCamera, p as UnsignedByteType, r as HalfFloatType, s as PlaneGeometry, t as WebGLRenderer, u as Scene } from "../_libs/three.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BVBDXD_e.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
var FRAG_SCENE = `
precision highp float;
varying vec2 vUv;
uniform sampler2D tArt;
uniform vec2 uResolution;
uniform vec2 uTexSize;
uniform float uTime;
uniform float uMotion;
uniform float uDepth;
uniform float uParallax;
uniform float uMode;

#define PHI 1.61803398875
#define SCHUMANN 7.83
#define TAU 6.28318530718

const vec3 c1 = vec3(0.20, 0.40, 0.60);
const vec3 c2 = vec3(0.70, 0.20, 0.90);
const vec3 c3 = vec3(0.20, 0.90, 0.40);
const vec3 c4 = vec3(1.00, 0.85, 0.20);
const vec3 c5 = vec3(0.50, 0.90, 0.70);

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  v += a * noise(p); p *= 2.03; a *= 0.5;
  v += a * noise(p); p *= 2.03; a *= 0.5;
  v += a * noise(p); p *= 2.03; a *= 0.5;
  v += a * noise(p); p *= 2.03; a *= 0.5;
  v += a * noise(p);
  return v;
}

float phase(float t, float f) {
  return sin(t * f * TAU);
}

vec2 fitUV(vec2 uv, vec2 res, vec2 tex, float cover) {
  float sa = res.x / max(res.y, 1.0);
  float ta = tex.x / max(tex.y, 1.0);
  vec2 p = uv - 0.5;
  float wider = step(ta, sa);
  vec2 contain = vec2(
    mix(1.0, sa / max(ta, 0.0001), wider),
    mix(ta / max(sa, 0.0001), 1.0, wider)
  );
  vec2 coverS = vec2(
    mix(sa / max(ta, 0.0001), 1.0, wider),
    mix(1.0, ta / max(sa, 0.0001), wider)
  );
  p *= mix(contain, coverS, cover);
  return p + 0.5;
}

void main() {
  vec2 uv = vUv;
  float t = uTime;
  float shift = 1.0 - uMotion;
  float depthScale = 0.78 + uDepth * 0.42;
  vec2 origin = mix(vec2(0.5), vec2(shift, 0.52), uParallax * 0.42);

  vec2 warped = (uv - origin) / mix(1.0, depthScale, uParallax * 0.85) + origin;
  warped.x += (shift - 0.5) * uParallax * 0.10;
  warped.y += (uDepth - 0.5) * uParallax * 0.05;

  vec2 artUV = fitUV(warped, uResolution, uTexSize, uMode);
  vec2 inside = smoothstep(vec2(-0.02), vec2(0.0), artUV) * smoothstep(vec2(1.02), vec2(1.0), artUV);
  float inFrame = inside.x * inside.y;
  vec3 art = texture2D(tArt, clamp(artUV, 0.0, 1.0)).rgb * inFrame;

  vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
  vec2 c = (uv - origin) * aspect;
  c /= (0.48 + uDepth * 0.52);
  float r = length(c);
  float ang = atan(c.y, c.x);

  float psi1 = phase(t, 0.09);
  float psi2 = phase(t, PHI * 0.055);
  float psi3 = phase(t, SCHUMANN * 0.01);
  float psi4 = phase(t, PHI * 0.04);
  float psi5 = phase(t, 0.035);

  float fold = abs(cos(ang * 2.5 + t * 0.18));
  float ring = 0.5 + 0.5 * sin(r * 16.0 - t * PHI * 0.4 + fold * 2.4);
  float spokes = pow(abs(cos(ang * 2.5 - t * 0.22)), 10.0);
  float core = smoothstep(0.28, 0.0, r);
  float halo = smoothstep(1.05, 0.12, r);
  float filaments = fbm(vec2(ang * 1.4, r * 3.2 - t * 0.28));
  float nebula = fbm(uv * 2.4 + vec2(t * 0.03, -t * 0.02));

  vec3 field = vec3(0.0);
  field += c1 * (0.22 + 0.22 * psi1) * halo * nebula;
  field += c2 * (0.32 + 0.32 * psi2) * spokes * halo;
  field += c3 * (0.38 + 0.38 * psi3) * fold * smoothstep(1.0, 0.08, r);
  field += c4 * (0.55 + 0.45 * psi4) * core * (0.65 + 0.55 * ring);
  field += c5 * (0.28 + 0.28 * psi5) * filaments * halo;
  field += 1.55 * c4 * pow(core, 1.8);
  field += 0.12 * mix(c2, c5, nebula) * (1.0 - smoothstep(0.0, 1.35, r));

  float starCell = hash(floor(uv * uResolution.xy * 0.28));
  float stars = smoothstep(0.996, 1.0, starCell);
  field += stars * vec3(0.85, 0.9, 1.0) * (0.35 + 0.65 * psi1);

  float L = dot(art, vec3(0.299, 0.587, 0.114));
  vec3 litArt = art;
  float fieldAmt = mix(0.07 + 0.22 * smoothstep(0.38, 0.9, L), 1.0, uMode);
  litArt += field * fieldAmt;
  litArt += c4 * pow(max(L, 0.0), 3.4) * mix(0.28, 0.08, uMode);

  float warp = smoothstep(shift - 0.36, shift + 0.36, uv.x);
  float push = mix(0.06, 0.55, uMode) * warp;
  vec3 pushed = mix(litArt, field * 0.9 + art * 0.45, push);
  vec3 mixed = mix(pushed, field, uMode * 0.92);
  mixed *= 0.94 + 0.06 * mix(c1, c4, warp);

  gl_FragColor = vec4(mixed, 1.0);
}
`;
var FRAG_LUMINANCE = `
precision highp float;
varying vec2 vUv;
uniform sampler2D tSource;
uniform float uThreshold;

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  vec4 color = texture2D(tSource, vUv);
  float L = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  float lo = uThreshold;
  float hi = min(1.0, uThreshold + 0.22);
  float bright = smoothstep(lo, hi, L);

  vec3 hsv = rgb2hsv(color.rgb);
  hsv.y = clamp(hsv.y * 1.25, 0.0, 1.0);
  hsv.z = clamp(hsv.z * 1.15, 0.0, 1.4);

  gl_FragColor = vec4(hsv2rgb(hsv) * bright, bright);
}
`;
var FRAG_BLUR = `
precision highp float;
varying vec2 vUv;
uniform sampler2D tGlow;
uniform vec2 uResolution;
uniform vec2 uDirection;

void main() {
  vec2 px = uDirection / max(uResolution, vec2(1.0));
  vec4 acc = vec4(0.0);
  acc += texture2D(tGlow, vUv - 4.0 * px) * 0.05;
  acc += texture2D(tGlow, vUv - 3.0 * px) * 0.09;
  acc += texture2D(tGlow, vUv - 2.0 * px) * 0.12;
  acc += texture2D(tGlow, vUv - 1.0 * px) * 0.15;
  acc += texture2D(tGlow, vUv) * 0.18;
  acc += texture2D(tGlow, vUv + 1.0 * px) * 0.15;
  acc += texture2D(tGlow, vUv + 2.0 * px) * 0.12;
  acc += texture2D(tGlow, vUv + 3.0 * px) * 0.09;
  acc += texture2D(tGlow, vUv + 4.0 * px) * 0.05;
  gl_FragColor = acc;
}
`;
var FRAG_COMPOSITE = `
precision highp float;
varying vec2 vUv;
uniform sampler2D tScene;
uniform sampler2D tGlow;
uniform float uTime;
uniform float uBloom;
uniform float uPipeline;

#define PHI 1.61803398875
#define SCHUMANN 7.83

const vec3 c1 = vec3(0.20, 0.40, 0.60);
const vec3 c2 = vec3(0.70, 0.20, 0.90);
const vec3 c3 = vec3(0.20, 0.90, 0.40);
const vec3 c4 = vec3(1.00, 0.85, 0.20);
const vec3 c5 = vec3(0.50, 0.90, 0.70);

vec3 photonicTint(vec3 rgb, float lum, float t) {
  vec3 tint = mix(c1, c5, clamp(lum, 0.0, 1.0));
  tint = mix(tint, c2, smoothstep(0.4, 0.8, lum * (0.5 + 0.5 * sin(t))));
  tint = mix(tint, c3, smoothstep(0.6, 0.9, lum * (0.5 + 0.5 * cos(t * SCHUMANN))));
  tint = mix(tint, c4, smoothstep(0.8, 1.0, lum * (0.5 + 0.5 * sin(t * PHI))));
  return rgb * tint * 1.35;
}

void main() {
  vec3 scene = texture2D(tScene, vUv).rgb;
  vec4 glowSrc = texture2D(tGlow, vUv);
  float lum = max(glowSrc.a, dot(glowSrc.rgb, vec3(0.299, 0.587, 0.114)));
  vec3 bloomCol = photonicTint(glowSrc.rgb, lum, uTime);
  vec3 withBloom = scene + bloomCol * lum * uBloom * 0.85;
  vec3 finalCol = mix(scene, withBloom, uPipeline);
  finalCol = finalCol / (vec3(1.0) + finalCol * 0.28);
  gl_FragColor = vec4(finalCol, 1.0);
}
`;
var EMA_ALPHA = .15;
var CHANNELS = [
	{
		id: "base",
		label: "Base",
		freq: "steady",
		color: "#4a88c4"
	},
	{
		id: "violet",
		label: "Violet",
		freq: "sin(t)",
		color: "#a85ad6"
	},
	{
		id: "life",
		label: "Life",
		freq: "7.83 Hz",
		color: "#3dcc7a"
	},
	{
		id: "gold",
		label: "Gold",
		freq: "φ 1.618",
		color: "#e8c547"
	},
	{
		id: "field",
		label: "Field",
		freq: "envelope",
		color: "#6fd4a8"
	}
];
var DEFAULT_PARAMS = {
	bloom: .82,
	threshold: .48,
	parallax: .78,
	pipeline: true
};
var SCENES = [{
	id: "sovereign",
	label: "Sovereign",
	src: "/art/sovereign.png"
}, {
	id: "field",
	label: "Mandala",
	src: "/art/mandala.jpg"
}];
function makeFBO(w, h, type) {
	return new WebGLRenderTarget(w, h, {
		minFilter: LinearFilter,
		magFilter: LinearFilter,
		format: RGBAFormat,
		type,
		depthBuffer: false,
		stencilBuffer: false
	});
}
var PhotonicEngine = class {
	renderer;
	camera;
	rtScene;
	quad;
	sceneMat;
	lumMat;
	blurHMat;
	blurVMat;
	compMat;
	fboSource;
	fboBright;
	fboBlurH;
	fboBlurV;
	textures = /* @__PURE__ */ new Map();
	loader = new TextureLoader();
	params = { ...DEFAULT_PARAMS };
	sceneId = "sovereign";
	motion = .5;
	depth = .52;
	lastT = 0;
	fps = 60;
	fpsAccum = 0;
	fpsFrames = 0;
	disposed = false;
	onStats;
	statsClock = 0;
	resizeObs;
	constructor({ canvas, onStats }) {
		this.onStats = onStats;
		this.renderer = new WebGLRenderer({
			canvas,
			antialias: false,
			alpha: false,
			powerPreference: "high-performance"
		});
		this.renderer.setClearColor(328970, 1);
		this.renderer.outputColorSpace = SRGBColorSpace;
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
		this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
		const geo = new PlaneGeometry(2, 2);
		const fboType = this.renderer.capabilities.isWebGL2 ? HalfFloatType : UnsignedByteType;
		const w = Math.max(1, canvas.clientWidth || 1);
		const h = Math.max(1, canvas.clientHeight || 1);
		this.fboSource = makeFBO(w, h, fboType);
		this.fboBright = makeFBO(w, h, fboType);
		this.fboBlurH = makeFBO(w, h, fboType);
		this.fboBlurV = makeFBO(w, h, fboType);
		this.sceneMat = new ShaderMaterial({
			vertexShader: VERT,
			fragmentShader: FRAG_SCENE,
			uniforms: {
				tArt: { value: null },
				uResolution: { value: new Vector2(w, h) },
				uTexSize: { value: new Vector2(1, 1) },
				uTime: { value: 0 },
				uMotion: { value: .5 },
				uDepth: { value: .5 },
				uParallax: { value: this.params.parallax },
				uMode: { value: 0 }
			},
			depthTest: false,
			depthWrite: false
		});
		this.lumMat = new ShaderMaterial({
			vertexShader: VERT,
			fragmentShader: FRAG_LUMINANCE,
			uniforms: {
				tSource: { value: null },
				uThreshold: { value: this.params.threshold }
			},
			depthTest: false,
			depthWrite: false
		});
		this.blurHMat = new ShaderMaterial({
			vertexShader: VERT,
			fragmentShader: FRAG_BLUR,
			uniforms: {
				tGlow: { value: null },
				uResolution: { value: new Vector2(w, h) },
				uDirection: { value: new Vector2(1, 0) }
			},
			depthTest: false,
			depthWrite: false
		});
		this.blurVMat = new ShaderMaterial({
			vertexShader: VERT,
			fragmentShader: FRAG_BLUR,
			uniforms: {
				tGlow: { value: null },
				uResolution: { value: new Vector2(w, h) },
				uDirection: { value: new Vector2(0, 1) }
			},
			depthTest: false,
			depthWrite: false
		});
		this.compMat = new ShaderMaterial({
			vertexShader: VERT,
			fragmentShader: FRAG_COMPOSITE,
			uniforms: {
				tScene: { value: null },
				tGlow: { value: null },
				uTime: { value: 0 },
				uBloom: { value: this.params.bloom },
				uPipeline: { value: 1 }
			},
			depthTest: false,
			depthWrite: false
		});
		this.quad = new Mesh(geo, this.sceneMat);
		this.rtScene = new Scene();
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
	setScene(id) {
		this.sceneId = id;
		this.sceneMat.uniforms.uMode.value = id === "field" ? 1 : 0;
		const tex = this.textures.get(id);
		if (tex) this.bindTexture(tex);
	}
	setParams(next) {
		this.params = {
			...this.params,
			...next
		};
		this.lumMat.uniforms.uThreshold.value = this.params.threshold;
		this.compMat.uniforms.uBloom.value = this.params.bloom;
		this.compMat.uniforms.uPipeline.value = this.params.pipeline ? 1 : 0;
		this.sceneMat.uniforms.uParallax.value = this.params.parallax;
	}
	setMotion(x, depth) {
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
	preload(id, url) {
		this.loader.load(url, (tex) => {
			tex.minFilter = LinearFilter;
			tex.magFilter = LinearFilter;
			tex.generateMipmaps = false;
			tex.colorSpace = SRGBColorSpace;
			this.textures.set(id, tex);
			if (this.sceneId === id) this.bindTexture(tex);
		}, void 0, () => {
			const fallback = this.makeFallback();
			this.textures.set(id, fallback);
			if (this.sceneId === id) this.bindTexture(fallback);
		});
	}
	bindTexture(tex) {
		this.sceneMat.uniforms.tArt.value = tex;
		const img = tex.image;
		const w = img?.width ?? 1;
		const h = img?.height ?? 1;
		this.sceneMat.uniforms.uTexSize.value.set(w, h);
	}
	makeFallback() {
		const canvas = document.createElement("canvas");
		canvas.width = 1024;
		canvas.height = 1024;
		const ctx = canvas.getContext("2d");
		if (ctx) {
			const g = ctx.createRadialGradient(512, 512, 0, 512, 512, 512);
			g.addColorStop(0, "#ffd700");
			g.addColorStop(.22, "#7dff9a");
			g.addColorStop(.45, "#40c0ff");
			g.addColorStop(.7, "#8040ff");
			g.addColorStop(1, "#05050a");
			ctx.fillStyle = g;
			ctx.fillRect(0, 0, 1024, 1024);
			for (let i = 0; i < 5; i++) {
				const ang = i / 5 * Math.PI * 2 - Math.PI / 2;
				ctx.beginPath();
				ctx.moveTo(512, 512);
				ctx.lineTo(512 + Math.cos(ang) * 500, 512 + Math.sin(ang) * 500);
				ctx.strokeStyle = "rgba(255,255,255,0.85)";
				ctx.lineWidth = 8;
				ctx.stroke();
			}
		}
		const tex = new CanvasTexture(canvas);
		tex.colorSpace = SRGBColorSpace;
		return tex;
	}
	resize = () => {
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
		this.sceneMat.uniforms.uResolution.value.set(bw, bh);
		this.blurHMat.uniforms.uResolution.value.set(bw, bh);
		this.blurVMat.uniforms.uResolution.value.set(bw, bh);
	};
	loop = (timeMs) => {
		if (this.disposed) return;
		const t = timeMs * .001;
		const dt = Math.min(.1, Math.max(0, t - this.lastT || .016));
		this.lastT = t;
		this.fpsAccum += dt;
		this.fpsFrames += 1;
		if (this.fpsAccum >= .4) {
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
		if (this.statsClock > .12) {
			this.statsClock = 0;
			this.onStats?.({
				motion: this.motion,
				depth: this.depth,
				fps: this.fps
			});
		}
	};
};
var MotionTracker = class {
	filteredX = .5;
	filteredDepth = .52;
	pointerX = .5;
	pointerY = .5;
	hasPointer = false;
	cameraOn = false;
	video = null;
	stream = null;
	camCanvas = null;
	camCtx = null;
	listeners = /* @__PURE__ */ new Set();
	target = null;
	disposed = false;
	attach(el) {
		this.target = el;
		el.addEventListener("pointermove", this.onPointer);
		el.addEventListener("pointerdown", this.onPointer);
		el.addEventListener("pointerleave", this.onLeave);
	}
	onChange(fn) {
		this.listeners.add(fn);
		return () => this.listeners.delete(fn);
	}
	async enableCamera() {
		if (this.cameraOn) return true;
		if (!navigator.mediaDevices?.getUserMedia) return false;
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					width: 640,
					height: 480,
					facingMode: "user"
				},
				audio: false
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
	tick(time) {
		if (this.disposed) return;
		let rawX = this.pointerX;
		let rawDepth = 1 - this.pointerY;
		let source = this.hasPointer ? "pointer" : "idle";
		if (this.cameraOn) {
			const cam = this.sampleCamera();
			if (cam) {
				rawX = cam.x;
				rawDepth = cam.depth;
				source = "camera";
			}
		} else if (!this.hasPointer) {
			rawX = .5 + Math.sin(time * .22) * .18;
			rawDepth = .5 + Math.sin(time * .14 + 1.2) * .12;
		}
		this.filteredX = EMA_ALPHA * rawX + (1 - EMA_ALPHA) * this.filteredX;
		this.filteredDepth = EMA_ALPHA * rawDepth + (1 - EMA_ALPHA) * this.filteredDepth;
		const sample = {
			x: this.filteredX,
			depth: this.filteredDepth,
			source
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
	onPointer = (ev) => {
		const el = this.target;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		if (rect.width <= 0 || rect.height <= 0) return;
		this.pointerX = Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width));
		this.pointerY = Math.min(1, Math.max(0, (ev.clientY - rect.top) / rect.height));
		this.hasPointer = true;
	};
	onLeave = () => {
		this.hasPointer = false;
	};
	sampleCamera() {
		const video = this.video;
		const ctx = this.camCtx;
		if (!video || !ctx || video.readyState < 2) return null;
		ctx.drawImage(video, 0, 0, 16, 12);
		const img = ctx.getImageData(0, 0, 16, 12).data;
		let sumX = 0;
		let total = 0;
		let luma = 0;
		for (let y = 0; y < 12; y++) for (let x = 0; x < 16; x++) {
			const i = (y * 16 + x) * 4;
			const L = (img[i] + img[i + 1] + img[i + 2]) / 3;
			luma += L;
			if (L > 45) {
				sumX += x;
				total++;
			}
		}
		return {
			x: total > 0 ? 1 - sumX / total / 16 : .5,
			depth: Math.min(1, Math.max(0, luma / 192 / 180))
		};
	}
};
function PhotonicCanvas({ scene, params, cameraLock, onStats, onCameraStatus }) {
	const hostRef = (0, import_react.useRef)(null);
	const canvasRef = (0, import_react.useRef)(null);
	const engineRef = (0, import_react.useRef)(null);
	const motionRef = (0, import_react.useRef)(null);
	const onStatsRef = (0, import_react.useRef)(onStats);
	const onCamRef = (0, import_react.useRef)(onCameraStatus);
	onStatsRef.current = onStats;
	onCamRef.current = onCameraStatus;
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		const host = hostRef.current;
		if (!canvas || !host) return;
		const engine = new PhotonicEngine({
			canvas,
			onStats: (s) => onStatsRef.current(s)
		});
		const motion = new MotionTracker();
		motion.attach(host);
		engineRef.current = engine;
		motionRef.current = motion;
		let raf = 0;
		const pump = (now) => {
			const sample = motion.tick(now * .001);
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
	(0, import_react.useEffect)(() => {
		engineRef.current?.setScene(scene);
	}, [scene]);
	(0, import_react.useEffect)(() => {
		engineRef.current?.setParams(params);
	}, [params]);
	(0, import_react.useEffect)(() => {
		const motion = motionRef.current;
		if (!motion) return;
		let cancelled = false;
		if (cameraLock) motion.enableCamera().then((ok) => {
			if (!cancelled) onCamRef.current(ok);
		});
		else {
			motion.disableCamera();
			onCamRef.current(false);
		}
		return () => {
			cancelled = true;
		};
	}, [cameraLock]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: hostRef,
		className: "absolute inset-0 touch-none",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
			ref: canvasRef,
			className: "block h-full w-full"
		})
	});
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function PhotonicHud({ entered, scene, params, cameraLock, cameraReady, settingsOpen, stats, onEnter, onScene, onParams, onCameraLock, onSettings }) {
	const shift = 1 - stats.motion;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		!entered && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute inset-0 z-20 flex items-end justify-start bg-gradient-to-t from-bg via-bg/55 to-transparent p-6 sm:p-10",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-w-xl pb-[env(safe-area-inset-bottom)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-3 font-mono text-xs tracking-[0.28em] text-fg-muted uppercase",
						children: "Five-channel dual-pass field"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-5xl leading-none tracking-tight text-fg sm:text-7xl",
						children: "Photonic-Ω"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-5 max-w-md text-sm leading-relaxed text-fg-muted sm:text-base",
						children: "Per-pixel luminance gate, 5D photonic bloom, inverse motion lock. Move left and the field slides right. Lean in and the mandala expands."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onEnter,
						className: "mt-8 min-h-11 rounded-sm bg-accent px-6 py-3 text-sm font-medium text-accent-fg transition-transform duration-[var(--motion-quick)] ease-[var(--ease-out)] hover:opacity-90 active:scale-[0.98]",
						children: "Enter the field"
					})
				]
			})
		}),
		entered && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "pointer-events-none absolute top-0 left-0 z-10 flex w-full items-start justify-between gap-3 p-4 sm:p-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-auto rounded-lg border border-border bg-bg-elevated/80 px-4 py-3 backdrop-blur-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-lg leading-none text-fg",
					children: "Photonic-Ω"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 font-mono text-[0.68rem] tracking-wide text-fg-muted uppercase",
					children: "Dual-pass FBO · luminance gate"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-auto flex flex-wrap items-center justify-end gap-2",
				children: [
					SCENES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => onScene(s.id),
						className: cn("min-h-11 rounded-md border px-3 font-mono text-xs tracking-wide uppercase sm:px-4", scene === s.id ? "border-border-strong bg-fg text-bg" : "border-border bg-bg-elevated/80 text-fg-muted hover:text-fg"),
						children: s.label
					}, s.id)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": cameraLock ? "Release camera" : "Lock camera",
						"aria-pressed": cameraLock,
						onClick: () => onCameraLock(!cameraLock),
						className: "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border bg-bg-elevated/80 text-fg backdrop-blur-sm hover:opacity-90",
						title: cameraLock ? "Release camera" : "Lock camera",
						children: cameraLock && cameraReady ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, {
							className: "size-4",
							strokeWidth: 1.75
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CameraOff, {
							className: "size-4",
							strokeWidth: 1.75
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "Tune pipeline",
						"aria-pressed": settingsOpen,
						onClick: () => onSettings(!settingsOpen),
						className: "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border bg-bg-elevated/80 text-fg backdrop-blur-sm hover:opacity-90",
						title: "Tune pipeline",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings2, {
							className: "size-4",
							strokeWidth: 1.75
						})
					})
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "pointer-events-none absolute bottom-0 left-0 z-10 flex w-full items-end justify-between gap-3 p-4 sm:p-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-auto rounded-lg border border-border bg-bg-elevated/80 px-3 py-2.5 backdrop-blur-sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "flex flex-wrap gap-x-4 gap-y-2",
					children: CHANNELS.map((ch, i) => {
						const pulse = .35 + .65 * absWave(stats.motion, i);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "size-1.5 shrink-0 rounded-full",
								style: {
									background: ch.color,
									opacity: .5 + pulse * .5
								}
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-[0.65rem] tracking-wide text-fg uppercase",
								children: ch.label
							})]
						}, ch.id);
					})
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "rounded-md border border-border bg-bg-elevated/75 px-3 py-2 font-mono text-[0.65rem] text-fg-muted backdrop-blur-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					"offset ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "tabular-nums text-fg",
						children: stats.motion.toFixed(2)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mx-2 text-fg-subtle",
						children: "·"
					}),
					"depth ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "tabular-nums text-fg",
						children: stats.depth.toFixed(2)
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-fg-subtle",
					children: [
						"shift ",
						shift.toFixed(2),
						" · ",
						Math.round(stats.fps),
						" fps ·",
						" ",
						cameraLock && cameraReady ? "camera" : "pointer"
					]
				})]
			})]
		})] }),
		entered && settingsOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "absolute top-24 right-4 z-20 w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-border bg-bg-elevated p-4 shadow-lg sm:right-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-3 flex items-center gap-2 text-fg",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Aperture, {
						className: "size-4",
						strokeWidth: 1.75
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-sm",
						children: "Pipeline"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "mb-4 flex min-h-11 items-center justify-between gap-3 text-sm text-fg",
					children: ["Dual-pass bloom", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						checked: params.pipeline,
						onChange: (e) => onParams({ pipeline: e.target.checked }),
						className: "size-4 accent-fg"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
					label: "Bloom",
					value: params.bloom,
					onChange: (v) => onParams({ bloom: v })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
					label: "Luminance gate",
					value: params.threshold,
					onChange: (v) => onParams({ threshold: v })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
					label: "Parallax",
					value: params.parallax,
					onChange: (v) => onParams({ parallax: v })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-[0.7rem] leading-relaxed text-fg-subtle",
					children: cameraLock && !cameraReady ? "Camera was blocked — pointer still drives inverse shift." : "Move across the field. Inverse mapping: you go left, light goes right."
				})
			]
		})
	] });
}
function Slider({ label, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "mb-3 block",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "mb-1 flex justify-between font-mono text-[0.65rem] text-fg-muted uppercase",
			children: [label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "tabular-nums text-fg",
				children: value.toFixed(2)
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type: "range",
			min: 0,
			max: 1,
			step: .01,
			value,
			onChange: (e) => onChange(Number(e.target.value)),
			className: "h-2 w-full cursor-pointer appearance-none rounded-full bg-bg-subtle accent-fg"
		})]
	});
}
function absWave(motion, i) {
	const t = motion * 6.283 + i * 1.256;
	return .5 + .5 * Math.sin(t);
}
function Home() {
	const [entered, setEntered] = (0, import_react.useState)(false);
	const [scene, setScene] = (0, import_react.useState)("sovereign");
	const [params, setParams] = (0, import_react.useState)(DEFAULT_PARAMS);
	const [cameraLock, setCameraLock] = (0, import_react.useState)(false);
	const [cameraReady, setCameraReady] = (0, import_react.useState)(false);
	const [settingsOpen, setSettingsOpen] = (0, import_react.useState)(false);
	const [stats, setStats] = (0, import_react.useState)({
		motion: .5,
		depth: .52,
		fps: 60
	});
	const patchParams = (0, import_react.useCallback)((next) => {
		setParams((prev) => ({
			...prev,
			...next
		}));
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative h-dvh w-full overflow-hidden bg-bg text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotonicCanvas, {
			scene,
			params,
			cameraLock: entered && cameraLock,
			onStats: setStats,
			onCameraStatus: setCameraReady
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotonicHud, {
			entered,
			scene,
			params,
			cameraLock,
			cameraReady,
			settingsOpen,
			stats,
			onEnter: () => setEntered(true),
			onScene: setScene,
			onParams: patchParams,
			onCameraLock: setCameraLock,
			onSettings: setSettingsOpen
		})]
	});
}
//#endregion
export { Home as component };
