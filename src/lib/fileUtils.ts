
import type { FileAnalysis } from "./interfaces";
interface HistoryItem {
  type: string;
  target: string;
  status: string;
}

export function scanFile(fileName: string): FileAnalysis {
  const reasons: FileAnalysis["reasons"] = [];
  const threats: string[] = [];
  let riskPoints = 0;

  // 1. File Extension Analysis
  const extension = fileName.split('.').pop()?.toLowerCase() || "";
  const dangerousExtensions = ["exe", "bat", "scr", "com", "pif", "vbs", "js", "jar"];
  const suspiciousExtensions = ["zip", "rar", "7z", "iso"];
  const safeExtensions = ["pdf", "txt", "doc", "docx", "xls", "xlsx", "jpg", "png", "gif"];
  
  let extensionValue = "";
  let extensionFlagged = false;
  
  if (dangerousExtensions.includes(extension)) {
    riskPoints += 40;
    extensionFlagged = true;
    extensionValue = `${extension.toUpperCase()} (EXECUTABLE - CRITICAL RISK)`;
    threats.push("Executable file detected");
  } else if (suspiciousExtensions.includes(extension)) {
    riskPoints += 20;
    extensionFlagged = true;
    extensionValue = `${extension.toUpperCase()} (archive - suspicious)`;
    threats.push("Archive file detected");
  } else if (safeExtensions.includes(extension)) {
    extensionValue = `${extension.toUpperCase()} (safe format)`;
  } else {
    riskPoints += 10;
    extensionFlagged = true;
    extensionValue = `${extension.toUpperCase()} (unknown format)`;
  }
  
  reasons.push({ label: "File Extension", value: extensionValue, flagged: extensionFlagged });

  // 2. File Name Analysis
  let fileNameValue = `${fileName} (${fileName.length} chars)`;
  let fileNameFlagged = false;
  
  const suspiciousPatterns = /invoice|payment|update|confirm|verify|urgent|click|secure|login|password|admin/i;
  if (suspiciousPatterns.test(fileName) && extensionFlagged) {
    riskPoints += 15;
    fileNameFlagged = true;
    fileNameValue += " - contains suspicious patterns";
    threats.push("Suspicious file naming detected");
  } else if (suspiciousPatterns.test(fileName)) {
    riskPoints += 5;
    fileNameFlagged = true;
    fileNameValue += " - unusual naming";
  } else {
    fileNameValue += " (normal)";
  }
  
  reasons.push({ label: "File Name", value: fileNameValue, flagged: fileNameFlagged });

  // 3. Simulated Signature Detection
  const hasKnownSignature = fileName.toLowerCase().includes("malware") || 
                            fileName.toLowerCase().includes("virus") ||
                            fileName.toLowerCase().includes("trojan");
  
  let signatureValue = "No known malware signatures";
  let signatureFlagged = false;
  
  if (hasKnownSignature) {
    riskPoints += 50;
    signatureFlagged = true;
    signatureValue = "MALWARE SIGNATURE DETECTED";
    threats.push("Known malware signature matched");
  }
  
  reasons.push({ label: "Malware Signature", value: signatureValue, flagged: signatureFlagged });

  // 4. Heuristic Analysis
  let heuristicValue = "No suspicious behavior patterns";
  let heuristicFlagged = false;
  
  if (extensionFlagged && fileNameFlagged) {
    riskPoints += 15;
    heuristicFlagged = true;
    heuristicValue = "Multiple risk factors detected";
    threats.push("Heuristic threat detected");
  }
  
  reasons.push({ label: "Heuristic Analysis", value: heuristicValue, flagged: heuristicFlagged });

  // Calculate final risk score
  let score = Math.min(100, riskPoints);
  if (riskPoints === 0) {
    score = 10; // Baseline safe score
  }

  const isInfected = riskPoints >= 35;
  const status: "safe" | "infected" = isInfected ? "infected" : "safe";
  
  // Generate file size (simulated)
  const fileSizeKB = Math.floor(Math.random() * 50000) + 100;
  const fileSize = fileSizeKB > 1024 ? `${(fileSizeKB / 1024).toFixed(2)} MB` : `${fileSizeKB} KB`;
  
  const result: FileAnalysis = { status, fileName, fileSize, reasons, score, threats };
  addToHistory({ type: "file", target: fileName, status: status === "infected" ? "phishing" : "safe" }, result);

  return result;
}
function addToHistory(item: HistoryItem, analysisResult?: FileAnalysis) {
  // Mock implementation - store in localStorage
  try {
    const history = JSON.parse(localStorage.getItem("scan_history") || "[]");
    history.push({
      id: Math.random().toString(),
      ...item,
      timestamp: new Date().toISOString(),
      analysisResult: analysisResult || null,
    });
    localStorage.setItem("scan_history", JSON.stringify(history));
  } catch (err) {
    console.error("Failed to save scan to history:", err);
  }
}
