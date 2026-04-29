import type { VTAnalysisResponse } from "./vt-interfaces";

const BASE_URL = "https://www.virustotal.com/api/v3";
const API_KEY = import.meta.env.VITE_VIRUSTOTAL_API_KEY;

export const vtApi = {
  /**
   * Step 1: Upload the file for analysis
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
      throw new Error(errorData.error?.message || "File analysis upload failed");
    }

    const json = await response.json();
    return json.data.id;
  },

  /**
   * Step 1 (Alternative): Submit URL for analysis
   */
  async submitUrl(url: string): Promise<string> {
    const response = await fetch(`${BASE_URL}/urls`, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "x-apikey": API_KEY!,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ url }).toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "URL analysis submission failed");
    }

    const json = await response.json();
    return json.data.id;
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
  },

  /**
   * Step 3: Get the full file report using the file hash (SHA-256)
   */
  async getFileReport(hash: string): Promise<any> {
    const response = await fetch(`${BASE_URL}/files/${hash}`, {
      method: "GET",
      headers: {
        "accept": "application/json",
        "x-apikey": API_KEY!,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch file report: ${response.statusText}`);
    }

    return await response.json();
  },

  /**
   * Combined: Submit URL + Poll (Legacy support)
   */
  async scanUrlWithVT(url: string) {
    const analysisId = await this.submitUrl(url);
    // Poll for completion (simple version for legacy compatibility)
    for (let i = 0; i < 10; i++) {
      const result = await this.getAnalysisResults(analysisId);
      if (result.data.attributes.status === "completed") {
        return {
          analysisId,
          stats: result.data.attributes.stats,
          results: result.data.attributes.results,
          url: result.meta?.url_info?.url ?? url,
        };
      }
      await new Promise(r => setTimeout(r, 2000));
    }
    throw new Error("Analysis engine timed out. Please try again.");
  }
};