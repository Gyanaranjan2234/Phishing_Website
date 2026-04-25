import { apiScans } from './api-backend';

export interface ScanRecord {
  type: "url" | "file" | "email" | "password";
  target: string;
  hash?: string;
  malicious?: number;
  suspicious?: number;
  harmless?: number;
  undetected?: number;
  risk_score?: number;
  status: string; // Safe / Low Risk / Moderate / High / Dangerous / Breached / Weak
  timestamp?: number;
  details?: string;
}

export const saveScanResult = async (record: ScanRecord) => {
  const finalRecord = { ...record, timestamp: record.timestamp || Date.now() };
  
  try {
    // 1. Update local storage history directly
    const existingHistory = JSON.parse(localStorage.getItem('scan_history') || '[]');
    existingHistory.unshift(finalRecord);
    // Keep max 100 locally
    if (existingHistory.length > 100) existingHistory.pop();
    localStorage.setItem('scan_history', JSON.stringify(existingHistory));
    
    // 2. Update local storage counters
    let totalScans = parseInt(localStorage.getItem('total_scans') || '0');
    let safeScans = parseInt(localStorage.getItem('safe_scans') || '0');
    let threatsFound = parseInt(localStorage.getItem('threats_found') || '0');
    let suspiciousScans = parseInt(localStorage.getItem('suspicious_scans') || '0');
    let undetectedScans = parseInt(localStorage.getItem('undetected_scans') || '0');
    
    // Determine status type
    const statusLower = finalRecord.status.toLowerCase();
    const isSafe = statusLower === 'safe' || statusLower === 'strong' || statusLower === 'clean';
    const isThreat = statusLower === 'phishing' || statusLower === 'breached' || statusLower === 'infected' || statusLower === 'dangerous' || statusLower === 'threat' || (record.malicious && record.malicious > 0);
    const isSuspicious = statusLower === 'suspicious' || statusLower === 'low risk' || statusLower === 'moderate' || (record.suspicious && record.suspicious > 0);
    const isUndetected = statusLower === 'undetected' || statusLower === 'unknown';

    if (isSafe) {
       safeScans += 1;
    } else if (isThreat) {
       threatsFound += 1;
    } else if (isSuspicious) {
       suspiciousScans += 1;
    } else {
       // Default to undetected if not clearly categorized
       undetectedScans += 1;
    }
    
    // Total is always the sum of parts to prevent mismatch
    totalScans = safeScans + threatsFound + suspiciousScans + undetectedScans;
    
    localStorage.setItem('total_scans', totalScans.toString());
    localStorage.setItem('safe_scans', safeScans.toString());
    localStorage.setItem('threats_found', threatsFound.toString());
    localStorage.setItem('suspicious_scans', suspiciousScans.toString());
    localStorage.setItem('undetected_scans', undetectedScans.toString());

    // 3. Try backend save if authenticated
    const userId = localStorage.getItem('user_id');
    if (userId) {
      const detailsStr = JSON.stringify(finalRecord);
      await apiScans.saveScan(
        parseInt(userId), 
        finalRecord.type, 
        finalRecord.target, 
        finalRecord.status, 
        detailsStr, 
        finalRecord.target
      );
    }
    
    // Fire event for UI to update globally
    window.dispatchEvent(new Event('scan_history_updated'));
  } catch (err) {
    console.error("Error saving scan record:", err);
  }
};

export const getLocalStats = () => {
  const safe = parseInt(localStorage.getItem('safe_scans') || '0');
  const threats = parseInt(localStorage.getItem('threats_found') || '0');
  const suspicious = parseInt(localStorage.getItem('suspicious_scans') || '0');
  const undetected = parseInt(localStorage.getItem('undetected_scans') || '0');
  
  return {
    totalScans: safe + threats,
    safeScans: safe,
    threatScans: threats,
    suspiciousScans: suspicious,
    undetectedScans: undetected
  };
};

export const getLocalHistory = () => {
  try {
    const history = JSON.parse(localStorage.getItem('scan_history') || '[]');
    // Ensure timestamps are Date objects for components that expect it
    return history.map((item: any) => ({
      ...item,
      id: item.id || Math.random().toString(36).substr(2, 9),
      timestamp: new Date(item.timestamp)
    }));
  } catch (e) {
    return [];
  }
};
