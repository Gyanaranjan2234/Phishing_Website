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

export type FinalVerdict = "safe" | "warning" | "dangerous";
export type SeverityLevel = "LOW" | "MEDIUM" | "HIGH";

/**
 * Calculate final verdict based on critical flags and score
 * Critical flags ALWAYS override score-based logic
 */
export function calculateFinalVerdict(
  score: number,
  flags: RiskFlags
): FinalVerdict {
  // Priority 1: Critical flags override everything
  if (flags.phishingDetected || flags.malwareDetected || flags.blacklisted) {
    return "dangerous";
  }

  // Priority 2: Score-based thresholds
  if (score <= 30) return "safe";
  if (score <= 70) return "warning";
  return "dangerous";
}

/**
 * Calculate adjusted score based on detected threats
 * Phishing +70, Malware +80, Blacklist +90 (capped at 100)
 */
export function calculateAdjustedScore(
  baseScore: number,
  flags: RiskFlags
): number {
  let adjustedScore = baseScore;

  if (flags.blacklisted) {
    adjustedScore = Math.min(adjustedScore + 90, 100);
  } else if (flags.malwareDetected) {
    adjustedScore = Math.min(adjustedScore + 80, 100);
  } else if (flags.phishingDetected) {
    adjustedScore = Math.min(adjustedScore + 70, 100);
  }

  // Ensure dangerous flags always show high risk score
  if (flags.phishingDetected || flags.malwareDetected || flags.blacklisted) {
    return Math.max(adjustedScore, 75);
  }

  return adjustedScore;
}

/**
 * Convert verdict to severity level (for reports and styling)
 */
export function verdictToSeverity(verdict: FinalVerdict): SeverityLevel {
  switch (verdict) {
    case "safe":
      return "LOW";
    case "warning":
      return "MEDIUM";
    case "dangerous":
      return "HIGH";
  }
}

/**
 * Get human-readable description for the verdict
 */
export function getVerdictDescription(verdict: FinalVerdict): string {
  const descriptions: Record<FinalVerdict, string> = {
    safe: "This URL appears safe and legitimate based on VirusTotal analysis",
    warning: "This URL shows suspicious characteristics — review before proceeding",
    dangerous: "Critical security threats detected — do not proceed",
  };
  return descriptions[verdict];
}

/**
 * Get final verdict title for UI display
 */
export function getVerdictTitle(verdict: FinalVerdict): string {
  const titles: Record<FinalVerdict, string> = {
    safe: "✓ Green Light — Safe to Proceed",
    warning: "⚠ Caution — Review Before Proceeding",
    dangerous: "✕ Red Alert — Do Not Proceed",
  };
  return titles[verdict];
}

/**
 * Get human-readable verdict text (simple)
 */
export function getVerdictLabel(verdict: FinalVerdict): string {
  const labels: Record<FinalVerdict, string> = {
    safe: "Safe",
    warning: "Warning",
    dangerous: "Dangerous",
  };
  return labels[verdict];
}

/**
 * Convert verdict to status for backward compatibility
 */
export function verdictToStatus(verdict: FinalVerdict): "safe" | "suspicious" | "dangerous" {
  switch (verdict) {
    case "safe":
      return "safe";
    case "warning":
      return "suspicious";
    case "dangerous":
      return "dangerous";
  }
}

/**
 * Determine if a verdict indicates danger
 */
export function isDangerous(verdict: FinalVerdict): boolean {
  return verdict === "dangerous";
}

/**
 * Determine if a verdict requires caution
 */
export function requiresCaution(verdict: FinalVerdict): boolean {
  return verdict === "warning" || verdict === "dangerous";
}

/**
 * Get recommendations based on verdict and scan type
 */
export function getRecommendations(verdict: FinalVerdict, scanType: string): string[] {
  const baseRecommendations = {
    safe: [
      "✓ This target appears to be secure and legitimate",
      "• Standard browsing security precautions still apply",
      "• Keep your browser and security tools updated",
      "• Enable two-factor authentication on important accounts",
      "• Regularly backup your important data",
    ],
    warning: [
      "⚠ Exercise caution when interacting with this target",
      "• Verify the legitimacy of the sender or source",
      "• Do not enter sensitive information without verification",
      "• Consider using additional security tools for confirmation",
      "• Monitor your accounts for suspicious activity",
    ],
    dangerous: [
      "🚨 Do NOT interact with this target",
      "• Do NOT click links or visit this website",
      "• Do NOT enter any personal information or credentials",
      "• Report this threat to the appropriate authorities",
      "• Check your accounts for unauthorized access",
      "• Run a security scan on your device",
      "• Consider changing passwords for important accounts",
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
