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
const drawHeader = (doc: any, pageW: number, margin: number) => {
  // Dark Blue Header Banner with gradient effect
  doc.setFillColor(...C.brandDark);
  doc.rect(0, 0, pageW, 35, 'F');
  
  // Add subtle lighter accent line at bottom
  doc.setFillColor(...C.accent);
  doc.rect(0, 33, pageW, 2, 'F');
  
  try {
    // Load and add APGS logo image
    const logoUrl = '/apgs-logo.png';
    const logoWidth = 18;
    const logoHeight = 18;
    const logoX = margin + 5;
    const logoY = 8.5;
    
    // Add logo image (will use placeholder circle if image fails)
    doc.addImage(logoUrl, 'PNG', logoX, logoY, logoWidth, logoHeight);
    
    // Header Text - positioned after logo
    const textX = logoX + logoWidth + 8;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.white);
    doc.text('APGS - Advanced Phishing Guard System', textX, 14);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 220, 255); // Light blue-tinted white
    doc.text('Professional Security Audit Report', textX, 21);
    
    // Divider line
    doc.setDrawColor(150, 180, 220);
    doc.setLineWidth(0.3);
    doc.line(textX, 24, pageW - margin, 24);
    
    // Report ID on right side
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 220, 255);
    doc.text(`Report ID: ${Math.random().toString(36).substring(2, 9).toUpperCase()}`, pageW - margin, 21, { align: 'right' });
  } catch (error) {
    // Fallback to circle logo if image fails to load
    console.warn('Logo image not found, using fallback');
    const logoX = margin + 10;
    const logoY = 17.5;
    const logoR = 9;
    doc.setFillColor(...C.white);
    doc.circle(logoX, logoY, logoR, 'F');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.brandDark);
    doc.text('APGS', logoX, logoY + 1.5, { align: 'center' });
    
    const textX = logoX + logoR + 6;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.white);
    doc.text('APGS - Advanced Phishing Guard System', textX, 14);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 220, 255);
    doc.text('Professional Security Audit Report', textX, 21);
    
    doc.setDrawColor(150, 180, 220);
    doc.setLineWidth(0.3);
    doc.line(textX, 24, pageW - margin, 24);
    
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 220, 255);
    doc.text(`Report ID: ${Math.random().toString(36).substring(2, 9).toUpperCase()}`, pageW - margin, 21, { align: 'right' });
  }
};

// ── 9. FOOTER ─────────────────────────────────────────────────
const drawFooters = (doc: any, pageW: number, pageH: number, margin: number) => {
  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    
    // Footer background bar - Professional dark blue (#1E3A8A)
    const footerY = pageH - 20;
    doc.setFillColor(...C.brandDark);
    doc.rect(0, footerY, pageW, 20, 'F');
    
    // Top accent border - lighter blue
    doc.setDrawColor(...C.accent);
    doc.setLineWidth(0.5);
    doc.line(0, footerY, pageW, footerY);
    
    // Footer text - Left side
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.white);
    doc.text('APGS — Confidential Security Intelligence', margin, footerY + 7);
    
    // Footer text - Right side (Page numbers)
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 220, 255); // Light blue-tinted white
    doc.text(`Page ${i} of ${total}`, pageW - margin, footerY + 7, { align: 'right' });
    
    // Disclaimer in smaller font below
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(180, 200, 230); // Muted blue-grey
    doc.text('DISCLAIMER: Automated probability-based risk assessment. Results should be verified by a security professional.', margin, footerY + 14);
  }
};

// ── Layout Helpers ────────────────────────────────────────────
const sectionHeader = (doc: any, title: string, x: number, y: number, w: number) => {
  // Section background
  doc.setFillColor(245, 248, 252);
  doc.rect(x, y, w, 10, 'F');
  
  // Left accent bar
  doc.setFillColor(...C.accent);
  doc.rect(x, y, 3, 10, 'F');
  
  // Section title
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.accent);
  doc.text(title.toUpperCase(), x + 7, y + 7);
  
  return y + 16; // Return next Y position with proper spacing
};

