import type { UrlAnalysis, FileAnalysis, PasswordResult, BreachResult } from './interfaces';
import {
  calculateFinalVerdict,
  calculateAdjustedScore,
  getVerdictDescription,
  getRecommendations,
  verdictToSeverity,
  type RiskFlags,
  type FinalVerdict,
} from './riskDecisionLogic';

export interface PDFReportData {
  scanType: 'url' | 'file' | 'password' | 'email';
  target: string;
  result: UrlAnalysis | FileAnalysis | PasswordResult | BreachResult;
  userName?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Map all 5 verdict tiers to RGB colors */
function getVerdictColors(verdict: FinalVerdict): { r: number; g: number; b: number } {
  switch (verdict) {
    case 'safe':     return { r: 0,   g: 230, b: 118 }; // Emerald green
    case 'low':      return { r: 255, g: 204, b: 0   }; // Amber
    case 'moderate': return { r: 255, g: 204, b: 0   }; // Amber
    case 'high':     return { r: 255, g: 77,  b: 77  }; // Red
    case 'dangerous':return { r: 255, g: 77,  b: 77  }; // Red
    default:         return { r: 200, g: 200, b: 200 }; // Fallback grey
  }
}

/** Map all 5 verdict tiers to prefix emoji */
function getVerdictEmoji(verdict: FinalVerdict): string {
  switch (verdict) {
    case 'safe':     return '✓';
    case 'low':      return '⚠';
    case 'moderate': return '⚠';
    case 'high':     return '✕';
    case 'dangerous':return '✕';
    default:         return '?';
  }
}

/** Safely coerce any unknown verdict string to a valid FinalVerdict */
function normalizeVerdict(raw: string): FinalVerdict {
  const valid: FinalVerdict[] = ['safe', 'low', 'moderate', 'high', 'dangerous'];
  return valid.includes(raw as FinalVerdict) ? (raw as FinalVerdict) : 'safe';
}

// ── Validate input ────────────────────────────────────────────────────────────

function validateInput(data: PDFReportData): void {
  if (!data || !data.result) {
    throw new Error('PDF generation failed: No scan result provided.');
  }
  const r = data.result as any;
  if (r.score === undefined || r.score === null) {
    throw new Error('PDF generation failed: Missing risk score in scan result.');
  }
  if (!data.target || data.target.trim() === '') {
    throw new Error('PDF generation failed: Missing target (URL or filename).');
  }
}

// ── Core PDF builder ─────────────────────────────────────────────────────────

/** Internal: builds the jsPDF document and returns it without saving */
const buildPDFDoc = async (data: PDFReportData) => {
  // Validate first — throws with a clear message if data is bad
  validateInput(data);

  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const pageWidth  = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin       = 15;
  const contentWidth = pageWidth - margin * 2;

  const result   = data.result as any;
  const flags: RiskFlags = result.flags || {};
  const baseScore        = typeof result.score === 'number' ? result.score : 0;

  // ── Verdict calculation ──
  const rawVerdict    = calculateFinalVerdict(baseScore, flags);
  const verdict       = normalizeVerdict(rawVerdict);
  const adjustedScore = Math.min(100, Math.max(0, calculateAdjustedScore(baseScore, flags)));
  const severity      = verdictToSeverity(verdict) ?? 'NONE';
  const verdictDesc   = getVerdictDescription(verdict) ?? 'No description available.';
  const recommendations = getRecommendations(verdict, data.scanType) ?? [];
  const colors        = getVerdictColors(verdict);   // always defined
  const emoji         = getVerdictEmoji(verdict);    // always defined

  let y = margin;

  // ── HEADER ───────────────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 55, 'F');

  doc.setFontSize(24);
  doc.setTextColor(colors.r, colors.g, colors.b);
  doc.setFont('helvetica', 'bold');
  doc.text('APGS', margin, 20);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Advanced Phishing Guard System', margin, 28);

  doc.setFontSize(9);
  doc.setTextColor(180, 190, 200);
  doc.text(`Security Report • ${new Date().toLocaleString()}`, margin, 36);

  y = 65;

  // ── Section helper ────────────────────────────────────────────────────────
  const addSection = (title: string, content: (doc: any, y: number) => number): number => {
    if (y > pageHeight - 40) { doc.addPage(); y = margin; }
    doc.setFontSize(13);
    doc.setTextColor(colors.r, colors.g, colors.b);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, y);
    y += 2;
    doc.setDrawColor(colors.r, colors.g, colors.b);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 3, pageWidth - margin, y + 3);
    y += 10;
    return content(doc, y);
  };

  // ── SECTION 1: OVERVIEW ──────────────────────────────────────────────────
  y = addSection('1. SCAN OVERVIEW', (_doc, y) => {
    const scanTypeLabel: Record<string, string> = {
      url: 'URL Phishing Detection',
      file: 'File Malware Analysis',
      password: 'Password Security Check',
      email: 'Email Breach Detection',
    };
    const lines = [
      `Scan Type:   ${scanTypeLabel[data.scanType] ?? data.scanType}`,
      `Target:      ${data.target}`,
      `Analyzed By: APGS Security Engine`,
      `User:        ${data.userName ?? 'Guest'}`,
      `Report Date: ${new Date().toLocaleString()}`,
    ];
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'normal');
    lines.forEach((line) => {
      if (y > pageHeight - 20) { doc.addPage(); y = margin; }
      doc.text(line, margin + 5, y);
      y += 7;
    });
    return y + 5;
  });

  // ── SECTION 2: VERDICT & SCORE ───────────────────────────────────────────
  y = addSection('2. SECURITY VERDICT', (_doc, y) => {
    doc.setFontSize(12);
    doc.setTextColor(colors.r, colors.g, colors.b);
    doc.setFont('helvetica', 'bold');
    doc.text(`${emoji}  ${verdict.toUpperCase()} — ${severity} SEVERITY`, margin + 5, y);
    y += 8;

    // Score bar
    doc.setFillColor(240, 240, 240);
    doc.rect(margin + 5, y, 100, 8, 'F');
    doc.setFillColor(colors.r, colors.g, colors.b);
    doc.rect(margin + 5, y, (adjustedScore / 100) * 100, 8, 'F');
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(`${adjustedScore} / 100`, margin + 110, y + 6);
    y += 15;

    // Description
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const descLines = doc.splitTextToSize(verdictDesc, contentWidth - 10);
    doc.text(descLines, margin + 5, y);
    y += (descLines.length * 5) + 5;
    return y + 3;
  });

  // ── SECTION 3: THREAT DETECTION SUMMARY (URL / File only) ────────────────
  if ((data.scanType === 'url' || data.scanType === 'file') && result.vtStats) {
    y = addSection('3. THREAT DETECTION SUMMARY', (_doc, y) => {
      const vt    = result.vtStats;
      const total = Math.max(
        (vt.malicious ?? 0) + (vt.suspicious ?? 0) + (vt.harmless ?? 0) + (vt.undetected ?? 0),
        1
      );
      const stats = [
        { label: 'Malicious',  value: vt.malicious  ?? 0, color: [255, 77,  77 ] as [number,number,number] },
        { label: 'Suspicious', value: vt.suspicious ?? 0, color: [255, 204, 0  ] as [number,number,number] },
        { label: 'Harmless',   value: vt.harmless   ?? 0, color: [0,   230, 118] as [number,number,number] },
        { label: 'Undetected', value: vt.undetected ?? 0, color: [180, 180, 180] as [number,number,number] },
      ];
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      stats.forEach((stat) => {
        if (y > pageHeight - 30) { doc.addPage(); y = margin; }
        doc.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
        doc.rect(margin + 5, y - 3, 4, 4, 'F');
        doc.setTextColor(50, 50, 50);
        doc.text(
          `${stat.label}: ${stat.value} vendor${stat.value !== 1 ? 's' : ''}`,
          margin + 12, y
        );
        y += 6;
      });
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`Total vendors scanned: ${total}`, margin + 5, y);
      return y + 8;
    });
  }

  // ── SECTION 4: DETAILED ANALYSIS ─────────────────────────────────────────
  const reasons: any[] = Array.isArray(result.reasons) ? result.reasons : [];
  if (reasons.length > 0) {
    y = addSection('4. DETAILED ANALYSIS', (_doc, y) => {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      reasons.slice(0, 15).forEach((reason) => {
        if (y > pageHeight - 20) { doc.addPage(); y = margin; }
        const flag       = reason?.flagged ?? false;
        const statusMark = flag ? '⚠' : '✓';
        const textColor  = flag ? [255, 100, 100] as [number,number,number]
                                : [100, 150, 100] as [number,number,number];
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(`${statusMark} ${reason?.label ?? ''}`, margin + 5, y);
        doc.setTextColor(80, 80, 80);
        const valueLines = doc.splitTextToSize(`${reason?.value ?? ''}`, contentWidth - 20);
        doc.text(valueLines, margin + 10, y + 5);
        y += 5 + valueLines.length * 4 + 3;
      });
      return y + 3;
    });
  }

  // ── SECTION 5: IDENTIFIED THREATS ────────────────────────────────────────
  const threats: string[] = Array.isArray(result.threats) ? result.threats : [];
  if (threats.length > 0) {
    y = addSection('5. IDENTIFIED THREATS', (_doc, y) => {
      doc.setFontSize(9);
      doc.setTextColor(255, 100, 100);
      doc.setFont('helvetica', 'normal');
      threats.forEach((threat) => {
        if (y > pageHeight - 20) { doc.addPage(); y = margin; }
        const lines = doc.splitTextToSize(`• ${threat ?? ''}`, contentWidth - 10);
        doc.text(lines, margin + 5, y);
        y += lines.length * 4 + 2;
      });
      return y + 3;
    });
  }

  // ── SECTION 6: RECOMMENDATIONS ───────────────────────────────────────────
  y = addSection('6. RECOMMENDED ACTIONS', (_doc, y) => {
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'normal');
    recommendations.forEach((rec, idx) => {
      if (y > pageHeight - 20) { doc.addPage(); y = margin; }
      const lines = doc.splitTextToSize(`${idx + 1}. ${rec ?? ''}`, contentWidth - 10);
      doc.text(lines, margin + 5, y);
      y += lines.length * 4 + 3;
    });
    return y + 5;
  });

  // ── FOOTER ────────────────────────────────────────────────────────────────
  const pageCount = (doc as any).internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(15, 23, 42);
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
    doc.setFontSize(8);
    doc.setTextColor(colors.r, colors.g, colors.b);
    doc.text(
      `APGS Confidential Report  |  Page ${i} of ${pageCount}  |  ${new Date().toISOString()}`,
      pageWidth / 2, pageHeight - 5, { align: 'center' }
    );
  }

  return doc;
};

// ── Public exports ────────────────────────────────────────────────────────────

/** Save PDF directly to device */
export const generatePDFReport = async (data: PDFReportData): Promise<void> => {
  const doc = await buildPDFDoc(data);
  doc.save('APGS_Report.pdf');
};

/**
 * Generate PDF and return as a Blob.
 * Used by the Share button — caller handles file sharing / fallback download.
 */
export const generatePDFBlob = async (data: PDFReportData): Promise<Blob> => {
  const doc = await buildPDFDoc(data);
  const blob = doc.output('blob');
  if (!(blob instanceof Blob) || blob.size === 0) {
    throw new Error('PDF generation produced an empty or invalid Blob.');
  }
  return blob as Blob;
};
