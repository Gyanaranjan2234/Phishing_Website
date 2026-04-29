/**
 * Unified Risk Decision Logic
 * 
 * This module centralizes all risk assessment decisions to ensure consistency
 * across the entire application (UI, PDF, APIs, etc).
 * 
 * Priority:
 * 1. Critical flags (phishing, malware, blacklist) → DANGEROUS
 * 2. Score thresholds → Safe/Warning/Dangerous
 * 3. Score adjustment for display consistency
 */

export interface RiskFlags {
  phishingDetected?: boolean;
  malwareDetected?: boolean;
  blacklisted?: boolean;
  suspicious?: boolean;
}

export type FinalVerdict = "safe" | "low" | "moderate" | "high" | "dangerous";
export type SeverityLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

/**
 * Calculate final verdict based on risk_score (0–100).
 * risk_score = Math.round((malicious / total) * 100)
 *
 * Tiers:
 *   0        → safe
 *   1–10     → low
 *   11–30    → moderate
 *   31–70    → high
 *   71–100   → dangerous
 *
 * Flags are NOT used to override the score — they are informational only.
 */
export function calculateFinalVerdict(
  score: number,
  flags: RiskFlags
): FinalVerdict {
  if (score === 0)  return "safe";
  if (score <= 10)  return "low";
  if (score <= 30)  return "moderate";
  if (score <= 70)  return "high";
  return "dangerous";
}

/**
 * The risk_score from mapVTResult IS the display score — no inflation needed.
 * This function is kept for API compatibility but is now a passthrough.
 */
export function calculateAdjustedScore(
  baseScore: number,
  flags: RiskFlags
): number {
  return baseScore;
}

/**
 * Convert verdict to severity level (for reports and styling)
 */
export function verdictToSeverity(verdict: FinalVerdict): SeverityLevel {
  switch (verdict) {
    case "safe":     return "NONE";
    case "low":      return "LOW";
    case "moderate": return "MEDIUM";
    case "high":     return "HIGH";
    case "dangerous":return "CRITICAL";
  }
}

/**
 * Get human-readable description for the verdict
 */
export function getVerdictDescription(verdict: FinalVerdict): string {
  const descriptions: Record<FinalVerdict, string> = {
    safe:      "No threats detected. This URL appears safe and legitimate.",
    low:       "Minimal detections (1–10%). A small number of vendors flagged this URL. Proceed with care.",
    moderate:  "Some vendors flagged this URL as suspicious (11–30%). Verify before interacting.",
    high:      "Multiple vendors flagged this URL (31–70%). High risk — avoid unless verified.",
    dangerous: "Widespread malicious detections (71–100%). Do NOT proceed with this URL.",
  };
  return descriptions[verdict];
}

/**
 * Get final verdict title for UI display
 */
export function getVerdictTitle(verdict: FinalVerdict): string {
  const titles: Record<FinalVerdict, string> = {
    safe:      "✓ Green Light — Safe to Proceed",
    low:       "⚠ Low Risk — Proceed with Awareness",
    moderate:  "⚠ Moderate Risk — Verify Before Proceeding",
    high:      "✕ High Risk — Avoid If Possible",
    dangerous: "✕ Red Alert — Do Not Proceed",
  };
  return titles[verdict];
}

/**
 * Get human-readable verdict text (simple)
 */
export function getVerdictLabel(verdict: FinalVerdict): string {
  const labels: Record<FinalVerdict, string> = {
    safe:      "Safe",
    low:       "Low Risk",
    moderate:  "Moderate Risk",
    high:      "High Risk",
    dangerous: "Dangerous",
  };
  return labels[verdict];
}

/**
 * Convert verdict to status for backward compatibility
 */
export function verdictToStatus(verdict: FinalVerdict): "safe" | "suspicious" | "dangerous" {
  switch (verdict) {
    case "safe":      return "safe";
    case "low":       return "suspicious";
    case "moderate":  return "suspicious";
    case "high":      return "dangerous";
    case "dangerous": return "dangerous";
  }
}

/**
 * Determine if a verdict indicates danger
 */
export function isDangerous(verdict: FinalVerdict): boolean {
  return verdict === "dangerous" || verdict === "high";
}

export function requiresCaution(verdict: FinalVerdict): boolean {
  return verdict !== "safe";
}

/**
 * Get recommendations based on verdict and scan type
 */
export function getRecommendations(verdict: FinalVerdict, scanType: string): string[] {
  const baseRecommendations: Record<FinalVerdict, string[]> = {
    safe: [
      "✓ This target appears to be secure and legitimate",
      "• Standard browsing security precautions still apply",
      "• Keep your browser and security tools updated",
      "• Enable two-factor authentication on important accounts",
    ],
    low: [
      "⚠ Minimal risk detected — a small number of vendors flagged this target",
      "• Verify the source before sharing personal information",
      "• Use caution if prompted to download files or enter credentials",
    ],
    moderate: [
      "⚠ Moderate risk — some vendors flagged this target as suspicious",
      "• Do not enter sensitive information without further verification",
      "• Consider using additional security tools for confirmation",
      "• Monitor your accounts for suspicious activity",
    ],
    high: [
      "✕ High risk detected — multiple vendors flagged this target",
      "• Avoid interacting with this URL unless you are certain of its legitimacy",
      "• Do NOT enter credentials or personal information",
      "• Report to your IT or security team",
    ],
    dangerous: [
      "🚨 Do NOT interact with this target",
      "• Do NOT click links or visit this website",
      "• Do NOT enter any personal information or credentials",
      "• Report this threat to the appropriate authorities",
      "• Check your accounts for unauthorized access",
      "• Run a security scan on your device",
    ],
  };
  return baseRecommendations[verdict] || baseRecommendations.safe;
}

/**
 * Create a complete risk assessment object
 */
export interface RiskAssessment {
  verdict: FinalVerdict;
  severity: SeverityLevel;
  score: number;
  adjustedScore: number;
  description: string;
  title: string;
  label: string;
  isDangerous: boolean;
  requiresCaution: boolean;
  recommendations: string[];
}

export function createRiskAssessment(
  baseScore: number,
  flags: RiskFlags,
  scanType: string = "url"
): RiskAssessment {
  const verdict = calculateFinalVerdict(baseScore, flags);
  const adjustedScore = calculateAdjustedScore(baseScore, flags);
  const severity = verdictToSeverity(verdict);

  return {
    verdict,
    severity,
    score: baseScore,
    adjustedScore,
    description: getVerdictDescription(verdict),
    title: getVerdictTitle(verdict),
    label: getVerdictLabel(verdict),
    isDangerous: isDangerous(verdict),
    requiresCaution: requiresCaution(verdict),
    recommendations: getRecommendations(verdict, scanType),
  };
}
