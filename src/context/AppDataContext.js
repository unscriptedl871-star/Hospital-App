import React, { createContext, useMemo } from "react";

export const AppDataContext = createContext(null);

/**
 * AppDataContext
 * ----------------
 * Appointments REMOVED
 * MongoDB backend is now the single source of truth
 *
 * Keep this context for future shared app-level data
 * (chat, notifications, reports, etc.)
 */

export function AppDataProvider({ children }) {
  const value = useMemo(
    () => ({
      // ✅ intentionally empty for now
      // add future shared state here
    }),
    []
  );

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
}
