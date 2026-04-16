import type { UrlAnalysis, FileAnalysis } from "./interfaces";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Centralized Theme (Matches URL Report Branding)
const THEME = {
  dark: [15, 23, 30] as [number, number, number],
  neonGreen: [0, 230, 118] as [number, number, number],
  dangerRed: [239, 68, 68] as [number, number, number],
  warningYellow: [234, 179, 8] as [number, number, number],
  safeGreen: [0, 200, 83] as [number, number, number],
  slateGray: [60, 60, 60] as [number, number, number],
};
// This file contains the main function to generate a PDF report based on the analysis results.
export async function generateReport(analysis: UrlAnalysis): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  let y = 20;

  const riskLabel =
    analysis.score >= 71 ? "High Risk" :
    analysis.score >= 31 ? "Suspicious" :
    "Safe";

  const riskColor: [number, number, number] =
    analysis.score >= 71 ? [239, 68, 68] :
    analysis.score >= 31 ? [234, 179, 8] :
    [0, 200, 83];

  // ============ HEADER ============
  doc.setFillColor(15, 23, 30);
  doc.rect(0, 0, w, 50, "F");

  doc.setFontSize(22);
  doc.setTextColor(0, 230, 118);
  doc.setFont("helvetica", "bold");
  doc.text("APGS SECURITY RISK REPORT", w / 2, 18, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 160, 140);
  doc.text("Advanced Phishing Guard System", w / 2, 28, { align: "center" });

  const now = new Date();
  const reportDate = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const reportTime = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  doc.setFontSize(9);
  doc.text(`Report Generated: ${reportDate} at ${reportTime}`, w / 2, 38, { align: "center" });

  y = 62;

  // ============ SCANNED URL ============
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.setFont("helvetica", "bold");
  doc.text("SCANNED URL", 20, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 30, 30);
  const urlToDisplay = analysis.url.length > 85 ? analysis.url.substring(0, 85) + "..." : analysis.url;
  doc.text(urlToDisplay, 20, y, { maxWidth: w - 40 });

  y += 14;

  // ============ RESULT & RISK SCORE ============
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
  const resultText =
    analysis.status === "safe" ? "SAFE" :
    analysis.status === "suspicious" ? "SUSPICIOUS" :
    "PHISHING DETECTED";
  doc.text(`Result: ${resultText}`, 20, y);

  y += 10;
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.setFont("helvetica", "normal");
  doc.text(`Risk Level: ${riskLabel}`, 20, y);

  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.text(`Security Score: ${analysis.score}/100`, 20, y);

  y += 7;

  // Score bar
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.rect(20, y, 140, 12);
  doc.setFillColor(...riskColor);
  const barWidth = (analysis.score / 100) * 140;
  doc.rect(20, y, barWidth, 12, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(`${analysis.score}%`, 20 + barWidth / 2, y + 8, { align: "center" });

  y += 20;

  // VirusTotal stats if available
  if (analysis.vtStats) {
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.3);
    doc.line(20, y, w - 20, y);
    y += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("VIRUSTOTAL SCAN STATS", 20, y);
    y += 10;

    const stats = [
      { label: "Malicious", value: analysis.vtStats.malicious, color: [239, 68, 68] as [number, number, number] },
      { label: "Suspicious", value: analysis.vtStats.suspicious, color: [234, 179, 8] as [number, number, number] },
      { label: "Harmless", value: analysis.vtStats.harmless, color: [0, 200, 83] as [number, number, number] },
      { label: "Undetected", value: analysis.vtStats.undetected, color: [150, 150, 150] as [number, number, number] },
    ];

    stats.forEach((stat) => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
      doc.text(`${stat.label}:`, 25, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      doc.text(`${stat.value} vendor(s)`, 70, y);
      y += 7;
    });

    y += 5;
  }

  // ============ DIVIDER ============
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.line(20, y, w - 20, y);
  y += 10;

  // ============ DETAILED FINDINGS ============
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("DETAILED FINDINGS", 20, y);
  y += 10;

  analysis.reasons.forEach((reason) => {
    if (y > h - 60) {
      doc.addPage();
      y = 20;
    }
    const factorColor: [number, number, number] = reason.flagged ? [239, 68, 68] : [0, 200, 83];
    const statusIcon = reason.flagged ? "! " : "✓ ";

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(factorColor[0], factorColor[1], factorColor[2]);
    doc.text(`${statusIcon} ${reason.label}`, 25, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(`Status: ${reason.flagged ? "WARNING" : "CLEAN"}`, 30, y + 5);
    doc.text(`Details: ${reason.value}`, 30, y + 10, { maxWidth: w - 50 });

    y += 18;
  });

  y += 5;

  // ============ FINAL VERDICT ============
  if (y > h - 80) { doc.addPage(); y = 20; }

  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.line(20, y, w - 20, y);
  y += 10;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("FINAL VERDICT", 20, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);

  const verdict =
    analysis.status === "safe"
      ? "SAFE: The analyzed URL appears to be legitimate and safe to interact with. No significant phishing indicators were detected."
      : analysis.status === "suspicious"
      ? "SUSPICIOUS: This URL shows some suspicious indicators. Exercise caution and do not enter personal information."
      : "WARNING: This URL shows strong indicators of a PHISHING ATTEMPT. Do NOT enter personal information or credentials.";

  doc.text(verdict, 20, y, { maxWidth: w - 40, lineHeightFactor: 1.3 });

  // ============ RECOMMENDATIONS ============
  y = h - 70;
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.line(20, y, w - 20, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("RECOMMENDATIONS", 20, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);

  const recommendations = [
    "• Only enter sensitive information on trusted, verified websites",
    "• Always check the HTTPS lock icon before entering data",
    "• Be cautious of unsolicited emails with suspicious links",
    "• Keep your browser and antivirus software updated",
    "• Use strong, unique passwords for different websites",
  ];

  recommendations.forEach((rec, idx) => {
    doc.text(rec, 20, y + idx * 6, { maxWidth: w - 40 });
  });

  // ============ FOOTER ============
  doc.setFillColor(15, 23, 30);
  doc.rect(0, h - 12, w, 12, "F");
  doc.setFontSize(8);
  doc.setTextColor(120, 160, 140);
  doc.text("APGS - Confidential Security Report | All Rights Reserved", w / 2, h - 5, { align: "center" });

  doc.save(`APGS_Security_Report_${Date.now()}.pdf`);
}

export async function generateFileReport(analysis: FileAnalysis, userName: string): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = 20;

  const riskLabel =
    analysis.score >= 71 ? "High Risk" :
    analysis.score >= 31 ? "Suspicious" :
    "Safe";

  const riskColor: [number, number, number] =
    analysis.score >= 71 ? [255, 77, 77] :
    analysis.score >= 31 ? [255, 204, 0] :
    [0, 255, 156];

  const drawSectionHeader = (title: string) => {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(title, margin, y);
    y += 8;
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.4);
    doc.line(margin, y, w - margin, y);
    y += 10;
  };

  const addField = (label: string, value: string) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text(`${label}:`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text(value, margin + 35, y, { maxWidth: w - margin * 2 - 35 });
    y += 7;
  };

  // ============ HEADER ============
  doc.setFillColor(15, 23, 30);
  doc.rect(0, 0, w, 48, "F");

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 230, 118);
  doc.text("APGS File Security Report", w / 2, 16, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(160, 180, 170);
  doc.text("Advanced Phishing Guard System", w / 2, 24, { align: "center" });

  const now = new Date();
  const reportDate = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const reportTime = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  doc.text(`Generated: ${reportDate} ${reportTime}`, w / 2, 32, { align: "center" });

  y = 58;

  drawSectionHeader("Scanned File Details");
  addField("File Name", analysis.fileName);
  addField("File Size", analysis.fileSize);

  y += 4;
  drawSectionHeader("Scan Result");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.text(`Result: ${analysis.status === "safe" ? "SAFE" : "INFECTED"}`, margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.text(`Risk Level: ${riskLabel}`, margin, y);
  y += 8;
  doc.text(`Security Score: ${analysis.score}/100`, margin, y);
  y += 8;

  const fileBarWidth = Math.max(0.1, (analysis.score / 100) * (w - margin * 2));
  doc.setDrawColor(220);
  doc.setFillColor(235, 235, 235);
  doc.rect(margin, y, w - margin * 2, 10, "F");
  doc.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.rect(margin, y, fileBarWidth, 10, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(`${analysis.score}%`, margin + fileBarWidth / 2, y + 6, { align: "center" });
  y += 20;

  drawSectionHeader("Scan Analysis");

  analysis.reasons.forEach((reason) => {
    if (y > h - 60) { doc.addPage(); y = 20; }
    const flagColor: [number, number, number] = reason.flagged ? [255, 77, 77] : [0, 255, 156];
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(flagColor[0], flagColor[1], flagColor[2]);
    doc.text(`${reason.flagged ? "!" : "✓"} ${reason.label}`, margin, y);
    y += 6;
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Status: ${reason.flagged ? "WARNING" : "CLEAN"}`, margin + 8, y);
    y += 5;
    doc.text(`Details: ${reason.value}`, margin + 8, y, { maxWidth: w - margin * 2 - 8 });
    y += 9;
  });

  if (analysis.threats.length > 0) {
    y += 3;
    drawSectionHeader("Detected Threats");
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    analysis.threats.forEach((threat) => {
      doc.text(`• ${threat}`, margin + 6, y, { maxWidth: w - margin * 2 - 6 });
      y += 5;
    });
  }

  y += 12;
  if (y > h - 60) { doc.addPage(); y = 20; }
  drawSectionHeader("Final Verdict");
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
  const fileVerdict =
    analysis.status === "safe"
      ? "The file is found to be safe. Continue monitoring and keep security tools updated."
      : "The file is potentially malicious. Do not open or execute. Quarantine and remove immediately.";
  doc.text(fileVerdict, margin, y, { maxWidth: w - margin * 2, lineHeightFactor: 1.3 });

  doc.setFillColor(15, 23, 30);
  doc.rect(0, h - 14, w, 14, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(160, 180, 170);
  doc.text("APGS - Confidential Security Report | All Rights Reserved", w / 2, h - 6, { align: "center" });

  doc.save(`APGS_File_Security_Report_${Date.now()}.pdf`);
}
