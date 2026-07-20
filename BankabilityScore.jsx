import React, { useMemo } from "react";
import { usePlanning } from "../context/PlanningContext";
import PlanningVaultBadge from "./PlanningVaultBadge";

const CCRIS_OPTIONS = [
  { score: 5.0, label: "Clean record", desc: "No late payments at all" },
  { score: 4.0, label: "Mostly clean", desc: "1 late payment in the past year, last 3 months clean" },
  { score: 3.0, label: "A few late payments", desc: "Several in the past year, last 3 months clean" },
  { score: 2.0, label: "Recent late payments", desc: "Still catching up on repayments" },
];

const HOUSING_OPTIONS = [
  { score: 1.0, label: "No housing loan" },
  { score: 2.0, label: "Under 1 year" },
  { score: 3.0, label: "1–2 years" },
  { score: 4.0, label: "2–5 years" },
  { score: 5.0, label: "5+ years" },
];

const UTIL_OPTIONS = [
  { score: 5.0, label: "Under 30%" },
  { score: 4.0, label: "30–50%" },
  { score: 3.0, label: "50–70%" },
  { score: 2.0, label: "70–90%" },
  { score: 1.0, label: "Over 90%" },
];

const EXPERIENCE_OPTIONS = [
  { score: 1.0, label: "Completely new field" },
  { score: 2.0, label: "Under 1 year, related field" },
  { score: 3.0, label: "1–2 years" },
  { score: 4.0, label: "2–5 years" },
  { score: 5.0, label: "5+ years in this field" },
];

const WEIGHTS = { ccris: 0.3, housing: 0.3, utilization: 0.2, experience: 0.2 };

function bandFor(score) {
  if (score >= 4.5) return { name: "Strong", tip: "You're positioned for prime bank rates.", color: "#00c2ff" };
  if (score >= 3.5) return { name: "Bankable", tip: "Mainstream bank or SCF financing suits you.", color: "#00c2ff" };
  if (score >= 2.5) return { name: "Moderate", tip: "Alternative or P2P financing is likely a better fit right now.", color: "#e8b64a" };
  if (score >= 1.5) return { name: "Weak", tip: "Worth strengthening your profile before applying.", color: "#e8b64a" };
  return { name: "Not recommended", tip: "Focus on credit repair before seeking financing.", color: "#e05a5a" };
}

