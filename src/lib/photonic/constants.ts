export const PHI = 1.61803398875;
export const SCHUMANN = 7.83;
export const EMA_ALPHA = 0.15;

export const CHANNELS = [
  { id: "base", label: "Base", freq: "steady", color: "#4a88c4" },
  { id: "violet", label: "Violet", freq: "sin(t)", color: "#a85ad6" },
  { id: "life", label: "Life", freq: "7.83 Hz", color: "#3dcc7a" },
  { id: "gold", label: "Gold", freq: "φ 1.618", color: "#e8c547" },
  { id: "field", label: "Field", freq: "envelope", color: "#6fd4a8" },
] as const;

export type SceneId = "sovereign" | "field";

export type PhotonicParams = {
  bloom: number;
  threshold: number;
  parallax: number;
  pipeline: boolean;
};

export const DEFAULT_PARAMS: PhotonicParams = {
  bloom: 0.82,
  threshold: 0.48,
  parallax: 0.78,
  pipeline: true,
};

export const SCENES: { id: SceneId; label: string; src: string }[] = [
  { id: "sovereign", label: "Sovereign", src: "/art/sovereign.png" },
  { id: "field", label: "Mandala", src: "/art/mandala.jpg" },
];
