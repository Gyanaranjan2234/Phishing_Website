import type { UrlAnalysis, FileAnalysis } from './interfaces';

export interface PDFReportData {
  scanType: 'url' | 'file';
  target: string;
  result: UrlAnalysis | FileAnalysis;
  userName?: string;
}

// ── Professional Color Palette ────────────────────────────────
const C = {
  black:        [15,  23,  42]  as [number, number, number],
  darkGrey:     [51,  65,  85]  as [number, number, number],
  midGrey:      [100, 116, 139] as [number, number, number],
  lightGrey:    [226, 232, 240] as [number, number, number],
  veryLight:    [248, 250, 252] as [number, number, number],
  white:        [255, 255, 255] as [number, number, number],
  accent:       [37,  99, 235]  as [number, number, number],
  accentLight:  [219, 234, 254] as [number, number, number],
  danger:       [220,  38,  38]  as [number, number, number],
  dangerLight:  [254, 226, 226] as [number, number, number],
  warning:      [180,  83,   9]  as [number, number, number],
  warningLight: [254, 243, 199] as [number, number, number],
  safe:         [21, 128,  61]  as [number, number, number],
  safeLight:    [220, 252, 231] as [number, number, number],
};

// ── Helper: Sanitize & Format ───────────────────�const getRiskLevel = (score: number) => {
  if (score === 0) return "SAFE";
  if (score <= 10) return "LOW RISK";
  if (score <= 30) return "MODERATE";
  if (score <= 70) return "HIGH RISK";
  return "DANGEROUS";
};

// ── 1. REPORT HEADER ──────────────────────────────────────────
const drawHeader = (doc: any, pageW: number, margin: number) => {
  // Dark Blue Header Banner
  doc.setFillColor(...C.accent);
  doc.rect(0, 0, pageW, 25, 'F');
  
  // Logo
  doc.setFillColor(...C.white);
  doc.circle(margin + 8, 12.5, 7, 'F');
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.accent);
  doc.text('APGS', margin + 8, 13.5, { align: 'center' });
  
  // Header Text
  doc.setFontSize(12); doc.setTextColor(...C.white);
  doc.text('APGS - Advanced Phishing Guard System', margin + 18, 11);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.white);
  doc.text('Security Audit Report', margin + 18, 17);
  
  // Divider
  doc.setDrawColor(...C.white);
  doc.setLineWidth(0.1);
  doc.line(margin + 18, 19, pageW - margin, 19);
  
  doc.setFontSize(8);
  doc.text(`ID: ${Math.random().toString(36).substring(2, 9).toUpperCase()}`, pageW - margin, 17, { align: 'right' });
};

// ── 9. FOOTER ─────────────────────────────────────────────────
const drawFooters = (doc: any, pageW: number, pageH: number, margin: number) => {
  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    // Divider
    doc.setDrawColor(...C.lightGrey); doc.line(margin, pageH - 18, pageW - margin, pageH - 18);
    
    doc.setFontSize(8); doc.setTextColor(...C.midGrey);
    doc.text('APGS — Confidential Security Intelligence', margin, pageH - 12);
    doc.text(`Page ${i} of ${total}`, pageW - margin, pageH - 12, { align: 'right' });
    
    doc.setFontSize(7);
    doc.text('DISCLAIMER: Automated probability-based risk assessment. Results should be verified by a security professional.', margin, pageH - 7);
  }
};

// ── Layout Helpers ────────────────────────────────────────────
const sectionHeader = (doc: any, title: string, x: number, y: number, w: number) => {
  doc.setFillColor(...C.veryLight); doc.rect(x, y, w, 9, 'F');
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.accent);
  doc.text(title.toUpperCase(), x + 4, y + 6);
  return y + 14;
};

const checkPage = (doc: any, y: number, pageH: number, margin: number, pageW: number) => {
  if (y > pageH - 35) {
    doc.addPage();
    drawHeader(doc, pageW, margin);
    return 40;
  }
  return y;
};

