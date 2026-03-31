import jsPDF from 'jspdf';
import { UrlAnalysis, FileAnalysis, PasswordResult, BreachResult } from './interfaces';

export interface PDFReportData {
  scanType: 'url' | 'file' | 'password' | 'email';
  target: string;
  result: UrlAnalysis | FileAnalysis | PasswordResult | BreachResult;
  userName?: string;
}

const createHeader = (doc: jsPDF, title: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(0, 100, 200);
  doc.text(title, pageWidth / 2, 20, { align: 'center' });
  
  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('APGS -  Advanced Phishing Guard System', pageWidth / 2, 28, { align: 'center' });
  
  // Timestamp
  doc.setFontSize(9);
  const timestamp = new Date().toLocaleString();
  doc.text(`Generated: ${timestamp}`, pageWidth / 2, 35, { align: 'center' });
  
  // Line
  doc.setDrawColor(200, 200, 200);
  doc.line(10, 40, pageWidth - 10, 40);
};

const createSection = (doc: jsPDF, title: string, startY: number, content: string[]): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = startY;
  
  // Check if we need a new page
  if (y > pageHeight - 40) {
    doc.addPage();
    y = 20;
  }
  
  // Section title
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text(title, 15, y);
  y += 8;
  
  // Content
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  
  content.forEach((line) => {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
    
    const splitText = doc.splitTextToSize(line, pageWidth - 30);
    doc.text(splitText, 15, y);
    y += splitText.length > 1 ? splitText.length * 5 + 3 : 6;
  });
  
  return y + 8;
};

export const generatePDFReport = (data: PDFReportData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  createHeader(doc, 'Risk Analysis Report');
  
  let y = 50;
  
  // Overview section
  const overviewContent = [
    `Scan Type: ${data.scanType === 'url' ? 'URL Phishing Detection' : 'File Malware Analysis'}`,
    `Target: ${data.target}`,
    ...(data.userName ? [`Analyzed By: ${data.userName}`] : []),
  ];
  y = createSection(doc, '📋 Overview', y, overviewContent);
  
  // Risk Assessment
  const result = data.result as any;
  const riskContent = [
    `Status: ${result.status ? result.status.toUpperCase() : 'UNKNOWN'}`,
    ...(result.score !== undefined ? [`Risk Score: ${result.score}/100`] : []),
  ];
  y = createSection(doc, '📊 Risk Assessment', y, riskContent);
  
  // Severity Level
  const severity = result.score !== undefined 
    ? (result.score <= 30 ? 'LOW' : result.score <= 70 ? 'MEDIUM' : 'HIGH')
    : 'UNKNOWN';
  
  const severityContent = [
    `Severity Level: ${severity}`,
    ...(severity === 'HIGH' ? ['⚠️ This target poses a significant security risk'] : []),
    ...(severity === 'MEDIUM' ? ['⚠️ This target requires caution'] : []),
    ...(severity === 'LOW' ? ['✓ This target appears safe'] : []),
  ];
  y = createSection(doc, '⚠️ Severity', y, severityContent);
  
  // Analysis Details
  const analysisContent: string[] = [];
  if (data.scanType === 'url' && 'reasons' in result) {
    (result as UrlAnalysis).reasons.forEach((reason) => {
      analysisContent.push(`• ${reason.label}: ${reason.value}`);
    });
  } else if (data.scanType === 'file' && 'threats' in result) {
    (result as FileAnalysis).threats?.forEach((threat) => {
      analysisContent.push(`• ${threat}`);
    });
  }
  
  if (analysisContent.length > 0) {
    y = createSection(doc, '🔍 Analysis Details', y, analysisContent);
  }
  
  // Recommendations
  const recommendations = getSolutionRecommendations(data.scanType, result.status, severity);
  y = createSection(doc, '💡 Recommendations', y, recommendations);
  
  // Footer
  const pageCount = (doc as any).internal.pages.length - 1;
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }
  
  // Final status
  doc.setPage(pageCount);
  const finalY = (doc as any).lastAutoTable?.finalY || pageHeight - 40;
  doc.setFontSize(12);
  doc.setTextColor(0, 100, 200);
  doc.text('✓ Report Generation Complete', 15, Math.min(finalY + 20, pageHeight - 20));
  doc.text(new Date().toLocaleString(), 15, Math.min(finalY + 28, pageHeight - 12));
};

