import type { UrlAnalysis, FileAnalysis, PasswordResult, BreachResult } from './interfaces';
import {
  calculateFinalVerdict,
  calculateAdjustedScore,
  getVerdictDescription,
  getRecommendations,
  verdictToSeverity,
  type RiskFlags,
} from './riskDecisionLogic';

export interface PDFReportData {
  scanType: 'url' | 'file' | 'password' | 'email';
  target: string;
  result: UrlAnalysis | FileAnalysis | PasswordResult | BreachResult;
  userName?: string;
}

/**
 * Get color values for verdict-based styling
 */
function getVerdictColors(verdict: 'safe' | 'warning' | 'dangerous') {
  switch (verdict) {
    case 'safe':
      return { r: 0, g: 230, b: 118 }; // Emerald green
    case 'warning':
      return { r: 255, g: 204, b: 0 }; // Amber/Yellow
    case 'dangerous':
      return { r: 255, g: 77, b: 77 }; // Red
  }
}

/**
 * Get verdict emoji
 */
function getVerdictEmoji(verdict: 'safe' | 'warning' | 'dangerous') {
  switch (verdict) {
    case 'safe':
      return '✓';
    case 'warning':
      return '⚠';
    case 'dangerous':
      return '✕';
  }
}

export const generatePDFReport = async (data: PDFReportData): Promise<void> => {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  // Extract flags from result
  const flags: RiskFlags = (data.result as any).flags || {};
  const baseScore = (data.result as any).score ?? 0;

  // Calculate unified verdict
  const verdict = calculateFinalVerdict(baseScore, flags);
  const adjustedScore = calculateAdjustedScore(baseScore, flags);
  const severity = verdictToSeverity(verdict);
  const verdictDescription = getVerdictDescription(verdict);
  const recommendations = getRecommendations(verdict, data.scanType);
  const verdictColors = getVerdictColors(verdict);
  const verdictEmoji = getVerdictEmoji(verdict);

  let y = margin;

  // ============ HEADER ============
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 55, 'F');

  // Logo/Title
  doc.setFontSize(24);
  doc.setTextColor(verdictColors.r, verdictColors.g, verdictColors.b);
  doc.setFont('helvetica', 'bold');
  doc.text('APGS', margin, 20);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Advanced Phishing Guard System', margin, 28);

  doc.setFontSize(9);
  doc.setTextColor(180, 190, 200);
  doc.text(`Security Report • ${new Date().toLocaleString()}`, margin, 36);

  y = 65;

  /**
   * Helper function to add a section
   */
  const addSection = (title: string, content: (doc: any, y: number) => number) => {
    // Check page break
    if (y > pageHeight - 40) {
      doc.addPage();
      y = margin;
    }

    // Section title with underline
    doc.setFontSize(13);
    doc.setTextColor(verdictColors.r, verdictColors.g, verdictColors.b);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, y);
    y += 2;

    // Underline
    doc.setDrawColor(verdictColors.r, verdictColors.g, verdictColors.b);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 3, pageWidth - margin, y + 3);
    y += 10;

    // Content
    return content(doc, y);
  };

  // ============ SECTION 1: OVERVIEW ============
  y = addSection('1. SCAN OVERVIEW', (doc, y) => {
    const scanTypes: Record<string, string> = {
      url: 'URL Phishing Detection',
      file: 'File Malware Analysis',
      password: 'Password Security Check',
      email: 'Email Breach Detection',
    };

    const details = [
      `Scan Type: ${scanTypes[data.scanType]}`,
      `Target: ${data.target}`,
      `Analyzed By: APGS Security Engine`,
      `Report Date: ${new Date().toLocaleString()}`,
    ];

    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'normal');

    details.forEach((detail) => {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = margin;
      }
      doc.text(detail, margin + 5, y);
      y += 7;
    });

    return y + 5;
  });

  // ============ SECTION 2: VERDICT & SCORE ============
  y = addSection('2. SECURITY VERDICT', (doc, y) => {
    doc.setFontSize(12);
    doc.setTextColor(verdictColors.r, verdictColors.g, verdictColors.b);
    doc.setFont('helvetica', 'bold');

    const verdictText = `${verdictEmoji} ${verdict.toUpperCase()} - ${severity} SEVERITY`;
    doc.text(verdictText, margin + 5, y);
    y += 8;

    // Score bar background
    doc.setFillColor(240, 240, 240);
    doc.rect(margin + 5, y, 100, 8, 'F');

    // Score bar fill
    doc.setFillColor(verdictColors.r, verdictColors.g, verdictColors.b);
    const barWidth = (adjustedScore / 100) * 100;
    doc.rect(margin + 5, y, barWidth, 8, 'F');

    // Score text
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(`${adjustedScore}/100`, margin + 110, y + 6);
    y += 15;

    // Description
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const descLines = doc.splitTextToSize(verdictDescription, contentWidth - 10);
    doc.text(descLines, margin + 5, y);
    y += descLines.length * 5 + 5;

    return y + 3;
  });

  // ============ SECTION 3: THREAT ANALYSIS STATS (URL/File only) ============
  const result = data.result as any;
  if ((data.scanType === 'url' || data.scanType === 'file') && result.vtStats) {
    y = addSection('3. THREAT DETECTION SUMMARY', (doc, y) => {
      const vt = result.vtStats;
      const total = (vt.malicious + vt.suspicious + vt.harmless + vt.undetected) || 1;

      const stats = [
        { label: 'Malicious', value: vt.malicious, color: [255, 77, 77] },
        { label: 'Suspicious', value: vt.suspicious, color: [255, 204, 0] },
        { label: 'Harmless', value: vt.harmless, color: [0, 230, 118] },
        { label: 'Undetected', value: vt.undetected, color: [180, 180, 180] },
      ];

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      stats.forEach((stat, idx) => {
        if (y > pageHeight - 30) {
          doc.addPage();
          y = margin;
        }

        // Color box
        doc.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
        doc.rect(margin + 5, y - 3, 4, 4, 'F');

        // Label and value
        doc.setTextColor(50, 50, 50);
        doc.text(`${stat.label}: ${stat.value} vendor${stat.value !== 1 ? 's' : ''}`, margin + 12, y);
        y += 6;
      });

      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`Total Vendors Scanned: ${total}`, margin + 5, y);

      return y + 8;
    });
  }

  // ============ SECTION 4: ANALYSIS DETAILS ============
  if (result.reasons && result.reasons.length > 0) {
    y = addSection('4. DETAILED ANALYSIS', (doc, y) => {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      result.reasons.slice(0, 15).forEach((reason: any) => {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = margin;
        }

        const status = reason.flagged ? '⚠' : '✓';
        const textColor = reason.flagged ? [255, 100, 100] : [100, 150, 100];
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);

        const label = `${status} ${reason.label}`;
        const valueLines = doc.splitTextToSize(`${reason.value}`, contentWidth - 20);
        
        doc.text(label, margin + 5, y);
        doc.setTextColor(80, 80, 80);
        doc.text(valueLines, margin + 10, y + 5);
        y += 5 + (valueLines.length * 4) + 3;
      });

      return y + 3;
    });
  }

  // ============ SECTION 5: THREAT DETAILS ============
  if (result.threats && result.threats.length > 0) {
    y = addSection('5. IDENTIFIED THREATS', (doc, y) => {
      doc.setFontSize(9);
      doc.setTextColor(255, 100, 100);
      doc.setFont('helvetica', 'normal');

      result.threats.forEach((threat: string) => {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = margin;
        }
        const threatLines = doc.splitTextToSize(`• ${threat}`, contentWidth - 10);
        doc.text(threatLines, margin + 5, y);
        y += threatLines.length * 4 + 2;
      });

      return y + 3;
    });
  }

  // ============ SECTION 6: RECOMMENDATIONS ============
  y = addSection('6. RECOMMENDED ACTIONS', (doc, y) => {
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'normal');

    recommendations.forEach((rec, idx) => {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = margin;
      }
      const recLines = doc.splitTextToSize(`${idx + 1}. ${rec}`, contentWidth - 10);
      doc.text(recLines, margin + 5, y);
      y += recLines.length * 4 + 3;
    });

    return y + 5;
  });

  // ============ FOOTER ON ALL PAGES ============
  const pageCount = (doc as any).internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer background
    doc.setFillColor(15, 23, 42);
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
    
    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(verdictColors.r, verdictColors.g, verdictColors.b);
    doc.text(
      `APGS Confidential Report  |  Page ${i} of ${pageCount}  |  ${new Date().toISOString()}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );
  }

  // ============ SAVE FILE ============
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `APGS_${verdict}_Report_${dateStr}.pdf`;
  doc.save(fileName);
};
