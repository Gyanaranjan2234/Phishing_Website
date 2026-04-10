import { loadEnv } from "vite";

const VT_BASE = "https://www.virustotal.com/api/v3";
//const VT_KEY  = process.env.VIRUSTOTAL_API_KEY!;
function getHeaders() {
  return {
    "x-apikey": import.meta.env.VITE_VIRUSTOTAL_API_KEY!,
    "accept": "application/json",
    "Content-Type": "application/x-www-form-urlencoded",
  };
}

// Step 1 — Submit URL, get analysisId back
async function submitUrl(url: string): Promise<string> {
  const res = await fetch(`${VT_BASE}/urls`, {
    method: "POST",
    headers: getHeaders(),
    body: new URLSearchParams({ url }).toString(),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message ?? `Submit failed: ${res.status}`);
  }

  const data = await res.json();
  // data.data.id → "u-<hash>-<timestamp>"
  return data.data.id as string;
}

// Step 2 — Poll analysis until status === "completed"
async function pollAnalysis(
  analysisId: string,
  maxRetries = 5,
  intervalMs = 3000*20
) {
  for (let i = 0; i < maxRetries; i++) {
    const res = await fetch(`${VT_BASE}/analyses/${analysisId}`, {
      headers: { "x-apikey": import.meta.env.VITE_VIRUSTOTAL_API_KEY! },
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err?.error?.message ?? `Poll failed: ${res.status}`);
    }

    const data = await res.json();
    const attrs = data.data.attributes;

    if (attrs.status === "completed") {
      return {
        analysisId,
        stats:   attrs.stats,      // { malicious, suspicious, harmless, undetected, ... }
        results: attrs.results,    // { BitDefender: { category, engine_name, result }, ... }
        url:     data.meta?.url_info?.url ?? "",
      };
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error("VirusTotal analysis timed out");
}

// Exported: submit + poll chained
export async function scanUrlWithVT(url: string) {
  const analysisId = await submitUrl(url);
  return pollAnalysis(analysisId);
}
