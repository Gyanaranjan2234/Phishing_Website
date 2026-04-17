# Implementation Reference: Unified Risk Logic & PDF

## Quick Start: Using Unified Decision Logic

### In Any Component

```typescript
import {
  calculateFinalVerdict,
  calculateAdjustedScore,
  createRiskAssessment,
  getRecommendations,
  type RiskFlags,
} from "@/lib/riskDecisionLogic";

// Step 1: Extract flags from VirusTotal data
const flags: RiskFlags = {
  phishingDetected: vtData.malicious >= 3,
  malwareDetected: vtData.malicious >= 1,
  blacklisted: false,
  suspicious: vtData.suspicious >= 2,
};

// Step 2: Calculate everything at once
const assessment = createRiskAssessment(baseScore, flags, "url");

// Now use assessment everywhere
console.log(assessment.verdict);        // "safe" | "warning" | "dangerous"
console.log(assessment.adjustedScore);  // Boosted if threats detected
console.log(assessment.recommendations); // Array of recommendations
console.log(assessment.description);    // Human-readable verdict text
```

---

## For PDF Generation

```typescript
import { generatePDFReport } from "@/lib/pdfReportGenerator";

// The PDF generator automatically uses unified logic
// Just pass the data with flags
const pdfData = {
  scanType: "url",
  target: "https://example.com",
  result: urlAnalysisWithFlags, // Must include flags
  userName: "John Doe",
};

// This PDF will now use:
// - Unified decision logic
// - Adjusted scores
// - Color-coded sections
// - Consistent verdict everywhere
await generatePDFReport(pdfData);
```

---

## Data Structure Requirements

### UrlAnalysis with Flags
```typescript
interface UrlAnalysis {
  url: string;
  status: ScanStatus;
  score: number;
  reasons: { label: string; value: string; flagged: boolean }[];
  vtStats: VTAnalysisStats;
  vtVendors: Record<string, VTVendorResult>;
  analysisId: string;
  flags?: {                    // ← Added
    phishingDetected?: boolean;
    malwareDetected?: boolean;
    blacklisted?: boolean;
    suspicious?: boolean;
  };
}
```

### RiskAnalysisData with Flags
```typescript
interface RiskAnalysisData {
  scanType: "url" | "email" | "file" | "password";
  status: "safe" | "suspicious" | "dangerous";
  score: number;
  details: string;
  threats?: string[];
  timestamp?: string;
  userName?: string;
  targetItem?: string;
  analysisItems?: string[];
  flags?: RiskFlags;  // ← Added
}
```

---

## Score Adjustment Rules

The score is adjusted ONLY if critical flags are present:

```typescript
function calculateAdjustedScore(baseScore: number, flags: RiskFlags): number {
  let adjustedScore = baseScore;

  if (flags.blacklisted) {
    adjustedScore = Math.min(adjustedScore + 90, 100);  // +90, max 100
  } else if (flags.malwareDetected) {
    adjustedScore = Math.min(adjustedScore + 80, 100);  // +80, max 100
  } else if (flags.phishingDetected) {
    adjustedScore = Math.min(adjustedScore + 70, 100);  // +70, max 100
  }

  // Ensure dangerous flags show high risk
  if (flags.phishingDetected || flags.malwareDetected || flags.blacklisted) {
    return Math.max(adjustedScore, 75);  // At least 75 if dangerous
  }

  return adjustedScore;  // Return original if no threats
}
```

---

## Verdict Decision Priority

```typescript
function calculateFinalVerdict(score: number, flags: RiskFlags): FinalVerdict {
  // PRIORITY 1: Critical flags ALWAYS override
  if (flags.phishingDetected || flags.malwareDetected || flags.blacklisted) {
    return "dangerous";
  }

  // PRIORITY 2: Score thresholds
  if (score <= 30) return "safe";
  if (score <= 70) return "warning";
  return "dangerous";
}
```

**This ensures:**
- Phishing URLs are NEVER shown as "Safe"
- Malware is NEVER downgraded to "Warning"
- Blacklisted items are ALWAYS "Dangerous"

---

## PDF Sections Explained

### Section 1: SCAN OVERVIEW
- What was scanned (URL/File/Email/Password)
- What was the target
- When it was scanned
- Who performed the scan

