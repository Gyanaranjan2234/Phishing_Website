import type { VTAnalysisResponse } from "../types/vt-interfaces";

const VT_BASE = "https://www.virustotal.com/api/v3";
const API_KEY = import.meta.env.VITE_VIRUSTOTAL_API_KEY;

function getHeaders() {
  return {
    "x-apikey": API_KEY!,
    "accept": "application/json",
  };
}

// =============================================================================
// URL SCANNING
// =============================================================================

/**
 * Step 1 — Submit URL, get analysisId back
 */
async function submitUrl(url: string): Promise<string> {
  const res = await fetch(`${VT_BASE}/urls`, {
    method: "POST",
    headers: {
      ...getHeaders(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ url }).toString(),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message ?? `Submit failed: ${res.status}`);
  }

  const data = await res.json();
  return data.data.id as string;
}

/**
 * Step 2 — Poll analysis until status === "completed"
 */
async function pollAnalysis(
  analysisId: string,
  maxRetries = 5,
  intervalMs = 3000 * 20
) {
  for (let i = 0; i < maxRetries; i++) {
    const res = await fetch(`${VT_BASE}/analyses/${analysisId}`, {
      headers: getHeaders(),
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

  throw new Error("Analysis engine timed out. Please try again.");
}

/**
 * Exported: submit + poll chained for URLs
 */
export async function scanUrlWithVT(url: string) {
  const analysisId = await submitUrl(url);
  return pollAnalysis(analysisId);
}

// =============================================================================
// FILE SCANNING
// =============================================================================

export const vtApi = {
  /**
   * Step 1: Upload the file for analysis
   */
  async uploadAndScan(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${VT_BASE}/files`, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "x-apikey": API_KEY!,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "File analysis upload failed");
    }

    const json = await response.json();
    return json.data.id; // This is the analysisId
  },

  /**
   * Step 2: Get the results using the analysisId
   */
  async getAnalysisResults(analysisId: string): Promise<VTAnalysisResponse> {
    const response = await fetch(`${VT_BASE}/analyses/${analysisId}`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch report: ${response.statusText}`);
    }

    return await response.json();
  },

  /**
   * Step 3: Get the full file report using the file hash (SHA-256)
   */
  async getFileReport(hash: string): Promise<any> {
    const response = await fetch(`${VT_BASE}/files/${hash}`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // File not found in VT database
      }
      throw new Error(`Failed to fetch file report: ${response.statusText}`);
    }

    return await response.json();
  }
};
