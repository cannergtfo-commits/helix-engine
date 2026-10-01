export type PacketFamily = "wall" | "floor" | "roof" | "metal" | "ground";

export type Packet = {
  id: string;
  label: string;
  family: PacketFamily;
  color: string;
  rate: number;
  metal: number;
  rough: number;
  normal: number;
  env: number;
  glass?: boolean;
  pattern: "brick" | "ashlar" | "rubble" | "plank" | "clapboard" | "shingle" | "tile" | "check" | "herring" | "parquet" | "weave" | "plaster" | "grit" | "thatch" | "seam" | "grass" | "marble" | "hex" | "cobble" | "scale" | "cmu" | "corrugate" | "diamond" | "basket" | "logs" | "bamboo" | "mosaic" | "flag" | "speckle" | "ripple" | "bark" | "stripe" | "batten";
  face: string;
  seam: string;
  invert?: boolean;
};

export const PACKETS: Packet[] = [
  { id: "brick", label: "Brick", family: "wall", color: "#8d4a3a", rate: 42, metal: 0.02, rough: 0.82, normal: 0.7, env: 0.35, pattern: "brick", face: "#8d4536", seam: "#c8b7a4", invert: true },
  { id: "brick-dark", label: "Dark brick", family: "wall", color: "#5c3028", rate: 46, metal: 0.03, rough: 0.8, normal: 0.7, env: 0.3, pattern: "brick", face: "#4a2822", seam: "#8d7568", invert: true },
  { id: "brick-white", label: "Whitewashed", family: "wall", color: "#d9cfc3", rate: 48, metal: 0.02, rough: 0.86, normal: 0.45, env: 0.22, pattern: "brick", face: "#e4d9cc", seam: "#b7aa9c", invert: true },
  { id: "stone", label: "Ashlar", family: "wall", color: "#8a8d86", rate: 52, metal: 0.04, rough: 0.84, normal: 0.6, env: 0.22, pattern: "ashlar", face: "#9aa097", seam: "#5e615c", invert: true },
  { id: "fieldstone", label: "Fieldstone", family: "wall", color: "#6e6a62", rate: 50, metal: 0.03, rough: 0.9, normal: 0.75, env: 0.18, pattern: "rubble", face: "#7a756c", seam: "#3e3c38", invert: true },
  { id: "stucco", label: "Stucco", family: "wall", color: "#e4d7c4", rate: 30, metal: 0.01, rough: 0.94, normal: 0.25, env: 0.12, pattern: "plaster", face: "#e4d7c4", seam: "#cbbba6" },
  { id: "clapboard", label: "Clapboard", family: "wall", color: "#d8d2c6", rate: 34, metal: 0.03, rough: 0.72, normal: 0.4, env: 0.2, pattern: "clapboard", face: "#ddd6c8", seam: "#8d8680" },
  { id: "shingle-siding", label: "Shingle siding", family: "wall", color: "#8a735c", rate: 38, metal: 0.04, rough: 0.78, normal: 0.5, env: 0.22, pattern: "shingle", face: "#8d7660", seam: "#3a3128", invert: true },
  { id: "adobe", label: "Adobe", family: "wall", color: "#c4875a", rate: 26, metal: 0.02, rough: 0.92, normal: 0.35, env: 0.14, pattern: "brick", face: "#c48958", seam: "#a56d42", invert: true },
  { id: "marble", label: "Marble", family: "wall", color: "#e7e2da", rate: 80, metal: 0.08, rough: 0.28, normal: 0.15, env: 0.7, pattern: "marble", face: "#efeae3", seam: "#b7b0a6" },
  { id: "subway", label: "Subway tile", family: "wall", color: "#f2f0ea", rate: 44, metal: 0.06, rough: 0.32, normal: 0.35, env: 0.45, pattern: "brick", face: "#f4f1ea", seam: "#b7b2a8", invert: true },
  { id: "drywall", label: "Drywall", family: "wall", color: "#d9d3c7", rate: 18, metal: 0.01, rough: 0.92, normal: 0.15, env: 0.12, pattern: "plaster", face: "#d7d1c6", seam: "#c4beb2" },
  { id: "wood", label: "Oak", family: "floor", color: "#8a6244", rate: 28, metal: 0.04, rough: 0.68, normal: 0.45, env: 0.25, pattern: "plank", face: "#8a6244", seam: "#5c3e2a" },
  { id: "parquet", label: "Parquet", family: "floor", color: "#a97445", rate: 40, metal: 0.05, rough: 0.55, normal: 0.35, env: 0.3, pattern: "parquet", face: "#b07c48", seam: "#6b4a2c" },
  { id: "herringbone", label: "Herringbone", family: "floor", color: "#9a6840", rate: 44, metal: 0.05, rough: 0.58, normal: 0.4, env: 0.28, pattern: "herring", face: "#a06e44", seam: "#5e412c" },
  { id: "tile", label: "Stone tile", family: "floor", color: "#b7b1a6", rate: 36, metal: 0.04, rough: 0.62, normal: 0.3, env: 0.25, pattern: "tile", face: "#c4beb2", seam: "#8a847c" },
  { id: "terracotta", label: "Terracotta", family: "floor", color: "#b85a3a", rate: 34, metal: 0.03, rough: 0.7, normal: 0.35, env: 0.2, pattern: "tile", face: "#c4623e", seam: "#8d4630" },
  { id: "check", label: "Checker", family: "floor", color: "#d9d3c5", rate: 32, metal: 0.04, rough: 0.5, normal: 0.2, env: 0.3, pattern: "check", face: "#e6e0d4", seam: "#2a2c30" },
  { id: "carpet", label: "Carpet", family: "floor", color: "#6e3a3a", rate: 24, metal: 0.01, rough: 0.96, normal: 0.2, env: 0.08, pattern: "weave", face: "#7a4040", seam: "#4a2828" },
  { id: "concrete", label: "Concrete", family: "floor", color: "#8d8a84", rate: 22, metal: 0.03, rough: 0.9, normal: 0.35, env: 0.18, pattern: "grit", face: "#8d8a84", seam: "#6e6b66" },
  { id: "terrazzo", label: "Terrazzo", family: "floor", color: "#d5d0c8", rate: 58, metal: 0.06, rough: 0.4, normal: 0.2, env: 0.4, pattern: "speckle", face: "#ddd7ce", seam: "#8a8478" },
  { id: "roofing", label: "Slate", family: "roof", color: "#3e4248", rate: 36, metal: 0.12, rough: 0.62, normal: 0.55, env: 0.4, pattern: "shingle", face: "#3a3e46", seam: "#1c1e22", invert: true },
  { id: "clay-tile", label: "Clay tile", family: "roof", color: "#a34a32", rate: 40, metal: 0.05, rough: 0.66, normal: 0.5, env: 0.28, pattern: "shingle", face: "#b55236", seam: "#6e3224", invert: true },
  { id: "metal-roof", label: "Metal roof", family: "roof", color: "#8d9298", rate: 38, metal: 0.72, rough: 0.32, normal: 0.25, env: 0.9, pattern: "seam", face: "#9aa0a6", seam: "#5c6166" },
  { id: "thatch", label: "Thatch", family: "roof", color: "#c4a15a", rate: 22, metal: 0.02, rough: 0.94, normal: 0.55, env: 0.12, pattern: "thatch", face: "#c9a45c", seam: "#8a6a32" },
  { id: "glass", label: "Glass", family: "metal", color: "#d5dee6", rate: 55, metal: 0.04, rough: 0.08, normal: 0.05, env: 1.15, glass: true, pattern: "plaster", face: "#d5dee6", seam: "#b7c4ce" },
  { id: "brass", label: "Brass", family: "metal", color: "#c9863a", rate: 70, metal: 0.86, rough: 0.28, normal: 0.2, env: 1.1, pattern: "seam", face: "#d29244", seam: "#8a5a22" },
  { id: "iron", label: "Iron", family: "metal", color: "#3a3d42", rate: 48, metal: 0.78, rough: 0.38, normal: 0.25, env: 0.85, pattern: "seam", face: "#4a4e54", seam: "#1c1e22" },
  { id: "copper", label: "Copper", family: "metal", color: "#b87333", rate: 74, metal: 0.84, rough: 0.3, normal: 0.2, env: 1.05, pattern: "seam", face: "#c47c3a", seam: "#6e421c" },
  { id: "lot", label: "Lot", family: "ground", color: "#2a2d33", rate: 8, metal: 0.04, rough: 0.94, normal: 0.4, env: 0.2, pattern: "grit", face: "#2a2d33", seam: "#1a1c20" },
  { id: "grass", label: "Grass", family: "ground", color: "#3d5a3a", rate: 12, metal: 0.01, rough: 0.95, normal: 0.45, env: 0.1, pattern: "grass", face: "#3f6a3c", seam: "#24381f" },
  { id: "gravel", label: "Gravel", family: "ground", color: "#9a968c", rate: 14, metal: 0.04, rough: 0.9, normal: 0.55, env: 0.16, pattern: "grit", face: "#a8a296", seam: "#6a6660" },
  { id: "dirt", label: "Dirt", family: "ground", color: "#6a4a32", rate: 6, metal: 0.02, rough: 0.96, normal: 0.4, env: 0.1, pattern: "grit", face: "#6e4e34", seam: "#3e2a1c" },
  { id: "stock-brick", label: "Stock brick", family: "wall", color: "#c4a06a", rate: 40, metal: 0.02, rough: 0.84, normal: 0.65, env: 0.3, pattern: "brick", face: "#c9a56e", seam: "#efe2cc", invert: true },
  { id: "firebrick", label: "Firebrick", family: "wall", color: "#7a2e22", rate: 44, metal: 0.03, rough: 0.78, normal: 0.6, env: 0.28, pattern: "brick", face: "#8a3426", seam: "#d8c2b0", invert: true },
  { id: "glazed-brick", label: "Glazed brick", family: "wall", color: "#1f4a3a", rate: 62, metal: 0.18, rough: 0.22, normal: 0.4, env: 0.7, pattern: "brick", face: "#245844", seam: "#c8d4cc", invert: true },
  { id: "limestone", label: "Limestone", family: "wall", color: "#d5d0c2", rate: 50, metal: 0.04, rough: 0.7, normal: 0.4, env: 0.28, pattern: "ashlar", face: "#ddd6c6", seam: "#8a8478", invert: true },
  { id: "sandstone", label: "Sandstone", family: "wall", color: "#c4a06a", rate: 48, metal: 0.03, rough: 0.82, normal: 0.5, env: 0.2, pattern: "ashlar", face: "#d0aa72", seam: "#8a6840", invert: true },
  { id: "granite", label: "Granite", family: "wall", color: "#6e7274", rate: 64, metal: 0.08, rough: 0.45, normal: 0.35, env: 0.45, pattern: "speckle", face: "#7a7e80", seam: "#2e3234" },
  { id: "basalt", label: "Basalt", family: "wall", color: "#2c3036", rate: 54, metal: 0.06, rough: 0.72, normal: 0.45, env: 0.25, pattern: "ashlar", face: "#343840", seam: "#121418", invert: true },
  { id: "cobblestone", label: "Cobblestone", family: "wall", color: "#7a756c", rate: 46, metal: 0.03, rough: 0.88, normal: 0.7, env: 0.18, pattern: "cobble", face: "#8a8478", seam: "#3a3834" },
  { id: "river-rock", label: "River rock", family: "wall", color: "#8a8478", rate: 42, metal: 0.04, rough: 0.8, normal: 0.65, env: 0.22, pattern: "cobble", face: "#9a9284", seam: "#4a463e" },
  { id: "flint", label: "Flint", family: "wall", color: "#3a3e44", rate: 40, metal: 0.06, rough: 0.7, normal: 0.7, env: 0.2, pattern: "rubble", face: "#4a4e56", seam: "#1a1c20", invert: true },
  { id: "cedar-siding", label: "Cedar siding", family: "wall", color: "#a65a38", rate: 36, metal: 0.03, rough: 0.74, normal: 0.45, env: 0.22, pattern: "shingle", face: "#b4623c", seam: "#4a2818", invert: true },
  { id: "shiplap", label: "Shiplap", family: "wall", color: "#c8cdd2", rate: 32, metal: 0.03, rough: 0.55, normal: 0.3, env: 0.22, pattern: "clapboard", face: "#d0d5da", seam: "#8a9096" },
  { id: "board-batten", label: "Board and batten", family: "wall", color: "#3e4a44", rate: 34, metal: 0.03, rough: 0.68, normal: 0.4, env: 0.2, pattern: "batten", face: "#46564e", seam: "#1c2420" },
  { id: "log", label: "Log wall", family: "wall", color: "#6a4630", rate: 30, metal: 0.03, rough: 0.8, normal: 0.55, env: 0.16, pattern: "logs", face: "#7a5238", seam: "#3a2418" },
  { id: "bamboo", label: "Bamboo", family: "wall", color: "#c4a85a", rate: 28, metal: 0.03, rough: 0.62, normal: 0.4, env: 0.2, pattern: "bamboo", face: "#d2b464", seam: "#6a5428" },
  { id: "cinder", label: "Cinder block", family: "wall", color: "#8a8884", rate: 16, metal: 0.03, rough: 0.9, normal: 0.4, env: 0.14, pattern: "cmu", face: "#94928c", seam: "#5a5854" },
  { id: "lime-plaster", label: "Lime plaster", family: "wall", color: "#efe6d6", rate: 28, metal: 0.01, rough: 0.9, normal: 0.18, env: 0.14, pattern: "plaster", face: "#f2eadc", seam: "#ddd2c0" },
  { id: "ochre-stucco", label: "Ochre stucco", family: "wall", color: "#c4924a", rate: 28, metal: 0.02, rough: 0.92, normal: 0.28, env: 0.14, pattern: "plaster", face: "#d09e52", seam: "#a07838" },
  { id: "blue-plaster", label: "Blue plaster", family: "wall", color: "#6a8498", rate: 32, metal: 0.02, rough: 0.86, normal: 0.22, env: 0.18, pattern: "plaster", face: "#7490a4", seam: "#4a6474" },
  { id: "nero", label: "Nero marble", family: "wall", color: "#1c1e22", rate: 90, metal: 0.12, rough: 0.22, normal: 0.12, env: 0.85, pattern: "marble", face: "#24262c", seam: "#d8d4cc" },
  { id: "verde", label: "Verde marble", family: "wall", color: "#2e4638", rate: 88, metal: 0.1, rough: 0.26, normal: 0.14, env: 0.75, pattern: "marble", face: "#345442", seam: "#d4e0d4" },
  { id: "onyx", label: "Onyx", family: "wall", color: "#1a120e", rate: 96, metal: 0.14, rough: 0.18, normal: 0.1, env: 0.95, pattern: "marble", face: "#221814", seam: "#e0b878" },
  { id: "hex-tile", label: "Hex tile", family: "wall", color: "#e7e2d8", rate: 42, metal: 0.05, rough: 0.35, normal: 0.28, env: 0.4, pattern: "hex", face: "#efeae0", seam: "#8a8478" },
  { id: "mosaic", label: "Mosaic", family: "wall", color: "#3a5a6a", rate: 58, metal: 0.05, rough: 0.4, normal: 0.3, env: 0.35, pattern: "mosaic", face: "#4a6a78", seam: "#c4b48a" },
  { id: "slate-clad", label: "Slate cladding", family: "wall", color: "#3a4048", rate: 46, metal: 0.08, rough: 0.6, normal: 0.5, env: 0.32, pattern: "shingle", face: "#444a52", seam: "#1a1e22", invert: true },
  { id: "daub", label: "Daub", family: "wall", color: "#cbb48a", rate: 14, metal: 0.02, rough: 0.94, normal: 0.3, env: 0.1, pattern: "plaster", face: "#d2ba90", seam: "#8a7048" },
  { id: "stacked-stone", label: "Stacked stone", family: "wall", color: "#8a8074", rate: 52, metal: 0.03, rough: 0.86, normal: 0.6, env: 0.18, pattern: "flag", face: "#968c7e", seam: "#3e3a34" },
  { id: "stripe", label: "Stripe paper", family: "wall", color: "#6a3030", rate: 22, metal: 0.01, rough: 0.8, normal: 0.1, env: 0.12, pattern: "stripe", face: "#7a3838", seam: "#efe6d8" },
  { id: "bark", label: "Bark", family: "wall", color: "#4a3424", rate: 12, metal: 0.02, rough: 0.95, normal: 0.7, env: 0.1, pattern: "bark", face: "#5a3e2c", seam: "#1c140e" },
  { id: "walnut", label: "Walnut", family: "floor", color: "#4a3020", rate: 48, metal: 0.05, rough: 0.5, normal: 0.4, env: 0.3, pattern: "plank", face: "#543628", seam: "#2a1a10" },
  { id: "pine", label: "Pine", family: "floor", color: "#d2b48a", rate: 22, metal: 0.03, rough: 0.7, normal: 0.35, env: 0.2, pattern: "plank", face: "#d8bc92", seam: "#8a6844" },
  { id: "mahogany", label: "Mahogany", family: "floor", color: "#6a3020", rate: 56, metal: 0.05, rough: 0.48, normal: 0.38, env: 0.32, pattern: "plank", face: "#7a3824", seam: "#3a1810" },
  { id: "maple", label: "Maple", family: "floor", color: "#e4d2b4", rate: 46, metal: 0.04, rough: 0.45, normal: 0.3, env: 0.28, pattern: "plank", face: "#ead8ba", seam: "#a08868" },
  { id: "ebony", label: "Ebony", family: "floor", color: "#1a1614", rate: 70, metal: 0.06, rough: 0.4, normal: 0.3, env: 0.4, pattern: "plank", face: "#221c18", seam: "#0a0806" },
  { id: "barnwood", label: "Barnwood", family: "floor", color: "#8a8074", rate: 26, metal: 0.03, rough: 0.82, normal: 0.5, env: 0.16, pattern: "plank", face: "#948878", seam: "#4a443c" },
  { id: "cork", label: "Cork", family: "floor", color: "#c4925a", rate: 24, metal: 0.02, rough: 0.9, normal: 0.35, env: 0.12, pattern: "grit", face: "#cc9a62", seam: "#8a6238" },
  { id: "bamboo-floor", label: "Bamboo floor", family: "floor", color: "#c8a85c", rate: 34, metal: 0.04, rough: 0.55, normal: 0.35, env: 0.22, pattern: "bamboo", face: "#d2b266", seam: "#6a5424" },
  { id: "tatami", label: "Tatami", family: "floor", color: "#c2b46a", rate: 30, metal: 0.01, rough: 0.88, normal: 0.25, env: 0.1, pattern: "weave", face: "#ccbe74", seam: "#6a6438" },
  { id: "marble-floor", label: "Marble floor", family: "floor", color: "#e8e2d8", rate: 78, metal: 0.08, rough: 0.25, normal: 0.12, env: 0.65, pattern: "marble", face: "#f0eae0", seam: "#b8b0a4" },
  { id: "granite-floor", label: "Granite floor", family: "floor", color: "#5a5e62", rate: 60, metal: 0.08, rough: 0.35, normal: 0.25, env: 0.5, pattern: "speckle", face: "#6a6e72", seam: "#1e2226" },
  { id: "hex-floor", label: "Hex floor", family: "floor", color: "#d8d2c6", rate: 38, metal: 0.05, rough: 0.4, normal: 0.25, env: 0.3, pattern: "hex", face: "#e2dcd0", seam: "#6a6660" },
  { id: "mosaic-floor", label: "Mosaic floor", family: "floor", color: "#8a6848", rate: 52, metal: 0.04, rough: 0.48, normal: 0.3, env: 0.28, pattern: "mosaic", face: "#9a7450", seam: "#efe6d4" },
  { id: "brick-paver", label: "Brick paver", family: "floor", color: "#8d4a3a", rate: 30, metal: 0.02, rough: 0.8, normal: 0.45, env: 0.18, pattern: "brick", face: "#96503e", seam: "#c8b8a4", invert: true },
  { id: "flagstone", label: "Flagstone", family: "floor", color: "#8a867c", rate: 36, metal: 0.03, rough: 0.78, normal: 0.5, env: 0.18, pattern: "flag", face: "#98948a", seam: "#4a4842" },
  { id: "cobble-floor", label: "Cobble floor", family: "floor", color: "#6e6a62", rate: 32, metal: 0.03, rough: 0.88, normal: 0.65, env: 0.14, pattern: "cobble", face: "#7a756c", seam: "#2e2c28" },
  { id: "basketweave", label: "Basketweave", family: "floor", color: "#a07048", rate: 42, metal: 0.04, rough: 0.58, normal: 0.35, env: 0.26, pattern: "basket", face: "#aa784e", seam: "#5c3c24" },
  { id: "wool", label: "Wool", family: "floor", color: "#3a4a6a", rate: 26, metal: 0.01, rough: 0.96, normal: 0.2, env: 0.08, pattern: "weave", face: "#425478", seam: "#1e2838" },
  { id: "carpet-ink", label: "Ink carpet", family: "floor", color: "#1c1e28", rate: 28, metal: 0.01, rough: 0.97, normal: 0.15, env: 0.06, pattern: "weave", face: "#242632", seam: "#0e1014" },
  { id: "slate-floor", label: "Slate floor", family: "floor", color: "#3a4046", rate: 40, metal: 0.08, rough: 0.55, normal: 0.4, env: 0.3, pattern: "tile", face: "#444a50", seam: "#1a1e22" },
  { id: "honed", label: "Honed concrete", family: "floor", color: "#b0aca4", rate: 34, metal: 0.06, rough: 0.45, normal: 0.15, env: 0.35, pattern: "grit", face: "#b8b4ac", seam: "#8a8680" },
  { id: "terrazzo-night", label: "Night terrazzo", family: "floor", color: "#1e2228", rate: 62, metal: 0.08, rough: 0.32, normal: 0.18, env: 0.5, pattern: "speckle", face: "#262a30", seam: "#d8d4cc" },
  { id: "cedar-roof", label: "Cedar shake", family: "roof", color: "#8a5a38", rate: 32, metal: 0.03, rough: 0.78, normal: 0.55, env: 0.2, pattern: "shingle", face: "#966240", seam: "#3a2414", invert: true },
  { id: "copper-roof", label: "Copper roof", family: "roof", color: "#b87333", rate: 68, metal: 0.8, rough: 0.32, normal: 0.22, env: 1, pattern: "seam", face: "#c47c3a", seam: "#5a3414" },
  { id: "tin-roof", label: "Tin roof", family: "roof", color: "#c8ccd0", rate: 30, metal: 0.7, rough: 0.28, normal: 0.2, env: 0.9, pattern: "seam", face: "#d0d4d8", seam: "#6a7074" },
  { id: "pantile", label: "Pantile", family: "roof", color: "#b85a3a", rate: 38, metal: 0.04, rough: 0.64, normal: 0.55, env: 0.26, pattern: "scale", face: "#c46240", seam: "#6a301c" },
  { id: "green-slate", label: "Green slate", family: "roof", color: "#3a4a42", rate: 42, metal: 0.1, rough: 0.58, normal: 0.5, env: 0.35, pattern: "shingle", face: "#425448", seam: "#141c18", invert: true },
  { id: "lead-roof", label: "Lead roof", family: "roof", color: "#6a6e74", rate: 50, metal: 0.74, rough: 0.4, normal: 0.2, env: 0.7, pattern: "seam", face: "#747880", seam: "#2a2e32" },
  { id: "corrugated", label: "Corrugated", family: "roof", color: "#8a9094", rate: 24, metal: 0.68, rough: 0.38, normal: 0.45, env: 0.75, pattern: "corrugate", face: "#969ca0", seam: "#4a5054" },
  { id: "sod", label: "Sod roof", family: "roof", color: "#3a5234", rate: 18, metal: 0.01, rough: 0.95, normal: 0.4, env: 0.1, pattern: "grass", face: "#44603c", seam: "#1e3018" },
  { id: "reed", label: "Reed", family: "roof", color: "#a89060", rate: 16, metal: 0.02, rough: 0.94, normal: 0.5, env: 0.1, pattern: "thatch", face: "#b49868", seam: "#6a5430" },
  { id: "zinc", label: "Zinc roof", family: "roof", color: "#8a9298", rate: 46, metal: 0.7, rough: 0.34, normal: 0.18, env: 0.8, pattern: "seam", face: "#949ca2", seam: "#3a4248" },
  { id: "gold", label: "Gold", family: "metal", color: "#d4a84a", rate: 120, metal: 0.92, rough: 0.22, normal: 0.12, env: 1.2, pattern: "seam", face: "#e0b454", seam: "#8a6820" },
  { id: "bronze", label: "Bronze", family: "metal", color: "#8a5a32", rate: 66, metal: 0.82, rough: 0.34, normal: 0.2, env: 0.9, pattern: "seam", face: "#96643a", seam: "#3a2414" },
  { id: "steel", label: "Steel", family: "metal", color: "#b4b8bc", rate: 40, metal: 0.84, rough: 0.28, normal: 0.15, env: 1, pattern: "seam", face: "#c0c4c8", seam: "#5a6064" },
  { id: "chrome", label: "Chrome", family: "metal", color: "#e4e8ec", rate: 72, metal: 1, rough: 0.08, normal: 0.05, env: 1.3, pattern: "plaster", face: "#eef2f4", seam: "#b0b4b8" },
  { id: "rust", label: "Rust", family: "metal", color: "#8a3a22", rate: 18, metal: 0.35, rough: 0.78, normal: 0.55, env: 0.3, pattern: "grit", face: "#9a4428", seam: "#4a1c10" },
  { id: "verdigris", label: "Verdigris", family: "metal", color: "#3a7a68", rate: 58, metal: 0.55, rough: 0.48, normal: 0.35, env: 0.6, pattern: "speckle", face: "#448872", seam: "#1a4034" },
  { id: "pewter", label: "Pewter", family: "metal", color: "#8a8e90", rate: 44, metal: 0.76, rough: 0.4, normal: 0.18, env: 0.7, pattern: "seam", face: "#969a9c", seam: "#3a3e40" },
  { id: "silver", label: "Silver", family: "metal", color: "#d0d4d8", rate: 84, metal: 0.94, rough: 0.16, normal: 0.1, env: 1.15, pattern: "seam", face: "#d8dce0", seam: "#6a7074" },
  { id: "lead", label: "Lead", family: "metal", color: "#5a5e64", rate: 36, metal: 0.7, rough: 0.48, normal: 0.2, env: 0.55, pattern: "seam", face: "#64686e", seam: "#22262a" },
  { id: "diamond-plate", label: "Diamond plate", family: "metal", color: "#9aa0a4", rate: 42, metal: 0.8, rough: 0.36, normal: 0.55, env: 0.85, pattern: "diamond", face: "#a4aaae", seam: "#4a5054" },
  { id: "frosted", label: "Frosted glass", family: "metal", color: "#e4e8ea", rate: 48, metal: 0.02, rough: 0.45, normal: 0.15, env: 0.7, glass: true, pattern: "plaster", face: "#e8ecee", seam: "#c8ccd0" },
  { id: "green-glass", label: "Green glass", family: "metal", color: "#6aaa88", rate: 52, metal: 0.04, rough: 0.08, normal: 0.05, env: 1.1, glass: true, pattern: "plaster", face: "#74b492", seam: "#c8ddd0" },
  { id: "amber-glass", label: "Amber glass", family: "metal", color: "#c4843a", rate: 52, metal: 0.04, rough: 0.1, normal: 0.05, env: 1.05, glass: true, pattern: "plaster", face: "#d09044", seam: "#f0d8b0" },
  { id: "mirror", label: "Mirror", family: "metal", color: "#d8dee4", rate: 60, metal: 1, rough: 0.04, normal: 0.02, env: 1.4, pattern: "plaster", face: "#e0e6ec", seam: "#b8c0c8" },
  { id: "blackened", label: "Blackened steel", family: "metal", color: "#1a1c1e", rate: 54, metal: 0.82, rough: 0.42, normal: 0.2, env: 0.6, pattern: "seam", face: "#222426", seam: "#0a0c0e" },
  { id: "sand", label: "Sand", family: "ground", color: "#d2c29a", rate: 6, metal: 0.02, rough: 0.95, normal: 0.3, env: 0.1, pattern: "grit", face: "#d8c8a0", seam: "#a09070" },
  { id: "snow", label: "Snow", family: "ground", color: "#e8eef2", rate: 8, metal: 0.02, rough: 0.7, normal: 0.15, env: 0.35, pattern: "plaster", face: "#f2f6f8", seam: "#c8d4dc" },
  { id: "moss", label: "Moss", family: "ground", color: "#2e4a2a", rate: 8, metal: 0.01, rough: 0.96, normal: 0.4, env: 0.08, pattern: "grass", face: "#345432", seam: "#182816" },
  { id: "mud", label: "Mud", family: "ground", color: "#4a3828", rate: 4, metal: 0.02, rough: 0.98, normal: 0.3, env: 0.06, pattern: "grit", face: "#544030", seam: "#2a1c12" },
  { id: "clay", label: "Clay", family: "ground", color: "#a06040", rate: 8, metal: 0.02, rough: 0.9, normal: 0.3, env: 0.1, pattern: "grit", face: "#aa6848", seam: "#6a3c28" },
  { id: "mulch", label: "Mulch", family: "ground", color: "#3a2a1c", rate: 6, metal: 0.02, rough: 0.96, normal: 0.55, env: 0.08, pattern: "bark", face: "#4a3424", seam: "#1a1008" },
  { id: "asphalt", label: "Asphalt", family: "ground", color: "#2a2c30", rate: 14, metal: 0.04, rough: 0.85, normal: 0.25, env: 0.15, pattern: "grit", face: "#32343a", seam: "#141618" },
  { id: "ice", label: "Ice", family: "ground", color: "#d4e4ee", rate: 20, metal: 0.06, rough: 0.12, normal: 0.1, env: 0.9, pattern: "ripple", face: "#dceaf2", seam: "#8aa8c0" },
  { id: "water", label: "Water", family: "ground", color: "#2a4a5a", rate: 10, metal: 0.2, rough: 0.08, normal: 0.15, env: 1, pattern: "ripple", face: "#345868", seam: "#102028" },
  { id: "street", label: "Street cobble", family: "ground", color: "#6a6660", rate: 22, metal: 0.03, rough: 0.86, normal: 0.6, env: 0.14, pattern: "cobble", face: "#76726c", seam: "#2a2824" },
  { id: "pebble", label: "Pebble", family: "ground", color: "#b0a898", rate: 12, metal: 0.04, rough: 0.82, normal: 0.5, env: 0.16, pattern: "speckle", face: "#b8b0a0", seam: "#5a5448" },
  { id: "dark-gravel", label: "Dark gravel", family: "ground", color: "#3a3c40", rate: 12, metal: 0.04, rough: 0.9, normal: 0.5, env: 0.14, pattern: "grit", face: "#424448", seam: "#1a1c20" },
];