const getSolutionRecommendations = (scanType: string, status: string, severity: string): string[] => {
  const recommendations: string[] = [];
  
  if (scanType === 'url') {
    if (severity === 'HIGH') {
      recommendations.push('Do NOT click on this link');
      recommendations.push('Do NOT enter any personal information on this site');
      recommendations.push('Report this phishing attempt to the respective platform');
      recommendations.push('Check your accounts for unauthorized access');
    } else if (severity === 'MEDIUM') {
      recommendations.push('Exercise caution when visiting this link');
      recommendations.push('Verify the legitimacy of the sender');
      recommendations.push('Do not enter sensitive information');
    } else {
      recommendations.push('This link appears to be safe');
      recommendations.push('Standard browsing precautions still apply');
    }
  } else if (scanType === 'file') {
    if (severity === 'HIGH') {
      recommendations.push('Do NOT open or execute this file');
      recommendations.push('Do NOT share this file with others');
      recommendations.push('Delete this file immediately');
      recommendations.push('Run a full antivirus scan on your system');
      recommendations.push('Check for any suspicious activity on your computer');
    } else if (severity === 'MEDIUM') {
      recommendations.push('Be cautious with this file');
      recommendations.push('Verify the file source before opening');
      recommendations.push('Consider running a scan before opening');
    } else {
      recommendations.push('This file appears to be safe');
      recommendations.push('Standard security practices still apply');
    }
  } else if (scanType === 'password') {
    if (severity === 'HIGH') {
      recommendations.push('❌ This password has been compromised in known data breaches');
      recommendations.push('Change this password immediately on all accounts where it is used');
      recommendations.push('Check if your account has been hacked at haveibeenpwned.com');
      recommendations.push('Enable two-factor authentication on important accounts');
      recommendations.push('Monitor your accounts for suspicious activity');
    } else if (severity === 'MEDIUM') {
      recommendations.push('⚠️ This password is weak and can be guessed easily');
      recommendations.push('Use a combination of uppercase, lowercase, numbers, and symbols');
      recommendations.push('Make your password at least 12 characters long');
      recommendations.push('Avoid using dictionary words or personal information');
      recommendations.push('Consider using a password manager for stronger passwords');
    } else {
      recommendations.push('✓ This is a strong password');
      recommendations.push('Keep this password secure and never share it');
      recommendations.push('Use different passwords for different accounts');
    }
  } else if (scanType === 'email') {
    if (severity === 'HIGH') {
      recommendations.push('⚠️ This email has been found in known data breaches');
      recommendations.push('Immediately change the password for this email account');
      recommendations.push('Check for unauthorized account access');
      recommendations.push('Enable two-factor authentication if not already enabled');
      recommendations.push('Check all connected accounts and services for security');
      recommendations.push('Monitor this email account for suspicious activity');
    } else {
      recommendations.push('✓ This email has not been found in known data breaches');
      recommendations.push('Continue to use strong, unique passwords');
      recommendations.push('Enable two-factor authentication for added security');
      recommendations.push('Regularly review account activity and connected apps');
    }
  }
  
  return recommendations;
};

