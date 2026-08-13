import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { storage } from "./lib/storage.js";

/* ---------------------------------------------------------------
   TOKENS
   Brand: #aaeca0 (mint) / #40abe6 (blue) — reserved for accents,
   headers and non-status chrome. True RAG red/amber/green kept
   separate so status is never ambiguous with the brand mint.
   Signature: a two-line "ledger rule" (mint over blue) under every
   section header, and tabular-number KPI figures set in a mono
   face — a nod to spreadsheet ledgers, the actual subject matter.
------------------------------------------------------------------ */
const CSS = `
:root{
  --mint:#aaeca0; --blue:#40abe6;
  --mint-dark:#6fcf60; --blue-dark:#2a8bc7;
  --ink:#122921; --ink-soft:#4c5f57; --ink-faint:#8a9b93;
  --paper:#f6faf7; --card:#ffffff; --border:#e0eae2;
  --rag-green:#1a9e5c; --rag-green-bg:#e8f7ee;
  --rag-amber:#c98a0e; --rag-amber-bg:#fdf3df;
  --rag-red:#d43f3f; --rag-red-bg:#fceaea;
  --shadow: 0 1px 2px rgba(18,41,33,0.06), 0 4px 14px rgba(18,41,33,0.06);
  --radius: 12px;
}
.fpd-root{
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  color: var(--ink);
  background: var(--paper);
  min-height: 100%;
  width: 100%;
  box-sizing: border-box;
  padding: 20px;
  font-size: 14px;
  line-height: 1.45;
}
.fpd-root *{ box-sizing: border-box; }
.fpd-mono{ font-family: "SF Mono", "Roboto Mono", ui-monospace, Menlo, Consolas, monospace; font-variant-numeric: tabular-nums; }

/* Top bar */
.fpd-topbar{ display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:18px; }
.fpd-brand{ display:flex; align-items:baseline; gap:10px; }
.fpd-brand h1{ font-size:19px; font-weight:800; letter-spacing:-0.02em; margin:0; }
.fpd-brand .sub{ font-size:12px; color:var(--ink-faint); }
.fpd-tabs{ display:flex; gap:4px; background:var(--card); padding:4px; border-radius:10px; border:1px solid var(--border); box-shadow:var(--shadow); }
.fpd-tab{ border:none; background:transparent; padding:8px 16px; border-radius:7px; font-size:13px; font-weight:650; color:var(--ink-soft); cursor:pointer; transition: all .15s ease; }
.fpd-tab.active{ background: var(--ink); color:#fff; }
.fpd-tab:not(.active):hover{ background: var(--paper); color:var(--ink); }
.fpd-tab:disabled{ opacity:.4; cursor:not-allowed; }
.fpd-tab:disabled:hover{ background:transparent; color:var(--ink-soft); }

.fpd-toolbtn{ border:1px solid var(--border); background:var(--card); padding:7px 12px; border-radius:8px; font-size:12.5px; font-weight:600; color:var(--ink-soft); cursor:pointer; display:inline-flex; align-items:center; gap:6px; }
.fpd-toolbtn:hover{ border-color: var(--blue); color: var(--blue-dark); }
.fpd-toolbtn.danger:hover{ border-color: var(--rag-red); color: var(--rag-red); }
.fpd-toolbtn.primary{ background: var(--ink); color:#fff; border-color:var(--ink); }
.fpd-toolbtn.primary:hover{ opacity:.88; color:#fff; }

/* Section / ledger rule */
.fpd-section{ background:var(--card); border:1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); margin-bottom:16px; overflow:hidden; }
.fpd-section-head{ padding:14px 18px 12px; }
.fpd-section-head h2{ font-size:14px; font-weight:800; letter-spacing:-0.01em; margin:0 0 8px; display:flex; align-items:center; gap:8px; }
.fpd-ledger-rule{ height:4px; width:100%; background: linear-gradient(90deg, var(--mint) 50%, var(--blue) 50%); border-radius:2px; opacity:.9; }
.fpd-section-body{ padding: 0 18px 18px; }
.fpd-section-desc{ font-size:12px; color:var(--ink-faint); margin: -4px 0 10px; }

/* KPI cards */
.fpd-kpi-grid{ display:grid; grid-template-columns: repeat(auto-fit, minmax(150px,1fr)); gap:10px; margin-bottom:16px; }
.fpd-kpi{ background:var(--card); border:1px solid var(--border); border-radius: var(--radius); padding:13px 14px; box-shadow: var(--shadow); }
.fpd-kpi .label{ font-size:10.5px; text-transform:uppercase; letter-spacing:.06em; color:var(--ink-faint); font-weight:700; margin-bottom:6px; }
.fpd-kpi .value{ font-size:22px; font-weight:800; letter-spacing:-0.01em; }
.fpd-kpi .delta{ font-size:11.5px; margin-top:4px; font-weight:650; }

/* RAG badge/pill */
.fpd-rag{ display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:999px; font-weight:800; font-size:12px; letter-spacing:.02em; }
.fpd-rag .dot{ width:8px; height:8px; border-radius:50%; }
.fpd-rag.green{ background:var(--rag-green-bg); color:var(--rag-green); }
.fpd-rag.green .dot{ background:var(--rag-green); }
.fpd-rag.amber{ background:var(--rag-amber-bg); color:var(--rag-amber); }
.fpd-rag.amber .dot{ background:var(--rag-amber); }
.fpd-rag.red{ background:var(--rag-red-bg); color:var(--rag-red); }
.fpd-rag.red .dot{ background:var(--rag-red); }

/* Tables */
.fpd-table-wrap{ overflow-x:auto; }
table.fpd-table{ width:100%; border-collapse:collapse; font-size:12.5px; }
table.fpd-table th{ text-align:left; font-size:10.5px; text-transform:uppercase; letter-spacing:.05em; color:var(--ink-faint); font-weight:700; padding:6px 8px; border-bottom:2px solid var(--border); white-space:nowrap; }
table.fpd-table td{ padding:5px 8px; border-bottom:1px solid var(--border); vertical-align:middle; }
table.fpd-table tr:last-child td{ border-bottom:none; }
.fpd-input, .fpd-select, .fpd-textarea{ width:100%; border:1px solid var(--border); border-radius:6px; padding:5px 7px; font-size:12.5px; background:#fff; color:var(--ink); font-family:inherit; }
.fpd-input:focus, .fpd-select:focus, .fpd-textarea:focus{ outline:2px solid var(--blue); outline-offset:0; border-color:var(--blue); }
.fpd-input.invalid{ border-color: var(--rag-red); background: var(--rag-red-bg); }
.fpd-err{ font-size:10.5px; color:var(--rag-red); margin-top:2px; }
.fpd-rowdel{ border:none; background:none; color:var(--ink-faint); cursor:pointer; font-size:15px; line-height:1; padding:2px 6px; border-radius:5px; }
.fpd-rowdel:hover{ color:var(--rag-red); background:var(--rag-red-bg); }
.fpd-addrow{ margin-top:10px; }

.fpd-badge{ display:inline-block; padding:2px 8px; border-radius:999px; font-size:10.5px; font-weight:750; }
.fpd-badge.green{ background:var(--rag-green-bg); color:var(--rag-green); }
.fpd-badge.amber{ background:var(--rag-amber-bg); color:var(--rag-amber); }
.fpd-badge.red{ background:var(--rag-red-bg); color:var(--rag-red); }
.fpd-badge.blue{ background:#e8f4fc; color:var(--blue-dark); }
.fpd-badge.grey{ background:#eef1ef; color:var(--ink-soft); }

.fpd-narrative{ background: linear-gradient(180deg, #fff 0%, var(--paper) 100%); border:1px solid var(--border); border-left:4px solid var(--blue); border-radius:8px; padding:12px 14px; font-size:13px; color:var(--ink); }
.fpd-narrative .meta{ font-size:10.5px; color:var(--ink-faint); margin-top:8px; font-weight:650; }

.fpd-empty{ text-align:center; padding:26px 14px; color:var(--ink-faint); font-size:12.5px; }
.fpd-empty .big{ font-size:24px; margin-bottom:6px; }

.fpd-dropdown-wrap{ display:flex; align-items:center; gap:8px; }
.fpd-dropdown{ border:1px solid var(--border); background:var(--card); border-radius:8px; padding:8px 12px; font-size:13px; font-weight:650; color:var(--ink); box-shadow: var(--shadow); }

.fpd-grid-2{ display:grid; grid-template-columns: 1.3fr 1fr; gap:14px; }
.fpd-grid-3{ display:grid; grid-template-columns: repeat(3, 1fr); gap:14px; }
@media (max-width: 820px){
  .fpd-grid-2, .fpd-grid-3{ grid-template-columns: 1fr; }
}

.fpd-modal-overlay{ position:fixed; inset:0; background:rgba(18,41,33,.45); display:flex; align-items:center; justify-content:center; z-index:50; }
.fpd-modal{ background:#fff; border-radius:12px; padding:20px; max-width:360px; width:90%; box-shadow: 0 10px 40px rgba(0,0,0,.25); }
.fpd-modal h3{ margin:0 0 8px; font-size:15px; }
.fpd-modal p{ margin:0 0 16px; font-size:12.5px; color:var(--ink-soft); }
.fpd-modal .row{ display:flex; gap:8px; justify-content:flex-end; }

.fpd-resbar-track{ background:#eef2ef; border-radius:6px; height:8px; width:100%; overflow:hidden; }
.fpd-resbar-fill{ height:100%; border-radius:6px; }

.fpd-loading{ display:flex; align-items:center; justify-content:center; height:200px; color:var(--ink-faint); font-size:13px; }

@media print{
  .fpd-noprint{ display:none !important; }
  .fpd-root{ background:#fff; padding:0; }
  .fpd-section{ box-shadow:none; border:1px solid #ccc; break-inside:avoid; }
}
`;