const swatches = new Map<string, string>();
let swatchColor: HTMLCanvasElement | null = null;
let swatchRough: HTMLCanvasElement | null = null;

export function packetById(id: string) {
  return PACKETS.find((packet) => packet.id === id);
}

export function packetSwatch(id: string) {
  if (typeof document === "undefined") return "";
  const cached = swatches.get(id);
  if (cached) return cached;
  const packet = packetById(id);
  if (!packet) return "";
  if (!swatchColor || !swatchRough) {
    swatchColor = document.createElement("canvas");
    swatchRough = document.createElement("canvas");
  }
  swatchColor.width = 64;
  swatchColor.height = 64;
  swatchRough.width = 64;
  swatchRough.height = 64;
  const ctx = swatchColor.getContext("2d");
  const rough = swatchRough.getContext("2d");
  if (!ctx || !rough) return "";
  paintPacket(packet, ctx, rough, 64);
  const url = swatchColor.toDataURL("image/jpeg", 0.72);
  if (!url) return "";
  swatches.set(id, url);
  return url;
}

export function paintPacket(packet: Packet, c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number) {
  const pattern = packet.pattern;
  if (pattern === "brick") return bricks(c, r, size, packet.face, packet.seam);
  if (pattern === "ashlar") return bricks(c, r, size, packet.face, packet.seam, 4, 2);
  if (pattern === "rubble") return rubble(c, r, size, packet.face, packet.seam);
  if (pattern === "plank") return planks(c, r, size, packet.face, packet.seam);
  if (pattern === "clapboard") return clapboard(c, r, size, packet.face, packet.seam);
  if (pattern === "shingle") return shingles(c, r, size, packet.face, packet.seam);
  if (pattern === "tile") return tiles(c, r, size, packet.face, packet.seam, 6);
  if (pattern === "check") return checks(c, r, size, packet.face, packet.seam);
  if (pattern === "herring") return herring(c, r, size, packet.face, packet.seam);
  if (pattern === "parquet") return parquet(c, r, size, packet.face, packet.seam);
  if (pattern === "weave") return weave(c, r, size, packet.face, packet.seam);
  if (pattern === "thatch") return thatch(c, r, size, packet.face, packet.seam);
  if (pattern === "seam") return seams(c, r, size, packet.face, packet.seam);
  if (pattern === "grass") return grass(c, r, size, packet.face, packet.seam);
  if (pattern === "plaster") return plaster(c, r, size, packet.face, packet.seam);
  if (pattern === "marble") return marble(c, r, size, packet.face, packet.seam);
  if (pattern === "hex") return hexes(c, r, size, packet.face, packet.seam);
  if (pattern === "cobble") return cobbles(c, r, size, packet.face, packet.seam);
  if (pattern === "scale") return scales(c, r, size, packet.face, packet.seam);
  if (pattern === "cmu") return bricks(c, r, size, packet.face, packet.seam, 5, 2);
  if (pattern === "corrugate") return corrugate(c, r, size, packet.face, packet.seam);
  if (pattern === "diamond") return diamonds(c, r, size, packet.face, packet.seam);
  if (pattern === "basket") return basket(c, r, size, packet.face, packet.seam);
  if (pattern === "logs") return logs(c, r, size, packet.face, packet.seam);
  if (pattern === "bamboo") return bamboo(c, r, size, packet.face, packet.seam);
  if (pattern === "mosaic") return mosaic(c, r, size, packet.face, packet.seam);
  if (pattern === "flag") return flags(c, r, size, packet.face, packet.seam);
  if (pattern === "speckle") return speckle(c, r, size, packet.face, packet.seam);
  if (pattern === "ripple") return ripple(c, r, size, packet.face, packet.seam);
  if (pattern === "bark") return bark(c, r, size, packet.face, packet.seam);
  if (pattern === "stripe") return stripes(c, r, size, packet.face, packet.seam);
  if (pattern === "batten") return batten(c, r, size, packet.face, packet.seam);
  return grit(c, r, size, packet.face, packet.seam);
}