// ════════════════════════════════════════════════════════════
//  BUILDER: URL REPORT
// ════════════════════════════════════════════════════════════
const buildURLReport = async (data: PDFReportData) => {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const pW = doc.internal.pageSize.getWidth(), pH = doc.internal.pageSize.getHeight();
  const margin = 20, cw = pW - margin * 2;

  const res = data.result as UrlAnalysis;
  const score = res.score ?? 0;
  const mode = res.mode || 'quick';
  const url = res.url;

  const sLab = getRiskLevel(score);
  let sCol = C.safe, sBg = C.safeLight;
  if (score > 70) { sCol = C.danger; sBg = C.dangerLight; }
  else if (score > 10) { sCol = C.warning; sBg = C.warningLight; }

  drawHeader(doc, pW, margin);
  let y = 38;

  // 2. SCAN INFORMATION
  y = sectionHeader(doc, 'Scan Information', margin, y, cw);
  const info = [
    ['Audit Type', 'URL Threat Detection'],
    ['Analysis Mode', mode === 'deep' ? 'Deep Scan (API + AI)' : 'Quick Scan (AI Only)'],
    ['Target Resource', url],
    ['Detection Engine', res.source || 'APGS Neural-X Engine'],
    ['Timestamp', new Date().toLocaleString()],
  ];

  const labelWidth = 45;
  info.forEach(([k, v], i) => {
    y = checkPage(doc, y, pH, margin, pW);
    if (i % 2 === 0) { doc.setFillColor(...C.veryLight); doc.rect(margin, y - 5, cw, 8, 'F'); }
    
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.midGrey);
    doc.text(`${k}`, margin + 3, y + 1);
    doc.text(':', margin + labelWidth - 5, y + 1);
    
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.darkGrey);
    const sv = doc.splitTextToSize(sanitize(v), cw - labelWidth - 5);
    doc.text(sv, margin + labelWidth, y + 1);
    y += (sv.length * 5) + 3;
  });
  y += 5;

  // 3. RISK SUMMARY
  y = sectionHeader(doc, 'Risk Summary', margin, y, cw);
  doc.setFillColor(...sBg); doc.roundedRect(margin, y, cw, 30, 2, 2, 'F');
  doc.setDrawColor(...sCol); doc.setLineWidth(0.5); doc.roundedRect(margin, y, cw, 30, 2, 2, 'S');
  
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...sCol);
  doc.text('SECURITY VERDICT', margin + 10, y + 10);
  doc.setFontSize(20); doc.text(sLab, margin + 10, y + 21);
  
  // Centered Score Box on right side
  const bx = pW - margin - 35, by = y + 5, bw = 25, bh = 20;
  doc.setFillColor(...sCol); doc.roundedRect(bx, by, bw, bh, 1, 1, 'F');
  doc.setTextColor(...C.white); 
  doc.setFontSize(14); doc.setFont('helvetica', 'bold');
  doc.text(`${score} / 100`, bx + bw/2, by + 12, { align: 'center' });
  
  if (mode === 'deep' && res.vtStats) {
    doc.setFontSize(8); doc.setTextColor(...sCol);
    doc.text(`${res.vtStats.malicious} / ${res.vtStats.total || 90} vendors flagged`, pW - margin - 22.5, y + 28, { align: 'center' });
  }
  y += 40;

  // 4. SCORING BREAKDOWN (Quick Scan Only)
  if (mode === 'quick') {
    y = sectionHeader(doc, 'Scoring Breakdown', margin, y, cw);
    const indicators = [
      ['LENGTH', url.length > 75 ? 'FLAGGED' : 'PASS'],
      ['HAS HTTPS', url.startsWith('https://') ? 'PASS' : 'FLAGGED'],
      ['DOT COUNT', (url.match(/\./g) || []).length > 3 ? 'FLAGGED' : 'PASS'],
      ['HAS IP', /\d+\.\d+\.\d+\.\d+/.test(url) ? 'FLAGGED' : 'PASS'],
      ['HAS SUSPICIOUS WORD', ['login', 'verify', 'update', 'banking', 'secure', 'account'].some(w => url.toLowerCase().includes(w)) ? 'FLAGGED' : 'PASS'],
    ];

    indicators.forEach(([k, v], i) => {
      y = checkPage(doc, y, pH, margin, pW);
      if (i % 2 === 0) { doc.setFillColor(...C.veryLight); doc.rect(margin, y - 4, cw, 7, 'F'); }
      doc.setFontSize(9); doc.setTextColor(...C.darkGrey);
      doc.text(`• ${k}`, margin + 6, y + 1);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...(v === 'FLAGGED' ? C.danger : C.safe));
      doc.text(v, pW - margin - 6, y + 1, { align: 'right' });
      doc.setFont('helvetica', 'normal'); y += 8;
    });

    const keywords = (res.modelAnalysis?.explanations || []).filter(e => e.score > 0.05);
    if (keywords.length > 0) {
      y += 2;
      doc.setFontSize(9); doc.setTextColor(...C.midGrey);
      doc.text('Keyword Analysis:', margin + 4, y);
      y += 7;
      keywords.forEach(kw => {
        y = checkPage(doc, y, pH, margin, pW);
        doc.setTextColor(...C.darkGrey); doc.text(`• Keyword: "${sanitize(kw.word)}"`, margin + 10, y);
        doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.danger);
        doc.text('FLAGGED', pW - margin - 6, y, { align: 'right' });
        doc.setFont('helvetica', 'normal'); y += 7;
      });
    }
    y += 8;
  }

  // 5. THREAT INTELLIGENCE (Deep Scan Only)
  if (mode === 'deep' && res.vtStats) {
    y = checkPage(doc, y, pH, margin, pW);
    y = sectionHeader(doc, 'Threat Intelligence Analysis', margin, y, cw);
    
    const stats = res.vtStats;
    const items = [
      ['Total Analysis Vendors', stats.total || 94],
      ['Confirmed Malicious', stats.malicious],
      ['Suspicious Flagging', stats.suspicious],
      ['Clean / Harmless', stats.harmless],
      ['Undetected', stats.undetected],
    ];

    items.forEach(([k, v], i) => {
      y = checkPage(doc, y, pH, margin, pW);
      if (i % 2 === 0) { doc.setFillColor(...C.veryLight); doc.rect(margin, y - 4, cw, 7, 'F'); }
      doc.setFontSize(9); doc.setTextColor(...C.midGrey);
      doc.text(`• ${k}`, margin + 6, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...((k as string).includes('Malicious') && stats.malicious > 0 ? C.danger : C.darkGrey));
      doc.text(`${v}`, pW - margin - 6, y, { align: 'right' });
      doc.setFont('helvetica', 'normal'); y += 8;
    });
    y += 8;
  }

  // 6. RISK INTERPRETATION
  y = checkPage(doc, y, pH, margin, pW);
  y = sectionHeader(doc, 'Risk Interpretation', margin, y, cw);
  doc.setFontSize(9); doc.setTextColor(...C.darkGrey);
  let interpretation = "";
  if (score > 70) {
    interpretation = "Critical Risk: The analyzed resource exhibits multiple confirmed malicious signatures. Accessing this URL poses a high probability of data theft, credential harvesting, or malware delivery.";
  } else if (score > 30) {
    interpretation = "Elevated Risk: Heuristic anomalies and suspicious patterns detected. While not definitively confirmed as malicious, the structural composition aligns with known phishing methodologies.";
  } else {
    interpretation = "Minimal Risk: No significant threat indicators were identified during the analysis. The resource appears to follow standard safety protocols and lacks recognized malicious features.";
  }
  const sInter = doc.splitTextToSize(interpretation, cw - 10);
  doc.text(sInter, margin + 5, y);
  y += (sInter.length * 6) + 10;

  // 7. RECOMMENDATIONS
  y = checkPage(doc, y, pH, margin, pW);
  y = sectionHeader(doc, 'Actionable Recommendations', margin, y, cw);
  const recs = score > 70 
    ? ['DO NOT interact with this resource or provide any credentials.', 'Immediately blacklist this domain at the network level.', 'Report this incident to your Security Operations Center (SOC).', 'Audit any accounts that may have interacted with this link.'] 
    : score > 30 
    ? ['Proceed with extreme caution and verify source authenticity.', 'Do not enter sensitive information or download attachments.', 'Cross-reference this URL with known official channels.'] 
    : ['This resource appears safe for standard use.', 'Maintain standard security awareness and report future anomalies.', 'Ensure your browser and security extensions are up to date.'];
  
  recs.forEach((r, i) => {
    y = checkPage(doc, y, pH, margin, pW);
    doc.setFontSize(9); doc.setTextColor(...C.darkGrey);
    const lr = doc.splitTextToSize(`${i + 1}. ${r}`, cw - 12);
    doc.text(lr, margin + 6, y);
    y += (lr.length * 6) + 2;
  });

  drawFooters(doc, pW, pH, margin);
  return doc;
};

