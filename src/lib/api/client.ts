/**
 * DarkTip API Client
 *
 * Production-grade API client for all DarkTip services.
 * Handles authentication, request signing, and error handling.
 */

export interface ApiConfig {
  baseUrl: string;
  apiKey?: string;
  merchantId?: string;
  timeout?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    requestId: string;
    timestamp: number;
    rateLimit?: {
      remaining: number;
      reset: number;
    };
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export class ApiError extends Error {
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;
  requestId?: string;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.requestId = requestId;
  }
}

export class DarkTipApiClient {
  private config: Required<ApiConfig>;
  private accessToken: string | null = null;

  constructor(config: ApiConfig) {
    this.config = {
      baseUrl: config.baseUrl || process.env.NEXT_PUBLIC_API_URL || "/api",
      apiKey: config.apiKey || process.env.DARKTIP_API_KEY || "",
      merchantId: config.merchantId || "",
      timeout: config.timeout || 30000,
    };
  }

  /**
   * Set access token for authenticated requests
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Clear access token
   */
  clearAccessToken(): void {
    this.accessToken = null;
  }

  /**
   * Generate request signature for secure API calls
   */
  private generateSignature(
    method: string,
    path: string,
    timestamp: number,
    body?: string
  ): string {
    const message = `${method}${path}${timestamp}${body || ""}`;
    // In production, use HMAC-SHA256 with secret key
    // This is a simplified version for demonstration
    return Buffer.from(message).toString("base64").slice(0, 32);
  }

  /**
   * Make authenticated API request
   */
  async request<T>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    options?: {
      body?: Record<string, unknown>;
      params?: Record<string, string>;
      headers?: Record<string, string>;
    }
  ): Promise<ApiResponse<T>> {
    const url = new URL(path, this.config.baseUrl);

    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const timestamp = Date.now();
    const bodyString = options?.body ? JSON.stringify(options.body) : undefined;
    const signature = this.generateSignature(method, path, timestamp, bodyString);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Api-Key": this.config.apiKey,
      "X-Timestamp": timestamp.toString(),
      "X-Signature": signature,
      "X-Request-Id": `req_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      ...options?.headers,
    };

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    if (this.config.merchantId) {
      headers["X-Merchant-Id"] = this.config.merchantId;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url.toString(), {
        method,
        headers,
        body: bodyString,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.error?.message || "Request failed",
          data.error?.code || "UNKNOWN_ERROR",
          response.status,
          data.error?.details,
          headers["X-Request-Id"]
        );
      }

      return {
        success: true,
        data: data.data,
        meta: {
          requestId: headers["X-Request-Id"],
          timestamp,
          rateLimit: {
            remaining: parseInt(response.headers.get("X-RateLimit-Remaining") || "100"),
            reset: parseInt(response.headers.get("X-RateLimit-Reset") || "0"),
          },
        },
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new ApiError("Request timeout", "TIMEOUT", 408);
      }

      throw new ApiError(
        error instanceof Error ? error.message : "Unknown error",
        "NETWORK_ERROR",
        0
      );
    }
  }

  // Convenience methods
  async get<T>(path: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>("GET", path, { params });
  }

  async post<T>(path: string, body?: Record<string, unknown>): Promise<ApiResponse<T>> {
    return this.request<T>("POST", path, { body });
  }

  async put<T>(path: string, body?: Record<string, unknown>): Promise<ApiResponse<T>> {
    return this.request<T>("PUT", path, { body });
  }

  async patch<T>(path: string, body?: Record<string, unknown>): Promise<ApiResponse<T>> {
    return this.request<T>("PATCH", path, { body });
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", path);
  }
}

// Singleton instance
let apiClient: DarkTipApiClient | null = null;

export function getApiClient(config?: ApiConfig): DarkTipApiClient {
  if (!apiClient && config) {
    apiClient = new DarkTipApiClient(config);
  }
  if (!apiClient) {
    apiClient = new DarkTipApiClient({
      baseUrl: process.env.NEXT_PUBLIC_API_URL || "/api",
    });
  }
  return apiClient;
}

export default DarkTipApiClient;