function fill(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, seam: string) {
  c.fillStyle = face;
  r.fillStyle = "#9a9a9a";
  c.fillRect(0, 0, size, size);
  r.fillRect(0, 0, size, size);
  c.strokeStyle = seam;
}

function bricks(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, seam: string, rows = 8, cols = 4) {
  c.fillStyle = seam;
  r.fillStyle = "#d0d0d0";
  c.fillRect(0, 0, size, size);
  r.fillRect(0, 0, size, size);
  const bh = size / rows;
  const bw = size / cols;
  for (let row = 0; row < rows; row++) {
    const offset = row % 2 ? bw / 2 : 0;
    for (let col = -1; col < cols + 1; col++) {
      c.fillStyle = vary(face, ((row * 5 + col * 3) % 5) * 10 - 20);
      r.fillStyle = "#8a8a8a";
      c.fillRect(col * bw + offset + 1, row * bh + 1, bw - 2, bh - 2);
      r.fillRect(col * bw + offset + 1, row * bh + 1, bw - 2, bh - 2);
    }
  }
}

function rubble(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, seam: string) {
  fill(c, r, size, seam, seam);
  for (let i = 0; i < 18; i++) {
    const x = (i * 47) % size;
    const y = (i * 29) % size;
    const w = 28 + (i % 4) * 16;
    const h = 18 + (i % 3) * 12;
    c.fillStyle = vary(face, (i % 5) * 12 - 24);
    r.fillStyle = "#8d8d8d";
    c.fillRect(x, y, w, h);
    c.strokeStyle = seam;
    c.strokeRect(x, y, w, h);
    r.fillRect(x, y, w, h);
  }
}

