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
    
    totalScans += 1;
    
    // Determine if it's safe or a threat based on malicious count or status
    const isSafe = 
      record.malicious === 0 || 
      finalRecord.status.toLowerCase() === 'safe' || 
      finalRecord.status.toLowerCase() === 'strong' ||
      finalRecord.status.toLowerCase() === 'clean';

    if (isSafe) {
       safeScans += 1;
    } else {
       threatsFound += 1;
    }
    
    localStorage.setItem('total_scans', totalScans.toString());
    localStorage.setItem('safe_scans', safeScans.toString());
    localStorage.setItem('threats_found', threatsFound.toString());

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
  return {
    totalScans: parseInt(localStorage.getItem('total_scans') || '0'),
    safeScans: parseInt(localStorage.getItem('safe_scans') || '0'),
    threatScans: parseInt(localStorage.getItem('threats_found') || '0')
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
