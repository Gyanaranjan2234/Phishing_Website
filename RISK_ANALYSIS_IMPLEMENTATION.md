# Risk Analysis Report - Implementation Guide

## Quick Start

### 1. Import the Component
```tsx
import RiskAnalysisReport from "@/components/RiskAnalysisReport";
import type { RiskAnalysisData } from "@/components/RiskAnalysisReport";
```

### 2. Prepare Your Data
```tsx
const reportData: RiskAnalysisData = {
  scanType: "url",
  status: "safe",
  score: 25,
  details: "This URL has been verified as legitimate and safe to visit.",
  threats: [],
  timestamp: new Date().toISOString(),
  userName: "Admin User",
  targetItem: "https://google.com",
  analysisItems: ["HTTPS Encrypted", "Valid Certificate", "Safe Reputation"],
};
```

### 3. Render the Component
```tsx
<RiskAnalysisReport data={reportData} />
```

## Data Structure

### RiskAnalysisData Interface

```typescript
interface RiskAnalysisData {
  // Required fields
  scanType: "url" | "email" | "file" | "password";
  status: "safe" | "suspicious" | "dangerous";
  score: number;        // 0-100
  details: string;      // Main analysis description

  // Optional fields
  threats?: string[];              // Array of identified threats
  timestamp?: string;              // ISO format datetime
  userName?: string;               // Who performed the scan
  targetItem?: string;             // What was scanned
  analysisItems?: string[];        // Analysis findings
}
```

## Field Descriptions

### scanType
Determines what type of security scan was performed.

**Values:**
- `"url"` → URL Phishing Detection
- `"email"` → Email Breach Check
- `"file"` → File Malware Analysis
- `"password"` → Password Strength Analysis

**Example:**
```tsx
scanType: "url"
```

### status
Overall security assessment result.

**Values:**
- `"safe"` → Item is verified safe (0-30 score)
- `"suspicious"` → Suspicious characteristics detected (31-70 score)
- `"dangerous"` → Critical threat identified (71-100 score)

**Note:** Should align with score ranges for consistency.

### score
Numerical risk assessment (0-100 scale).

**Ranges:**
- `0-30`: Safe (green)
- `31-70`: Warning (amber)
- `71-100`: Dangerous (red)

**Example:**
```tsx
score: 45  // Results in WARNING status
```

### details
Main analysis explanation text.

**Guidelines:**
- Clear, concise language
- Explain the assessment
- Mention key findings
- Maximum 500 characters

**Example:**
```tsx
details: "This URL shows some suspicious patterns. The domain was recently registered and contains credential harvesting indicators. Manual review recommended before accessing."
```

### threats (Optional)
Array of specific security threats identified.

**Usage:**
```tsx
threats: [
  "Newly registered domain",
  "Phishing-like form patterns",
  "Suspicious redirect detected"
]
```

**Display:**
- Shows in red "Identified Issues" section
- Only displayed if array has items
- Each threat in its own box with warning icon

### timestamp (Optional)
When the scan was performed.

**Format:**
```tsx
timestamp: new Date().toISOString()
// or
timestamp: "2024-03-27T14:23:45.000Z"
```

**Display:**
- Formatted based on user locale
- Shows in Scan Information card

### userName (Optional)
User or system that performed the scan.

**Example:**
```tsx
userName: "Security Scanner Pro v2.1"
```

**Display:**
- Shows in Scan Information card
- Defaults to "Guest User" if not provided

### targetItem (Optional)
The URL, email, file path, or item being scanned.

**Examples:**
```tsx
// URL Scan
targetItem: "https://example.com/login"

// Email Scan
targetItem: "security@example.com"

// File Scan
targetItem: "C:/Downloads/document.pdf"

// Password
targetItem: "User password for account XYZ"
```

**Display:**
- Shows in Scan Information card
- Text wraps on mobile
- Truncated with ellipsis if too long

### analysisItems (Optional)
Array of analysis findings or positive indicators.

**Usage:**
```tsx
analysisItems: [
  "HTTPS Enabled",
  "Valid SSL Certificate",
  "Domain Reputation: Good",
  "No Malware Detected",
  "Email Authentication: PASS"
]
```

**Display:**
- Grid layout (2-3 columns)
- Each item with eye icon
- Cyan colored for visibility
- Shows in "Analysis Items" section

## Examples

### Example 1: Safe URL

```tsx
const safeURLData: RiskAnalysisData = {
  scanType: "url",
  status: "safe",
  score: 12,
  details: "This URL has been verified as legitimate. All security checks passed successfully. The website uses secure connections and has a good reputation.",
  threats: [],
  timestamp: new Date().toISOString(),
  userName: "Automated Scanner",
  targetItem: "https://www.github.com",
  analysisItems: [
    "HTTPS Encrypted",
    "Valid Certificate",
    "Verified Domain",
    "Safe Reputation",
    "No Malware"
  ]
};
```

### Example 2: Suspicious Email

```tsx
const suspiciousEmailData: RiskAnalysisData = {
  scanType: "email",
  status: "suspicious",
  score: 58,
  details: "This email address shows several warning signs. While not confirmed malicious, exercise caution. The sender domain has a poor reputation and the email pattern matches known phishing campaigns.",
  threats: [
    "Sender domain reputation: Poor",
    "Email pattern matches phishing",
    "Urgent language detected"
  ],
  timestamp: "2024-03-27T10:30:00.000Z",
  userName: "Email Filter",
  targetItem: "noreply@secure-update-confirm.xyz",
  analysisItems: [
    "Poor Domain Reputation",
    "Phishing Pattern Match",
    "Urgent Language",
    "No SPF Record"
  ]
};
```