function planks(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, seam: string) {
  fill(c, r, size, face, seam);
  const boards = 6;
  for (let i = 0; i < boards; i++) {
    const y = (i * size) / boards;
    c.fillStyle = seam;
    r.fillStyle = "#e4e4e4";
    c.fillRect(0, y, size, 2);
    r.fillRect(0, y, size, 2);
    c.strokeStyle = "rgba(40,22,12,0.28)";
    for (let g = 0; g < 3; g++) {
      c.beginPath();
      c.moveTo(0, y + 8 + g * 10);
      c.lineTo(size, y + 10 + g * 10);
      c.stroke();
    }
  }
}

function clapboard(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, seam: string) {
  fill(c, r, size, face, seam);
  const rows = 12;
  const h = size / rows;
  for (let i = 0; i < rows; i++) {
    c.fillStyle = i % 2 ? vary(face, -12) : face;
    c.fillRect(0, i * h, size, h - 1);
    c.fillStyle = seam;
    r.fillStyle = "#dedede";
    c.fillRect(0, (i + 1) * h - 2, size, 2);
    r.fillRect(0, (i + 1) * h - 2, size, 2);
  }
}

function shingles(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, seam: string) {
  fill(c, r, size, seam, seam);
  const rows = 8;
  const rh = size / rows;
  for (let row = 0; row < rows; row++) {
    const offset = row % 2 ? size / 8 : 0;
    for (let col = -1; col < 5; col++) {
      c.fillStyle = vary(face, row % 2 ? -10 : 8);
      c.fillRect(col * (size / 4) + offset, row * rh, size / 4 - 2, rh - 2);
      c.strokeStyle = seam;
      c.strokeRect(col * (size / 4) + offset, row * rh, size / 4 - 2, rh - 2);
      r.fillStyle = "#7a7a7a";
      r.fillRect(col * (size / 4) + offset, row * rh, size / 4 - 2, rh - 2);
    }
  }
}

