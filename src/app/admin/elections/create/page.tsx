"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { createElection, getElectionTypes, getDepartments, type CreateElectionPayload } from "@/lib/services";
import toast from "react-hot-toast";

const STEPS = ["Basic Info", "Schedule", "Settings"];

export default function CreateElectionPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CreateElectionPayload>({ title: "", typeName: "", departmentId: null, startAt: "", endAt: "" });
  const [description, setDescription] = useState("");
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false);
  const [error, setError] = useState("");

  const { data: types } = useQuery({ queryKey: ["admin-election-types"], queryFn: getElectionTypes });
  const { data: departments } = useQuery({ queryKey: ["admin-departments"], queryFn: getDepartments });

  const createMut = useMutation({
    mutationFn: (data: CreateElectionPayload) => {
      const payload: CreateElectionPayload = { title: data.title, typeName: data.typeName, departmentId: data.departmentId || null };
      if (data.startAt) payload.startAt = new Date(data.startAt).toISOString();
      if (data.endAt) payload.endAt = new Date(data.endAt).toISOString();
      return createElection(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-elections"] });
      toast.success("Election created successfully!");
      router.push("/admin/elections");
    },
    onError: (e: any) => {
      const errMsg = e.response?.data?.error || "Failed to create election.";
      const issues = e.response?.data?.issues?.map((i: any) => `${i.path.join(".")}: ${i.message}`).join(", ");
      setError(issues ? `${errMsg} (${issues})` : errMsg);
      setStep(0);
    },
  });

  const canNext = step === 0 ? form.title.trim().length >= 3 && form.typeName !== "" : true;

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", paddingBottom: "48px" }}>

      {/* Page Title */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <button
            onClick={() => router.back()}
            style={{ display: "flex", alignItems: "center", gap: "5px", background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "13px", fontFamily: "inherit", padding: 0 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 14px rgba(37,99,235,0.35)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/></svg>
          </div>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0c1a3a", margin: 0, letterSpacing: "-0.4px" }}>Create New Election</h1>
            <p style={{ fontSize: "13px", color: "#9ca3af", margin: "2px 0 0" }}>Configure and launch a new election for RUNSA</p>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: "28px", gap: "0" }}>
        {STEPS.map((label, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "unset" }}>
            <div
              onClick={() => i < step && setStep(i)}
              style={{ display: "flex", alignItems: "center", gap: "8px", cursor: i < step ? "pointer" : "default" }}
            >
              <div style={{
                width: "30px", height: "30px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "12px", fontWeight: 700, flexShrink: 0, transition: "all 0.3s",
                background: i < step ? "#2563eb" : i === step ? "linear-gradient(135deg,#2563eb,#4f46e5)" : "#e8eaf0",
                color: i <= step ? "#fff" : "#9ca3af",
                boxShadow: i === step ? "0 0 0 4px rgba(37,99,235,0.18)" : "none",
              }}>
                {i < step
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : i + 1}
              </div>
              <span style={{ fontSize: "12.5px", fontWeight: i === step ? 700 : 500, color: i <= step ? "#0c1a3a" : "#9ca3af", whiteSpace: "nowrap" }}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: "2px", margin: "0 12px", background: i < step ? "#2563eb" : "#e8eaf0", borderRadius: "2px", transition: "background 0.3s" }} />
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", padding: "14px 16px", marginBottom: "20px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "1px" }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span style={{ fontSize: "13px", color: "#991b1b", lineHeight: 1.5 }}>{error}</span>
        </div>
      )}

      {/* Card */}
      <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid #e8eaf0", boxShadow: "0 4px 24px rgba(12,26,58,0.06)", overflow: "hidden" }}>

        {/* Card Header Strip */}
        <div style={{ height: "4px", background: "linear-gradient(90deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%)" }} />

        <div style={{ padding: "32px 36px" }}>

          {/* ── STEP 0: Basic Info ── */}
          {step === 0 && (
            <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
              <SectionTitle icon="clipboard" title="Basic Information" subtitle="Set the election name and type" />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "24px" }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <FieldLabel text="Election Name" required />
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g., RUNSA Student Government Elections 2025"
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = "#2563eb")}
                    onBlur={e => (e.target.style.borderColor = "#e2e8f0")}
                  />
                </div>

                <div>
                  <FieldLabel text="Election Type" required />
                  <div style={{ position: "relative" }}>
                    <select
                      value={form.typeName}
                      onChange={(e) => setForm({ ...form, typeName: e.target.value })}
                      style={{ ...inputStyle, appearance: "none", paddingRight: "40px" }}
                    >
                      <option value="" disabled>Select type…</option>
                      {types?.map((t: any) => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                    <div style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#9ca3af" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                  </div>
                </div>

                <div>
                  <FieldLabel text="Eligible Departments" />
                  <div style={{ position: "relative" }}>
                    <select
                      value={form.departmentId ?? ""}
                      onChange={(e) => setForm({ ...form, departmentId: e.target.value || null })}
                      style={{ ...inputStyle, appearance: "none", paddingRight: "40px" }}
                    >
                      <option value="">Campus-wide (All Departments)</option>
                      {departments?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <div style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#9ca3af" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                  </div>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <FieldLabel text="Description" hint="Optional" />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide additional context about this election, its scope, and what positions are being contested…"
                    rows={4}
                    style={{ ...inputStyle, resize: "vertical", lineHeight: "1.6" }}
                    onFocus={e => (e.target.style.borderColor = "#2563eb")}
                    onBlur={e => (e.target.style.borderColor = "#e2e8f0")}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 1: Schedule ── */}
          {step === 1 && (
            <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
              <SectionTitle icon="calendar" title="Election Schedule" subtitle="Set when voting opens and closes (optional)" />

              <div style={{ background: "linear-gradient(135deg, #eff6ff, #eef2ff)", border: "1px solid #c7d2fe", borderRadius: "12px", padding: "14px 16px", display: "flex", gap: "10px", marginTop: "20px", marginBottom: "24px" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "1px" }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span style={{ fontSize: "12.5px", color: "#4338ca", lineHeight: 1.6 }}>
                  Dates are <strong>optional</strong>. If left blank, the election will be active immediately and remain open until manually closed.
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <FieldLabel text="Start Date & Time" hint="Optional" />
                  <div style={{ position: "relative" }}>
                    <input
                      type="datetime-local"
                      value={form.startAt}
                      onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                      style={{ ...inputStyle, paddingLeft: "42px" }}
                      onFocus={e => (e.target.style.borderColor = "#2563eb")}
                      onBlur={e => (e.target.style.borderColor = "#e2e8f0")}
                    />
                    <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </div>
                  </div>
                </div>

                <div>
                  <FieldLabel text="End Date & Time" hint="Optional" />
                  <div style={{ position: "relative" }}>
                    <input
                      type="datetime-local"
                      value={form.endAt}
                      onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                      style={{ ...inputStyle, paddingLeft: "42px" }}
                      onFocus={e => (e.target.style.borderColor = "#2563eb")}
                      onBlur={e => (e.target.style.borderColor = "#e2e8f0")}
                    />
                    <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline preview */}
              {(form.startAt || form.endAt) && (
                <div style={{ marginTop: "24px", padding: "16px 20px", background: "#f8faff", border: "1px solid #e0e7ff", borderRadius: "12px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "12px" }}>Schedule Preview</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "3px" }}>Opens</div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#0c1a3a" }}>{form.startAt ? new Date(form.startAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Immediately"}</div>
                    </div>
                    <div style={{ flex: 1, height: "2px", background: "linear-gradient(90deg,#2563eb,#7c3aed)", borderRadius: "2px" }} />
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "3px" }}>Closes</div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#0c1a3a" }}>{form.endAt ? new Date(form.endAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Manually"}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Settings & Review ── */}
          {step === 2 && (
            <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
              <SectionTitle icon="settings" title="Settings & Review" subtitle="Confirm details before creating the election" />

              {/* Toggle */}
              <div style={{ margin: "24px 0", padding: "18px 20px", background: "#f8faff", border: "1px solid #e0e7ff", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#0c1a3a" }}>Allow Multiple Votes</div>
                  <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "3px" }}>Can voters cast more than one vote per position?</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={allowMultipleVotes}
                  onClick={() => setAllowMultipleVotes(!allowMultipleVotes)}
                  style={{ width: "48px", height: "26px", borderRadius: "100px", border: "none", cursor: "pointer", transition: "background 0.3s", background: allowMultipleVotes ? "#2563eb" : "#d1d5db", position: "relative", flexShrink: 0 }}
                >
                  <span style={{ position: "absolute", top: "3px", width: "20px", height: "20px", background: "#fff", borderRadius: "50%", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.3s", left: allowMultipleVotes ? "25px" : "3px" }} />
                </button>
              </div>

              {/* Review Summary */}
              <div style={{ background: "#f8f9fb", borderRadius: "14px", border: "1px solid #e8eaf0", overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", background: "#f0f4ff", borderBottom: "1px solid #e0e7ff" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#3730a3", textTransform: "uppercase", letterSpacing: "0.7px" }}>Review Summary</span>
                </div>
                {[
                  { label: "Election Name", value: form.title || "—" },
                  { label: "Election Type", value: form.typeName || "—" },
                  { label: "Department", value: departments?.find(d => d.id === form.departmentId)?.name || "Campus-wide" },
                  { label: "Start", value: form.startAt ? new Date(form.startAt).toLocaleString() : "Immediately" },
                  { label: "End", value: form.endAt ? new Date(form.endAt).toLocaleString() : "Manual close" },
                  { label: "Multiple Votes", value: allowMultipleVotes ? "Yes" : "No" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", alignItems: "flex-start", padding: "12px 20px", borderBottom: "1px solid #f0f1f5" }}>
                    <span style={{ width: "140px", fontSize: "12px", color: "#6b7280", fontWeight: 500, flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: "13px", color: "#0c1a3a", fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ padding: "20px 36px", borderTop: "1px solid #f0f1f5", background: "#fafbfd", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            type="button"
            onClick={() => step === 0 ? router.back() : setStep(s => s - 1)}
            style={{ padding: "10px 22px", background: "#fff", color: "#374151", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "13.5px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f5f6fa")}
            onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
          >
            {step === 0 ? "Cancel" : "← Back"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{ width: i === step ? "20px" : "6px", height: "6px", borderRadius: "3px", background: i <= step ? "#2563eb" : "#e2e8f0", transition: "all 0.3s" }} />
            ))}
          </div>

          {step < 2 ? (
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setStep(s => s + 1)}
              style={{ padding: "10px 26px", background: canNext ? "linear-gradient(135deg,#2563eb,#4f46e5)" : "#e2e8f0", color: canNext ? "#fff" : "#9ca3af", border: "none", borderRadius: "10px", fontSize: "13.5px", fontWeight: 700, cursor: canNext ? "pointer" : "not-allowed", fontFamily: "inherit", boxShadow: canNext ? "0 4px 14px rgba(37,99,235,0.3)" : "none", transition: "all 0.2s" }}
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              disabled={createMut.isPending}
              onClick={() => { setError(""); createMut.mutate(form); }}
              style={{ padding: "10px 28px", background: createMut.isPending ? "#93c5fd" : "linear-gradient(135deg,#2563eb,#4f46e5)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "13.5px", fontWeight: 700, cursor: createMut.isPending ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(37,99,235,0.3)", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }}
            >
              {createMut.isPending
                ? <><Spinner /> Creating…</>
                : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Launch Election</>}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  clipboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
      <line x1="9" y1="12" x2="15" y2="12"/>
      <line x1="9" y1="16" x2="13" y2="16"/>
    </svg>
  ),
  calendar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
};

function SectionTitle({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "linear-gradient(135deg,#eff6ff,#eef2ff)", border: "1px solid #c7d2fe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {SECTION_ICONS[icon]}
      </div>
      <div>
        <div style={{ fontSize: "16px", fontWeight: 700, color: "#0c1a3a" }}>{title}</div>
        <div style={{ fontSize: "12.5px", color: "#9ca3af" }}>{subtitle}</div>
      </div>
    </div>
  );
}

function FieldLabel({ text, required, hint }: { text: string; required?: boolean; hint?: string }) {
  return (
    <label style={{ display: "block", marginBottom: "7px" }}>
      <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#374151" }}>{text}</span>
      {required && <span style={{ color: "#ef4444", marginLeft: "3px" }}>*</span>}
      {hint && <span style={{ fontSize: "11px", color: "#9ca3af", marginLeft: "6px", fontWeight: 400 }}>({hint})</span>}
    </label>
  );
}

function Spinner() {
  return (
    <span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </span>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  background: "#f8faff",
  border: "1.5px solid #e2e8f0",
  borderRadius: "10px",
  fontSize: "13.5px",
  color: "#0c1a3a",
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color 0.2s, box-shadow 0.2s",
  boxSizing: "border-box",
};
