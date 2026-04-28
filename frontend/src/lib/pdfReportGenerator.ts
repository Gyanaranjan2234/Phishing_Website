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
  brandDark:    [30,  58, 138]  as [number, number, number], // #1E3A8A - Professional dark blue
  brandLight:   [234, 242, 255] as [number, number, number], // #EAF2FF - Light blue
  danger:       [220,  38,  38]  as [number, number, number],
  dangerLight:  [254, 226, 226] as [number, number, number],
  warning:      [180,  83,   9]  as [number, number, number],
  warningLight: [254, 243, 199] as [number, number, number],
  safe:         [21, 128,  61]  as [number, number, number],
  safeLight:    [220, 252, 231] as [number, number, number],
};

// ── Helper: Sanitize & Format ─────────────────────────────────
const sanitize = (str: string) => str.replace(/[^\x20-\x7E]/g, '').substring(0, 200);

const getRiskLevel = (score: number) => {
  if (score === 0) return "SAFE";
  if (score <= 10) return "LOW RISK";
  if (score <= 30) return "MODERATE";
  if (score <= 70) return "HIGH RISK";
  return "DANGEROUS";
};

// ── 1. REPORT HEADER ──────────────────────────────────────────
const drawHeader = (doc: any, pageW: number, margin: number, isFirstPage: boolean = false) => {
  // Dark Blue Header Banner for all pages
  doc.setFillColor(...C.brandDark);
  doc.rect(0, 0, pageW, 35, 'F');
  
  // Add subtle lighter accent line at bottom
  doc.setFillColor(...C.accent);
  doc.rect(0, 33, pageW, 2, 'F');

  try {
    const logoUrl = '/apgs-logo.png';
    const logoWidth = 18;
    const logoHeight = 18;
    const logoX = margin;
    const logoY = 8.5; // Same Y for both pages — vertically centered in the 35px banner
    
    // Branding text color consistently for the banner
    const textColor = C.white;
    const subColor = [200, 220, 255];

    // Add logo image
    doc.addImage(logoUrl, 'PNG', logoX, logoY, logoWidth, logoHeight);
    
    // Header Text — same offsets as page 2 for consistent alignment
    const textX = logoX + logoWidth + 8;
    doc.setFontSize(isFirstPage ? 22 : 16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textColor);
    doc.text('APGS Security Intelligence', textX, logoY + 7);
    
    doc.setFontSize(isFirstPage ? 12 : 10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...subColor);
    doc.text('Advanced Phishing Guard System - Audit Report', textX, logoY + 14);
    
    if (!isFirstPage) {
      doc.setFontSize(8);
      doc.setTextColor(200, 220, 255);
      doc.text(`ID: ${Math.random().toString(36).substring(2, 8).toUpperCase()}`, pageW - margin, 21, { align: 'right' });
    }
  } catch (error) {
    const logoX = margin;
    const logoY = isFirstPage ? 20 : 15;
    const textColor = isFirstPage ? C.brandDark : C.white;
    doc.setFontSize(isFirstPage ? 22 : 16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textColor);
    doc.text('APGS SECURITY REPORT', logoX, logoY);
  }
};

// ── 9. FOOTER ─────────────────────────────────────────────────
const drawFooters = (doc: any, pageW: number, pageH: number, margin: number) => {
  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    const footerY = pageH - 20;
    doc.setFillColor(...C.brandDark);
    doc.rect(0, footerY, pageW, 20, 'F');
    doc.setDrawColor(...C.accent);
    doc.setLineWidth(0.5);
    doc.line(0, footerY, pageW, footerY);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.white);
    doc.text('APGS — Confidential Security Intelligence', margin, footerY + 8);
    doc.setTextColor(200, 220, 255);
    doc.text(`Page ${i} of ${total}`, pageW - margin, footerY + 8, { align: 'right' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(180, 200, 230);
    doc.text('Automated security assessment. Results should be verified by a professional.', margin, footerY + 14);
  }
};

// ── Layout Helpers ────────────────────────────────────────────
const FOOTER_RESERVED = 30;
const HEADER_SPACE = 45;