/* ---------------------------------------------------------------
   HELPERS
------------------------------------------------------------------ */
const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);

const fmtCurrency = (n) => {
  const v = Number(n);
  if (!isFinite(v)) return "$0";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
};
const fmtCurrencyPrecise = (n) => {
  const v = Number(n);
  if (!isFinite(v)) return "$0.00";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(v);
};
const fmtPct = (n, digits = 0) => {
  const v = Number(n);
  if (!isFinite(v)) return "0%";
  return `${v.toFixed(digits)}%`;
};
const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};
const fmtDateTime = (iso) => {
  if (!iso) return "—";
  const dt = new Date(iso);
  if (isNaN(dt)) return "—";
  return dt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};

function ragTone(status) {
  if (status === "Green") return "green";
  if (status === "Amber") return "amber";
  return "red";
}

function computeCPI(project) {
  const bac = Number(project.plannedBudget) || 0;
  const ac = Number(project.actualCost) || 0;
  const actualPct = Number(project.actualPctComplete) || 0;
  const ev = bac * (actualPct / 100);
  if (ac <= 0) return null;
  return ev / ac;
}
function computeSPI(project) {
  const bac = Number(project.plannedBudget) || 0;
  const plannedPct = Number(project.plannedPctComplete) || 0;
  const actualPct = Number(project.actualPctComplete) || 0;
  const ev = bac * (actualPct / 100);
  const pv = bac * (plannedPct / 100);
  if (pv <= 0) return null;
  return ev / pv;
}
function computeVariance(project) {
  const planned = Number(project.plannedBudget) || 0;
  const forecast = Number(project.forecast) || 0;
  const varDollar = forecast - planned;
  const varPct = planned !== 0 ? (varDollar / planned) * 100 : 0;
  return { varDollar, varPct };
}
function computeBurnRate(project, snapshots) {
  // avg $ spent per week, derived from snapshot history if available, else from start date to today
  const sorted = [...(snapshots || [])].sort((a, b) => (a.date > b.date ? 1 : -1));
  if (sorted.length >= 2) {
    const first = sorted[0], last = sorted[sorted.length - 1];
    const days = (new Date(last.date) - new Date(first.date)) / (1000 * 60 * 60 * 24);
    const weeks = Math.max(days / 7, 1);
    const spend = (Number(last.actualCost) || 0) - (Number(first.actualCost) || 0);
    return spend / weeks;
  }
  if (project.startDate) {
    const days = (new Date() - new Date(project.startDate)) / (1000 * 60 * 60 * 24);
    const weeks = Math.max(days / 7, 1);
    return (Number(project.actualCost) || 0) / weeks;
  }
  return null;
}

