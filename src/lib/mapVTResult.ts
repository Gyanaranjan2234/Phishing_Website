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
  const total = (stats.malicious + stats.suspicious + stats.harmless + stats.undetected) || 1;

  // Score 0–100: high = dangerous (matches your existing getScoreColor logic)
  const score = Math.min(
    100,
    Math.round(((stats.malicious  + stats.suspicious* 1) / total) * 100)
  );

  const status: ScanStatus =
    stats.malicious >= 3 ? "phishing"
    : stats.malicious >= 1 || stats.suspicious >= 2 ? "suspicious"
    : "safe";

  // Extract critical flags for unified decision logic
  const flags = {
    phishingDetected: stats.malicious >= 3,
    malwareDetected: stats.malicious >= 1,
    blacklisted: false, // Can be set via API if needed
    suspicious: stats.suspicious >= 2,
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

  return { url, status, score, reasons, vtStats: stats, vtVendors: results, analysisId, flags };
}