export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const token = localStorage.getItem("token");
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status}: ${errorText || response.statusText}`);
  }

  return response;
}

/**
 * Fetch market trends with custom symbols
 * @param symbols Array of ticker symbols or comma-separated string
 */
export const fetchMarketTrends = async (symbols?: string[] | string) => {
  let symbolsParam = "";
  
  if (Array.isArray(symbols)) {
    symbolsParam = symbols.join(",");
  } else if (typeof symbols === "string") {
    symbolsParam = symbols;
  }
  
  const url = symbolsParam ? `/api/market/trends?symbols=${symbolsParam}` : "/api/market/trends";
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch market trends: ${response.statusText}`);
  }
  
  return response.json();
};

/**
 * Get API service status and configuration
 */
export const getApiStatus = async () => {
  const response = await fetch("/api/market/status");
  
  if (!response.ok) {
    throw new Error(`Failed to fetch API status: ${response.statusText}`);
  }
  
  return response.json();
};
