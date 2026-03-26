import { UrlAnalysis } from "./mockData";

export interface RiskReportData {
  scanType: "url" | "email" | "file" | "password";
  result: {
    status: "safe" | "suspicious" | "dangerous";
    score?: number;
    details: string;
    threats?: string[];
  };
  userName?: string;
  timestamp?: Date;
}

const getRiskLevel = (score: number | undefined): string => {
  if (score === undefined) return "UNKNOWN";
  if (score <= 30) return "LOW";
  if (score <= 70) return "MEDIUM";
  return "HIGH";
};

const getRiskIcon = (level: string): string => {
  switch (level) {
    case "HIGH": return "🔴";
    case "MEDIUM": return "🟠";
    case "LOW": return "🟡";
    default: return "⚪";
  }
};

const getStatusEmoji = (status: string): string => {
  switch (status) {
    case "safe": return "✅ SAFE";
    case "suspicious": return "⚠️ SUSPICIOUS";
    case "dangerous": return "🚨 DANGEROUS";
    default: return "❓ UNKNOWN";
  }
};

export const generateRiskReport = (data: RiskReportData): string => {
  const timestamp = data.timestamp ? new Date(data.timestamp).toLocaleString() : new Date().toLocaleString();
  const riskLevel = getRiskLevel(data.result.score);
  const riskIcon = getRiskIcon(riskLevel);
  const statusEmoji = getStatusEmoji(data.result.status);

  const threatsSummary = data.result.threats && data.result.threats.length > 0
    ? data.result.threats.map((threat, i) => `${getRiskIcon("HIGH")} ${threat}`).join("\n")
    : `${riskIcon} No specific threats detected`;

  const scanTypeLabel = {
    url: "URL Phishing Detection",
    email: "Email Breach Check",
    file: "File Malware Analysis",
    password: "Password Strength Analysis"
  }[data.scanType];

  const report = `
╔════════════════════════════════════════════════════════════╗
║          APGS Risk Report (Security Assessment)            ║
║     Authentication Protocol Gateway Secure                 ║
╚════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 PROJECT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Project:     APGS - Authentication Protocol Gateway Secure
Version:     1.0.0
Scan Date:   ${timestamp}
${data.userName ? `Analyzed By:  ${data.userName}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 SCAN OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Scan Type:   ${scanTypeLabel}
Purpose:     Comprehensive security analysis to identify potential 
             threats and vulnerabilities in your digital assets.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RISK ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Risk Level:  ${riskIcon} ${riskLevel}
${data.result.score !== undefined ? `Risk Score:  ${data.result.score}/100` : ""}
Status:      ${statusEmoji}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  THREAT DETECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${threatsSummary}

Details:     ${data.result.details}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛡️  RISK LEVELS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 HIGH RISK
   Status:  CRITICAL - Immediate action required
   Action:  Address this threat immediately to prevent security breach
   
🟠 MEDIUM RISK
   Status:  WARNING - Needs improvement
   Action:  Review and implement recommended security measures
   
🟡 LOW RISK
   Status:  INFO - Minor issue
   Action:  Monitor and consider implementing best practices

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 SECURITY MEASURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Secure Authentication Login
  - Multi-layer security verification
  - Session-based protection
  
✓ HTTPS Encryption
  - End-to-end encrypted connections
  - Secure data transmission
  
✓ Real-time Scanning
  - Immediate threat detection
  - Instant risk assessment
  
✓ Minimal Data Storage
  - Privacy-first approach
  - No unnecessary data retention

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 FINAL RESULT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

System Status: ${statusEmoji}

${data.result.status === "safe"
    ? "✅ GREEN LIGHT - Your system appears to be secure."
    : data.result.status === "suspicious"
    ? "⚠️ CAUTION - Suspicious activity detected. Review and take appropriate action."
    : "🚨 DANGER - Critical threats identified. Immediate action required."
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Review the identified threats carefully
2. Take corrective action based on risk level
${riskLevel === "HIGH" ? "3. Contact support immediately for critical threats\n" : ""}
3. Keep your security tools and software updated
4. Regularly monitor and conduct security assessments
5. Follow best practices for digital security

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 SUPPORT & CONTACT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For additional help and support:
Email: gyana.tcr20@gmail.com
Phone: +91 7008584414

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ Report Generated by APGS Security Scanner
╔════════════════════════════════════════════════════════════╗
║  This report is confidential and contains sensitive        ║
║  security information. Handle with care.                   ║
╚════════════════════════════════════════════════════════════╝
`;

  return report;
};

export const downloadReport = (content: string, scanType: string) => {
  const filename = `APGS_Risk_Report_${scanType}_${new Date().toISOString().split('T')[0]}.txt`;
  const element = document.createElement("a");
  element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content));
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};
