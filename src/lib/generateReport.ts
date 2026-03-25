import jsPDF from "jspdf";
import type { UrlAnalysis } from "./mockData";

export function generateReport(analysis: UrlAnalysis) {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  let y = 20;

  const riskLabel = analysis.score >= 75 ? "Safe" : analysis.score >= 50 ? "Suspicious" : "High Risk";
  const riskInverse = 100 - analysis.score; // invert: 0=safe, 100=danger for display

  // Header bar
  doc.setFillColor(15, 23, 30);
  doc.rect(0, 0, w, 40, "F");
  doc.setFontSize(20);
  doc.setTextColor(0, 230, 118);
  doc.text("APGS Security Risk Report", w / 2, 18, { align: "center" });
  doc.setFontSize(9);
  doc.setTextColor(120, 160, 140);
  doc.text("Authentication Protocol Gateway Secure", w / 2, 28, { align: "center" });
  doc.text(`Generated: ${new Date().toLocaleString()}`, w / 2, 35, { align: "center" });

  y = 52;

  // Scanned URL
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text("Scanned URL:", 20, y);
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.text(analysis.url.length > 80 ? analysis.url.substring(0, 80) + "..." : analysis.url, 20, y + 7);
  y += 20;

  // Result & Risk Score
  doc.setFontSize(13);
  const statusColor: [number, number, number] = analysis.status === "safe" ? [0, 200, 83] : [239, 68, 68];
  doc.setTextColor(...statusColor);
  doc.text(`Result: ${analysis.status === "safe" ? "SAFE" : "PHISHING DETECTED"}`, 20, y);
  y += 10;

  // Risk score bar
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`Security Score: ${analysis.score}/100 (${riskLabel})`, 20, y);
  y += 6;

  // Bar background
  doc.setFillColor(230, 230, 230);
  doc.roundedRect(20, y, 120, 6, 3, 3, "F");
  // Bar fill
  const barColor: [number, number, number] = analysis.score >= 75 ? [0, 200, 83] : analysis.score >= 50 ? [234, 179, 8] : [239, 68, 68];
  doc.setFillColor(...barColor);
  doc.roundedRect(20, y, (analysis.score / 100) * 120, 6, 3, 3, "F");
  y += 16;

  // Separator
  doc.setDrawColor(200, 200, 200);
  doc.line(20, y, w - 20, y);
  y += 10;

  // Detailed Findings
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text("Detailed Findings", 20, y);
  y += 10;

  analysis.reasons.forEach((reason) => {
    const icon = reason.flagged ? "⚠" : "✓";
    const color: [number, number, number] = reason.flagged ? [239, 68, 68] : [0, 200, 83];
    doc.setFontSize(10);
    doc.setTextColor(...color);
    doc.text(icon, 22, y);
    doc.setTextColor(60, 60, 60);
    doc.text(`${reason.label}:`, 30, y);
    doc.setTextColor(30, 30, 30);
    doc.text(reason.value, 80, y, { maxWidth: w - 100 });
    y += 8;
  });

  y += 8;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, y, w - 20, y);
  y += 10;

  // Final Verdict
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text("Final Verdict", 20, y);
  y += 8;
  doc.setFontSize(11);
  doc.setTextColor(...statusColor);
  doc.text(
    analysis.status === "safe"
      ? "The analyzed URL appears to be safe. No significant phishing indicators were detected."
      : "WARNING: This URL shows strong indicators of a phishing attempt. Do not enter personal information.",
    20,
    y,
    { maxWidth: w - 40 }
  );

  // Footer
  const h = doc.internal.pageSize.getHeight();
  doc.setFillColor(15, 23, 30);
  doc.rect(0, h - 15, w, 15, "F");
  doc.setFontSize(8);
  doc.setTextColor(120, 160, 140);
  doc.text("APGS - Authentication Protocol Gateway Secure | Confidential Report", w / 2, h - 6, { align: "center" });

  doc.save(`APGS_Report_${Date.now()}.pdf`);
}