const sectionHeader = (doc: any, title: string, x: number, y: number, w: number) => {
  doc.setFillColor(245, 248, 252);
  doc.rect(x, y, w, 10, 'F');
  doc.setFillColor(...C.accent);
  doc.rect(x, y, 3, 10, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.accent);
  doc.text(title.toUpperCase(), x + 7, y + 7);
  return y + 15;
};

const checkPage = (doc: any, y: number, pageH: number, margin: number, pageW: number, requiredSpace: number = 10) => {
  if (y + requiredSpace > pageH - FOOTER_RESERVED) {
    doc.addPage();
    drawHeader(doc, pageW, margin, false);
    return HEADER_SPACE;
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
  else if (score > 30) { sCol = C.warning; sBg = C.warningLight; }
  else if (score > 0) { sCol = C.warning; sBg = C.warningLight; }

  // 1. PAGE 1 HEADER (Title focused)
  drawHeader(doc, pW, margin, true);
  let y = 50;

  // 2. SCAN INFORMATION
  y = sectionHeader(doc, 'SCAN INFORMATION', margin, y, cw);
  const info = [
    ['Audit Type', 'URL Threat Detection'],
    ['Analysis Mode', mode === 'deep' ? 'Deep Scan' : 'Quick Scan'],
    ['Target Resource', url],
    ['Scan By', 'APGS Security Engine'],
    ['Timestamp', new Date().toLocaleString()],
  ];

  const maxLabelWidth = 50;
  const colonX = margin + maxLabelWidth;
  const valueX = colonX + 5;
  
  info.forEach(([k, v], i) => {
    y = checkPage(doc, y, pH, margin, pW, 12);
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 5, cw, 9, 'F');
    }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.darkGrey);
    doc.text(k, margin + 4, y);
    doc.text(':', colonX - 2, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.black);
    const valueText = sanitize(v);
    const sv = doc.splitTextToSize(valueText, cw - (valueX - margin) - 4);
    doc.text(sv, valueX, y);
    y += Math.max(sv.length * 5, 9) + 2;
  });
  y += 5;

  // 3. RISK SUMMARY
  y = checkPage(doc, y, pH, margin, pW, 45);
  y = sectionHeader(doc, 'RISK SUMMARY', margin, y, cw);
  doc.setFillColor(...sBg);
  doc.roundedRect(margin, y, cw, 28, 2, 2, 'F');
  doc.setDrawColor(...sCol);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, y, cw, 28, 2, 2, 'S');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...sCol);
  doc.text('RISK LEVEL', margin + 10, y + 9);
  doc.setFontSize(20);
  doc.text(sLab, margin + 10, y + 21);
  const bx = pW - margin - 40;
  const by = y + 4;
  const bw = 30;
  const bh = 20;
  doc.setFillColor(...sCol);
  doc.roundedRect(bx, by, bw, bh, 2, 2, 'F');
  doc.setTextColor(...C.white); 
  doc.setFontSize(14);
  doc.text(`${score}`, bx + bw/2, by + 9, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('/ 100', bx + bw/2, by + 15, { align: 'center' });
  if (mode === 'deep' && res.vtStats) {
    doc.setFontSize(8.5);
    doc.setTextColor(...sCol);
    const totalVendors = res.vtStats.malicious + res.vtStats.suspicious + res.vtStats.harmless + res.vtStats.undetected;
    doc.text(`${res.vtStats.malicious} / ${totalVendors} vendors flagged`, bx + bw/2, y + 27, { align: 'center' });
  }
  y += 38;

  // 4. SCORING BREAKDOWN
  y = checkPage(doc, y, pH, margin, pW, 30);
  y = sectionHeader(doc, 'SCORING BREAKDOWN', margin, y, cw);
  if (mode === 'quick') {
    const indicators = [
      ['LENGTH', url.length > 75 ? 'FLAGGED' : 'PASS'],
      ['HAS HTTPS', url.startsWith('https://') ? 'PASS' : 'FLAGGED'],
      ['DOT COUNT', (url.match(/\./g) || []).length > 3 ? 'FLAGGED' : 'PASS'],
      ['HAS IP', /\d+\.\d+\.\d+\.\d+/.test(url) ? 'FLAGGED' : 'PASS'],
      ['SUSPICIOUS WORD', ['login', 'verify', 'update', 'banking', 'secure', 'account'].some(w => url.toLowerCase().includes(w)) ? 'FLAGGED' : 'PASS'],
    ];
    indicators.forEach(([k, v], i) => {
      y = checkPage(doc, y, pH, margin, pW, 10);
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y - 4, cw, 8, 'F');
      }
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.darkGrey);
      doc.text(`• ${k}`, margin + 6, y + 1);
      doc.setTextColor(...(v === 'FLAGGED' ? C.danger : C.safe));
      doc.text(v, pW - margin - 6, y + 1, { align: 'right' });
      y += 8;
    });

    const keywords = (res.modelAnalysis?.explanations || []).filter(e => e.score > 0.05);
    if (keywords.length > 0) {
      y = checkPage(doc, y, pH, margin, pW, 20);
      y += 5;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.accent);
      doc.text('KEYWORD ANALYSIS', margin + 4, y);
      y += 8;
      keywords.forEach(kw => {
        y = checkPage(doc, y, pH, margin, pW, 8);
        doc.setTextColor(...C.darkGrey);
        doc.setFont('helvetica', 'normal');
        doc.text(`• Keyword: ${sanitize(kw.word)}`, margin + 10, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.danger);
        doc.text('FLAGGED', pW - margin - 6, y, { align: 'right' });
        y += 7;
      });
    }
    y += 8;
  } else if (mode === 'deep') {
    const urlIndicators = [
      ['LENGTH', url.length > 75 ? 'FLAGGED' : 'PASS'],
      ['HAS HTTPS', url.startsWith('https://') ? 'PASS' : 'FLAGGED'],
      ['DOT COUNT', (url.match(/\./g) || []).length > 3 ? 'FLAGGED' : 'PASS'],
      ['HAS IP', /\d+\.\d+\.\d+\.\d+/.test(url) ? 'FLAGGED' : 'PASS'],
      ['SUSPICIOUS WORD', ['login', 'verify', 'update', 'banking', 'secure', 'account'].some(w => url.toLowerCase().includes(w)) ? 'FLAGGED' : 'PASS'],
    ];
    urlIndicators.forEach(([k, v], i) => {
      y = checkPage(doc, y, pH, margin, pW, 10);
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y - 4, cw, 8, 'F');
      }
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.darkGrey);
      doc.text(`• ${k}`, margin + 6, y + 1);
      doc.setTextColor(...(v === 'FLAGGED' ? C.danger : C.safe));
      doc.text(v, pW - margin - 6, y + 1, { align: 'right' });
      y += 8;
    });

    const keywords = (res.modelAnalysis?.explanations || []).filter(e => e.score > 0.05);
    if (keywords.length > 0) {
      y = checkPage(doc, y, pH, margin, pW, 20);
      y += 5;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.accent);
      doc.text('Keyword Analysis:', margin + 4, y);
      y += 8;
      keywords.forEach(kw => {
        y = checkPage(doc, y, pH, margin, pW, 8);
        doc.setTextColor(...C.darkGrey);
        doc.setFont('helvetica', 'normal');
        doc.text(`• Keyword: ${sanitize(kw.word)}`, margin + 10, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.danger);
        doc.text('FLAGGED', pW - margin - 6, y, { align: 'right' });
        y += 7;
      });
      y += 4;
    }

    if (res.vtStats && !res.apiUnavailable) {
      y = checkPage(doc, y, pH, margin, pW, 40);
      y += 6;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.accent);
      doc.text('External Threat Signals', margin + 4, y);
      y += 10;
      const stats = res.vtStats;
      const apiSignals = [
        ['Malicious detections', stats.malicious >= 1 ? 'FLAGGED' : 'PASS'],
        ['Suspicious detections', stats.suspicious >= 1 ? 'FLAGGED' : 'PASS'],
        ['Vendor consensus', (stats.malicious + stats.suspicious) > 0 ? 'FLAGGED' : 'PASS'],
      ];
      apiSignals.forEach(([k, v]) => {
        y = checkPage(doc, y, pH, margin, pW, 10);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.darkGrey);
        doc.text(`• ${k}`, margin + 6, y);
        doc.setTextColor(...(v === 'FLAGGED' ? C.danger : C.safe));
        doc.text(v, pW - margin - 6, y, { align: 'right' });
        y += 9;
      });
      y += 4;
    }

    y = checkPage(doc, y, pH, margin, pW, 20);
    y += 6;
    const riskLevel = getRiskLevel(score);
    let riskColor = C.safe;
    if (riskLevel === 'DANGEROUS') riskColor = C.danger;
    else if (riskLevel === 'HIGH RISK') riskColor = [255, 140, 0] as [number, number, number];
    else if (riskLevel === 'MODERATE' || riskLevel === 'LOW RISK') riskColor = C.warning;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.accent);
    doc.text('FINAL VERDICT:', margin + 6, y);
    doc.setTextColor(...riskColor);
    doc.text(riskLevel, pW - margin - 6, y, { align: 'right' });
    y += 12;
  }

  if (mode === 'deep' && res.vtStats) {
    y = checkPage(doc, y, pH, margin, pW, 50);
    y = sectionHeader(doc, 'THREAT INTELLIGENCE', margin, y, cw);
    const stats = res.vtStats;
    const totalVendors = stats.malicious + stats.suspicious + stats.harmless + stats.undetected;
    const items = [
      ['Vendors Flagged', `${stats.malicious + stats.suspicious} / ${totalVendors}`],
      ['Malicious', `${stats.malicious}`],
      ['Suspicious', `${stats.suspicious}`],
      ['Harmless', `${stats.harmless}`],
      ['Undetected', `${stats.undetected}`],
    ];
    items.forEach(([k, v], i) => {
      y = checkPage(doc, y, pH, margin, pW, 10);
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y - 4, cw, 8, 'F');
      }
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.darkGrey);
      doc.text(`• ${k}`, margin + 6, y);
      const isMalicious = (k as string).includes('Malicious') && stats.malicious > 0;
      doc.setTextColor(...(isMalicious ? C.danger : C.black));
      doc.text(`${v}`, pW - margin - 6, y, { align: 'right' });
      y += 8;
    });
    y += 8;
  }

  y = checkPage(doc, y, pH, margin, pW, 40);
  y = sectionHeader(doc, 'RISK INTERPRETATION', margin, y, cw);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.darkGrey);
  let interpretation = "";
  let warningLine = "";
  if (score === 0) {
    interpretation = "SAFE: No threat indicators were detected during the comprehensive analysis of this URL. Our heuristic engine and threat intelligence databases confirm that the target resource aligns with standard security protocols. No malicious redirects, phishing patterns, or obfuscated scripts were identified. The resource is considered legitimate for standard interaction.";
  } else if (score <= 10) {
    interpretation = "LOW RISK: Minor anomalies were detected in the URL structure or metadata. While not explicitly malicious, these indicators suggest the need for basic situational awareness. The target exhibits minimal heuristic variance from known safe patterns. Proceed with caution and verify the source if prompted for any non-sensitive interaction.";
  } else if (score <= 30) {
    interpretation = "MODERATE: Suspicious patterns were identified that deviate from standard legitimate behavior. This includes potential domain age issues, suspicious character encoding, or minor flags from secondary security vendors. These indicators are often observed in staged phishing campaigns. Manual verification of the source is strongly recommended.";
  } else if (score <= 70) {
    interpretation = "HIGH RISK: Significant threat indicators were detected, including high-confidence phishing heuristics and matches against known malicious patterns. The URL exhibits structural traits commonly associated with credential harvesting, unauthorized redirects, or social engineering tactics. Interaction with this resource poses a substantial risk to data security.";
  } else {
    interpretation = "DANGEROUS: Critical threat confirmed. Multiple high-severity malicious signatures were identified by both our AI heuristic engine and external threat intelligence partners. This resource is definitively associated with active phishing campaigns or malware delivery. Any interaction will likely result in immediate compromise.";
    warningLine = "ACCESS IS STRONGLY PROHIBITED.";
  }
  
  doc.setFont('helvetica', 'normal');
  const sInter = doc.splitTextToSize(interpretation, cw - 12);
  doc.text(sInter, margin + 6, y);
  y += (sInter.length * 5.5) + 2;

  if (warningLine) {
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text(warningLine, margin + 6, y);
    doc.setFont('helvetica', 'normal');
    y += 4;
  }
  y += 12;

  y = checkPage(doc, y, pH, margin, pW, 40);
  y = sectionHeader(doc, 'ACTIONABLE RECOMMENDATIONS', margin, y, cw);
  let recs: string[] = [];
  if (score === 0) {
    recs = [
      'Verified Safe Interaction: You may proceed with normal usage of this resource. The scan confirms no malicious components are currently present.',
      'Continuous Monitoring: Maintain standard security awareness. Always ensure the destination URL matches the intended service before proceeding.',
      'Endpoint Protection: Ensure your security software and browser extensions are active to provide real-time protection against evolving threats.'
    ];
  } else if (score <= 10) {
    recs = [
      'Source Verification: Confirm the identity of the sender or the referring resource before entering any non-critical information on this page.',
      'Caution with Data: Avoid entering sensitive credentials or financial information. The low-level anomalies detected may indicate a sophisticated spoofing attempt.',
      'Heuristic Watch: Be alert for unexpected pop-ups, forced downloads, or requests for system permissions that usually follow low-risk indicators.'
    ];
  } else if (score <= 30) {
    recs = [
      'Strict Credential Protection: Do not enter usernames, passwords, or MFA codes. The suspicious patterns detected are common indicators of early-stage phishing.',
      'Cross-Reference Source: Independently verify the website by manually typing the official domain into your browser rather than following the scanned link.',
      'Security Tool Validation: Use an alternative security provider or contact your internal IT support to validate the safety of this resource.'
    ];
  } else if (score <= 70) {
    recs = [
      'Immediate Interaction Cease: Stop all activity on the target site. The high-confidence heuristics suggest a malicious intent designed for data harvesting.',
      'Internal Incident Reporting: Notify your organization\'s security team or IT helpdesk. Providing the Report ID will assist them in blocking this threat globally.',
      'Network Isolation: If possible, disconnect from sensitive VPNs or internal networks before further investigating this resource in a sandbox environment.',
      'Browser Cache Clearance: Clear your browser cache and active sessions to mitigate the risk of cross-site scripting or session hijacking.'
    ];
  } else {
    recs = [
      'ABSOLUTE PROHIBITION: Do not interact with this resource. The identified signatures confirm an active threat that will likely lead to system compromise.',
      'Domain Level Blocking: Blacklist this domain and its associated IP addresses at the organizational firewall to prevent accidental access by other users.',
      'Immediate Account Audit: If you have entered credentials, change them immediately from a known safe device and enable Multi-Factor Authentication (MFA).',
      'Security Incident Escalation: Treat this as a confirmed security event. Escalate to your SOC for a full forensic review of your endpoint for potential malware.'
    ];
  }
  recs.forEach((r, i) => {
    y = checkPage(doc, y, pH, margin, pW, 12);
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 4, cw, 8, 'F');
    }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.darkGrey);
    const lr = doc.splitTextToSize(`${i + 1}. ${r}`, cw - 14);
    doc.text(lr, margin + 7, y);
    y += (lr.length * 6) + 3;
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

  // 1. PAGE 1 HEADER
  drawHeader(doc, pW, margin, true);
  let y = 50;

  y = sectionHeader(doc, 'SCAN INFORMATION', margin, y, cw);
  const info = [['Target File', res.fileName], ['File Size', res.fileSize], ['SHA-256 Hash', res.sha256 || 'N/A']];
  const labelWidth = 45;
  info.forEach(([k, v], i) => {
    y = checkPage(doc, y, pH, margin, pW, 12);
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

  y = checkPage(doc, y, pH, margin, pW, 45);
  y = sectionHeader(doc, 'RISK SUMMARY', margin, y, cw);
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

  y = checkPage(doc, y, pH, margin, pW, 30);
  y = sectionHeader(doc, 'THREAT INTELLIGENCE ANALYSIS', margin, y, cw);
  if (res.threats?.length) {
    doc.setFontSize(9); doc.setTextColor(...C.danger);
    res.threats.forEach(t => {
      y = checkPage(doc, y, pH, margin, pW, 10);
      doc.text(`[!] Malware Signature: ${sanitize(t)}`, margin + 6, y);
      y += 8;
    });
  } else {
    doc.setFontSize(9); doc.setTextColor(...C.safe);
    doc.text('✓ No known malware signatures detected.', margin + 6, y);
    y += 10;
  }

  y = checkPage(doc, y, pH, margin, pW, 40);
  y = sectionHeader(doc, 'RISK INTERPRETATION', margin, y, cw);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.darkGrey);
  
  let fInter = "";
  let fWarning = "";
  if (score === 0) {
    fInter = "CLEAN: No malicious signatures or suspicious artifacts were detected in the file's static or behavioral analysis. The file hash does not match any known malware in global threat intelligence databases. It is considered safe for intended use within the environment.";
  } else if (score <= 30) {
    fInter = "SUSPICIOUS: The file exhibits behaviors or structural traits that are frequently associated with unwanted applications or low-risk threats. While no definitive malware signatures were found, the heuristic variance suggests a need for controlled execution and manual review.";
  } else {
    fInter = "MALICIOUS: Critical threat confirmed. The file contains signatures or behavioral patterns definitively identified as malware, such as trojans, ransomware, or spyware. Execution of this file will result in unauthorized system access, data exfiltration, or permanent file damage.";
    fWarning = "ACCESS IS STRONGLY PROHIBITED.";
  }
  
  doc.setFont('helvetica', 'normal');
  const sFInter = doc.splitTextToSize(fInter, cw - 12);
  doc.text(sFInter, margin + 6, y);
  y += (sFInter.length * 5.5) + 2;

  if (fWarning) {
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text(fWarning, margin + 6, y);
    doc.setFont('helvetica', 'normal');
    y += 4;
  }
  y += 12;

  y = checkPage(doc, y, pH, margin, pW, 40);
  y = sectionHeader(doc, 'ACTIONABLE RECOMMENDATIONS', margin, y, cw);
  const fRecs = score === 0 
    ? [
        'Safe Execution: The file is verified as clean and may be executed or shared as needed. Maintain standard file-handling precautions.',
        'Version Verification: Ensure the file was obtained from a trusted source. Even safe files can be replaced by malicious versions if the source is compromised.',
        'Standard Backup: Always maintain updated backups of your data before executing any new applications, even those verified as safe.'
      ] 
    : score <= 30
    ? [
        'Sandboxed Execution: If execution is necessary, use an isolated virtual environment or sandbox to prevent potential impact on the host system.',
        'Behavioral Monitoring: Monitor system resource usage and network traffic immediately after execution for any unauthorized connections or file modifications.',
        'Security Team Review: Submit the file to your security department for an in-depth behavioral analysis before deploying it to production systems.'
      ]
    : [
        'IMMEDIATE QUARANTINE: Do not open or execute this file. Move it to a secure, isolated directory or delete it immediately to prevent accidental activation.',
        'Endpoint Threat Scan: Perform a full system scan using your primary antivirus provider to ensure no secondary infections or persistence mechanisms are present.',
        'SOC Notification: Report this threat to your Security Operations Center. Provide the file hash and source to assist in organization-wide remediation.',
        'Access Control Audit: Review how the file was obtained and audit the source (email, download link, or USB) to identify the initial point of entry.'
      ];
  
  fRecs.forEach((r, i) => {
    y = checkPage(doc, y, pH, margin, pW, 12);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.darkGrey);
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