function computeMilestoneStatus(m) {
  if (m.complete) return "Complete";
  if (!m.dueDate) return "On Track";
  const due = new Date(m.dueDate + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffDays = (due - now) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return "Delayed";
  if (diffDays <= 7) return "At Risk";
  return "On Track";
}
function milestoneTone(status) {
  if (status === "Complete") return "blue";
  if (status === "On Track") return "green";
  if (status === "At Risk") return "amber";
  return "red";
}

function computeRAG(project, risks, milestones) {
  const cpi = computeCPI(project);
  const spi = computeSPI(project);
  const openHighRisks = (risks || []).filter((r) => r.status === "Open" && r.severity === "High").length;
  const delayedMilestones = (milestones || []).filter((m) => computeMilestoneStatus(m) === "Delayed").length;

  let score = 0; // higher = worse
  if (cpi !== null) { if (cpi < 0.85) score += 2; else if (cpi < 0.95) score += 1; }
  if (spi !== null) { if (spi < 0.85) score += 2; else if (spi < 0.95) score += 1; }
  if (openHighRisks >= 2) score += 2; else if (openHighRisks === 1) score += 1;
  if (delayedMilestones >= 2) score += 2; else if (delayedMilestones === 1) score += 1;

  if (score >= 4) return "Red";
  if (score >= 2) return "Amber";
  return "Green";
}

function riskSeverityRank(sev) { return sev === "High" ? 0 : sev === "Medium" ? 1 : 2; }

function validateField(type, value) {
  if (type === "percent") {
    const n = Number(value);
    if (value === "" || isNaN(n)) return "Required";
    if (n < 0 || n > 100) return "0–100 only";
    return null;
  }
  if (type === "currency" || type === "number") {
    const n = Number(value);
    if (value === "" || isNaN(n)) return "Number only";
    if (n < 0) return "Must be ≥ 0";
    return null;
  }
  if (type === "date") {
    if (!value) return "Required";
    if (isNaN(new Date(value))) return "Invalid date";
    return null;
  }
  return null;
}

/* ---------------------------------------------------------------
   SAMPLE DATA
------------------------------------------------------------------ */
function sampleData() {
  const start = new Date();
  start.setDate(start.getDate() - 70);
  const mkDate = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  };
  return {
    project: {
      name: "Core Banking Migration – Phase 2",
      sponsor: "M. Okafor, CFO",
      startDate: start.toISOString().slice(0, 10),
      endDate: mkDate(95),
      plannedBudget: 1250000,
      actualCost: 812000,
      forecast: 1340000,
      plannedPctComplete: 68,
      actualPctComplete: 61,
      expectedBenefit: 2100000,
      investmentCost: 1340000,
    },
    milestones: [
      { id: uid(), name: "Ledger data migration – Wave 1", dueDate: mkDate(-30), owner: "Data Eng", complete: true },
      { id: uid(), name: "Regulatory sign-off (reconciliation)", dueDate: mkDate(-5), owner: "Compliance", complete: true },
      { id: uid(), name: "Ledger data migration – Wave 2", dueDate: mkDate(4), owner: "Data Eng", complete: false },
      { id: uid(), name: "UAT with Treasury team", dueDate: mkDate(18), owner: "QA", complete: false },
      { id: uid(), name: "Parallel run – payments", dueDate: mkDate(30), owner: "Payments Sq.", complete: false },
      { id: uid(), name: "Go-live readiness review", dueDate: mkDate(60), owner: "PMO", complete: false },
      { id: uid(), name: "Legacy system decommission", dueDate: mkDate(90), owner: "Infra", complete: false },
    ],
    risks: [
      { id: uid(), description: "Vendor API rate limits may throttle final cutover window", severity: "High", status: "Open", owner: "Integration Lead" },
      { id: uid(), description: "Key reconciliation SME on leave through UAT phase", severity: "High", status: "Open", owner: "PMO" },
      { id: uid(), description: "FX rate feed contract renewal pending legal review", severity: "Medium", status: "Open", owner: "Legal" },
      { id: uid(), description: "Test environment capacity constraints during parallel run", severity: "Medium", status: "Mitigated", owner: "Infra" },
      { id: uid(), description: "Minor UI copy inconsistencies flagged by UAT group", severity: "Low", status: "Open", owner: "UX" },
    ],
    issues: [
      { id: uid(), description: "Batch job timing conflict with EOD close", severity: "High", status: "Open" },
      { id: uid(), description: "Duplicate customer IDs found in staging (Wave 1)", severity: "Medium", status: "Closed" },
      { id: uid(), description: "Report export missing decimal precision on FX lines", severity: "Low", status: "Closed" },
      { id: uid(), description: "SSO timeout during long reconciliation sessions", severity: "Medium", status: "Open" },
    ],
    resources: [
      { id: uid(), name: "Data Engineering", allocatedPct: 92 },
      { id: uid(), name: "QA / UAT", allocatedPct: 74 },
      { id: uid(), name: "Compliance", allocatedPct: 40 },
      { id: uid(), name: "Infrastructure", allocatedPct: 58 },
      { id: uid(), name: "PMO", allocatedPct: 65 },
    ],
    scopeChanges: [
      { id: uid(), description: "Add real-time FX feed for EUR/GBP pairs", date: mkDate(-20), costImpact: 45000 },
      { id: uid(), description: "Extend parallel run by two weeks per Compliance ask", date: mkDate(-8), costImpact: 28000 },
    ],
    snapshots: [
      { id: uid(), date: mkDate(-56), narrative: "Kickoff complete, Wave 1 migration scripting underway. Budget tracking to plan.", plannedPctComplete: 20, actualPctComplete: 18, actualCost: 220000, forecast: 1250000 },
      { id: uid(), date: mkDate(-35), narrative: "Wave 1 migration in flight. Reconciliation SME availability flagged as an emerging risk.", plannedPctComplete: 38, actualPctComplete: 34, actualCost: 460000, forecast: 1275000 },
      { id: uid(), date: mkDate(-14), narrative: "Regulatory sign-off achieved ahead of schedule. Vendor API throttling risk raised to High.", plannedPctComplete: 55, actualPctComplete: 50, actualCost: 650000, forecast: 1310000 },
      { id: uid(), date: mkDate(-2), narrative: "Wave 2 prep underway; forecast nudged up on scope addition (EUR/GBP feed). Overall status Amber — watching two high-severity risks into UAT.", plannedPctComplete: 68, actualPctComplete: 61, actualCost: 812000, forecast: 1340000 },
    ],
    lastUpdated: new Date().toISOString(),
  };
}