function SelectCard({ options, value, onChange, showDesc }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {options.map((opt) => {
        const active = value === opt.score;
        return (
          <button
            key={opt.label}
            onClick={() => onChange(opt.score)}
            style={{
              textAlign: "left",
              padding: "12px 14px",
              borderRadius: 12,
              border: active ? "1.5px solid #00c2ff" : "1.5px solid #1f2937",
              background: active ? "rgba(0,194,255,0.08)" : "#111827",
              color: "#e5e7eb",
              cursor: "pointer",
            }}
          >
            <div style={{ fontSize: 14.5, fontWeight: active ? 600 : 500 }}>{opt.label}</div>
            {showDesc && opt.desc && (
              <div style={{ fontSize: 12.5, color: "#8b98a9", marginTop: 2 }}>{opt.desc}</div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "12px 14px",
        borderRadius: 12,
        border: "1.5px solid #1f2937",
        background: "#111827",
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: 14, color: "#e5e7eb", textAlign: "left", paddingRight: 12 }}>{label}</span>
      <span
        style={{
          width: 42,
          height: 24,
          borderRadius: 999,
          background: checked ? "#00c2ff" : "#374151",
          position: "relative",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 20 : 2,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#fff",
          }}
        />
      </span>
    </button>
  );
}

function ScoreRow({ label, score }) {
  const pct = (score / 5) * 100;
  const color = score >= 4 ? "#00c2ff" : score >= 2.5 ? "#e8b64a" : "#e05a5a";
  return (
    <div style={{ padding: "10px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 6 }}>
        <span style={{ color: "#cbd5e1", fontWeight: 500 }}>{label}</span>
        <span style={{ color: "#e5e7eb", fontWeight: 600 }}>{score.toFixed(1)}/5</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: "#1f2937", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999 }} />
      </div>
    </div>
  );
}

export default function BankabilityScore() {
  const { planningData, updatePlanning } = usePlanning();
  const data = planningData.bankability;

  const set = (field) => (value) => updatePlanning("bankability", { [field]: value });

  const { finalScore, band, breakdown, lever, isKO } = useMemo(() => {
    const { ccris, housing, utilization, experience, hasTradeRefs, hasLegalCase } = data;
    const raw =
      ccris * WEIGHTS.ccris +
      housing * WEIGHTS.housing +
      utilization * WEIGHTS.utilization +
      experience * WEIGHTS.experience;
    const penalty = hasTradeRefs ? 0 : 0.5;
    const capped = Math.max(0, raw - penalty);
    const ko = hasLegalCase;

    const items = [
      { key: "CCRIS Repayment", score: ccris, weight: WEIGHTS.ccris },
      { key: "Housing Loan Trust", score: housing, weight: WEIGHTS.housing },
      { key: "Card Utilization", score: utilization, weight: WEIGHTS.utilization },
      { key: "Business Experience", score: experience, weight: WEIGHTS.experience },
    ];
    const leverItem = items
      .filter((i) => i.score < 5)
      .sort((a, b) => a.score * a.weight - b.score * b.weight)[0];

    return {
      finalScore: ko ? 0 : capped,
      band: ko
        ? { name: "Not eligible", tip: "An ongoing legal case rules out financing for now.", color: "#e05a5a" }
        : bandFor(capped),
      breakdown: items,
      lever: leverItem,
      isKO: ko,
    };
  }, [data]);

  const sectionStyle = { marginBottom: 28 };
  const labelStyle = { fontSize: 13, fontWeight: 700, color: "#00c2ff", letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 10 };

  return (
    <div style={{ padding: "20px 18px 60px", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#f4d97a" }}>Bankability Score</div>
          <div style={{ fontSize: 13.5, color: "#8b98a9", marginTop: 4 }}>
            A self-assessment to understand how lenders may view your profile — for education only, not a guarantee.
          </div>
        </div>
        <PlanningVaultBadge />
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>1. CCRIS Repayment Record</div>
        <SelectCard options={CCRIS_OPTIONS} value={data.ccris} onChange={set("ccris")} showDesc />
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>2. Housing Loan</div>
        <SelectCard options={HOUSING_OPTIONS} value={data.housing} onChange={set("housing")} />
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>3. Credit Card Utilization</div>
        <div style={{ fontSize: 12.5, color: "#8b98a9", marginBottom: 10, marginTop: -6 }}>
          Combined across all cards, latest month
        </div>
        <SelectCard options={UTIL_OPTIONS} value={data.utilization} onChange={set("utilization")} />
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>4. Experience in This Field</div>
        <SelectCard options={EXPERIENCE_OPTIONS} value={data.experience} onChange={set("experience")} />
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>5. Additional Factors</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Toggle checked={data.hasTradeRefs} onChange={set("hasTradeRefs")} label="I have other trade references (supplier credit, other loans)" />
          <Toggle checked={data.hasLegalCase} onChange={set("hasLegalCase")} label="I have an ongoing legal case or dispute" />
        </div>
      </div>

      <div
        style={{
          borderRadius: 16,
          border: "1.5px solid #1f2937",
          background: "linear-gradient(180deg, rgba(0,194,255,0.06), rgba(0,0,0,0))",
          padding: 18,
          marginBottom: 28,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 34, fontWeight: 800, color: "#fff" }}>{isKO ? "—" : finalScore.toFixed(1)}</div>
            <div style={{ fontSize: 13, color: "#8b98a9" }}>out of 5.0</div>
          </div>
          <div
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              background: `${band.color}22`,
              border: `1px solid ${band.color}`,
              color: band.color,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {band.name}
          </div>
        </div>
        <div style={{ height: 8, borderRadius: 999, background: "#1f2937", marginTop: 14, overflow: "hidden" }}>
          {!isKO && (
            <div
              style={{
                width: `${(finalScore / 5) * 100}%`,
                height: "100%",
                background: `linear-gradient(90deg, #00c2ff, ${band.color})`,
                borderRadius: 999,
              }}
            />
          )}
        </div>
        <div style={{ fontSize: 13, color: "#cbd5e1", marginTop: 12, lineHeight: 1.5 }}>{band.tip}</div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Your Breakdown</div>
        <div style={{ borderRadius: 14, border: "1.5px solid #1f2937", background: "#0f172a", padding: "4px 16px" }}>
          {breakdown.map((item, i) => (
            <div key={item.key} style={{ borderBottom: i < breakdown.length - 1 ? "1px solid #1f2937" : "none" }}>
              <ScoreRow label={item.key} score={item.score} />
            </div>
          ))}
          {!data.hasTradeRefs && (
            <div style={{ padding: "10px 0", borderTop: "1px solid #1f2937" }}>
              <div style={{ fontSize: 13, color: "#e05a5a" }}>No trade references — 0.5 penalty applied</div>
            </div>
          )}
        </div>
      </div>

      {!isKO && lever && (
        <div style={{ borderRadius: 14, border: "1px solid #f4d97a55", background: "rgba(244,217,122,0.06)", padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f4d97a", marginBottom: 6 }}>💡 Your biggest lever</div>
          <div style={{ fontSize: 13.5, color: "#cbd5e1", lineHeight: 1.5 }}>
            Improving <strong style={{ color: "#fff" }}>{lever.key}</strong> would move your score the most — it
            carries {Math.round(lever.weight * 100)}% weight and currently sits at {lever.score.toFixed(1)}/5.
          </div>
        </div>
      )}

      {isKO && (
        <div style={{ borderRadius: 14, border: "1px solid #e05a5a55", background: "rgba(224,90,90,0.08)", padding: 16 }}>
          <div style={{ fontSize: 13.5, color: "#f3b8b8", lineHeight: 1.5 }}>
            Most lenders will decline applications with an active legal dispute. Resolving this first is the
            priority before exploring financing options.
          </div>
        </div>
      )}
    </div>
  );
}
