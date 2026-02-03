/**
 * Token Manager Utility
 * Provides secure token storage, validation, and management functionality
 * Implements the token management requirements from the design document
 */

// supabase-js does not reliably export Session as a named type across versions.
// Define the minimal Session shape we need.
export type SessionLike = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: { id: string };
};

// Token storage configuration
const TOKEN_CONFIG = {
  STORAGE_KEY: 'supabase.auth.token',
  SESSION_KEY: 'supabase.auth.session',
  REFRESH_BUFFER: 60000, // Refresh 1 minute before expiry
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// Session data interface for secure storage
export interface SecureSessionData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user_id: string;
  created_at: number;
  last_refreshed?: number;
}

// Token validation result
export interface TokenValidationResult {
  isValid: boolean;
  isExpired: boolean;
  expiresIn: number; // milliseconds until expiry
  needsRefresh: boolean; // true if should refresh soon
}

/**
 * Secure Token Storage Manager
 * Handles encryption-like encoding and secure storage of authentication tokens
 */
export class TokenManager {
  private static instance: TokenManager;
  private retryCount = 0;

  private constructor() {}

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * Store session data securely with base64 encoding
   */
  public storeSession(session: SessionLike): boolean {
    try {
      const sessionData: SecureSessionData = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at || 0,
        user_id: session.user.id,
        created_at: Date.now(),
        last_refreshed: Date.now(),
      };

      // Encode session data for secure storage
      const encoded = this.encodeSessionData(sessionData);
      localStorage.setItem(TOKEN_CONFIG.STORAGE_KEY, encoded);
      
      // Store session metadata separately
      const metadata = {
        user_id: session.user.id,
        expires_at: session.expires_at,
        stored_at: Date.now(),
      };
      localStorage.setItem(TOKEN_CONFIG.SESSION_KEY, JSON.stringify(metadata));

      this.retryCount = 0; // Reset retry count on successful storage
      return true;
    } catch (error) {
      console.error('Failed to store session:', error);
      return false;
    }
  }

  /**
   * Retrieve stored session data
   */
  public getStoredSession(): SecureSessionData | null {
    try {
      const encoded = localStorage.getItem(TOKEN_CONFIG.STORAGE_KEY);
      if (!encoded) return null;

      const sessionData = this.decodeSessionData(encoded);
      
      // Validate session data integrity
      if (!this.validateSessionData(sessionData)) {
        this.clearStoredSession();
        return null;
      }

      return sessionData;
    } catch (error) {
      console.error('Failed to retrieve session:', error);
      this.clearStoredSession();
      return null;
    }
  }

  /**
   * Validate token and determine if refresh is needed
   */
  public validateToken(sessionData: SecureSessionData): TokenValidationResult {
    const now = Date.now();
    const expiresAt = sessionData.expires_at * 1000; // Convert to milliseconds
    const expiresIn = expiresAt - now;
    const isExpired = expiresIn <= 0;
    const needsRefresh = expiresIn <= TOKEN_CONFIG.REFRESH_BUFFER;

    return {
      isValid: !isExpired && this.validateSessionData(sessionData),
      isExpired,
      expiresIn: Math.max(0, expiresIn),
      needsRefresh: needsRefresh && !isExpired,
    };
  }

  /**
   * Clear all stored session data
   */
  public clearStoredSession(): void {
    try {
      localStorage.removeItem(TOKEN_CONFIG.STORAGE_KEY);
      localStorage.removeItem(TOKEN_CONFIG.SESSION_KEY);
      this.retryCount = 0;
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  /**
   * Update last refreshed timestamp
   */
  public updateRefreshTimestamp(sessionData: SecureSessionData): boolean {
    try {
      const updatedData = {
        ...sessionData,
        last_refreshed: Date.now(),
      };
      
      const encoded = this.encodeSessionData(updatedData);
      localStorage.setItem(TOKEN_CONFIG.STORAGE_KEY, encoded);
      return true;
    } catch (error) {
      console.error('Failed to update refresh timestamp:', error);
      return false;
    }
  }

  /**
   * Get session metadata without decoding full session
   */
  public getSessionMetadata(): { user_id: string; expires_at: number; stored_at: number } | null {
    try {
      const metadata = localStorage.getItem(TOKEN_CONFIG.SESSION_KEY);
      return metadata ? JSON.parse(metadata) : null;
    } catch (error) {
      console.error('Failed to get session metadata:', error);
      return null;
    }
  }

  /**
   * Check if retry should be attempted
   */
  public shouldRetry(): boolean {
    return this.retryCount < TOKEN_CONFIG.MAX_RETRY_ATTEMPTS;
  }

  /**
   * Increment retry count and add delay
   */
  public async incrementRetryWithDelay(): Promise<void> {
    this.retryCount++;
    if (this.retryCount < TOKEN_CONFIG.MAX_RETRY_ATTEMPTS) {
      await new Promise(resolve => setTimeout(resolve, TOKEN_CONFIG.RETRY_DELAY * this.retryCount));
    }
  }

  /**
   * Reset retry count
   */
  public resetRetryCount(): void {
    this.retryCount = 0;
  }

  /**
   * Encode session data for secure storage
   */
  private encodeSessionData(data: SecureSessionData): string {
    try {
      // Add checksum for integrity validation
      const dataWithChecksum = {
        ...data,
        checksum: this.generateChecksum(data),
      };
      return btoa(JSON.stringify(dataWithChecksum));
    } catch (error) {
      throw new Error('Failed to encode session data');
    }
  }

  /**
   * Decode session data from storage
   */
  private decodeSessionData(encoded: string): SecureSessionData {
    try {
      const decoded = JSON.parse(atob(encoded));
      
      // Verify checksum
      const { checksum, ...sessionData } = decoded;
      if (checksum !== this.generateChecksum(sessionData)) {
        throw new Error('Session data integrity check failed');
      }
      
      return sessionData;
    } catch (error) {
      throw new Error('Failed to decode session data');
    }
  }

  /**
   * Generate simple checksum for data integrity
   */
  private generateChecksum(data: SecureSessionData): string {
    const str = `${data.access_token}-${data.user_id}-${data.expires_at}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Validate session data structure and content
   */
  private validateSessionData(data: any): data is SecureSessionData {
    return (
      data &&
      typeof data.access_token === 'string' &&
      typeof data.refresh_token === 'string' &&
      typeof data.expires_at === 'number' &&
      typeof data.user_id === 'string' &&
      typeof data.created_at === 'number' &&
      data.access_token.length > 0 &&
      data.refresh_token.length > 0 &&
      data.user_id.length > 0 &&
      data.expires_at > 0
    );
  }
}

// Export singleton instance
export const tokenManager = TokenManager.getInstance();

// Export utility functions
export const isTokenExpired = (expiresAt: number): boolean => {
  return Date.now() >= expiresAt * 1000;
};

export const getTimeUntilExpiry = (expiresAt: number): number => {
  return Math.max(0, (expiresAt * 1000) - Date.now());
};

export const shouldRefreshToken = (expiresAt: number): boolean => {
  return getTimeUntilExpiry(expiresAt) <= TOKEN_CONFIG.REFRESH_BUFFER;
};