function tiles(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, seam: string, count: number) {
  c.fillStyle = seam;
  r.fillStyle = "#d8d8d8";
  c.fillRect(0, 0, size, size);
  r.fillRect(0, 0, size, size);
  const step = size / count;
  for (let y = 0; y < count; y++) {
    for (let x = 0; x < count; x++) {
      c.fillStyle = vary(face, ((x + y) % 3) * 8 - 8);
      r.fillStyle = "#9a9a9a";
      c.fillRect(x * step + 1, y * step + 1, step - 2, step - 2);
      r.fillRect(x * step + 1, y * step + 1, step - 2, step - 2);
    }
  }
}

function checks(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, seam: string) {
  r.fillStyle = "#b0b0b0";
  r.fillRect(0, 0, size, size);
  const n = 8;
  const step = size / n;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      c.fillStyle = (x + y) % 2 ? face : seam;
      c.fillRect(x * step, y * step, step, step);
    }
  }
}

function herring(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, seam: string) {
  fill(c, r, size, seam, seam);
  const w = 18;
  const h = 8;
  for (let row = 0; row < 16; row++) {
    for (let col = 0; col < 10; col++) {
      c.save();
      const x = col * w + (row % 2 ? w / 2 : 0);
      const y = row * (h + 2);
      c.translate(x, y);
      c.rotate(((row + col) % 2 ? 1 : -1) * 0.55);
      c.fillStyle = vary(face, (col % 3) * 8 - 8);
      c.fillRect(0, 0, w, h);
      c.restore();
    }
  }
}

