import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileAnalysis } from "./interfaces";

export const generateFilePdfReport = (data: FileAnalysis, userName?: string) => {
  const doc = new jsPDF();
  
  // 1. Determine Color based on the ACTUAL data status
  // This is where the "Malicious as Safe" bug is usually fixed
  const isMalicious = data.status === "infected";
  const isSuspicious = data.status === "suspicious";
  
  const themeColor = isMalicious ? [255, 77, 77] : isSuspicious ? [255, 204, 0] : [0, 224, 255];

  // --- Header ---
  doc.setFillColor(17, 24, 39); 
  doc.rect(0, 0, 210, 40, "F");
  doc.setTextColor(themeColor[0], themeColor[1], themeColor[2]);
  doc.setFontSize(22);
  doc.text("APGS FILE SECURITY AUDIT", 20, 25);

  // --- Verdict Box ---
  doc.setDrawColor(themeColor[0], themeColor[1], themeColor[2]);
  doc.setLineWidth(1.5);
  doc.rect(140, 50, 50, 30);
  doc.setTextColor(themeColor[0], themeColor[1], themeColor[2]);
  doc.setFontSize(10);
  doc.text("SECURITY VERDICT", 145, 58);
  doc.setFontSize(14);
  doc.text(data.status.toUpperCase(), 145, 72);

  // --- File Details ---
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text(`File: ${data.fileName}`, 20, 55);
  doc.text(`Score: ${data.score}/100`, 20, 62);
  doc.text(`Detection Ratio: ${data.vtStats?.malicious}/${data.vtStats?.malicious + data.vtStats?.undetected + data.vtStats?.harmless}`, 20, 69);

  // --- Vendor Table ---
  autoTable(doc, {
    startY: 90,
    head: [['Security Vendor', 'Result', 'Status']],
    body: data.reasons.map(r => [
      r.label, 
      r.value, 
      r.flagged ? "MALICIOUS" : "CLEAN"
    ]),
    headStyles: { fillStyle: [17, 24, 39], textColor: themeColor },
    didDrawCell: (cellData) => {
      if (cellData.section === 'body' && cellData.column.index === 2) {
        if (cellData.cell.text[0] === "MALICIOUS") doc.setTextColor(255, 77, 77);
        else doc.setTextColor(0, 255, 156);
      }
    }
  });

  doc.save(`APGS_Audit_${data.fileName}.pdf`);
};