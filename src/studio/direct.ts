import { createServerFn } from "@tanstack/react-start";

export type CatalogBrief = { id: string; title: string; category: string };

export type DirectPlan = {
  name: string;
  logline: string;
  tone: string;
  pillars: string[];
  beats: { title: string; body: string; kind: "setup" | "dialogue" | "objective" | "payoff"; speaker: string }[];
  placements: { assetId: string; x: number; z: number; yaw: number }[];
};

const KINDS = new Set(["setup", "dialogue", "objective", "payoff"]);

export const directScene = createServerFn({ method: "POST" })
  .validator((input: { prompt: string; catalog: CatalogBrief[] }) => input)
  .handler(async ({ data }): Promise<{ ok: true; plan: DirectPlan } | { ok: false; error: string }> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false, error: "AI is not available in this environment." };

    const prompt = String(data?.prompt ?? "").trim().slice(0, 500);
    if (prompt.length < 8) return { ok: false, error: "Describe the scene in a sentence." };

    const catalog = (Array.isArray(data?.catalog) ? data.catalog : []).slice(0, 60).flatMap((item) => {
      const id = String(item?.id ?? "").slice(0, 96);
      const title = String(item?.title ?? "").slice(0, 60);
      const category = String(item?.category ?? "").slice(0, 24);
      if (!id || !title) return [];
      return [{ id, title, category }];
    });
    if (catalog.length === 0) return { ok: false, error: "The model catalog has not loaded yet." };

    const allowed = new Set(catalog.map((item) => item.id));
    const list = catalog.map((item) => `${item.id} | ${item.category} | ${item.title}`).join("\n");

    let response: Response;
    try {
      response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "grok-4.5",
          temperature: 0.4,
          max_tokens: 900,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You direct a 3D game studio. Reply with one JSON object and nothing else. " +
                'Shape: {"name":"","logline":"","tone":"","pillars":[""],"beats":[{"title":"","body":"","kind":"setup","speaker":""}],"placements":[{"assetId":"","x":0,"z":0,"yaw":0}]}. ' +
                "kind is setup, dialogue, objective, or payoff. Write 3 beats. Place 5 to 9 models. " +
                "assetId must be copied from the catalog. Spread them: x between -6 and 6, z between -7 and 1, at least 1.6 apart. yaw is degrees. " +
                "Do not invent models. Prefer creatures, heroes, and places over small clutter.",
            },
            { role: "user", content: `Catalog:\n${list}\n\nScene:\n${prompt}` },
          ],
        }),
      });
    } catch {
      return { ok: false, error: "Could not reach the director." };
    }

    if (!response.ok) return { ok: false, error: `Director unavailable (${response.status}).` };

    const body = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = body.choices?.[0]?.message?.content ?? "";
    const plan = parsePlan(raw, allowed);
    if (!plan) return { ok: false, error: "The director replied, but not with a usable scene." };
    return { ok: true, plan };
  });

function parsePlan(raw: string, allowed: Set<string>): DirectPlan | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  const placements = Array.isArray(record.placements) ? record.placements : [];
  const used = new Set<string>();
  const placed = placements.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const assetId = String(row.assetId ?? "");
    if (!allowed.has(assetId) || used.has(assetId)) return [];
    used.add(assetId);
    return [
      {
        assetId,
        x: clamp(Number(row.x) || 0, -8, 8),
        z: clamp(Number(row.z) || 0, -8, 4),
        yaw: clamp(Number(row.yaw) || 0, -180, 180),
      },
    ];
  });
  if (placed.length < 3) return null;
  const beats = (Array.isArray(record.beats) ? record.beats : []).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const kind = String(row.kind ?? "setup");
    return [
      {
        title: String(row.title ?? "Beat").slice(0, 48),
        body: String(row.body ?? "").slice(0, 220),
        kind: (KINDS.has(kind) ? kind : "setup") as DirectPlan["beats"][number]["kind"],
        speaker: String(row.speaker ?? "Narrator").slice(0, 24),
      },
    ];
  });
  const pillars = (Array.isArray(record.pillars) ? record.pillars : [])
    .map((item) => String(item).slice(0, 60))
    .filter(Boolean)
    .slice(0, 4);
  return {
    name: String(record.name ?? "Directed scene").slice(0, 42),
    logline: String(record.logline ?? "").slice(0, 180),
    tone: String(record.tone ?? "Focused").slice(0, 32),
    pillars: pillars.length ? pillars : ["A place you can walk", "Models from the catalog", "A beat you can play"],
    beats: (beats.length ? beats : [{ title: "Enter", body: "Walk the scene the director laid out.", kind: "setup" as const, speaker: "Narrator" }]).slice(0, 4),
    placements: placed.slice(0, 9),
  };
}

function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(min, Math.min(max, value));
}
