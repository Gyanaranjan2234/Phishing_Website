# Risk Decision Logic: Before & After Examples

## Scenario 1: Phishing URL with Low Score

### URL: A sophisticated phishing page
- Malicious vendors: 1 (just enough to trigger phishing flag)
- Suspicious vendors: 0
- Harmless vendors: 90
- Undetected vendors: 8
- **Calculated Score**: (1 + 0) / 99 * 100 = ~1%

### OLD BEHAVIOR (Bug)
```
Score: 1 (Safe threshold 0-30)
Verdict: ✓ Safe
Status: Safe

Result: INCORRECT - User might visit phishing page!
```

### NEW BEHAVIOR (Fixed) ✅
```
Input:
- score: 1
- flags: { malwareDetected: true, phishingDetected: false }

Decision Logic:
1. Check flags: malwareDetected === true → DANGEROUS
2. Override score completely

Output:
- verdict: "dangerous"
- displayScore: 75 (adjusted for consistency)
- Status: ✕ Dangerous
- Message: "Critical security threats detected — do not proceed"

Result: CORRECT - Clear danger warning!
```

---

## Scenario 2: Suspicious URL with Medium Score

### URL: Slightly suspicious domain
- Malicious vendors: 0
- Suspicious vendors: 5
- Harmless vendors: 50
- Undetected vendors: 44
- **Calculated Score**: (0 + 5*1) / 99 * 100 = ~5%

### OLD BEHAVIOR
```
Score: 5 (Safe threshold 0-30)
Verdict: ✓ Safe
Status: Safe

Result: Could be misleading if suspicious detections matter
```

### NEW BEHAVIOR (Improved) ✅
```
Input:
- score: 5
- flags: { suspicious: true, malwareDetected: false, phishingDetected: false }

Decision Logic:
1. Check malware/phishing/blacklist flags: all false
2. Use score thresholds: 5 ≤ 30 → Safe

Output:
- verdict: "safe"
- displayScore: 5 (no adjustment needed)
- Status: ✓ Safe
- Message: "This URL appears safe and legitimate..."

Result: CORRECT - Low risk, no danger override
```

---

## Scenario 3: Legitimate URL Marked Suspicious

### URL: Popular service with occasional false positives
- Malicious vendors: 0
- Suspicious vendors: 2
- Harmless vendors: 80
- Undetected vendors: 17
- **Calculated Score**: (0 + 2*1) / 99 * 100 = ~2%

### OLD BEHAVIOR
```
Score: 2 (Safe threshold 0-30)
Verdict: ✓ Safe
Status: Safe

Result: Correct, but why suspicious vendors?
```

### NEW BEHAVIOR (Enhanced Clarity) ✅
```
Input:
- score: 2
- flags: { suspicious: true, malwareDetected: false, phishingDetected: false }

Decision Logic:
1. Check malware/phishing/blacklist: all false
2. Use score: 2 ≤ 30 → Safe
3. Display flags noted but don't override

Output:
- verdict: "safe"
- displayScore: 2
- Status: ✓ Safe
- Message: "This URL appears safe and legitimate..."
- Analysis shows: 2 suspicious vendors flagged for review

Result: CORRECT - Safe with transparency about flags
```

---

## Scenario 4: Malware URL with High Score

### URL: Known malware distribution point
- Malicious vendors: 45
- Suspicious vendors: 10
- Harmless vendors: 30
- Undetected vendors: 14
- **Calculated Score**: (45 + 10) / 99 * 100 = ~56%

### OLD BEHAVIOR
```
Score: 56 (Warning threshold 31-70)
Verdict: ⚠ Warning
Status: Suspicious

Result: Misleading - should be DANGEROUS!
```

### NEW BEHAVIOR (Correct!) ✅
```
Input:
- score: 56
- flags: { malwareDetected: true, phishingDetected: true }

Decision Logic:
1. Check flags: malwareDetected === true → DANGEROUS
2. Override warning to danger
3. Boost score to ≥75 for UI consistency

Output:
- verdict: "dangerous"
- displayScore: 75 (adjusted from 56)
- Status: ✕ Dangerous
- Message: "Critical security threats detected — do not proceed"

Result: CORRECT - Clear danger despite moderate score!
```

---

## Scenario 5: Edge Case - Score at Boundary

### URL: Right at decision boundary
- Calculated Score: exactly 30.0

### OLD BEHAVIOR
```
Score: 30 (Safe vs Warning boundary)
Verdict: ✓ Safe (≤30 condition met)

Result: Safe, but very close to warning
```

### NEW BEHAVIOR (Consistent) ✅
```
Input:
- score: 30
- flags: { malwareDetected: false }

Decision Logic:
1. Check flags: no critical flags
2. Use score: 30 ≤ 30 → Safe

Output:
- verdict: "safe"
- displayScore: 30
- Status: ✓ Safe
- Boundary message can be added if needed

Result: CORRECT - Deterministic and documented
```

---

## Quick Reference

| Scenario | Score | Malicious | Verdict (OLD) | Verdict (NEW) | Status |
|----------|-------|-----------|---------------|---------------|--------|
| Phishing w/ low score | 1% | Yes | Safe ❌ | Dangerous ✅ | FIXED |
| Suspicious low score | 5% | No | Safe | Safe | OK |
| Clean URL | 2% | No | Safe | Safe | OK |
| Malware w/ med score | 56% | Yes | Warning ❌ | Dangerous ✅ | FIXED |
| Heavy threats | 90% | Yes | Dangerous | Dangerous | OK |
| Borderline safe | 30% | No | Safe | Safe | OK |
| Borderline warning | 31% | No | Warning | Warning | OK |

---

## Key Improvements

✅ **Phishing URLs are now always flagged as dangerous** - regardless of score
✅ **Malware URLs are now always flagged as dangerous** - regardless of score
✅ **Score and verdict are always visually aligned** - no conflicting messages
✅ **User safety is prioritized** - critical threats override low scores
✅ **Logic is centralized and maintainable** - easier to update rules
✅ **Backward compatible** - works with all existing API responses
