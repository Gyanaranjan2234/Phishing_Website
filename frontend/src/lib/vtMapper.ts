import { FileAnalysis, ScanReason } from "./interfaces";
import { VTAnalysisResponse } from "./vt-interfaces";

export const transformVTToUI = (vtRaw: VTAnalysisResponse, fileName: string): FileAnalysis => {
  const attributes = vtRaw.data.attributes;
  const stats = attributes.stats;
  const results = attributes.results;

  const totalEngines = stats.malicious + stats.suspicious + stats.undetected + stats.harmless;
  const riskScore = totalEngines > 0 ? Math.round(((stats.malicious + stats.suspicious) / totalEngines) * 100) : 0;

  let status: "safe" | "low" | "moderate" | "high" | "dangerous" = "safe";
  if (riskScore === 0) {
    status = "safe";
  } else if (riskScore <= 10) {
    status = "low";
  } else if (riskScore <= 30) {
    status = "moderate";
  } else if (riskScore <= 70) {
    status = "high";
  } else {
    status = "dangerous";
  }

  // Extract critical flags for unified decision logic
  const flags = {
    malwareDetected: stats.malicious > 0,
    phishingDetected: false, // File scanning usually doesn't strictly categorize as phishing
    blacklisted: false,
    suspicious: stats.suspicious > 0,
  };

  // CHANGE: Map ALL vendors instead of just 8 to allow for the scrollable list
  const reasons: ScanReason[] = Object.entries(results)
    .filter(([_, data]) => data.category !== "type-unsupported")
    .map(([engineName, data]) => ({
      label: engineName,
      value: data.result || "Clean / Undetected",
      flagged: data.category === "malicious" || data.category === "suspicious"
    }));

  const threats = Object.values(results)
    .filter(r => r.category === "malicious" && r.result)
    .map(r => r.result!)
    .slice(0, 5);

  return {
    fileName: fileName,
    fileSize: "Analyzed", 
    status,
    score: riskScore, // Pure calculated risk score from VT stats
    threats: threats.length > 0 ? threats : ["No specific threat signatures"],
    reasons,
    flags,
    // NEW: Pass stats to the frontend
    vtStats: {
      malicious: stats.malicious,
      suspicious: stats.suspicious,
      harmless: stats.harmless,
      undetected: stats.undetected
    },
    sha256: vtRaw.meta?.file_info?.sha256 || "N/A"
  };
};