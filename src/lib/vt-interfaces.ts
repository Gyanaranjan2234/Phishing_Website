export interface VTAnalysisResponse {
  data: {
    attributes: {
      stats: {
        malicious: number;
        suspicious: number;
        undetected: number;
        harmless: number;
        [key: string]: number;
      };
      results: Record<string, {
        engine_name: string;
        category: string;
        result: string | null;
      }>;
      status: string;
    };
  };
  meta: {
    file_info: {
      sha256: string;
      size: number;
    };
  };
}