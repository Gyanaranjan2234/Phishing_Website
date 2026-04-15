import type { VTAnalysisResponse } from "./vt-interfaces";

const BASE_URL = "https://www.virustotal.com/api/v3";
const API_KEY = import.meta.env.VITE_VIRUSTOTAL_API_KEY;

export const vtApi = {
  /**
   * Step 1: Upload the file to VirusTotal
   */
  async uploadAndScan(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${BASE_URL}/files`, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "x-apikey": API_KEY!,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Upload to VirusTotal failed");
    }

    const json = await response.json();
    return json.data.id; // This is the analysisId
  },

  /**
   * Step 2: Get the results using the analysisId
   */
  async getAnalysisResults(analysisId: string): Promise<VTAnalysisResponse> {
    const response = await fetch(`${BASE_URL}/analyses/${analysisId}`, {
      method: "GET",
      headers: {
        "accept": "application/json",
        "x-apikey": API_KEY!,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch report: ${response.statusText}`);
    }

    return await response.json();
  }
};