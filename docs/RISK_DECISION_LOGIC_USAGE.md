/**
 * RISK DECISION LOGIC GUIDE
 * 
 * How to use the unified risk decision system in your components
 */

// 1. IMPORT THE DECISION LOGIC
import {
  calculateFinalVerdict,
  adjustScoreIfNeeded,
  getVerdictDescription,
  getVerdictTitle,
  isDangerous,
  requiresCaution,
  type RiskFlags,
  type FinalVerdict,
} from "@/lib/riskDecisionLogic";

// 2. DEFINE CRITICAL FLAGS
const flags: RiskFlags = {
  phishingDetected: vtData.malicious >= 3,
  malwareDetected: vtData.malicious >= 1,
  blacklisted: false, // Can come from API
  suspicious: vtData.suspicious >= 2,
};

// 3. CALCULATE FINAL VERDICT
const verdict = calculateFinalVerdict(scoreValue, flags);
// Returns: "safe" | "warning" | "dangerous"

// 4. ADJUST SCORE FOR UI CONSISTENCY (optional)
const displayScore = adjustScoreIfNeeded(scoreValue, flags);
// If flags present, score will be >= 75

// 5. USE IN UI LOGIC
switch (verdict) {
  case "safe":
    // Show green, safe message
    break;
  case "warning":
    // Show yellow, caution message
    break;
  case "dangerous":
    // Show red, danger message
    break;
}

// 6. HELPER FUNCTIONS
if (isDangerous(verdict)) {
  // Take action for dangerous verdict
}

if (requiresCaution(verdict)) {
  // Includes both warning and dangerous
}

// 7. GET TEXT FOR DISPLAY
const title = getVerdictTitle(verdict);
// "✓ Green Light — Safe to Proceed"
// "⚠ Caution — Review Before Proceeding"
// "✕ Red Alert — Do Not Proceed"

const description = getVerdictDescription(verdict);
// Human-readable explanation

// IMPORTANT NOTES:
// - Always pass flags to calculateFinalVerdict()
// - Critical flags ALWAYS override score logic
// - Use adjustScoreIfNeeded() to ensure visual consistency
// - Never use score alone for verdict determination
// - This ensures no conflicting warnings appear