// ════════════════════════════════════════════════════════════
//  BUILDER: FILE REPORT
// ════════════════════════════════════════════════════════════
const buildFileReport = async (data: PDFReportData) => {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const pW = doc.internal.pageSize.getWidth(), pH = doc.internal.pageSize.getHeight();
  const margin = 20, cw = pW - margin * 2;
  const res = data.result as FileAnalysis;
  const score = res.score ?? 0;

  let sCol = C.safe, sBg = C.safeLight, sLab = "FILE: CLEAN";
  if (score > 70) { sCol = C.danger; sBg = C.dangerLight; sLab = "FILE: MALICIOUS"; }
  else if (score > 30) { sCol = C.warning; sBg = C.warningLight; sLab = "FILE: SUSPICIOUS"; }

  drawHeader(doc, pW, margin);
  let y = 38;

  y = sectionHeader(doc, 'Scan Information', margin, y, cw);
  const info = [['Target File', res.fileName], ['File Size', res.fileSize], ['SHA-256 Hash', res.sha256 || 'N/A']];
  const labelWidth = 45;
  info.forEach(([k, v], i) => {
    y = checkPage(doc, y, pH, margin, pW);
    if (i % 2 === 0) { doc.setFillColor(...C.veryLight); doc.rect(margin, y - 5, cw, 8, 'F'); }
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.midGrey);
    doc.text(`${k}`, margin + 3, y + 1);
    doc.text(':', margin + labelWidth - 5, y + 1);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.darkGrey);
    const sv = doc.splitTextToSize(sanitize(v), cw - labelWidth - 5);
    doc.text(sv, margin + labelWidth, y + 1);
    y += (sv.length * 5) + 3;
  });
  y += 5;

  y = sectionHeader(doc, 'Risk Summary', margin, y, cw);
  doc.setFillColor(...sBg); doc.roundedRect(margin, y, cw, 30, 2, 2, 'F');
  doc.setDrawColor(...sCol); doc.setLineWidth(0.5); doc.roundedRect(margin, y, cw, 30, 2, 2, 'S');
  
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...sCol);
  doc.text('MALWARE VERDICT', margin + 10, y + 10);
  doc.setFontSize(20); doc.text(sLab, margin + 10, y + 21);
  
  const bx = pW - margin - 35, by = y + 5, bw = 25, bh = 20;
  doc.setFillColor(...sCol); doc.roundedRect(bx, by, bw, bh, 1, 1, 'F');
  doc.setTextColor(...C.white); 
  doc.setFontSize(14); doc.setFont('helvetica', 'bold');
  doc.text(`${score}`, bx + bw/2, by + 10, { align: 'center' });
  doc.setFontSize(7); doc.setFont('helvetica', 'normal');
  doc.text('RISK SCORE', bx + bw/2, by + 16, { align: 'center' });
  y += 40;

  y = sectionHeader(doc, 'Threat Intelligence Analysis', margin, y, cw);
  if (res.threats?.length) {
    doc.setFontSize(9); doc.setTextColor(...C.danger);
    res.threats.forEach(t => {
      y = checkPage(doc, y, pH, margin, pW);
      doc.text(`[!] Malware Signature: ${sanitize(t)}`, margin + 6, y);
      y += 8;
    });
  } else {
    doc.setFontSize(9); doc.setTextColor(...C.safe);
    doc.text('✓ No known malware signatures detected.', margin + 6, y);
    y += 10;
  }

  y = sectionHeader(doc, 'Actionable Recommendations', margin, y, cw);
  const fRecs = score > 70 
    ? ['DO NOT open this file on any network-connected device.', 'Quarantine the file immediately to prevent accidental execution.', 'Notify your IT Security administrator about this threat.'] 
    : ['Scan the file with an alternative security provider.', 'Only open in a controlled, sandboxed environment.'];
  
  fRecs.forEach((r, i) => {
    y = checkPage(doc, y, pH, margin, pW);
    doc.setFontSize(9); doc.setTextColor(...C.darkGrey);
    const lr = doc.splitTextToSize(`${i + 1}. ${r}`, cw - 12);
    doc.text(lr, margin + 6, y);
    y += (lr.length * 6) + 2;
  });

  drawFooters(doc, pW, pH, margin);
  return doc;
};

