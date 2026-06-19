import { fetch as streamingFetch } from "expo/fetch";
import type { BirthChart } from "@/lib/astrology/types";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://bhavishyadeepa.com";

export type InterpretDepth = "beginner" | "intermediate" | "expert";
export type InterpretMode = "summary" | "detailed";

export class PlanRequiredError extends Error {
  constructor() {
    super("Detailed Reading requires the Pro plan.");
  }
}

type StreamArgs = {
  chart: BirthChart;
  token: string;
  mode: InterpretMode;
  depth?: InterpretDepth;
  question?: string;
  language?: string;
  onChunk: (text: string) => void;
  signal?: AbortSignal;
};

/**
 * Streams an AI interpretation from the same /api/interpret endpoint the web
 * client uses (JAA-153/FR-11.3) — no separate mobile backend. Uses expo/fetch
 * rather than the global fetch because React Native's standard fetch doesn't
 * expose a readable streaming body; expo/fetch does.
 */
export async function streamInterpretation({
  chart,
  token,
  mode,
  depth,
  question,
  language,
  onChunk,
  signal,
}: StreamArgs): Promise<void> {
  const res = await streamingFetch(`${API_BASE_URL}/api/interpret`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ chart, question, language, mode, depth }),
    signal,
  });

  if (res.status === 403) {
    throw new PlanRequiredError();
  }
  if (!res.ok || !res.body) {
    throw new Error(`Interpretation request failed: HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}
