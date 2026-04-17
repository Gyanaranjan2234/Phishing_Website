import { FileAnalysis, ScanReason } from "./interfaces";
import { VTAnalysisResponse } from "./vt-interfaces";

export const transformVTToUI = (vtRaw: VTAnalysisResponse, fileName: string): FileAnalysis => {
  const attributes = vtRaw.data.attributes;
  const stats = attributes.stats;
  const results = attributes.results;

  const totalEngines = stats.malicious + stats.suspicious + stats.undetected + stats.harmless;
  const rawScore = totalEngines > 0 ? (stats.malicious / totalEngines) * 100 : 0;
  
  const score = stats.malicious > 0 ? Math.max(Math.round(rawScore), 20) : Math.round(rawScore);

  let status: "safe" | "infected" | "suspicious" = "safe";
  if (stats.malicious >= 3) status = "infected";
  else if (stats.malicious > 0 || stats.suspicious > 0) status = "suspicious";

  // Extract critical flags for unified decision logic
  const flags = {
    malwareDetected: stats.malicious >= 3,
    phishingDetected: stats.malicious >= 1,
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
    score: status === "infected" ? Math.max(score, 80) : score, // Boost score for danger visibility
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