// src/lib/guestAccess.ts
// Guest access control - limits scans for unauthenticated users

const GUEST_SCAN_LIMIT = 3; // Maximum scans allowed for guests
const GUEST_SCAN_COUNT_KEY = "guest_scan_count";

/**
 * Check if user is logged in
 * @returns true if user is authenticated, false if guest
 */
export const isUserLoggedIn = (): boolean => {
  const username = localStorage.getItem("username");
  const session = localStorage.getItem("user_session");
  return !!(username && session);
};

/**
 * Get current guest scan count
 * @returns number of scans performed by guest
 */
export const getGuestScanCount = (): number => {
  const count = localStorage.getItem(GUEST_SCAN_COUNT_KEY);
  return count ? parseInt(count, 10) : 0;
};

/**
 * Increment guest scan count
 * @returns new scan count
 */
export const incrementGuestScanCount = (): number => {
  const currentCount = getGuestScanCount();
  const newCount = currentCount + 1;
  localStorage.setItem(GUEST_SCAN_COUNT_KEY, newCount.toString());
  return newCount;
};

/**
 * Check if guest can perform a scan
 * @returns { allowed: boolean, count: number, limit: number, message: string }
 */
export const canGuestScan = (): { 
  allowed: boolean; 
  count: number; 
  limit: number; 
  message: string;
} => {
  // If user is logged in, always allow
  if (isUserLoggedIn()) {
    return {
      allowed: true,
      count: 0,
      limit: GUEST_SCAN_LIMIT,
      message: "Authenticated user - unlimited scans"
    };
  }

  // Check guest scan count
  const count = getGuestScanCount();
  
  if (count >= GUEST_SCAN_LIMIT) {
    return {
      allowed: false,
      count,
      limit: GUEST_SCAN_LIMIT,
      message: `Guest limit reached (${count}/${GUEST_SCAN_LIMIT}). Please login to continue scanning.`
    };
  }

  return {
    allowed: true,
    count,
    limit: GUEST_SCAN_LIMIT,
    message: `Guest scan ${count + 1} of ${GUEST_SCAN_LIMIT}`
  };
};

/**
 * Reset guest scan count (use after login or manually)
 */
export const resetGuestScanCount = (): void => {
  localStorage.removeItem(GUEST_SCAN_COUNT_KEY);
};

/**
 * Handle scan attempt - checks access and increments count if allowed
 * @returns { success: boolean, message: string }
 */
export const handleScanAttempt = (): { success: boolean; message: string } => {
  // Check if user is logged in
  if (isUserLoggedIn()) {
    return {
      success: true,
      message: "Authenticated user - scan allowed"
    };
  }

  // Guest user - check limit
  const { allowed, count, limit, message } = canGuestScan();

  if (!allowed) {
    return {
      success: false,
      message
    };
  }

  // Increment scan count
  const newCount = incrementGuestScanCount();
  
  return {
    success: true,
    message: `Guest scan ${newCount} of ${limit}`
  };
};