// ════════════════════════════════════════════════════════════
//  EXPORTS
// ════════════════════════════════════════════════════════════
export const generatePDFReport = async (data: PDFReportData): Promise<void> => {
  const doc = data.scanType === 'file' ? await buildFileReport(data) : await buildURLReport(data);
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`APGS_${data.scanType.toUpperCase()}_Audit_${dateStr}.pdf`);
};

export const generatePDFBlob = async (data: PDFReportData): Promise<Blob> => {
  const doc = data.scanType === 'file' ? await buildFileReport(data) : await buildURLReport(data);
  return doc.output('blob');
};

export const downloadReport = generatePDFReport;.darkGrey);
    const lr = doc.splitTextToSize(`${i + 1}. ${r}`, cw - 12);
    doc.text(lr, margin + 6, y);
    y += (lr.length * 6) + 2;
  });

  drawFooters(doc, pW, pH, margin);
  return doc;
};

// ════════════════════════════════════════════════════════════
//  EXPORTS
// ════════════════════════════════════════════════════════════
export const generatePDFReport = async (data: PDFReportData): Promise<void> => {
  const doc = data.scanType === 'file' ? await buildFileReport(data) : await buildURLReport(data);
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`APGS_${data.scanType.toUpperCase()}_Audit_${dateStr}.pdf`);
};

export const generatePDFBlob = async (data: PDFReportData): Promise<Blob> => {
  const doc = data.scanType === 'file' ? await buildFileReport(data) : await buildURLReport(data);
  return doc.output('blob');
};

export const downloadReport = generatePDFReport;