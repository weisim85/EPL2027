import React, { useState } from "react";
import { PlanningProvider } from "./context/PlanningContext";
import BankabilityScore from "./components/BankabilityScore";

// NOTE: Replace these placeholder components with your actual imports from
// your existing repo (Budget, Retirement, EmergencyFund, Loan, FIRE,
// SavingsRate, Pockets, Bookkeeping, etc). Only BankabilityScore is new here.
const PlaceholderTab = ({ name }) => (
  <div style={{ padding: 24, color: "#e5e7eb" }}>{name} tab goes here (existing component)</div>
);

// Drawer groups — same grouping pattern you already use (Planning, Wealth,
// Calculators, Investing, Tracking). Bankability Score sits in Planning,
// directly after Bookkeeping.
const NAV_GROUPS = [
  {
    label: "Planning",
    tabs: [
      { id: "budget", label: "Budget", icon: "📋" },
      { id: "retirement", label: "Retirement", icon: "🏖️" },
      { id: "emergency", label: "Emergency Fund", icon: "🛟" },
      { id: "loan", label: "Loan & Mortgage", icon: "🏠" },
      { id: "fire", label: "FIRE", icon: "🔥" },
      { id: "savingsRate", label: "Savings Rate", icon: "🎯" },
      { id: "pockets", label: "Pockets", icon: "🪙" },
      { id: "bookkeeping", label: "Bookkeeping", icon: "📒" },
      { id: "bankability", label: "Bankability Score", icon: "🏦" }, // new, right after Bookkeeping
    ],
  },
  // ...your other groups (Wealth, Calculators, Investing, Tracking) unchanged
];

function Drawer({ open, onClose, activeTab, onSelect }) {
  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40 }}
        />
      )}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 280,
          background: "#0f172a",
          borderRight: "1px solid #1f2937",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s ease",
          zIndex: 50,
          paddingTop: "env(safe-area-inset-top)", // fixes iPhone status-bar overlap
          overflowY: "auto",
        }}
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.label} style={{ padding: "12px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#8b98a9", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
              {group.label}
            </div>
            {group.tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  onSelect(tab.id);
                  onClose();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  minHeight: 52, // mobile tap-target size you're already using
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: activeTab === tab.id ? "rgba(0,194,255,0.1)" : "transparent",
                  color: activeTab === tab.id ? "#00c2ff" : "#e5e7eb",
                  fontSize: 14.5,
                  fontWeight: activeTab === tab.id ? 600 : 500,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

function TabContent({ activeTab }) {
  switch (activeTab) {
    case "bankability":
      return <BankabilityScore />;
    case "budget":
      return <PlaceholderTab name="Budget" />;
    case "retirement":
      return <PlaceholderTab name="Retirement" />;
    case "emergency":
      return <PlaceholderTab name="Emergency Fund" />;
    case "loan":
      return <PlaceholderTab name="Loan & Mortgage" />;
    case "fire":
      return <PlaceholderTab name="FIRE" />;
    case "savingsRate":
      return <PlaceholderTab name="Savings Rate" />;
    case "pockets":
      return <PlaceholderTab name="Pockets" />;
    case "bookkeeping":
      return <PlaceholderTab name="Bookkeeping" />;
    default:
      return <PlaceholderTab name="Home" />;
  }
}

export default function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("bookkeeping");

  return (
    <PlanningProvider>
      <div style={{ minHeight: "100vh", background: "#0a0f1a" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "12px 16px",
            paddingTop: "calc(12px + env(safe-area-inset-top))",
            borderBottom: "1px solid #1f2937",
          }}
        >
          <button
            onClick={() => setDrawerOpen(true)}
            style={{ background: "none", border: "none", fontSize: 22, color: "#e5e7eb", cursor: "pointer" }}
            aria-label="Open menu"
          >
            ☰
          </button>
          <div style={{ marginLeft: 12, fontWeight: 700, color: "#f4d97a" }}>MoneyMap</div>
        </div>

        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} activeTab={activeTab} onSelect={setActiveTab} />

        <TabContent activeTab={activeTab} />
      </div>
    </PlanningProvider>
  );
}
