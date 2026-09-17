export const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const FRAG_SCENE = /* glsl */ `
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

export const FRAG_LUMINANCE = /* glsl */ `
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

export const FRAG_BLUR = /* glsl */ `
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

export const FRAG_COMPOSITE = /* glsl */ `
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