### Example 3: Dangerous File

```tsx
const dangerousFileData: RiskAnalysisData = {
  scanType: "file",
  status: "dangerous",
  score: 89,
  details: "This file has been identified as malicious with high confidence. Multiple antivirus engines detected malware signatures. The file exhibits behavior consistent with ransomware.",
  threats: [
    "Malware Signature: Ransomware.Gen2",
    "Ransomware behavior detected",
    "Blacklisted by VirusTotal (48/71)",
    "Uses process injection techniques"
  ],
  timestamp: new Date().toISOString(),
  userName: "Endpoint Protection",
  targetItem: "/downloads/document_final_SAFE.exe",
  analysisItems: [
    "Malware Detected",
    "Ransomware Type",
    "Process Injection",
    "Registry Modification"
  ]
};
```

### Example 4: Weak Password

```tsx
const weakPasswordData: RiskAnalysisData = {
  scanType: "password",
  status: "dangerous",
  score: 78,
  details: "This password is considered weak and should be changed immediately. It uses common patterns and lacks sufficient complexity. This password appears in compromised database lists.",
  threats: [
    "Password in breach database",
    "Insufficient length",
    "No special characters",
    "Dictionary word detected"
  ],
  timestamp: new Date().toISOString(),
  userName: "Password Analyzer",
  targetItem: "User account password",
  analysisItems: [
    "Low Entropy",
    "Dictionary Word",
    "In Breach List",
    "No Uppercase",
    "No Special Chars"
  ]
};
```

## Integration Patterns

### With React Query

```tsx
import { useQuery } from "@tanstack/react-query";
import RiskAnalysisReport from "@/components/RiskAnalysisReport";

function ScanResultPage({ scanId }) {
  const { data, isLoading } = useQuery({
    queryKey: ["scan", scanId],
    queryFn: () => fetchScanResult(scanId),
  });

  if (isLoading) return <div>Loading...</div>;
  
  return <RiskAnalysisReport data={data} />;
}
```

### With Form Submission

```tsx
import { useState } from "react";
import RiskAnalysisReport from "@/components/RiskAnalysisReport";

function ScanForm() {
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get("url");
    
    const response = await fetch("/api/scan", {
      method: "POST",
      body: JSON.stringify({ url }),
    });
    
    const data = await response.json();
    setResult(data);
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <input name="url" type="url" required />
        <button type="submit">Scan</button>
      </form>
      {result && <RiskAnalysisReport data={result} />}
    </>
  );
}
```

### With Server-Side Rendering (Next.js)

```tsx
import RiskAnalysisReport from "@/components/RiskAnalysisReport";

// app/scan/[id]/page.tsx
export default async function ScanPage({ params }) {
  const data = await fetchScanResult(params.id);
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Scan Results</h1>
      <RiskAnalysisReport data={data} />
    </div>
  );
}
```

## Styling & Customization

### Custom Container Classes

```tsx
<div className="custom-container">
  <RiskAnalysisReport data={reportData} />
</div>
```

With CSS:
```css
.custom-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}
```

### Theme Customization

To override the dark theme colors:

```tsx
// Create a wrapper component
function CustomRiskReport({ data }) {
  return (
    <div style={{ "--primary-bg": "#1a1a2e", "--card-bg": "#16213e" }}>
      <RiskAnalysisReport data={data} />
    </div>
  );
}
```

## Common Use Cases

1. **Security Dashboard**: Display scan results in dashboard
2. **Email Threat Detector**: Show email safety assessments
3. **File Scanner**: Display file security analysis
4. **Password Manager**: Show password strength reports
5. **Browser Extension**: Display web page safety info
6. **API Response**: Show risk assessment in API consumer apps

## Troubleshooting

### Issue: Component shows error
**Solution**: Ensure all required fields are provided and data is not null/undefined

### Issue: Icons not displaying
**Solution**: Verify `lucide-react` is installed: `npm install lucide-react`

### Issue: Dark theme not showing
**Solution**: Ensure Tailwind CSS is properly configured and includes dark mode

### Issue: Responsive layout broken
**Solution**: Check that viewport meta tag is present in HTML head

## Performance Tips

1. Memoize report data to avoid unnecessary re-renders
2. Use lazy loading for multiple reports
3. Implement pagination for large result sets
4. Cache scan results with React Query
5. Use WebWorkers for intensive data processing

## Security Considerations

1. The component sanitizes all input data
2. No sensitive data is logged to console (in production)
3. All rendering is client-side secure
4. XSS protection through React's default escaping
5. No external API calls from component

## API Integration Example

```tsx
async function getScanReport(itemToScan: string) {
  const response = await fetch("/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item: itemToScan }),
  });

  const data = await response.json();
  
  // API should return: RiskAnalysisData
  return data;
}

// Usage
const reportData = await getScanReport("https://example.com");
return <RiskAnalysisReport data={reportData} />;
```

## Support

For issues or feature requests, please check:
- Component source: `/src/components/RiskAnalysisReport.tsx`
- Demo: `/src/components/RiskAnalysisDemo.tsx`
- Design guide: `/RISK_ANALYSIS_REPORT_DESIGN.md`
