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
import { generatePDFReport } from "@/lib/pdfReportGenerator";
import { vtApi } from "@/lib/api-vt";
import { transformVTToUI } from "@/lib/vtMapper";
import { VTAnalysisResponse } from "@/lib/vt-interfaces";
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

// Updated: Uses unified decision logic with flag priority
// Ensures threats are never downplayed as "Safe"
const getVerdictInfo = (score: number, flags?: RiskFlags) => {
  const verdict = calculateFinalVerdict(score, flags || {});
  const adjustedScore = calculateAdjustedScore(score, flags || {});

  if (verdict === "safe") {
    return { bar: "bg-primary", text: "text-primary", bg: "bg-primary/10", label: "✓ Safe", description: "Low Risk File", adjustedScore };
  } else if (verdict === "warning") {
    return { bar: "bg-accent", text: "text-accent", bg: "bg-accent/10", label: "⚠ Warning", description: "Medium Risk File", adjustedScore };
  } else {
    return { bar: "bg-destructive", text: "text-destructive", bg: "bg-destructive/10", label: "✕ Dangerous", description: "High Risk File", adjustedScore };
  }
};

const FileScanner = ({ onScanComplete, isAuthenticated = false, userName, scanData, setScanData }: FileScannerProps) => {
  const [file, setFile] = useState<File | null>(scanData.file || null);
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [result, setResult] = useState<FileAnalysis | null>(scanData.result || null);
  const [scanProgress, setScanProgress] = useState(0);
  const [downloadingReport, setDownloadingReport] = useState(false);

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
    // 1. Upload file
    console.log("File object:", file);
    console.log("scan Data" , scanData);
    // giving the file from scan data 
    const analysisId = await vtApi.uploadAndScan(file!);
    setScanProgress(40);

    // 2. Poll for completion (VT analysis is async)
    let rawResult: VTAnalysisResponse;
    let isCompleted = false;
    let retryCount = 0;

    while (!isCompleted && retryCount < 10) {
      rawResult = await vtApi.getAnalysisResults(analysisId);
      if (rawResult.data.attributes.status === "completed") {
        isCompleted = true;
        break;
      }
      retryCount++;
      setScanProgress(40 + (retryCount * 5));
      await new Promise(r => setTimeout(r, 2000)); // Wait 2 seconds
    }

    // 3. Map to UI Interface
    // @ts-ignore - ensuring we have the result after loop
    const formattedResult = transformVTToUI(rawResult, file.name);
    
    // Calculate readable file size
    formattedResult.fileSize = (file.size / 1024).toFixed(2) + " KB";

    // 4. Update States
    setResult(formattedResult);
    setScanData({ file, result: formattedResult });
    setScanProgress(100);

    // Success Feedback
    if (formattedResult.status === "infected") showToast("Threat detected!", "error");
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
  // Priority: Use local 'result' (the actual VT mapped data)
  const reportResult =  scanData || result;

  if (!reportResult) {
    showToast("❌ No Scan Result Found. Please scan the file again.", "error");
    return;
  }

  setDownloadingReport(true);
  try {
    // Ensure we are treating this strictly as FileAnalysis
    const fileData = reportResult as FileAnalysis;

    // Use the specific file generator we discussed
    // This ensures 'infected' status flows into the PDF
    await generatePDFReport({
      scanType: "file",
      target: fileData.fileName,
      result: fileData,
      userName: userName,
    } );  

    showToast("✅ Security Report Downloaded", "success");
  } catch (error) {
    console.error("PDF Generation Error:", error);
    showToast("❌ Failed to generate PDF report", "error");
  } finally {
    setDownloadingReport(false);
  }
};
  const scoreInfo = result ? getVerdictInfo(result.score, result.flags) : null;
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
                    result.status === 'infected' ? 'bg-[#ff4d4d]/25 text-[#ff4d4d] border-[#ff4d4d]/60 shadow-[#ff4d4d]/40' :
                    'bg-[#ffcc00]/25 text-[#ffcc00] border-[#ffcc00]/60 shadow-[#ffcc00]/40'
                  }`}>
                    {result.status === 'safe' ? 'SAFE' : result.status === 'infected' ? 'DANGER' : 'SUSPICIOUS'}
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
                          result.status === 'infected' ? '#ff4d4d' : '#ffcc00'
                        }
                        strokeWidth="8"
                        strokeDasharray={`${(scoreInfo.adjustedScore / 100) * 251.2} 251.2`}
                        strokeLinecap="round"
                        fill="none"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-slate-100">{scoreInfo.adjustedScore}%</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ease-out ${
                          result.status === 'safe' ? 'bg-[#00ff9c]' :
                          result.status === 'infected' ? 'bg-[#ff4d4d]' : 'bg-[#ffcc00]'
                        }`}
                        style={{ width: `${scoreInfo.adjustedScore}%` }}
                      />
                    </div>
                    <p className="text-xs text-[#9ca3af] mt-1">Security Score</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modern Risk Analysis Report */}
            <div className="mt-8">
              <RiskAnalysisReport
                data={{
                  scanType: "file",
                  status: result.status === 'infected' ? 'dangerous' : result.status,
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
                  : result.status === 'infected'
                  ? 'border-[#ff4d4d] bg-[#2f0b0b] shadow-[0_0_30px_rgba(255,77,77,0.16)]'
                  : 'border-[#ffcc00] bg-[#2f2b0b] shadow-[0_0_30px_rgba(255,204,0,0.15)]'
              }`}>
                <div className="flex items-center justify-center gap-3 mb-3">
                  <span className="text-2xl">
                    {result.status === 'safe' ? '🛡️' : result.status === 'infected' ? '🚨' : '⚠️'}
                  </span>
                  <h5 className={`text-xl font-bold ${
                    result.status === 'safe' ? 'text-[#00ff9c]' :
                    result.status === 'infected' ? 'text-[#ff4d4d]' : 'text-[#ffcc00]'
                  }`}>
                    {result.status === 'safe' ? 'SAFE TO OPEN' : 
                     result.status === 'infected' ? 'DO NOT OPEN' : 'INSPECT WITH CAUTION'}
                  </h5>
                </div>
                <p className="text-sm text-slate-300">
                  {result.status === 'safe'
                    ? 'No critical threats detected. This file appears safe, but continue monitoring for new threats.'
                    : result.status === 'infected'
                    ? 'Dangerous file detected! Quarantine immediately and do not execute. Report to security team.'
                    : 'Potential risks identified. Proceed with caution and verify file source before use.'}
                </p>
              </div>
            </div>

            {/* Download Button */}
            <div className="mt-6 flex justify-center">
              <Button
                onClick={handleGenerateReport}
                disabled={downloadingReport}
                className="flex items-center gap-2 px-6 py-3"
              >
                {downloadingReport ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>
                ) : (
                  <><Download className="w-5 h-5" /> Download Full PDF Report</>
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
