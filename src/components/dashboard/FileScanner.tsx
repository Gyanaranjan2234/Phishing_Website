import { useState, useCallback } from "react";
import { Upload, FileUp, X, Loader2, CheckCircle, AlertTriangle, Shield, FileText, Download, AlertCircle, Check, Search, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
//import { scanFile, type FileAnalysis } from "@/lib/mockData";
import type { FileAnalysis, RiskReportData, PDFReportData } from "@/lib/interfaces";
//import { downloadReport, type PDFReportData } from "@/lib/pdfReportGenerator";
import { scanFile } from "@/lib/fileUtils";
import { apiScans } from "@/lib/api-backend";  // UPDATED: Use backend API
import { handleScanAttempt } from "@/lib/guestAccess";  // ADDED: Guest access control
import RiskAnalysisReport from "@/components/RiskAnalysisReport";
import { generateFileReport } from "@/lib/generateReport";
import { generateRiskReport } from "@/lib/reportGenerator";
import { generatePDFReport, generatePDFBlob } from "@/lib/pdfReportGenerator";
import { vtApi } from "@/lib/api-vt";
import { transformVTToUI } from "@/lib/vtMapper";
import { VTAnalysisResponse } from "@/lib/vt-interfaces";
import { saveScanResult } from "@/lib/scanHistory";
import { calculateFinalVerdict, calculateAdjustedScore, type RiskFlags } from "@/lib/riskDecisionLogic";
//import {generatePDFReport} from "@/lib/pdfReportGenerator";
//import { generateFilePdfReport} from "@lib/filepdfReport"
//import { generateFilePdfReport } from "@/lib/filepdfReport";
interface FileScannerProps {
  onScanComplete: () => void;
  isAuthenticated?: boolean;
  userName?: string;
  scanData: { file: File | null; result: any };
  setScanData: (data: { file: File | null; result: any }) => void;
}

const getVerdictInfo = (score: number, status: string) => {
  if (status === "safe") {
    return { bar: "bg-[#00ff9c]", text: "text-[#00ff9c]", bg: "bg-[#00ff9c]/10", label: "✓ Safe", description: "Risk Score (0–100): No threats detected", score };
  } else if (status === "low" || status === "moderate") {
    return { bar: "bg-[#ffcc00]", text: "text-[#ffcc00]", bg: "bg-[#ffcc00]/10", label: "⚠ " + (status === "low" ? "Low Risk" : "Moderate Risk"), description: "Risk Score (0–100): Based on detected threats", score };
  } else {
    return { bar: "bg-[#ff4d4d]", text: "text-[#ff4d4d]", bg: "bg-[#ff4d4d]/10", label: "✕ " + (status === "high" ? "High Risk" : "Dangerous"), description: "Risk Score (0–100): Widespread malicious detections", score };
  }
};

const calculateHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const FileScanner = ({ onScanComplete, isAuthenticated = false, userName, scanData, setScanData }: FileScannerProps) => {
  const [file, setFile] = useState<File | null>(scanData.file || null);
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [result, setResult] = useState<FileAnalysis | null>(scanData.result || null);
  const [scanProgress, setScanProgress] = useState(0);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setResult(null); }
  }, []);

const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const f = e.target.files?.[0];
  if (f) { 
    // 1. Update local state for UI display
    setFile(f); 
    
    // 2. Clear old results
    setResult(null); 
    setScanComplete(false);
    console.log(f);
    // 3. Update the shared state so the API logic has access to the actual File object
    setScanData({ file: f, result: null }); 
    console.log("scan Data" , scanData);
    console.log("file state", file);
  }
};
  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    toast({
      title: message,
      variant: type === "error" ? "destructive" : "default",
    });
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setScanProgress(0);
    setScanComplete(false);
    setScanData({ file: null, result: null });
    showToast("File scan cleared", "info");
  };