function parquet(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, seam: string) {
  fill(c, r, size, face, seam);
  const n = 4;
  const step = size / n;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      c.strokeStyle = seam;
      c.strokeRect(x * step + 2, y * step + 2, step - 4, step - 4);
      c.strokeStyle = "rgba(40,22,12,0.25)";
      if ((x + y) % 2) {
        for (let g = 6; g < step; g += 6) c.strokeRect(x * step + g, y * step + 4, 1, step - 8);
      } else {
        for (let g = 6; g < step; g += 6) {
          c.beginPath();
          c.moveTo(x * step + 4, y * step + g);
          c.lineTo(x * step + step - 4, y * step + g);
          c.stroke();
        }
      }
    }
  }
}

function weave(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, seam: string) {
  fill(c, r, size, face, seam);
  c.strokeStyle = seam;
  c.globalAlpha = 0.45;
  for (let i = -size; i < size * 2; i += 6) {
    c.beginPath();
    c.moveTo(i, 0);
    c.lineTo(i + size, size);
    c.stroke();
    c.beginPath();
    c.moveTo(i, size);
    c.lineTo(i + size, 0);
    c.stroke();
  }
  c.globalAlpha = 1;
}

function thatch(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, seam: string) {
  fill(c, r, size, face, seam);
  for (let y = 0; y < size; y += 4) {
    c.strokeStyle = y % 8 ? seam : vary(face, 18);
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(size, y + ((y / 4) % 3) - 1);
    c.stroke();
    r.fillStyle = "#c8c8c8";
    r.fillRect(0, y, size, 1);
  }
}

