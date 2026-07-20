import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";

const PlanningContext = createContext(null);

// ---- JSONBin config -------------------------------------------------------
// Replace with your actual JSONBin base + master key handling (kept out of
// source in your real repo — likely an env var or a serverless proxy).
const JSONBIN_BASE = "https://api.jsonbin.io/v3/b";

const DEFAULT_PLANNING_STATE = {
  budget: null,
  retirement: null,
  emergency: null,
  loan: null,
  fire: null,
  savingsRate: null,
  pockets: null,
  bookkeeping: null,
  // New slice for this feature. Keep every planning tab's data under one
  // vault object so a single JSONBin write covers all tabs.
  bankability: {
    ccris: 5.0,
    housing: 4.0,
    utilization: 4.0,
    experience: 4.0,
    hasTradeRefs: true,
    hasLegalCase: false,
    lastUpdated: null,
  },
};

export function PlanningProvider({ children }) {
  const [vaultId, setVaultId] = useState(() => localStorage.getItem("moneymap_vault_id") || null);
  const [vaultStatus, setVaultStatus] = useState(vaultId ? "synced" : "local"); // 'local' | 'syncing' | 'synced' | 'error'
  const [planningData, setPlanningData] = useState(DEFAULT_PLANNING_STATE);

  // --- Stale-closure fix: the debounced save must always read the LATEST
  // data and vault id, not whatever was captured when the timer was set.
  const latestData = useRef(planningData);
  const vaultRef = useRef(vaultId);
  const saveTimer = useRef(null);

  useEffect(() => {
    latestData.current = planningData;
  }, [planningData]);

  useEffect(() => {
    vaultRef.current = vaultId;
  }, [vaultId]);

  // --- Load vault on mount if one is already joined ---
  useEffect(() => {
    if (!vaultId) return;
    (async () => {
      try {
        setVaultStatus("syncing");
        const res = await fetch(`${JSONBIN_BASE}/${vaultId}/latest`);
        const json = await res.json();
        if (json?.record) {
          setPlanningData((prev) => ({ ...prev, ...json.record }));
        }
        setVaultStatus("synced");
      } catch (err) {
        console.error("Vault load failed:", err);
        setVaultStatus("error");
      }
    })();
  }, [vaultId]);

  // --- Debounced cloud save (800ms), always reading refs at fire-time ---
  const scheduleCloudSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const currentVault = vaultRef.current; // not the value captured at call time
      if (!currentVault) return; // local-only mode, nothing to sync
      try {
        setVaultStatus("syncing");
        await fetch(`${JSONBIN_BASE}/${currentVault}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(latestData.current),
        });
        setVaultStatus("synced");
      } catch (err) {
        console.error("Vault save failed:", err);
        setVaultStatus("error");
      }
    }, 800);
  }, []);

  // Generic updater any tab (including Bankability) can call
  const updatePlanning = useCallback(
    (slice, updates) => {
      setPlanningData((prev) => ({
        ...prev,
        [slice]: { ...prev[slice], ...updates, lastUpdated: new Date().toISOString() },
      }));
      scheduleCloudSave();
    },
    [scheduleCloudSave]
  );

  const joinVault = useCallback((binId) => {
    localStorage.setItem("moneymap_vault_id", binId);
    setVaultId(binId);
  }, []);

  const leaveVault = useCallback(() => {
    localStorage.removeItem("moneymap_vault_id");
    setVaultId(null);
    setVaultStatus("local");
  }, []);

  return (
    <PlanningContext.Provider
      value={{
        planningData,
        updatePlanning,
        vaultId,
        vaultStatus,
        joinVault,
        leaveVault,
      }}
    >
      {children}
    </PlanningContext.Provider>
  );
}

export function usePlanning() {
  const ctx = useContext(PlanningContext);
  if (!ctx) throw new Error("usePlanning must be used inside PlanningProvider");
  return ctx;
}