const handleScan = async () => {
  if (!file) {
    showToast("Please select a file first", "error");
    return;
  }

  // GUEST ACCESS CHECK: Verify scan limit before proceeding
  const scanAccess = handleScanAttempt();
  if (!scanAccess.success) {
    // Guest limit reached - block scan and show message
    showToast(scanAccess.message, "error");
    return;
  }

  // Show guest scan info (only for guests)
  if (!isAuthenticated) {
    showToast(`📝 ${scanAccess.message}`, "info");
  }
  
  setScanning(true);
  setScanProgress(10);

  try {
    // 1. Calculate file hash
    const fileHash = await calculateHash(file);
    let rawResult: any = null;

    // 2. Try to get existing file report by hash
    try {
      rawResult = await vtApi.getFileReport(fileHash);
    } catch (e) {
      console.log("File not found in VT or error fetching. Will upload.");
    }

    if (rawResult) {
      setScanProgress(100);
    } else {
      // 3. Upload file
      const analysisId = await vtApi.uploadAndScan(file);
      setScanProgress(40);

      // 4. Poll for completion (VT analysis is async)
      let isCompleted = false;
      let retryCount = 0;

      while (!isCompleted && retryCount < 15) {
        const analysisResult = await vtApi.getAnalysisResults(analysisId);
        if (analysisResult.data.attributes.status === "completed") {
          isCompleted = true;
          // VT requires the file report for full details after analysis
          rawResult = await vtApi.getFileReport(fileHash) || analysisResult;
          break;
        }
        retryCount++;
        setScanProgress(40 + (retryCount * 4));
        await new Promise(r => setTimeout(r, 2000)); // Wait 2 seconds
      }

      if (!isCompleted || !rawResult) {
         throw new Error("Analysis timed out");
      }
    }

    // Normalize rawResult for mapper (handles both file and analysis reports)
    const normalizedResult: VTAnalysisResponse = {
      data: {
        type: "analysis",
        id: rawResult.data?.id || "unknown",
        attributes: {
          status: "completed",
          stats: rawResult.data?.attributes?.last_analysis_stats || rawResult.data?.attributes?.stats,
          results: rawResult.data?.attributes?.last_analysis_results || rawResult.data?.attributes?.results
        }
      },
      meta: {
        file_info: {
          sha256: fileHash
        }
      }
    };

    // 5. Map to UI Interface
    const formattedResult = transformVTToUI(normalizedResult, file.name);
    
    // Calculate readable file size
    formattedResult.fileSize = (file.size / 1024).toFixed(2) + " KB";

    // 6. Update States
    setResult(formattedResult);
    setScanData({ file, result: formattedResult });
    setScanProgress(100);

    // 7. Save Scan Record
    await saveScanResult({
      type: "file",
      target: file.name,
      hash: fileHash,
      malicious: formattedResult.vtStats?.malicious || 0,
      suspicious: formattedResult.vtStats?.suspicious || 0,
      harmless: formattedResult.vtStats?.harmless || 0,
      undetected: formattedResult.vtStats?.undetected || 0,
      risk_score: formattedResult.score,
      status: formattedResult.status
    });

    // Success Feedback
    if (formattedResult.status === "suspicious") showToast("Warning: Potential risks identified", "error");
    else showToast("Scan completed successfully", "success");

  } catch (err) {
    console.error("Scanning failed:", err);
    showToast("Analysis failed. Try a smaller file.", "error");
  } finally {
    setScanning(false);
    setScanComplete(true);
    onScanComplete();
  }
};
const handleGenerateReport = async () => {
  const reportResult = result || scanData.result;

  if (!reportResult) {
    showToast("❌ No Scan Result Found. Please scan the file again.", "error");
    return;
  }

  setDownloadingReport(true);
  try {
    const fileData = reportResult as FileAnalysis;
    await generatePDFReport({
      scanType: "file",
      target: fileData.fileName,
      result: fileData,
      userName: userName,
    });
    showToast("✅ Security Report Downloaded", "success");
  } catch (error) {
    console.error("PDF Generation Error:", error);
    showToast("❌ Failed to generate PDF report", "error");
  } finally {
    setDownloadingReport(false);
  }
};