function seams(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, seam: string) {
  fill(c, r, size, face, seam);
  for (let x = 0; x < size; x += 32) {
    c.fillStyle = seam;
    r.fillStyle = "#6a6a6a";
    c.fillRect(x, 0, 2, size);
    r.fillRect(x, 0, 2, size);
    c.fillStyle = "rgba(255,255,255,0.18)";
    c.fillRect(x + 3, 0, 1, size);
  }
}

function grass(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, seam: string) {
  grit(c, r, size, face, seam);
  c.strokeStyle = vary(face, 30);
  for (let i = 0; i < 80; i++) {
    const x = (i * 37) % size;
    const y = (i * 19) % size;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + 1, y - 6);
    c.stroke();
  }
}

function grit(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, seam: string) {
  fill(c, r, size, face, seam);
  for (let i = 0; i < 500; i++) {
    const x = (i * 53) % size;
    const y = (i * 97) % size;
    c.fillStyle = i % 3 ? seam : vary(face, 20);
    r.fillStyle = i % 4 ? "#cfcfcf" : "#8d8d8d";
    c.fillRect(x, y, 2, 2);
    r.fillRect(x, y, 2, 2);
  }
}

function plaster(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, seam: string) {
  fill(c, r, size, face, seam);
  c.globalAlpha = 0.35;
  for (let i = 0; i < 36; i++) {
    const x = (i * 67) % size;
    const y = (i * 41) % size;
    const w = 28 + (i % 5) * 14;
    c.fillStyle = i % 2 ? vary(face, -16) : vary(face, 14);
    r.fillStyle = i % 2 ? "#b4b4b4" : "#8e8e8e";
    c.fillRect(x, y, w, w * 0.55);
    r.fillRect(x, y, w, w * 0.55);
  }
  c.globalAlpha = 1;
}

function marble(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, seam: string) {
  fill(c, r, size, face, seam);
  c.lineWidth = 2;
  r.strokeStyle = "#d0d0d0";
  for (let i = 0; i < 5; i++) {
    c.strokeStyle = i % 2 ? seam : vary(seam, 24);
    c.beginPath();
    r.beginPath();
    let x = ((i * 53) % size) - 8;
    c.moveTo(x, 0);
    r.moveTo(x, 0);
    for (let step = 1; step <= 8; step++) {
      x += 16 + ((i * 3 + step * 5) % 7) * 6;
      const y = (step * size) / 8;
      c.lineTo(x, y);
      r.lineTo(x, y);
    }
    c.stroke();
    r.stroke();
  }
}

function hexes(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, seam: string) {
  c.fillStyle = seam;
  r.fillStyle = "#d4d4d4";
  c.fillRect(0, 0, size, size);
  r.fillRect(0, 0, size, size);
  const radius = size / 9;
  const height = Math.sin(Math.PI / 3) * radius;
  for (let col = -1; col < 12; col++) {
    for (let row = -1; row < 12; row++) {
      const x = col * radius * 1.55;
      const y = row * height * 2 + (col % 2 ? height : 0);
      c.fillStyle = vary(face, ((col + row) % 4) * 8 - 12);
      r.fillStyle = "#9a9a9a";
      traceHex(c, x, y, radius * 0.86);
      c.fill();
      traceHex(r, x, y, radius * 0.86);
      r.fill();
    }
  }
}