function emptyData() {
  return {
    project: {
      name: "", sponsor: "", startDate: "", endDate: "",
      plannedBudget: "", actualCost: "", forecast: "",
      plannedPctComplete: "", actualPctComplete: "",
      expectedBenefit: "", investmentCost: "",
    },
    milestones: [], risks: [], issues: [], resources: [], scopeChanges: [], snapshots: [],
    lastUpdated: null,
  };
}

/* ---------------------------------------------------------------
   REUSABLE PIECES
------------------------------------------------------------------ */
function LedgerHeader({ children, right }) {
  return (
    <div className="fpd-section-head">
      <h2>
        <span style={{ flex: 1 }}>{children}</span>
        {right}
      </h2>
      <div className="fpd-ledger-rule" />
    </div>
  );
}

function Section({ title, desc, right, children }) {
  return (
    <div className="fpd-section">
      <LedgerHeader right={right}>{title}</LedgerHeader>
      <div className="fpd-section-body">
        {desc && <div className="fpd-section-desc">{desc}</div>}
        {children}
      </div>
    </div>
  );
}

function RagPill({ status }) {
  const tone = ragTone(status);
  return (
    <span className={`fpd-rag ${tone}`}>
      <span className="dot" />
      {status}
    </span>
  );
}

function Kpi({ label, value, delta, deltaTone }) {
  return (
    <div className="fpd-kpi">
      <div className="label">{label}</div>
      <div className="value fpd-mono">{value}</div>
      {delta != null && (
        <div className="delta" style={{ color: deltaTone === "green" ? "var(--rag-green)" : deltaTone === "red" ? "var(--rag-red)" : "var(--ink-faint)" }}>
          {delta}
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon = "🗂️", title, hint }) {
  return (
    <div className="fpd-empty">
      <div className="big">{icon}</div>
      <div style={{ fontWeight: 700, color: "var(--ink-soft)", marginBottom: 2 }}>{title}</div>
      <div>{hint}</div>
    </div>
  );
}

/* Generic editable table for array-of-object sections */
function EditableTable({ columns, rows, onChange, addLabel, emptyIcon, emptyTitle, emptyHint }) {
  const updateCell = (id, key, value) => {
    onChange(rows.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  };
  const deleteRow = (id) => onChange(rows.filter((r) => r.id !== id));
  const addRow = () => {
    const blank = { id: uid() };
    columns.forEach((c) => { blank[c.key] = c.type === "select" ? c.options[0] : c.type === "checkbox" ? false : ""; });
    onChange([...rows, blank]);
  };

  return (
    <div>
      <div className="fpd-table-wrap">
        <table className="fpd-table">
          <thead>
            <tr>
              {columns.map((c) => <th key={c.key} style={{ width: c.width }}>{c.label}</th>)}
              <th style={{ width: 32 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {columns.map((c) => {
                  const err = c.validate ? validateField(c.type, row[c.key]) : null;
                  return (
                    <td key={c.key}>
                      {c.type === "select" ? (
                        <select className="fpd-select" value={row[c.key] ?? c.options[0]} onChange={(e) => updateCell(row.id, c.key, e.target.value)}>
                          {c.options.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : c.type === "checkbox" ? (
                        <input type="checkbox" checked={!!row[c.key]} onChange={(e) => updateCell(row.id, c.key, e.target.checked)} />
                      ) : c.type === "date" ? (
                        <input type="date" className={`fpd-input${err ? " invalid" : ""}`} value={row[c.key] || ""} onChange={(e) => updateCell(row.id, c.key, e.target.value)} />
                      ) : c.type === "number" || c.type === "currency" || c.type === "percent" ? (
                        <input type="number" className={`fpd-input${err ? " invalid" : ""}`} value={row[c.key] ?? ""} onChange={(e) => updateCell(row.id, c.key, e.target.value)} min={0} max={c.type === "percent" ? 100 : undefined} />
                      ) : (
                        <input type="text" className={`fpd-input${err ? " invalid" : ""}`} value={row[c.key] ?? ""} onChange={(e) => updateCell(row.id, c.key, e.target.value)} placeholder={c.placeholder || ""} />
                      )}
                      {err && <div className="fpd-err">{err}</div>}
                    </td>
                  );
                })}
                <td>
                  <button className="fpd-rowdel" onClick={() => deleteRow(row.id)} title="Delete row" aria-label="Delete row">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <EmptyState icon={emptyIcon} title={emptyTitle} hint={emptyHint} />}
      <div className="fpd-addrow">
        <button className="fpd-toolbtn" onClick={addRow}>+ {addLabel}</button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   DATA ENTRY VIEW
------------------------------------------------------------------ */
function ProjectBudgetForm({ project, onChange }) {
  const set = (key, value) => onChange({ ...project, [key]: value });
  const field = (key, label, type = "text", opts = {}) => {
    const err = ["percent", "currency", "number", "date"].includes(type) ? validateField(type, project[key]) : null;
    return (
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</label>
        <input
          type={type === "currency" || type === "percent" ? "number" : type}
          className={`fpd-input${err ? " invalid" : ""}`}
          style={{ marginTop: 4 }}
          value={project[key] ?? ""}
          min={type === "percent" ? 0 : type === "currency" || type === "number" ? 0 : undefined}
          max={type === "percent" ? 100 : undefined}
          onChange={(e) => set(key, e.target.value)}
          {...opts}
        />
        {err && <div className="fpd-err">{err}</div>}
      </div>
    );
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px,1fr))", gap: 12 }}>
      {field("name", "Project name")}
      {field("sponsor", "Executive sponsor")}
      {field("startDate", "Start date", "date")}
      {field("endDate", "Target end date", "date")}
      {field("plannedBudget", "Planned budget ($ BAC)", "currency")}
      {field("actualCost", "Actual cost to date ($)", "currency")}
      {field("forecast", "Forecast at completion ($)", "currency")}
      {field("plannedPctComplete", "Planned % complete", "percent")}
      {field("actualPctComplete", "Actual % complete", "percent")}
      {field("expectedBenefit", "Expected benefit / value ($)", "currency")}
      {field("investmentCost", "Total investment cost ($)", "currency")}
    </div>
  );
}

function SnapshotForm({ project, snapshots, onAdd }) {
  const [narrative, setNarrative] = useState("");
  const handleLog = () => {
    const snap = {
      id: uid(),
      date: todayISO(),
      narrative: narrative.trim(),
      plannedPctComplete: project.plannedPctComplete || 0,
      actualPctComplete: project.actualPctComplete || 0,
      actualCost: project.actualCost || 0,
      forecast: project.forecast || 0,
    };
    onAdd(snap);
    setNarrative("");
  };
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: ".04em" }}>
        This period's summary
      </label>
      <textarea
        className="fpd-textarea"
        style={{ marginTop: 4, minHeight: 70, resize: "vertical" }}
        placeholder="e.g. Wave 2 prep underway; forecast nudged up on scope addition. Watching two high-severity risks into UAT."
        value={narrative}
        onChange={(e) => setNarrative(e.target.value)}
      />
      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
        <button className="fpd-toolbtn primary" onClick={handleLog}>📌 Log snapshot ({fmtDate(todayISO())})</button>
        <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>Captures current budget & % complete for the trend chart</span>
      </div>

      {snapshots.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div className="fpd-table-wrap">
            <table className="fpd-table">
              <thead>
                <tr><th>Date</th><th>Planned %</th><th>Actual %</th><th>Actual cost</th><th>Forecast</th><th>Summary</th><th style={{width:32}}></th></tr>
              </thead>
              <tbody>
                {[...snapshots].sort((a, b) => (a.date < b.date ? 1 : -1)).map((s) => (
                  <tr key={s.id}>
                    <td className="fpd-mono">{fmtDate(s.date)}</td>
                    <td className="fpd-mono">{fmtPct(s.plannedPctComplete)}</td>
                    <td className="fpd-mono">{fmtPct(s.actualPctComplete)}</td>
                    <td className="fpd-mono">{fmtCurrency(s.actualCost)}</td>
                    <td className="fpd-mono">{fmtCurrency(s.forecast)}</td>
                    <td style={{ maxWidth: 260, whiteSpace: "normal" }}>{s.narrative || "—"}</td>
                    <td><button className="fpd-rowdel" onClick={() => onAdd(null, s.id)}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function DataEntryView({ data, setData }) {
  const patch = (key, value) => setData((d) => ({ ...d, [key]: value }));

  return (
    <div>
      <Section title="Project & budget">
        <ProjectBudgetForm project={data.project} onChange={(p) => patch("project", p)} />
      </Section>

      <Section title="Reporting snapshot & narrative" desc="Log a snapshot each reporting period to build the trend chart and dashboard commentary.">
        <SnapshotForm
          project={data.project}
          snapshots={data.snapshots}
          onAdd={(snap, deleteId) => {
            if (deleteId) patch("snapshots", data.snapshots.filter((s) => s.id !== deleteId));
            else patch("snapshots", [...data.snapshots, snap]);
          }}
        />
      </Section>

      <Section title="Milestones" desc="Status is auto-calculated from due date (or mark complete) — no manual tagging needed.">
        <EditableTable
          columns={[
            { key: "name", label: "Milestone", type: "text", width: "34%" },
            { key: "dueDate", label: "Due date", type: "date", validate: true, width: 130 },
            { key: "owner", label: "Owner", type: "text", width: 140 },
            { key: "complete", label: "Complete?", type: "checkbox", width: 80 },
          ]}
          rows={data.milestones}
          onChange={(rows) => patch("milestones", rows)}
          addLabel="Add milestone"
          emptyIcon="🏁" emptyTitle="No milestones yet" emptyHint="Add your first milestone to start tracking the timeline."
        />
      </Section>

      <Section title="Risk register">
        <EditableTable
          columns={[
            { key: "description", label: "Risk", type: "text", width: "40%" },
            { key: "severity", label: "Severity", type: "select", options: ["High", "Medium", "Low"], width: 110 },
            { key: "status", label: "Status", type: "select", options: ["Open", "Mitigated", "Closed"], width: 110 },
            { key: "owner", label: "Owner", type: "text", width: 140 },
          ]}
          rows={data.risks}
          onChange={(rows) => patch("risks", rows)}
          addLabel="Add risk"
          emptyIcon="⚠️" emptyTitle="No risks logged" emptyHint="Log risks here to populate the register and top-3 view."
        />
      </Section>

      <Section title="Issues log">
        <EditableTable
          columns={[
            { key: "description", label: "Issue", type: "text", width: "44%" },
            { key: "severity", label: "Severity", type: "select", options: ["High", "Medium", "Low"], width: 110 },
            { key: "status", label: "Status", type: "select", options: ["Open", "Closed"], width: 110 },
          ]}
          rows={data.issues}
          onChange={(rows) => patch("issues", rows)}
          addLabel="Add issue"
          emptyIcon="🧩" emptyTitle="No issues logged" emptyHint="Track open/closed issues here."
        />
      </Section>

      <Section title="Resource utilization">
        <EditableTable
          columns={[
            { key: "name", label: "Team / resource", type: "text", width: "50%" },
            { key: "allocatedPct", label: "Allocated %", type: "percent", validate: true, width: 130 },
          ]}
          rows={data.resources}
          onChange={(rows) => patch("resources", rows)}
          addLabel="Add resource"
          emptyIcon="👥" emptyTitle="No resources logged" emptyHint="Add teams and their allocation % to see utilization."
        />
      </Section>

      <Section title="Scope change requests">
        <EditableTable
          columns={[
            { key: "description", label: "Change request", type: "text", width: "44%" },
            { key: "date", label: "Date", type: "date", validate: true, width: 130 },
            { key: "costImpact", label: "Cost impact ($)", type: "currency", validate: true, width: 140 },
          ]}
          rows={data.scopeChanges}
          onChange={(rows) => patch("scopeChanges", rows)}
          addLabel="Add scope change"
          emptyIcon="📝" emptyTitle="No scope changes this period" emptyHint="Log any scope additions or reductions here."
        />
      </Section>
    </div>
  );
}

/* ---------------------------------------------------------------
   DASHBOARD VIEW
------------------------------------------------------------------ */
const STAKEHOLDERS = [
  { key: "exec", label: "Executive Sponsor" },
  { key: "cfo", label: "Finance / CFO" },
  { key: "team", label: "Project Team" },
  { key: "client", label: "Client / Board" },
];

function BudgetBarChart({ project }) {
  const rows = [{
    name: "Budget",
    Planned: Number(project.plannedBudget) || 0,
    Actual: Number(project.actualCost) || 0,
    Forecast: Number(project.forecast) || 0,
  }];
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0eae2" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={54} />
        <Tooltip formatter={(v) => fmtCurrency(v)} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="Planned" fill="#aaeca0" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Actual" fill="#40abe6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Forecast" fill="#122921" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function TrendChart({ snapshots, metricKeys, colors, yFormatter }) {
  const rows = [...snapshots].sort((a, b) => (a.date > b.date ? 1 : -1)).map((s) => ({
    date: fmtDate(s.date).replace(",", ""),
    ...metricKeys.reduce((acc, k) => ({ ...acc, [k.key]: Number(s[k.dataKey]) || 0 }), {}),
  }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0eae2" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} width={44} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {metricKeys.map((k, i) => (
          <Line key={k.key} type="monotone" dataKey={k.key} name={k.label} stroke={colors[i % colors.length]} strokeWidth={2.5} dot={{ r: 3 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function RiskDonut({ risks }) {
  const open = risks.filter((r) => r.status === "Open");
  const counts = ["High", "Medium", "Low"].map((sev) => ({ name: sev, value: open.filter((r) => r.severity === sev).length }));
  const colors = { High: "#d43f3f", Medium: "#c98a0e", Low: "#1a9e5c" };
  const total = counts.reduce((a, c) => a + c.value, 0);
  if (total === 0) return <EmptyState icon="✅" title="No open risks" hint="Risk register is clear." />;
  return (
    <ResponsiveContainer width="100%" height={190}>
      <PieChart>
        <Pie data={counts} dataKey="value" nameKey="name" innerRadius={45} outerRadius={72} paddingAngle={2}>
          {counts.map((c) => <Cell key={c.name} fill={colors[c.name]} />)}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function ResourceBars({ resources }) {
  if (resources.length === 0) return <EmptyState icon="👥" title="No resource data" hint="Add teams in the Edit Data tab." />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {resources.map((r) => {
        const pct = Math.min(Number(r.allocatedPct) || 0, 150);
        const color = pct > 100 ? "var(--rag-red)" : pct > 85 ? "var(--rag-amber)" : "var(--blue)";
        return (
          <div key={r.id}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
              <span style={{ fontWeight: 600 }}>{r.name || "Untitled"}</span>
              <span className="fpd-mono" style={{ color }}>{fmtPct(r.allocatedPct)}</span>
            </div>
            <div className="fpd-resbar-track">
              <div className="fpd-resbar-fill" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MilestoneTable({ milestones, compact }) {
  if (milestones.length === 0) return <EmptyState icon="🏁" title="No milestones" hint="Add milestones in the Edit Data tab." />;
  const list = compact ? milestones.slice(0, 6) : milestones;
  const sorted = [...list].sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1));
  return (
    <div className="fpd-table-wrap">
      <table className="fpd-table">
        <thead><tr><th>Milestone</th><th>Due</th>{!compact && <th>Owner</th>}<th>Status</th></tr></thead>
        <tbody>
          {sorted.map((m) => {
            const status = computeMilestoneStatus(m);
            return (
              <tr key={m.id}>
                <td>{m.name || "Untitled"}</td>
                <td className="fpd-mono">{fmtDate(m.dueDate)}</td>
                {!compact && <td>{m.owner || "—"}</td>}
                <td><span className={`fpd-badge ${milestoneTone(status)}`}>{status}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RiskTable({ risks, limit }) {
  const open = risks.filter((r) => r.status !== "Closed").sort((a, b) => riskSeverityRank(a.severity) - riskSeverityRank(b.severity));
  const list = limit ? open.slice(0, limit) : risks;
  if (risks.length === 0) return <EmptyState icon="⚠️" title="No risks logged" hint="Add risks in the Edit Data tab." />;
  const sevTone = (s) => (s === "High" ? "red" : s === "Medium" ? "amber" : "green");
  return (
    <div className="fpd-table-wrap">
      <table className="fpd-table">
        <thead><tr><th>Risk</th><th>Severity</th><th>Status</th>{!limit && <th>Owner</th>}</tr></thead>
        <tbody>
          {list.map((r) => (
            <tr key={r.id}>
              <td>{r.description || "Untitled"}</td>
              <td><span className={`fpd-badge ${sevTone(r.severity)}`}>{r.severity}</span></td>
              <td><span className="fpd-badge grey">{r.status}</span></td>
              {!limit && <td>{r.owner || "—"}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExecView({ data }) {
  const rag = computeRAG(data.project, data.risks, data.milestones);
  const { varDollar, varPct } = computeVariance(data.project);
  const latestSnap = [...data.snapshots].sort((a, b) => (a.date > b.date ? -1 : 1))[0];
  return (
    <div>
      <div className="fpd-kpi-grid">
        <div className="fpd-kpi">
          <div className="label">Overall status</div>
          <div style={{ marginTop: 2 }}><RagPill status={rag} /></div>
        </div>
        <Kpi label="% complete (actual / planned)" value={`${fmtPct(data.project.actualPctComplete)} / ${fmtPct(data.project.plannedPctComplete)}`} />
        <Kpi label="Forecast vs planned budget" value={fmtCurrency(data.project.forecast)}
          delta={`${varDollar >= 0 ? "+" : ""}${fmtCurrency(varDollar)} (${varPct >= 0 ? "+" : ""}${varPct.toFixed(1)}%)`}
          deltaTone={varDollar > 0 ? "red" : "green"} />
        <Kpi label="Open high-severity risks" value={data.risks.filter(r => r.status === "Open" && r.severity === "High").length}
          deltaTone={data.risks.filter(r => r.status === "Open" && r.severity === "High").length > 0 ? "red" : "green"} />
      </div>
      <div className="fpd-grid-2">
        <Section title="This period, in brief">
          {latestSnap ? (
            <div className="fpd-narrative">
              {latestSnap.narrative || "No commentary logged for this period."}
              <div className="meta">{fmtDate(latestSnap.date)}</div>
            </div>
          ) : <EmptyState icon="🗒️" title="No narrative yet" hint="Log a snapshot in the Edit Data tab to add commentary." />}
        </Section>
        <Section title="Top risks">
          <RiskTable risks={data.risks} limit={3} />
        </Section>
      </div>
      <Section title="Budget summary">
        <BudgetBarChart project={data.project} />
      </Section>
    </div>
  );
}

function CfoView({ data }) {
  const cpi = computeCPI(data.project);
  const spi = computeSPI(data.project);
  const { varDollar, varPct } = computeVariance(data.project);
  const burn = computeBurnRate(data.project, data.snapshots);
  return (
    <div>
      <div className="fpd-kpi-grid">
        <Kpi label="Planned budget (BAC)" value={fmtCurrency(data.project.plannedBudget)} />
        <Kpi label="Actual cost to date" value={fmtCurrency(data.project.actualCost)} />
        <Kpi label="Forecast at completion" value={fmtCurrency(data.project.forecast)}
          delta={`${varDollar >= 0 ? "+" : ""}${fmtCurrency(varDollar)} (${varPct >= 0 ? "+" : ""}${varPct.toFixed(1)}%)`}
          deltaTone={varDollar > 0 ? "red" : "green"} />
        <Kpi label="Weekly burn rate" value={burn != null ? fmtCurrency(burn) : "—"} />
        <Kpi label="CPI" value={cpi != null ? cpi.toFixed(2) : "—"} deltaTone={cpi != null ? (cpi >= 0.95 ? "green" : cpi >= 0.85 ? undefined : "red") : undefined} />
        <Kpi label="SPI" value={spi != null ? spi.toFixed(2) : "—"} deltaTone={spi != null ? (spi >= 0.95 ? "green" : spi >= 0.85 ? undefined : "red") : undefined} />
      </div>
      <div className="fpd-grid-2">
        <Section title="Planned vs actual vs forecast">
          <BudgetBarChart project={data.project} />
        </Section>
        <Section title="Cost trend over time">
          {data.snapshots.length > 0 ? (
            <TrendChart snapshots={data.snapshots} colors={["#40abe6", "#122921"]}
              metricKeys={[{ key: "Actual cost", dataKey: "actualCost", label: "Actual cost" }, { key: "Forecast", dataKey: "forecast", label: "Forecast" }]}
            />
          ) : <EmptyState icon="📈" title="No trend data yet" hint="Log snapshots to build the cost trend." />}
        </Section>
      </div>
      <Section title="Scope change requests this period" desc="Each change and its budget impact.">
        {data.scopeChanges.length === 0 ? (
          <EmptyState icon="📝" title="No scope changes" hint="Nothing logged for this period." />
        ) : (
          <div className="fpd-table-wrap">
            <table className="fpd-table">
              <thead><tr><th>Change</th><th>Date</th><th>Cost impact</th></tr></thead>
              <tbody>
                {data.scopeChanges.map((s) => (
                  <tr key={s.id}><td>{s.description}</td><td className="fpd-mono">{fmtDate(s.date)}</td><td className="fpd-mono">{fmtCurrency(s.costImpact)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}

function TeamView({ data }) {
  const openIssues = data.issues.filter((i) => i.status === "Open");
  const closedIssues = data.issues.filter((i) => i.status === "Closed");
  const openRisks = data.risks.filter((r) => r.status === "Open");
  const actionItems = [
    ...openRisks.map((r) => ({ text: `Risk: ${r.description}`, owner: r.owner, tone: "red" })),
    ...openIssues.map((i) => ({ text: `Issue: ${i.description}`, owner: "—", tone: "amber" })),
  ];
  return (
    <div>
      <div className="fpd-kpi-grid">
        <Kpi label="Open issues" value={openIssues.length} deltaTone={openIssues.length > 0 ? "red" : "green"} />
        <Kpi label="Closed issues" value={closedIssues.length} />
        <Kpi label="Open risks" value={openRisks.length} deltaTone={openRisks.length > 0 ? "red" : "green"} />
        <Kpi label="Avg. resource allocation" value={data.resources.length ? fmtPct(data.resources.reduce((a, r) => a + (Number(r.allocatedPct) || 0), 0) / data.resources.length) : "—"} />
      </div>
      <div className="fpd-grid-2">
        <Section title="Milestone tracker">
          <MilestoneTable milestones={data.milestones} />
        </Section>
        <Section title="Resource load">
          <ResourceBars resources={data.resources} />
        </Section>
      </div>
      <div className="fpd-grid-2">
        <Section title="Risk register">
          <RiskTable risks={data.risks} />
        </Section>
        <Section title="Action items" desc="Open risks and issues needing attention.">
          {actionItems.length === 0 ? <EmptyState icon="✅" title="Nothing outstanding" hint="All clear for now." /> : (
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
              {actionItems.map((a, i) => (
                <li key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12.5 }}>
                  <span className={`fpd-badge ${a.tone}`} style={{ marginTop: 1 }}>{a.tone === "red" ? "Risk" : "Issue"}</span>
                  <span>{a.text}{a.owner && a.owner !== "—" ? <span style={{ color: "var(--ink-faint)" }}> — {a.owner}</span> : null}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}

function ClientView({ data }) {
  const rag = computeRAG(data.project, data.risks, data.milestones);
  const benefit = Number(data.project.expectedBenefit) || 0;
  const invest = Number(data.project.investmentCost) || 0;
  const roi = invest > 0 ? ((benefit - invest) / invest) * 100 : null;
  const latestSnap = [...data.snapshots].sort((a, b) => (a.date > b.date ? -1 : 1))[0];
  const complete = data.milestones.filter((m) => computeMilestoneStatus(m) === "Complete").length;
  return (
    <div>
      <div className="fpd-kpi-grid">
        <div className="fpd-kpi">
          <div className="label">Overall status</div>
          <div style={{ marginTop: 2 }}><RagPill status={rag} /></div>
        </div>
        <Kpi label="Timeline progress" value={fmtPct(data.project.actualPctComplete)} />
        <Kpi label="Milestones complete" value={`${complete} / ${data.milestones.length}`} />
        <Kpi label="Projected ROI" value={roi != null ? `${roi.toFixed(0)}%` : "—"} deltaTone={roi != null ? (roi >= 0 ? "green" : "red") : undefined} />
      </div>
      <div className="fpd-grid-2">
        <Section title="Summary, in plain terms">
          {latestSnap ? (
            <div className="fpd-narrative">
              {latestSnap.narrative || "No summary logged yet for this period."}
              <div className="meta">Last updated {fmtDate(latestSnap.date)}</div>
            </div>
          ) : <EmptyState icon="🗒️" title="No summary yet" hint="A narrative will appear here once logged." />}
        </Section>
        <Section title="Outcomes & value" desc="Expected benefit vs. investment.">
          <div className="fpd-kpi-grid" style={{ marginBottom: 0 }}>
            <Kpi label="Expected benefit" value={fmtCurrency(benefit)} />
            <Kpi label="Investment cost" value={fmtCurrency(invest)} />
          </div>
        </Section>
      </div>
      <Section title="Key milestones">
        <MilestoneTable milestones={data.milestones} compact />
      </Section>
    </div>
  );
}

function DashboardView({ data, stakeholder }) {
  if (!data.project.name && data.milestones.length === 0 && data.risks.length === 0) {
    return (
      <div className="fpd-section">
        <div className="fpd-section-body" style={{ paddingTop: 18 }}>
          <EmptyState icon="📊" title="No data yet" hint={`Head to "Edit Data" to add your project details — the dashboard builds itself from there.`} />
        </div>
      </div>
    );
  }
  if (stakeholder === "exec") return <ExecView data={data} />;
  if (stakeholder === "cfo") return <CfoView data={data} />;
  if (stakeholder === "team") return <TeamView data={data} />;
  return <ClientView data={data} />;
}

/* ---------------------------------------------------------------
   ROOT APP
------------------------------------------------------------------ */
const STORAGE_KEY = "finance-dashboard-data-v1";

export default function App() {
  const [data, setDataRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [stakeholder, setStakeholder] = useState("exec");
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get(STORAGE_KEY);
        if (res && res.value) {
          setDataRaw(JSON.parse(res.value));
        } else {
          const seeded = sampleData();
          setDataRaw(seeded);
          await storage.set(STORAGE_KEY, JSON.stringify(seeded));
        }
      } catch (e) {
        // key not found or other error -> seed
        try {
          const seeded = sampleData();
          setDataRaw(seeded);
          await storage.set(STORAGE_KEY, JSON.stringify(seeded));
        } catch (e2) {
          setSaveError("Could not load or initialize saved data.");
          setDataRaw(emptyData());
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveTimer = React.useRef(null);

  const persistNow = useCallback(async (stamped) => {
    try {
      const result = await storage.set(STORAGE_KEY, JSON.stringify(stamped));
      if (!result) setSaveError("Save failed — your changes may not persist.");
      else setSaveError(null);
    } catch (e) {
      setSaveError("Save failed — your changes may not persist.");
    }
  }, []);

  // Update local state instantly (so typing never lags), persist to storage
  // debounced so rapid keystrokes collapse into one write.
  const setData = useCallback((updater) => {
    setDataRaw((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      const stamped = { ...next, lastUpdated: new Date().toISOString() };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => persistNow(stamped), 500);
      return stamped;
    });
  }, [persistNow]);

  const handleReset = async () => {
    const fresh = emptyData();
    setDataRaw(fresh);
    try { await storage.set(STORAGE_KEY, JSON.stringify(fresh)); } catch (e) { setSaveError("Reset save failed."); }
    setShowReset(false);
  };

  if (loading || !data) {
    return (
      <div className="fpd-root">
        <style>{CSS}</style>
        <div className="fpd-loading">Loading dashboard…</div>
      </div>
    );
  }

  const rag = computeRAG(data.project, data.risks, data.milestones);

  return (
    <div className="fpd-root">
      <style>{CSS}</style>

      <div className="fpd-topbar fpd-noprint">
        <div className="fpd-brand">
          <h1>{data.project.name || "Untitled project"}</h1>
          <span className="sub">Last updated {fmtDateTime(data.lastUpdated)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div className="fpd-tabs">
            <button className={`fpd-tab${tab === "edit" ? " active" : ""}`} onClick={() => setTab("edit")} disabled title="Data entry is currently locked">Edit Data</button>
            <button className={`fpd-tab${tab === "dashboard" ? " active" : ""}`} onClick={() => setTab("dashboard")}>Dashboard</button>
          </div>
          <button className="fpd-toolbtn" onClick={() => window.print()}>🖨️ Print / Export</button>
          <button className="fpd-toolbtn danger" onClick={() => setShowReset(true)}>Reset data</button>
        </div>
      </div>

      {saveError && (
        <div className="fpd-noprint" style={{ background: "var(--rag-red-bg)", color: "var(--rag-red)", padding: "8px 12px", borderRadius: 8, fontSize: 12, marginBottom: 12 }}>
          {saveError}
        </div>
      )}

      {tab === "dashboard" && (
        <div className="fpd-noprint" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
          <div className="fpd-dropdown-wrap">
            <label style={{ fontSize: 12, fontWeight: 650, color: "var(--ink-soft)" }}>Viewing as:</label>
            <select className="fpd-dropdown" value={stakeholder} onChange={(e) => setStakeholder(e.target.value)}>
              {STAKEHOLDERS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <RagPill status={rag} />
        </div>
      )}

      {tab === "edit" ? (
        <DataEntryView data={data} setData={setData} />
      ) : (
        <DashboardView data={data} stakeholder={stakeholder} />
      )}

      {showReset && (
        <div className="fpd-modal-overlay fpd-noprint">
          <div className="fpd-modal">
            <h3>Reset all project data?</h3>
            <p>This clears the data tab, dashboard, and all logged snapshots. This can't be undone — use this to start a new project or reporting cycle.</p>
            <div className="row">
              <button className="fpd-toolbtn" onClick={() => setShowReset(false)}>Cancel</button>
              <button className="fpd-toolbtn danger" onClick={handleReset}>Reset everything</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