const handleShare = async () => {
  const reportResult = result || scanData.result;
  if (!reportResult) {
    showToast("❌ No Scan Result. Please scan a file first.", "error");
    return;
  }

  setSharing(true);

  // Helper: download PDF as fallback
  const downloadFallback = (blob: Blob) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "APGS_Report.pdf";
    link.click();
    URL.revokeObjectURL(link.href);
    showToast("⬇️ Download started — Sharing not supported on this device", "info");
  };

  try {
    const fileData = reportResult as FileAnalysis;

    // 1. Generate PDF Blob
    const pdfBlob = await generatePDFBlob({
      scanType: "file",
      target: fileData.fileName,
      result: fileData,
      userName: userName,
    });

    // 2. Convert to File
    const pdfFile = new File([pdfBlob], "APGS_Report.pdf", { type: "application/pdf" });

    // 3. Check file-share support (canShare can itself throw on some browsers)
    let canShareFiles = false;
    try {
      canShareFiles = !!(navigator.canShare && navigator.canShare({ files: [pdfFile] }));
    } catch {
      canShareFiles = false;
    }

    if (canShareFiles) {
      await navigator.share({ files: [pdfFile] });
      showToast("✅ Shared Successfully", "success");
    } else {
      downloadFallback(pdfBlob);
    }
  } catch (err: any) {
    // User cancelled the share sheet — silent
    if (err?.name === "AbortError") return;
    // Device/browser doesn't support sharing — fallback to download
    if (err?.name === "NotAllowedError" || err?.name === "NotSupportedError" || err instanceof TypeError) {
      try {
        const fileData = (result || scanData.result) as FileAnalysis;
        const blob = await generatePDFBlob({ scanType: "file", target: fileData.fileName, result: fileData, userName });
        downloadFallback(blob);
      } catch {
        showToast("❌ Failed to generate report", "error");
      }
      return;
    }
    // Genuine share failure
    showToast("❌ Share Failed", "error");
  } finally {
    setSharing(false);
  }
};
  const scoreInfo = result ? getVerdictInfo(result.score, result.status) : null;
  return (
    <section className="bg-card border border-border rounded-lg p-6 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
      <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5 text-primary" /> File Scanner
      </h2>
      {!isAuthenticated && (
        <div className="mb-4 rounded-lg border border-border/40 bg-primary/10 p-3 text-sm text-primary">
          Login to save your scan history when signed in.
        </div>
      )}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
      >
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileUp className="w-6 h-6 text-primary" />
            <span className="text-foreground font-mono text-sm">{file.name}</span>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-muted-foreground hover:text-destructive">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="cursor-pointer">
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Drag & drop or <span className="text-primary underline">browse</span></p>
            <input type="file" className="hidden" onChange={handleFileSelect} />
          </label>
        )}
      </div>
      {file && (
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <Button onClick={handleScan} disabled={scanning} className="font-heading hover:shadow-[0_0_16px_hsl(150_100%_45%/0.3)] transition-shadow">
            {scanning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scanning...</> : "Scan File"}
          </Button>
          <Button onClick={handleReset} disabled={scanning} variant="outline" className="font-heading border-border hover:bg-card/70 transition gap-2">
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        </div>
      )}

      {scanning && (
        <div className="mt-4 space-y-2 animate-fade-in-up">
          <p className="text-muted-foreground text-sm font-mono">Analyzing file security...</p>
          <Progress value={scanProgress} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">{Math.round(scanProgress)}%</p>
        </div>
      )}

      {!scanning && !scanComplete && !result && (
        <div className="mt-6 rounded-lg border border-border p-4 bg-muted/30 text-sm text-muted-foreground">
          <p className="font-heading font-semibold text-foreground">Risk Report</p>
          <p className="mt-1">No report generated yet. Upload a file and run a scan to view the risk report section.</p>
        </div>
      )}

      {!scanning && scanComplete && !result && (
        <div className="mt-6 rounded-lg border border-border p-4 bg-yellow-500/10 text-sm text-warning-foreground">
          <p className="font-heading font-semibold text-warning-foreground">Scan finished with no result</p>
          <p className="mt-1">Something went wrong generating the file report. Try again.</p>
        </div>
      )}

      {result && scoreInfo && (
        <section className="mt-6 flex justify-center">
          <div className="w-full max-w-4xl rounded-2xl border border-[#00e0ff] bg-[#111827] p-6 shadow-2xl shadow-[#00e0ff]/30 backdrop-blur-xl animate-fade-in-up">
            {/* Header */}
            <div className="mb-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Shield className="w-8 h-8 text-[#00e0ff] drop-shadow-[0_0_20px_rgba(0,224,255,0.7)]" />
                <h3 className="text-2xl font-heading font-bold text-[#e5e7eb] drop-shadow-[0_0_15px_rgba(0,224,255,0.5)]">
                  APGS File Security Report
                </h3>
              </div>
              <p className="text-sm text-[#9ca3af]">Comprehensive file analysis completed</p>
              <p className="text-xs text-[#9ca3af] mt-1">Scanned on {new Date().toLocaleString()}</p>
            </div>

            {/* Main Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* File Details Card */}
              <div className="rounded-xl border border-[#00e0ff]/35 bg-[#1f2937] p-5 shadow-lg hover:shadow-[#00e0ff]/20 transition-all duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-[#00e0ff] drop-shadow-[0_0_10px_rgba(0,224,255,0.7)]" />
                  <h4 className="text-sm font-heading font-bold text-[#e5e7eb] uppercase tracking-wider">File Details</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[#00ff9c] text-sm">📁</span>
                    <div>
                      <p className="text-xs text-[#9ca3af] uppercase">Name</p>
                      <p className="text-sm text-[#e5e7eb] font-mono truncate">{result.fileName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#00ff9c] text-sm">💾</span>
                    <div>
                      <p className="text-xs text-[#9ca3af] uppercase">Size</p>
                      <p className="text-sm text-[#e5e7eb]">{result.fileSize}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#00ff9c] text-sm">📄</span>
                    <div>
                      <p className="text-xs text-[#9ca3af] uppercase">Type</p>
                      <p className="text-sm text-[#e5e7eb]">{result.fileName.split('.').pop()?.toUpperCase() || 'Unknown'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scan Result Card */}
              <div className="rounded-xl border border-[#00e0ff]/35 bg-[#1f2937] p-5 shadow-lg hover:shadow-[#00e0ff]/20 transition-all duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-[#00e0ff] drop-shadow-[0_0_8px_rgba(0,224,255,0.7)]" />
                  <h4 className="text-sm font-heading font-bold text-[#e5e7eb] uppercase tracking-wider">Scan Result</h4>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border shadow-sm ${
                    result.status === 'safe' ? 'bg-[#00ff9c]/25 text-[#00ff9c] border-[#00ff9c]/60 shadow-[#00ff9c]/40' :
                    (result.status === 'low' || result.status === 'moderate') ? 'bg-[#ffcc00]/25 text-[#ffcc00] border-[#ffcc00]/60 shadow-[#ffcc00]/40' :
                    'bg-[#ff4d4d]/25 text-[#ff4d4d] border-[#ff4d4d]/60 shadow-[#ff4d4d]/40'
                  }`}>
                    {result.status === 'safe' ? 'SAFE' : result.status === 'low' ? 'LOW RISK' : result.status === 'moderate' ? 'MODERATE' : result.status === 'high' ? 'HIGH RISK' : 'DANGEROUS'}
                  </span>
                  <span className="text-xs text-[#9ca3af]">Risk: {scoreInfo.label}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <svg viewBox="0 0 100 100" className="w-20 h-20 transform -rotate-90">
                      <circle cx="50" cy="50" r="40" stroke="#334155" strokeWidth="8" fill="none" />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={
                          result.status === 'safe' ? '#00ff9c' :
                          (result.status === 'low' || result.status === 'moderate') ? '#ffcc00' : '#ff4d4d'
                        }
                        strokeWidth="8"
                        strokeDasharray={`${(scoreInfo.score / 100) * 251.2} 251.2`}
                        strokeLinecap="round"
                        fill="none"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-slate-100">{scoreInfo.score}%</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ease-out ${
                          result.status === 'safe' ? 'bg-[#00ff9c]' :
                          (result.status === 'low' || result.status === 'moderate') ? 'bg-[#ffcc00]' : 'bg-[#ff4d4d]'
                        }`}
                        style={{ width: `${scoreInfo.score}%` }}
                      />
                    </div>
                    <p className="text-xs text-[#9ca3af] mt-1">Risk Score</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modern Risk Analysis Report */}
            <div className="mt-8">
              <RiskAnalysisReport
                data={{
                  scanType: "file",
                  status: result.status,
                  score: result.score,
                  details: result.reasons.map(r => r.label).join(", "),
                  threats: result.reasons.filter(r => r.flagged).map(r => r.label),
                  timestamp: new Date().toISOString(),
                  userName: userName,
                  targetItem: file?.name || "Unknown file",
                  flags: result.flags,
                }}
              />
            </div>

            {/* Analysis Grid */}
            <div className="mt-6">
              <h4 className="text-sm font-heading font-bold text-[#e5e7eb] uppercase tracking-wider mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-[#00e0ff] drop-shadow-[0_0_8px_rgba(0,224,255,0.6)]" />
                Analysis Details
              </h4>
              <div className="grid gap-3 md:grid-cols-2">
                {result.reasons.map((r, i) => (
                  <div
                    key={i}
                    className={`rounded-lg border p-4 transition-all duration-300 hover:scale-105 ${
                      r.flagged
                        ? 'border-[#ff4d4d]/60 bg-[#1f2937] hover:shadow-[0_0_20px_rgba(255,77,77,0.3)]'
                        : 'border-[#00ff9c]/60 bg-[#1f2937] hover:shadow-[0_0_20px_rgba(0,255,156,0.3)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{r.flagged ? '❌' : '✔️'}</span>
                      <h5 className="text-sm font-semibold text-slate-100">{r.label}</h5>
                    </div>
                    <p className="text-xs text-slate-300 mb-1">{r.value}</p>
                    <p className={`text-xs font-medium ${
                      r.flagged ? 'text-[#ff4d4d]' : 'text-[#00ff9c]'
                    }`}>
                      {r.flagged ? 'THREAT DETECTED' : 'CLEAN'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Final Verdict */}
            <div className="mt-6">
              <h4 className="text-sm font-heading font-bold text-[#e5e7eb] uppercase tracking-wider mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#00e0ff] drop-shadow-[0_0_8px_rgba(0,224,255,0.6)]" />
                Final Verdict
              </h4>
              <div className={`rounded-xl border p-5 text-center bg-[#1f2937] border-l-4 ${
                result.status === 'safe' 
                  ? 'border-[#00ff9c] bg-[#0b2b1f] shadow-[0_0_30px_rgba(0,255,156,0.12)]' 
                  : (result.status === 'low' || result.status === 'moderate')
                  ? 'border-[#ffcc00] bg-[#2f2b0b] shadow-[0_0_30px_rgba(255,204,0,0.15)]'
                  : 'border-[#ff4d4d] bg-[#2f0b0b] shadow-[0_0_30px_rgba(255,77,77,0.16)]'
              }`}>
                <div className="flex items-center justify-center gap-3 mb-3">
                  <span className="text-2xl">
                    {result.status === 'safe' ? '🛡️' : (result.status === 'high' || result.status === 'dangerous') ? '🚨' : '⚠️'}
                  </span>
                  <h5 className={`text-xl font-bold ${
                    result.status === 'safe' ? 'text-[#00ff9c]' :
                    (result.status === 'low' || result.status === 'moderate') ? 'text-[#ffcc00]' : 'text-[#ff4d4d]'
                  }`}>
                    {result.status === 'safe' ? 'SAFE TO OPEN' : 
                     result.status === 'low' ? 'LOW RISK DETECTED' :
                     result.status === 'moderate' ? 'INSPECT WITH CAUTION (MODERATE)' :
                     result.status === 'high' ? 'HIGH RISK DETECTED' : 'DO NOT OPEN (DANGEROUS)'}
                  </h5>
                </div>
                <p className="text-sm text-slate-300">
                  {result.status === 'safe'
                    ? 'No critical threats detected. This file appears safe, but continue monitoring for new threats.'
                    : (result.status === 'low' || result.status === 'moderate')
                    ? 'Some risk identified. Proceed with caution and verify file source before use.'
                    : 'Dangerous file detected! Quarantine immediately and do not execute. Report to security team.'}
                </p>
              </div>
            </div>

            {/* Download & Share Buttons */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                id="file-download-report-btn"
                onClick={handleGenerateReport}
                disabled={downloadingReport || sharing}
                className="flex items-center justify-center gap-2 font-heading hover:shadow-[0_0_20px_hsl(150_100%_45%/0.4)] transition-all duration-300"
              >
                {downloadingReport ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                ) : (
                  <><Download className="w-4 h-4" /> Download</>
                )}
              </Button>
              <Button
                id="file-share-report-btn"
                onClick={handleShare}
                disabled={sharing || downloadingReport}
                className="flex items-center justify-center gap-2 font-heading hover:shadow-[0_0_20px_hsl(150_100%_45%/0.4)] transition-all duration-300"
              >
                {sharing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sharing...</>
                ) : (
                  <><span className="text-base leading-none">📤</span> Share</>
                )}
              </Button>
            </div>
          </div>
        </section>
      )}
    </section>
  );
};

export default FileScanner;
