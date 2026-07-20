import React from "react";
import { usePlanning } from "../context/PlanningContext";

const STATUS_COPY = {
  local: { label: "Local only", color: "#8b98a9" },
  syncing: { label: "Syncing…", color: "#f4d97a" },
  synced: { label: "Synced", color: "#00c2ff" },
  error: { label: "Sync error", color: "#e05a5a" },
};

export default function PlanningVaultBadge() {
  const { vaultStatus } = usePlanning();
  const meta = STATUS_COPY[vaultStatus] || STATUS_COPY.local;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        color: meta.color,
        padding: "4px 10px",
        borderRadius: 999,
        border: `1px solid ${meta.color}55`,
        background: `${meta.color}11`,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.color }} />
      {meta.label}
    </div>
  );
}