### Section 2: SECURITY VERDICT (Color-Coded)
- Final verdict with emoji (✓/⚠/✕)
- Severity level (LOW/MEDIUM/HIGH)
- Visual score bar (color-matched to verdict)
- Clear description

### Section 3: THREAT DETECTION SUMMARY
- Malicious vendors count (🔴)
- Suspicious vendors count (🟠)
- Harmless verdicts count (🟢)
- Undetected count (⚪)

### Section 4: DETAILED ANALYSIS
- Each vendor's verdict
- Flagged items highlighted
- Clean formatting

### Section 5: IDENTIFIED THREATS
- List of threat signatures
- Color-coded for severity

### Section 6: RECOMMENDED ACTIONS
- 5+ actionable recommendations
- Specific to verdict type:
  - **Safe**: Standard precautions
  - **Warning**: Verification needed, be cautious
  - **Dangerous**: Do not interact, report, secure accounts

---

## Color Scheme

### For Verdicts
| Verdict | Color | RGB | Usage |
|---------|-------|-----|-------|
| Safe | Emerald | 0, 230, 118 | ✓ Safe verdicts |
| Warning | Amber | 255, 204, 0 | ⚠ Warning verdicts |
| Dangerous | Red | 255, 77, 77 | ✕ Dangerous verdicts |

### In PDF
- **Header color**: Matches verdict color
- **Title underlines**: Verdict color
- **Score bar**: Verdict color
- **Footer**: Verdict color

---

## Testing Checklist

- [ ] Phishing URL shows "Dangerous" even with low score
- [ ] Clean URL shows "Safe" with no boosted score
- [ ] Suspicious URL shows "Warning" with original score
- [ ] PDF header color matches verdict
- [ ] PDF score bar matches verdict color
- [ ] All 6 sections appear in PDF
- [ ] Recommendations match verdict type
- [ ] Footer appears on all pages
- [ ] No conflicting messages anywhere
- [ ] Score adjustment is correct (phishing +70, malware +80, blacklist +90)

---

## Backward Compatibility

- ✅ Old UI still works (updated to use new logic)
- ✅ Old PDF interface still exists (updated internally)
- ✅ No breaking changes to component APIs
- ✅ All data structures include optional flags field

---

## Future Enhancements

1. **Score History**: Track score changes over time
2. **Flag Severity**: Different levels of threat criticality
3. **Custom Thresholds**: Allow users to set their own safe/warning/danger levels
4. **Multi-flag Analysis**: Handle multiple threats simultaneously
5. **Report Comparison**: Compare old vs new scans
6. **Alert Notifications**: Notify when critical flags are detected

---

## Common Issues & Solutions

### Issue: Phishing URL still shows "Safe"
**Solution**: Ensure flags are being extracted from VT data
```typescript
// Check this is working:
const flags = {
  phishingDetected: vtData.malicious >= 3,  // Must be >= 3
  malwareDetected: vtData.malicious >= 1,
};
```

### Issue: Score not adjusting
**Solution**: Pass flags to calculateAdjustedScore
```typescript
// Correct:
const adjusted = calculateAdjustedScore(score, flags);

// Wrong (won't adjust):
const adjusted = score;
```

### Issue: PDF shows wrong color
**Solution**: Ensure verdict is being calculated before colors
```typescript
// Correct order:
const verdict = calculateFinalVerdict(score, flags);
const colors = getVerdictColors(verdict);

// Wrong (will use default):
const colors = getVerdictColors("safe");
```

### Issue: Different verdicts in UI and PDF
**Solution**: Both should use calculateFinalVerdict() with same flags
```typescript
// Both should do this:
const verdict = calculateFinalVerdict(baseScore, flags);
// NOT score-based logic in one and flag-based in another
```

---

## Performance Notes

- ✅ All calculations are O(1) - no loops
- ✅ No async operations needed
- ✅ Can be called frequently without performance impact
- ✅ PDF generation is async (uses jsPDF)

---

## Support

For questions or issues with the unified logic, refer to:
- `src/lib/riskDecisionLogic.ts` - Main logic
- `src/lib/pdfReportGenerator.ts` - PDF implementation
- `docs/PHISHING_LOGIC_FIXED.md` - Architecture overview