const checkPage = (doc: any, y: number, pageH: number, margin: number, pageW: number) => {
  if (y > pageH - 35) {
    doc.addPage();
    // Redraw the header on new page
    drawHeader(doc, pageW, margin);
    return 45;
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

  drawHeader(doc, pW, margin);
  let y = 38;

  // 2. SCAN INFORMATION
  y = sectionHeader(doc, 'SCAN INFORMATION', margin, y, cw);
  const info = [
    ['Audit Type', 'URL Threat Detection'],
    ['Analysis Mode', mode === 'deep' ? 'Deep Scan' : 'Quick Scan'],
    ['Target Resource', url],
    ['Scan By', 'APGS Security Engine'],
    ['Timestamp', new Date().toLocaleString()],
  ];

  // Calculate max label width for alignment
  const maxLabelWidth = 50;
  const colonX = margin + maxLabelWidth;
  const valueX = colonX + 5;
  
  info.forEach(([k, v], i) => {
    y = checkPage(doc, y, pH, margin, pW);
    
    // Alternating row background
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 5, cw, 9, 'F');
    }
    
    // Label (bold)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.darkGrey);
    doc.text(k, margin + 4, y);
    
    // Colon (aligned)
    doc.text(':', colonX - 2, y);
    
    // Value (normal)
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.black);
    const valueText = sanitize(v);
    const sv = doc.splitTextToSize(valueText, cw - (valueX - margin) - 4);
    doc.text(sv, valueX, y);
    
    // Move to next row with consistent spacing
    y += Math.max(sv.length * 5, 9) + 2;
  });
  y += 6;

  // 3. RISK SUMMARY (DYNAMIC)
  y = sectionHeader(doc, 'RISK SUMMARY', margin, y, cw);
  
  // Risk summary box with proper styling
  doc.setFillColor(...sBg);
  doc.roundedRect(margin, y, cw, 28, 2, 2, 'F');
  doc.setDrawColor(...sCol);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, y, cw, 28, 2, 2, 'S');
  
  // Risk Level label and value
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...sCol);
  doc.text('RISK LEVEL', margin + 10, y + 9);
  
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(sLab, margin + 10, y + 21);
  
  // Centered Score Box on right side
  const bx = pW - margin - 40;
  const by = y + 4;
  const bw = 30;
  const bh = 20;
  doc.setFillColor(...sCol);
  doc.roundedRect(bx, by, bw, bh, 2, 2, 'F');
  doc.setTextColor(...C.white); 
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`${score}`, bx + bw/2, by + 9, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('/ 100', bx + bw/2, by + 15, { align: 'center' });
  
  // Vendor info for deep scan
  if (mode === 'deep' && res.vtStats) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...sCol);
    const totalVendors = res.vtStats.malicious + res.vtStats.suspicious + res.vtStats.harmless + res.vtStats.undetected;
    doc.text(`${res.vtStats.malicious} / ${totalVendors} vendors flagged this resource`, bx + bw/2, y + 27, { align: 'center' });
  }
  y += 36;

  // 4. SCORING BREAKDOWN
  // For Quick Scan: AI indicators only
  // For Deep Scan: Combined AI + API analysis
  y = sectionHeader(doc, 'SCORING BREAKDOWN', margin, y, cw);
  
  if (mode === 'quick') {
    // Quick Scan: URL indicators only
    const indicators = [
      ['LENGTH', url.length > 75 ? 'FLAGGED' : 'PASS'],
      ['HAS HTTPS', url.startsWith('https://') ? 'PASS' : 'FLAGGED'],
      ['DOT COUNT', (url.match(/\./g) || []).length > 3 ? 'FLAGGED' : 'PASS'],
      ['HAS IP', /\d+\.\d+\.\d+\.\d+/.test(url) ? 'FLAGGED' : 'PASS'],
      ['HAS SUSPICIOUS WORD', ['login', 'verify', 'update', 'banking', 'secure', 'account'].some(w => url.toLowerCase().includes(w)) ? 'FLAGGED' : 'PASS'],
    ];

    indicators.forEach(([k, v], i) => {
      y = checkPage(doc, y, pH, margin, pW);
      
      // Alternating row background
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y - 4, cw, 8, 'F');
      }
      
      // Indicator label (bold)
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.darkGrey);
      doc.text(`• ${k}`, margin + 6, y + 1);
      
      // Status value (bold with color)
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...(v === 'FLAGGED' ? C.danger : C.safe));
      doc.text(v, pW - margin - 6, y + 1, { align: 'right' });
      
      doc.setFont('helvetica', 'normal');
      y += 8;
    });

    // Keyword Analysis section
    const keywords = (res.modelAnalysis?.explanations || []).filter(e => e.score > 0.05);
    if (keywords.length > 0) {
      y += 5;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.accent);
      doc.text('KEYWORD ANALYSIS', margin + 4, y);
      y += 8;
      
      keywords.forEach(kw => {
        y = checkPage(doc, y, pH, margin, pW);
        
        // Keyword label
        doc.setTextColor(...C.darkGrey);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.text(`• Keyword: ${sanitize(kw.word)}`, margin + 10, y);
        
        // Status
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(...C.danger);
        doc.text('FLAGGED', pW - margin - 6, y, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        y += 7;
      });
    }
    y += 8;
  } else if (mode === 'deep') {
    // Deep Scan: Combined AI + API Scoring Breakdown
    
    // AI Analysis - URL Indicators
    const urlIndicators = [
      ['LENGTH', url.length > 75 ? 'FLAGGED' : 'PASS'],
      ['HAS HTTPS', url.startsWith('https://') ? 'PASS' : 'FLAGGED'],
      ['DOT COUNT', (url.match(/\./g) || []).length > 3 ? 'FLAGGED' : 'PASS'],
      ['HAS IP', /\d+\.\d+\.\d+\.\d+/.test(url) ? 'FLAGGED' : 'PASS'],
      ['HAS SUSPICIOUS WORD', ['login', 'verify', 'update', 'banking', 'secure', 'account'].some(w => url.toLowerCase().includes(w)) ? 'FLAGGED' : 'PASS'],
    ];

    urlIndicators.forEach(([k, v], i) => {
      y = checkPage(doc, y, pH, margin, pW);
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y - 4, cw, 8, 'F');
      }
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.darkGrey);
      doc.text(`• ${k}`, margin + 6, y + 1);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...(v === 'FLAGGED' ? C.danger : C.safe));
      doc.text(v, pW - margin - 6, y + 1, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      y += 8;
    });

    // Keyword Analysis
    const keywords = (res.modelAnalysis?.explanations || []).filter(e => e.score > 0.05);
    if (keywords.length > 0) {
      y += 5;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.accent);
      doc.text('Keyword Analysis:', margin + 4, y);
      y += 8;
      
      keywords.forEach(kw => {
        y = checkPage(doc, y, pH, margin, pW);
        doc.setTextColor(...C.darkGrey);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.text(`• Keyword: ${sanitize(kw.word)}`, margin + 10, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.danger);
        doc.text('FLAGGED', pW - margin - 6, y, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        y += 7;
      });
      y += 4;
    }

    // External Threat Signals
    if (res.vtStats && !res.apiUnavailable) {
      y += 6;
      
      // Check if we need a new page for the entire API section
      if (y > pH - 80) {
        doc.addPage();
        drawHeader(doc, pW, margin);
        y = 45;
      }
      
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
      
      apiSignals.forEach(([k, v], i) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.darkGrey);
        doc.text(`• ${k}`, margin + 6, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...(v === 'FLAGGED' ? C.danger : C.safe));
        doc.text(v, pW - margin - 6, y, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        y += 9;
      });
      
      y += 4;
    }

    // FINAL DECISION SIGNAL - Compact single-line format
    y += 6;
    
    // Check if we need a new page
    if (y > pH - 25) {
      doc.addPage();
      drawHeader(doc, pW, margin);
      y = 45;
    }
    
    const riskLevel = getRiskLevel(score);
    let riskColor = C.safe;
    
    if (riskLevel === 'DANGEROUS') {
      riskColor = C.danger;
    } else if (riskLevel === 'HIGH RISK') {
      riskColor = [255, 140, 0] as [number, number, number]; // Orange
    } else if (riskLevel === 'MODERATE' || riskLevel === 'LOW RISK') {
      riskColor = C.warning;
    }
    
    // Single-line format: "FINAL VERDICT: [RISK_LEVEL]"
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.accent);
    doc.text('FINAL VERDICT:', margin + 6, y);
    
    // Risk level (right-aligned, color-coded)
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...riskColor);
    doc.text(riskLevel, pW - margin - 6, y, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    y += 12;
  }

  // 5. THREAT INTELLIGENCE (Deep Scan Only)
  if (mode === 'deep' && res.vtStats) {
    y = checkPage(doc, y, pH, margin, pW);
    y = sectionHeader(doc, 'THREAT INTELLIGENCE', margin, y, cw);
    
    const stats = res.vtStats;
    // Calculate total dynamically from actual API response
    const totalVendors = stats.malicious + stats.suspicious + stats.harmless + stats.undetected;
    
    const items = [
      ['Vendors Flagged', `${stats.malicious + stats.suspicious} / ${totalVendors}`],
      ['Malicious', `${stats.malicious}`],
      ['Suspicious', `${stats.suspicious}`],
      ['Harmless', `${stats.harmless}`],
      ['Undetected', `${stats.undetected}`],
    ];

    items.forEach(([k, v], i) => {
      y = checkPage(doc, y, pH, margin, pW);
      
      // Alternating row background
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y - 4, cw, 8, 'F');
      }
      
      // Label (bold)
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.darkGrey);
      doc.text(`• ${k}`, margin + 6, y);
      
      // Value (bold with conditional color)
      doc.setFont('helvetica', 'bold');
      const isMalicious = (k as string).includes('Malicious') && stats.malicious > 0;
      doc.setTextColor(...(isMalicious ? C.danger : C.black));
      doc.setFontSize(10);
      doc.text(`${v}`, pW - margin - 6, y, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      y += 8;
    });
    y += 8;
  }

  // 6. RISK INTERPRETATION
  y = checkPage(doc, y, pH, margin, pW);
  y = sectionHeader(doc, 'RISK INTERPRETATION', margin, y, cw);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.darkGrey);
  
  let interpretation = "";
  if (score === 0) {
    interpretation = "SAFE: The analyzed resource shows no threat indicators. The URL appears legitimate and follows standard safety protocols.";
  } else if (score <= 10) {
    interpretation = "LOW RISK: Minor anomalies detected. A small number of heuristic indicators flagged this URL. Proceed with standard caution.";
  } else if (score <= 30) {
    interpretation = "MODERATE: Some suspicious patterns detected. While not definitively malicious, the URL exhibits characteristics that warrant verification before interaction.";
  } else if (score <= 70) {
    interpretation = "HIGH RISK: Significant threat indicators detected. Multiple heuristic anomalies and suspicious patterns align with known phishing methodologies. Avoid unless verified.";
  } else {
    interpretation = "DANGEROUS: Critical threat confirmed. The analyzed resource exhibits multiple confirmed malicious signatures. Accessing this URL poses a high probability of data theft, credential harvesting, or malware delivery. DO NOT PROCEED.";
  }
  
  const sInter = doc.splitTextToSize(interpretation, cw - 12);
  doc.text(sInter, margin + 6, y);
  y += (sInter.length * 5.5) + 12;

  // 7. RECOMMENDATIONS
  y = checkPage(doc, y, pH, margin, pW);
  y = sectionHeader(doc, 'ACTIONABLE RECOMMENDATIONS', margin, y, cw);
  
  let recs: string[];
  if (score === 0) {
    recs = [
      'This resource appears safe for standard use.',
      'Maintain standard security awareness and report future anomalies.',
      'Ensure your browser and security extensions are up to date.',
    ];
  } else if (score <= 10) {
    recs = [
      'Minimal risk detected — a small number of indicators flagged this URL.',
      'Verify the source before sharing personal information.',
      'Use caution if prompted to download files or enter credentials.',
    ];
  } else if (score <= 30) {
    recs = [
      'Moderate risk — suspicious characteristics detected.',
      'Do not enter sensitive information without further verification.',
      'Consider using additional security tools for confirmation.',
      'Monitor your accounts for suspicious activity.',
    ];
  } else if (score <= 70) {
    recs = [
      'High risk detected — multiple threat indicators found.',
      'Avoid interacting with this URL unless you are certain of its legitimacy.',
      'Do NOT enter credentials or personal information.',
      'Report to your IT or security team.',
    ];
  } else {
    recs = [
      'DO NOT interact with this resource or provide any credentials.',
      'Immediately blacklist this domain at the network level.',
      'Report this incident to your Security Operations Center (SOC).',
      'Audit any accounts that may have interacted with this link.',
    ];
  }
  
  recs.forEach((r, i) => {
    y = checkPage(doc, y, pH, margin, pW);
    
    // Alternating background
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

export const downloadReport = generatePDFReport;