function traceHex(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + Math.PI / 6;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function cobbles(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, seam: string) {
  fill(c, r, size, seam, seam);
  for (let i = 0; i < 28; i++) {
    const x = (i * 47) % size;
    const y = (i * 31) % size;
    const w = 22 + (i % 4) * 10;
    const h = 16 + (i % 3) * 8;
    c.fillStyle = vary(face, (i % 5) * 10 - 18);
    r.fillStyle = "#8a8a8a";
    c.beginPath();
    c.ellipse(x, y, w, h, (i % 5) * 0.2, 0, Math.PI * 2);
    c.fill();
    r.beginPath();
    r.ellipse(x, y, w, h, (i % 5) * 0.2, 0, Math.PI * 2);
    r.fill();
  }
}

function scales(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, seam: string) {
  fill(c, r, size, seam, seam);
  const rows = 7;
  const height = size / rows;
  for (let row = 0; row < rows; row++) {
    const offset = row % 2 ? size / 8 : 0;
    for (let col = -1; col < 5; col++) {
      const x = col * (size / 4) + offset + size / 8;
      const y = row * height + height * 0.85;
      c.fillStyle = vary(face, row % 2 ? -12 : 8);
      r.fillStyle = "#7a7a7a";
      c.beginPath();
      c.ellipse(x, y, size / 9, height * 0.85, 0, Math.PI, 0);
      c.fill();
      r.beginPath();
      r.ellipse(x, y, size / 9, height * 0.85, 0, Math.PI, 0);
      r.fill();
    }
  }
}

function corrugate(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, seam: string) {
  fill(c, r, size, face, seam);
  const band = Math.max(4, Math.round(size / 16));
  for (let x = 0; x < size; x += band) {
    const dark = Math.floor(x / band) % 2 === 0;
    c.fillStyle = dark ? vary(face, -28) : vary(face, 16);
    r.fillStyle = dark ? "#6a6a6a" : "#d0d0d0";
    c.fillRect(x, 0, Math.ceil(band / 2), size);
    r.fillRect(x, 0, Math.ceil(band / 2), size);
  }
}

function diamonds(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, seam: string) {
  fill(c, r, size, face, seam);
  const count = 5;
  const step = size / count;
  for (let y = 0; y < count; y++) {
    for (let x = 0; x < count; x++) {
      c.save();
      r.save();
      c.translate(x * step + step / 2, y * step + step / 2);
      r.translate(x * step + step / 2, y * step + step / 2);
      c.rotate(Math.PI / 4);
      r.rotate(Math.PI / 4);
      c.fillStyle = vary(seam, -10);
      r.fillStyle = "#c8c8c8";
      c.fillRect(-step * 0.22, -step * 0.22, step * 0.44, step * 0.44);
      r.fillRect(-step * 0.22, -step * 0.22, step * 0.44, step * 0.44);
      c.restore();
      r.restore();
    }
  }
}

function basket(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, seam: string) {
  fill(c, r, size, face, seam);
  const count = 4;
  const step = size / count;
  for (let y = 0; y < count; y++) {
    for (let x = 0; x < count; x++) {
      c.strokeStyle = seam;
      r.strokeStyle = "#dedede";
      c.strokeRect(x * step, y * step, step, step);
      const across = (x + y) % 2 === 0;
      for (let line = 6; line < step; line += 6) {
        c.beginPath();
        r.beginPath();
        if (across) {
          c.moveTo(x * step + 3, y * step + line);
          c.lineTo(x * step + step - 3, y * step + line);
          r.moveTo(x * step + 3, y * step + line);
          r.lineTo(x * step + step - 3, y * step + line);
        } else {
          c.moveTo(x * step + line, y * step + 3);
          c.lineTo(x * step + line, y * step + step - 3);
          r.moveTo(x * step + line, y * step + 3);
          r.lineTo(x * step + line, y * step + step - 3);
        }
        c.stroke();
        r.stroke();
      }
    }
  }
}

function logs(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, seam: string) {
  fill(c, r, size, seam, seam);
  const rows = 5;
  const height = size / rows;
  for (let i = 0; i < rows; i++) {
    const y = i * height;
    c.fillStyle = vary(face, (i % 2) * 12 - 6);
    r.fillStyle = "#9a9a9a";
    c.fillRect(0, y + 2, size, height - 4);
    r.fillRect(0, y + 2, size, height - 4);
    c.fillStyle = seam;
    r.fillStyle = "#d8d8d8";
    c.fillRect(0, y + height - 5, size, 3);
    r.fillRect(0, y + height - 5, size, 3);
    c.strokeStyle = "rgba(30,16,8,0.35)";
    c.beginPath();
    c.moveTo(0, y + height * 0.45);
    c.lineTo(size, y + height * 0.45);
    c.stroke();
  }
}

function bamboo(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, seam: string) {
  fill(c, r, size, seam, seam);
  const cols = 6;
  const width = size / cols;
  for (let i = 0; i < cols; i++) {
    const x = i * width;
    c.fillStyle = vary(face, (i % 3) * 10 - 10);
    r.fillStyle = "#a0a0a0";
    c.fillRect(x + 2, 0, width - 4, size);
    r.fillRect(x + 2, 0, width - 4, size);
    c.fillStyle = seam;
    r.fillStyle = "#e4e4e4";
    for (let node = 0; node < 4; node++) {
      const y = ((node * 5 + i) % 5) * (size / 5);
      c.fillRect(x + 1, y, width - 2, 3);
      r.fillRect(x + 1, y, width - 2, 3);
    }
  }
}

function mosaic(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, seam: string) {
  c.fillStyle = seam;
  r.fillStyle = "#d8d8d8";
  c.fillRect(0, 0, size, size);
  r.fillRect(0, 0, size, size);
  const count = 14;
  const step = size / count;
  for (let y = 0; y < count; y++) {
    for (let x = 0; x < count; x++) {
      const shift = ((x * 3 + y * 7) % 5) * 14 - 28;
      c.fillStyle = vary(face, shift);
      r.fillStyle = "#909090";
      c.fillRect(x * step + 1, y * step + 1, step - 2, step - 2);
      r.fillRect(x * step + 1, y * step + 1, step - 2, step - 2);
    }
  }
}

function flags(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, seam: string) {
  fill(c, r, size, seam, seam);
  for (let i = 0; i < 9; i++) {
    const x = (i * 71) % (size - 20);
    const y = (i * 43) % (size - 16);
    const w = 70 + (i % 3) * 28;
    const h = 36 + (i % 4) * 14;
    c.fillStyle = vary(face, (i % 4) * 10 - 16);
    r.fillStyle = "#8c8c8c";
    c.fillRect(x, y, w, h);
    r.fillRect(x, y, w, h);
    c.strokeStyle = seam;
    c.strokeRect(x, y, w, h);
  }
}

function speckle(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, seam: string) {
  fill(c, r, size, face, seam);
  for (let i = 0; i < 220; i++) {
    const x = (i * 59) % size;
    const y = (i * 83) % size;
    const chip = i % 5;
    c.fillStyle = chip === 0 ? seam : chip === 1 ? vary(face, 36) : vary(face, -20);
    r.fillStyle = chip % 2 ? "#d4d4d4" : "#7a7a7a";
    const w = 2 + (i % 3);
    c.fillRect(x, y, w, w);
    r.fillRect(x, y, w, w);
  }
}

function ripple(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, seam: string) {
  fill(c, r, size, face, seam);
  c.strokeStyle = seam;
  r.strokeStyle = "#d8d8d8";
  const gap = Math.max(6, Math.round(size / 14));
  for (let band = 0; band < size; band += gap) {
    c.beginPath();
    r.beginPath();
    for (let x = 0; x <= size; x += 8) {
      const y = band + Math.sin((x + band) / 18) * 3;
      if (x === 0) {
        c.moveTo(x, y);
        r.moveTo(x, y);
      } else {
        c.lineTo(x, y);
        r.lineTo(x, y);
      }
    }
    c.stroke();
    r.stroke();
  }
}

function bark(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, seam: string) {
  fill(c, r, size, face, seam);
  c.strokeStyle = seam;
  r.strokeStyle = "#d0d0d0";
  c.lineWidth = 2;
  for (let i = 0; i < 14; i++) {
    let x = (i * 19) % size;
    c.beginPath();
    r.beginPath();
    c.moveTo(x, 0);
    r.moveTo(x, 0);
    for (let y = 8; y <= size; y += 10) {
      x += ((i + y) % 5) - 2;
      c.lineTo(x, y);
      r.lineTo(x, y);
    }
    c.stroke();
    r.stroke();
  }
}

function stripes(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, seam: string) {
  r.fillStyle = "#b0b0b0";
  r.fillRect(0, 0, size, size);
  const count = 8;
  const width = size / count;
  for (let i = 0; i < count; i++) {
    c.fillStyle = i % 2 ? face : seam;
    c.fillRect(i * width, 0, width, size);
  }
}

function batten(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, seam: string) {
  fill(c, r, size, face, seam);
  const cols = 5;
  const width = size / cols;
  for (let i = 0; i < cols; i++) {
    c.fillStyle = seam;
    r.fillStyle = "#dedede";
    c.fillRect(i * width, 0, 4, size);
    r.fillRect(i * width, 0, 4, size);
    c.strokeStyle = "rgba(0,0,0,0.18)";
    c.beginPath();
    c.moveTo(i * width + width * 0.55, 0);
    c.lineTo(i * width + width * 0.55, size);
    c.stroke();
  }
}

function vary(hex: string, delta: number) {
  const raw = hex.replace("#", "");
  const n = parseInt(raw.length === 3 ? raw.split("").map((ch) => ch + ch).join("") : raw, 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp(((n >> 16) & 255) + delta);
  const g = clamp(((n >> 8) & 255) + delta);
  const b = clamp((n & 255) + delta);
  return `rgb(${r},${g},${b})`;
}
