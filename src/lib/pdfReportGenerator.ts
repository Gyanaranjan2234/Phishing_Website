import type { UrlAnalysis, FileAnalysis, PasswordResult, BreachResult } from './interfaces';

export interface PDFReportData {
  scanType: 'url' | 'file' | 'password' | 'email';
  target: string;
  result: UrlAnalysis | FileAnalysis | PasswordResult | BreachResult;
  userName?: string;
}

export const generatePDFReport = async (data: PDFReportData): Promise<void> => {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ============ HEADER ============
  doc.setFillColor(15, 23, 30);
  doc.rect(0, 0, pageWidth, 50, 'F');

  doc.setFontSize(20);
  doc.setTextColor(0, 230, 118);
  doc.setFont('helvetica', 'bold');
  doc.text('APGS SECURITY RISK REPORT', pageWidth / 2, 18, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 160, 140);
  doc.text('Advanced Phishing Guard System', pageWidth / 2, 28, { align: 'center' });

  doc.setFontSize(9);
  const timestamp = new Date().toLocaleString();
  doc.text(`Generated: ${timestamp}`, pageWidth / 2, 38, { align: 'center' });

  let y = 60;

  const createSection = (title: string, content: string[]): void => {
    if (y > pageHeight - 40) { doc.addPage(); y = 20; }

    doc.setFontSize(13);
    doc.setTextColor(0, 230, 118);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 15, y);
    y += 2;

    doc.setDrawColor(0, 230, 118);
    doc.setLineWidth(0.3);
    doc.line(15, y + 2, pageWidth - 15, y + 2);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);

    content.forEach((line) => {
      if (y > pageHeight - 20) { doc.addPage(); y = 20; }
      const splitText = doc.splitTextToSize(line, pageWidth - 30);
      doc.text(splitText, 15, y);
      y += splitText.length > 1 ? splitText.length * 5 + 3 : 7;
    });

    y += 8;
  };

  const result = data.result as any;

  // ============ OVERVIEW ============
  const scanTypeLabels: Record<string, string> = {
    url: 'URL Phishing Detection',
    file: 'File Malware Analysis',
    password: 'Password Security Check',
    email: 'Email Breach Detection',
  };

  createSection('OVERVIEW', [
    `Scan Type:    ${scanTypeLabels[data.scanType]}`,
    `Target:       ${data.target}`,
    ...(data.userName ? [`Analyzed By:  ${data.userName}`] : []),
    `Date:         ${new Date().toLocaleString()}`,
  ]);

  // ============ RISK ASSESSMENT ============
  const score = result.score ?? 0;
  const severity =
    score <= 30 ? 'LOW' :
    score <= 70 ? 'MEDIUM' :
    'HIGH';

  const statusLabel =
    result.status === 'safe' ? 'SAFE' :
    result.status === 'suspicious' ? 'SUSPICIOUS' :
    result.status === 'phishing' ? 'PHISHING DETECTED' :
    (result.status ?? 'UNKNOWN').toUpperCase();

  createSection('RISK ASSESSMENT', [
    `Status:         ${statusLabel}`,
    `Risk Score:     ${score}/100`,
    `Severity:       ${severity}`,
    ...(severity === 'HIGH' ? ['⚠ This target poses a significant security risk — immediate action required'] : []),
    ...(severity === 'MEDIUM' ? ['⚠ This target requires caution before proceeding'] : []),
    ...(severity === 'LOW' ? ['✓ This target appears safe'] : []),
  ]);

  // ============ VIRUSTOTAL STATS (url only) ============
  if (data.scanType === 'url' && result.vtStats) {
    const vt = result.vtStats;
    const total = (vt.malicious + vt.suspicious + vt.harmless + vt.undetected) || 1;
    createSection('VIRUSTOTAL SCAN RESULTS', [
      `Total Vendors Scanned:  ${total}`,
      `Malicious Detections:   ${vt.malicious} vendor(s)`,
      `Suspicious Detections:  ${vt.suspicious} vendor(s)`,
      `Harmless Verdicts:      ${vt.harmless} vendor(s)`,
      `Undetected:             ${vt.undetected} vendor(s)`,
      ...(result.analysisId ? [`Analysis ID:            ${result.analysisId}`] : []),
    ]);
  }

  // ============ ANALYSIS DETAILS ============
  const analysisContent: string[] = [];

  if (data.scanType === 'url' && 'reasons' in result) {
    (result as UrlAnalysis).reasons.forEach((reason: any) => {
      analysisContent.push(
        `${reason.flagged ? '⚠' : '✓'} ${reason.label}: ${reason.value}${reason.flagged ? ' [FLAGGED]' : ''}`
      );
    });
  } else if (data.scanType === 'file' && 'reasons' in result) {
    (result as FileAnalysis).reasons.forEach((reason: any) => {
      analysisContent.push(
        `${reason.flagged ? '⚠' : '✓'} ${reason.label}: ${reason.value}`
      );
    });
    if ((result as FileAnalysis).threats?.length) {
      analysisContent.push('');
      analysisContent.push('Detected Threats:');
      (result as FileAnalysis).threats.forEach((t: string) => {
        analysisContent.push(`  • ${t}`);
      });
    }
  } else if (data.scanType === 'password' && 'suggestions' in result) {
    const pw = result as PasswordResult;
    analysisContent.push(`Password Strength: ${pw.strength?.toUpperCase()}`);
    analysisContent.push(`Score: ${pw.score}/100`);
    if (pw.breached) analysisContent.push('⚠ WARNING: Password found in known data breaches!');
    pw.suggestions?.forEach((s: string) => analysisContent.push(`  • ${s}`));
  } else if (data.scanType === 'email' && 'breached' in result) {
    const email = result as BreachResult;
    analysisContent.push(`Email Status: ${email.breached ? 'COMPROMISED' : 'SAFE'}`);
    if (email.breached) {
      analysisContent.push(`Found in ${email.count} data breach(es)`);
      email.sources?.forEach((s: string) => analysisContent.push(`  • ${s}`));
    }
  }

  if (analysisContent.length > 0) {
    createSection('ANALYSIS DETAILS', analysisContent);
  }

  // ============ RECOMMENDATIONS ============
  const recommendations = getRecommendations(data.scanType, result.status, severity);
  createSection('RECOMMENDATIONS', recommendations);

  // ============ FOOTER ============
  const pageCount = (doc as any).internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(15, 23, 30);
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
    doc.setFontSize(8);
    doc.setTextColor(120, 160, 140);
    doc.text(
      `APGS Confidential Security Report  |  Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );
  }

  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`APGS_Report_${dateStr}_${Date.now()}.pdf`);
};

const getRecommendations = (scanType: string, status: string, severity: string): string[] => {
  if (scanType === 'url') {
    if (severity === 'HIGH') return [
      '• Do NOT click on this link or visit this website',
      '• Do NOT enter any personal information or credentials',
      '• Report this phishing attempt to the respective platform',
      '• Check your accounts for any unauthorized access',
      '• Run a security scan on your device',
    ];
    if (severity === 'MEDIUM') return [
      '• Exercise caution when visiting this link',
      '• Verify the legitimacy of the sender or source',
      '• Do not enter sensitive information on this page',
      '• Consider using a link preview tool for further verification',
    ];
    return [
      '• This link appears to be safe to visit',
      '• Standard browsing security precautions still apply',
      '• Keep your browser and security tools updated',
    ];
  }

  if (scanType === 'file') {
    if (severity === 'HIGH') return [
      '• Do NOT open or execute this file',
      '• Delete this file immediately from your system',
      '• Run a full antivirus scan on your device',
      '• Check for any suspicious system activity',
    ];
    if (severity === 'MEDIUM') return [
      '• Be cautious with this file',
      '• Verify the file source before opening',
      '• Consider running an additional antivirus scan',
    ];
    return [
      '• This file appears to be safe',
      '• Standard file security practices still apply',
    ];
  }

  if (scanType === 'password') {
    if (severity === 'HIGH') return [
      '• Change this password immediately on all accounts',
      '• Enable two-factor authentication on important accounts',
      '• Check haveibeenpwned.com for breach information',
      '• Monitor your accounts for suspicious activity',
    ];
    if (severity === 'MEDIUM') return [
      '• Strengthen this password with uppercase, numbers and symbols',
      '• Make your password at least 12 characters long',
      '• Avoid using dictionary words or personal information',
      '• Consider using a password manager',
    ];
    return [
      '• This is a strong password — keep it secure',
      '• Never share passwords across multiple accounts',
      '• Use a password manager for better security',
    ];
  }

  if (scanType === 'email') {
    if (severity === 'HIGH') return [
      '• Immediately change the password for this email account',
      '• Enable two-factor authentication if not already enabled',
      '• Check for unauthorized account access',
      '• Monitor all connected services for suspicious activity',
    ];
    return [
      '• This email has not been found in known data breaches',
      '• Continue using strong, unique passwords',
      '• Enable two-factor authentication for added security',
    ];
  }

  return ['• Follow best practices for digital security'];
};

// Keep downloadReport as alias for backward compat
export const downloadReport = generatePDFReport;
