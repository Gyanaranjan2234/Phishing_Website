import type { UrlAnalysis, ScanStatus } from "./interfaces";

export function mapVTToUrlAnalysis(
  url: string,
  analysisId: string,
  stats: {
    malicious: number;
    suspicious: number;
    harmless: number;
    undetected: number;
    timeout: number;
  },
  results: Record<string, { category: string; engine_name: string; result: string | null }>
): UrlAnalysis {
  // ── Single source of truth ──────────────────────────────────────────────
  // risk_score = malicious / total  (0–100)
  // Suspicious vendors do NOT inflate the score.
  const total = (stats.malicious + stats.suspicious + stats.harmless + stats.undetected) || 1;
  const risk_score = Math.round((stats.malicious / total) * 100);

  // Status: based on raw malicious count, not adjusted score
  const status: ScanStatus =
    stats.malicious >= 3 ? "phishing"
    : stats.malicious >= 1 ? "suspicious"
    : "safe";

  // Flags: purely informational — verdict is decided by risk_score in the UI
  const flags = {
    malwareDetected: stats.malicious > 0,
    phishingDetected: stats.malicious >= 3,
    blacklisted: false,
    suspicious: stats.suspicious > 0,
  };

  const flaggedVendors = Object.values(results).filter(
    (v) => v.category === "malicious" || v.category === "suspicious"
  );

  const reasons: UrlAnalysis["reasons"] = [
    {
      label: "Malicious Detections",
      value: `${stats.malicious} of ${total} vendors flagged as malicious`,
      flagged: stats.malicious > 0,
    },
    {
      label: "Suspicious Detections",
      value: `${stats.suspicious} of ${total} vendors flagged as suspicious`,
      flagged: stats.suspicious > 0,
    },
    {
      label: "Harmless Verdicts",
      value: `${stats.harmless} vendors confirmed safe`,
      flagged: false,
    },
    {
      label: "Undetected",
      value: `${stats.undetected} vendors had no verdict`,
      flagged: false,
    },
    ...flaggedVendors.map((v) => ({
      label: v.engine_name,
      value: v.result ?? v.category,
      flagged: true,
    })),
  ];

  return { url, status, score: risk_score, reasons, vtStats: stats, vtVendors: results, analysisId, flags };
}