import jsPDF from "jspdf";
import type { UrlAnalysis, FileAnalysis } from "./mockData";

export function generateReport(analysis: UrlAnalysis) {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  let y = 20;

  // Determine risk level
  const riskLabel = analysis.score >= 71 ? "High Risk" : analysis.score >= 31 ? "Suspicious" : "Safe";
  const riskColor: [number, number, number] = 
    analysis.score >= 71 ? [239, 68, 68] : 
    analysis.score >= 31 ? [234, 179, 8] : 
    [0, 200, 83];

  // ============ HEADER SECTION ============
  doc.setFillColor(15, 23, 30);
  doc.rect(0, 0, w, 50, "F");
  
  doc.setFontSize(22);
  doc.setTextColor(0, 230, 118);
  doc.setFont("helvetica", "bold");
  doc.text("APGS SECURITY RISK REPORT", w / 2, 18, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 160, 140);
  doc.text("Authentication Protocol Gateway Secure", w / 2, 28, { align: "center" });
  
  // Report metadata
  const now = new Date();
  const reportDate = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const reportTime = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  doc.setFontSize(9);
  doc.text(`Report Generated: ${reportDate} at ${reportTime}`, w / 2, 38, { align: "center" });
  
  y = 62;

  // ============ SCANNED URL SECTION ============
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

  // ============ RESULT & RISK SCORE SECTION ============
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
  const resultText = analysis.status === "safe" ? "SAFE" : "PHISHING DETECTED";
  doc.text(`Result: ${resultText}`, 20, y);
  
  y += 10;
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.setFont("helvetica", "normal");
  doc.text(`Risk Level: ${riskLabel}`, 20, y);
  
  y += 8;
  
  // Risk score bar with value
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.text(`Security Score: ${analysis.score}/100`, 20, y);
  
  y += 7;
  
  // Draw score bar
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.rect(20, y, 140, 12);
  
  // Fill score bar based on risk
  doc.setFillColor(...riskColor);
  const barWidth = (analysis.score / 100) * 140;
  doc.rect(20, y, barWidth, 12, "F");
  
  // Percentage text on bar
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(`${analysis.score}%`, 20 + barWidth / 2, y + 8, { align: "center" });
  
  y += 20;

  // ============ DIVIDER ============
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.line(20, y, w - 20, y);
  
  y += 10;

  // ============ DETAILED FINDINGS SECTION ============
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("DETAILED FINDINGS", 20, y);
  
  y += 10;

  // Analysis factors
  analysis.reasons.forEach((reason, index) => {
    const factorColor: [number, number, number] = reason.flagged ? [239, 68, 68] : [0, 200, 83];
    const statusIcon = reason.flagged ? "⚠" : "✓";
    const statusText = reason.flagged ? "WARNING" : "SAFE";
    
    // Factor label with icon
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(factorColor[0], factorColor[1], factorColor[2]);
    doc.text(`${statusIcon}  ${reason.label}`, 25, y);
    
    // Factor value
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    const valueY = y + 5;
    doc.text(`Status: ${statusText}`, 30, valueY);
    doc.text(`Details: ${reason.value}`, 30, valueY + 5, { maxWidth: w - 50 });
    
    y += 16;
  });
  
  y += 5;

  // ============ DIVIDER ============
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.line(20, y, w - 20, y);
  
  y += 10;

  // ============ FINAL VERDICT SECTION ============
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("FINAL VERDICT", 20, y);
  
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
  
  const verdict = analysis.status === "safe"
    ? "✓ SAFE: The analyzed URL appears to be legitimate and safe to interact with. No significant phishing indicators were detected. However, always exercise caution with personal information online."
    : "⚠ WARNING: This URL shows strong indicators of a PHISHING ATTEMPT. Do NOT enter personal information, credentials, or financial details on this website. Report this URL to the appropriate authorities.";
  
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
    "• Use strong, unique passwords for different websites"
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

  // Save PDF with timestamp
  const fileName = `APGS_Security_Report_${Date.now()}.pdf`;
  doc.save(fileName);
}

export function generateFileReport(analysis: FileAnalysis) {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = 20;

  const riskLabel = analysis.score >= 71 ? "High Risk" : analysis.score >= 31 ? "Suspicious" : "Safe";
  const riskColor: [number, number, number] =
    analysis.score >= 71 ? [255, 77, 77] : // #ff4d4d
    analysis.score >= 31 ? [255, 204, 0] : // #ffcc00
    [0, 255, 156]; // #00ff9c

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
  doc.text("Authentication Protocol Gateway Secure", w / 2, 24, { align: "center" });

  const now = new Date();
  const reportDate = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const reportTime = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  doc.text(`Generated: ${reportDate} ${reportTime}`, w / 2, 32, { align: "center" });

  y = 58;

  // ============ DETAILS ============
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
  const barWidth = Math.max(0.1, (analysis.score / 100) * (w - margin * 2));
  doc.setDrawColor(220);
  doc.setFillColor(235, 235, 235);
  doc.rect(margin, y, w - margin * 2, 10, "F");
  doc.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.rect(margin, y, barWidth, 10, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(`${analysis.score}%`, margin + (barWidth / 2), y + 6, { align: "center" });

  y += 20;
  drawSectionHeader("Scan Analysis");

  analysis.reasons.forEach((reason) => {
    const flagColor = reason.flagged ? [255, 77, 77] : [0, 255, 156] as [number, number, number];
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(flagColor[0], flagColor[1], flagColor[2]);
    doc.text(`${reason.flagged ? "⚠" : "✓"} ${reason.label}`, margin, y);

    y += 6;
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`● Status: ${reason.flagged ? "WARNING" : "CLEAN"}`, margin + 8, y);
    y += 5;
    doc.text(`● Details: ${reason.value}`, margin + 8, y, { maxWidth: w - margin * 2 - 8 });
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
  drawSectionHeader("Final Verdict");
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
  const verdictText = analysis.status === "safe"
    ? "The file is found to be safe based on current heuristics and simulated rules. Continue monitoring and keep security tools updated."
    : "The file is potentially malicious and poses a security risk. Do not open or execute. Quarantine and remove from the device immediately.";
  doc.text(verdictText, margin, y, { maxWidth: w - margin * 2, lineHeightFactor: 1.3 });

  // footer
  doc.setFillColor(15, 23, 30);
  doc.rect(0, h - 14, w, 14, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(160, 180, 170);
  doc.text("APGS - Confidential Security Report | All Rights Reserved", w / 2, h - 6, { align: "center" });

  const reportFileName = `APGS_File_Security_Report_${Date.now()}.pdf`;
  doc.save(reportFileName);
}