export const downloadReport = (data: PDFReportData): void => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Header
    createHeader(doc, 'Risk Analysis Report');
    
    let y = 50;
    
    // Determine scan type labels
    const scanTypeLabels: Record<string, string> = {
      url: 'URL Phishing Detection',
      file: 'File Malware Analysis',
      password: 'Password Security Check',
      email: 'Email Breach Detection'
    };
    
    // Overview section
    const overviewContent = [
      `Scan Type: ${scanTypeLabels[data.scanType]}`,
      `Target: ${data.target}`,
      ...(data.userName ? [`Analyzed By: ${data.userName}`] : []),
    ];
    y = createSection(doc, '📋 Overview', y, overviewContent);
    
    // Risk Assessment
    const result = data.result as any;
    const riskContent = [
      `Status: ${result.status ? result.status.toUpperCase() : 'UNKNOWN'}`,
      ...(result.score !== undefined ? [`Risk Score: ${result.score}/100`] : []),
      ...(result.strength !== undefined ? [`Strength: ${result.strength.toUpperCase()}`] : []),
      ...(result.breached !== undefined ? [`Breached: ${result.breached ? 'YES - COMPROMISED' : 'NO - SAFE'}`] : []),
    ];
    y = createSection(doc, '📊 Risk Assessment', y, riskContent);
    
    // Severity Level
    let severity = 'UNKNOWN';
    if (result.score !== undefined) {
      severity = result.score <= 30 ? 'LOW' : result.score <= 70 ? 'MEDIUM' : 'HIGH';
    } else if (data.scanType === 'password' && result.strength) {
      const strengthMap: Record<string, string> = { weak: 'HIGH', medium: 'MEDIUM', strong: 'LOW' };
      severity = strengthMap[result.strength] || 'MEDIUM';
    } else if (data.scanType === 'email' && result.breached !== undefined) {
      severity = result.breached ? 'HIGH' : 'LOW';
    }
    
    const severityContent = [
      `Severity Level: ${severity}`,
      ...(severity === 'HIGH' ? ['⚠️ This target poses a significant security risk'] : []),
      ...(severity === 'MEDIUM' ? ['⚠️ This target requires caution'] : []),
      ...(severity === 'LOW' ? ['✓ This target appears safe'] : []),
    ];
    y = createSection(doc, '⚠️ Severity', y, severityContent);
    
    // Analysis Details - Comprehensive for all types
    const analysisContent: string[] = [];
    
    if (data.scanType === 'url' && 'reasons' in result) {
      (result as UrlAnalysis).reasons.forEach((reason) => {
        analysisContent.push(`• ${reason.label}: ${reason.value} ${reason.flagged ? '[⚠️ FLAGGED]' : ''}`);
      });
    } else if (data.scanType === 'file' && 'reasons' in result) {
      (result as FileAnalysis).reasons.forEach((reason) => {
        analysisContent.push(`• ${reason.label}: ${reason.value} ${reason.flagged ? '[⚠️ FLAGGED]' : ''}`);
      });
      // Add threats if any
      if ((result as FileAnalysis).threats?.length) {
        analysisContent.push('\n🚨 Detected Threats:');
        (result as FileAnalysis).threats.forEach((threat) => {
          analysisContent.push(`  • ${threat}`);
        });
      }
    } else if (data.scanType === 'password' && 'suggestions' in result) {
      const pwResult = result as PasswordResult;
      analysisContent.push(`Password Strength: ${pwResult.strength.toUpperCase()}`);
      analysisContent.push(`Score: ${pwResult.score}/100`);
      if (pwResult.breached) {
        analysisContent.push('⚠️ WARNING: This password has been found in known data breaches!');
      }
      if (pwResult.suggestions?.length) {
        analysisContent.push('\n💡 Improvement Suggestions:');
        pwResult.suggestions.forEach((suggestion) => {
          analysisContent.push(`  • ${suggestion}`);
        });
      }
    } else if (data.scanType === 'email' && 'breached' in result) {
      const emailResult = result as BreachResult;
      analysisContent.push(`Email Status: ${emailResult.breached ? 'COMPROMISED' : 'SAFE'}`);
      if (emailResult.breached) {
        analysisContent.push(`Found in ${emailResult.count} data breaches`);
        if (emailResult.sources?.length) {
          analysisContent.push('\n📋 Breach Sources:');
          emailResult.sources.forEach((source) => {
            analysisContent.push(`  • ${source}`);
          });
        }
      }
    }
    
    if (analysisContent.length > 0) {
      y = createSection(doc, '🔍 Analysis Details', y, analysisContent);
    }
    
    // Recommendations
    const recommendations = getSolutionRecommendations(data.scanType, result.status || result.strength, severity);
    y = createSection(doc, '💡 Recommendations', y, recommendations);
    
    // Footer with page numbers
    const pageCount = (doc as any).internal.pages.length - 1;
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
    
    // Generate and download
    const date = new Date();
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const filename = `APGS_Report_${dateStr}.pdf`;
    
    doc.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
};
