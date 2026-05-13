"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCandidates, createCandidate, updateCandidateDecision,
  getPositions, getAdminUsers, type CreateCandidatePayload,
} from "@/lib/services";

const STATUS_CFG: Record<string, { bg: string; color: string }> = {
  APPROVED: { bg: "#f0fdf4", color: "#16a34a" },
  PENDING:  { bg: "#fffbeb", color: "#d97706" },
  REJECTED: { bg: "#fef2f2", color: "#dc2626" },
};

const ITEMS = 8;

export default function CandidatesPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateCandidatePayload>({ userId: "", positionId: "", manifesto: "", photoUrl: "" });
  const [selectedUser, setSelectedUser] = useState<{ id: string; fullName: string | null; matricNo: string } | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const { data: candidates, isLoading } = useQuery({
    queryKey: ["admin-candidates"],
    queryFn: () => getCandidates(),
  });
  const { data: positions } = useQuery({ queryKey: ["admin-positions"], queryFn: () => getPositions() });
  const { data: allUsers } = useQuery({ queryKey: ["admin-users"], queryFn: getAdminUsers });

  const filteredUsers = (allUsers || []).filter(u =>
    !userSearch ||
    (u.fullName || "").toLowerCase().includes(userSearch.toLowerCase()) ||
    u.matricNo.toLowerCase().includes(userSearch.toLowerCase())
  ).slice(0, 10);

  const createMut = useMutation({
    mutationFn: (payload: CreateCandidatePayload) => {
      // Strip empty optional fields — backend Zod rejects "" as invalid URL/string
      const clean: CreateCandidatePayload = {
        userId: payload.userId,
        positionId: payload.positionId,
      };
      if (payload.manifesto?.trim()) clean.manifesto = payload.manifesto.trim();
      if (payload.photoUrl?.trim()) clean.photoUrl = payload.photoUrl.trim();
      return createCandidate(clean);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-candidates"] });
      setShowCreate(false);
      setForm({ userId: "", positionId: "", manifesto: "", photoUrl: "" });
      setSelectedUser(null);
      setUserSearch("");
      setError("");
    },
    onError: (e: any) => {
      const msg = e.response?.data?.error || "Failed to add candidate.";
      const issues = e.response?.data?.issues?.map((i: any) => `${i.path?.join(".") ?? "field"}: ${i.message}`).join(", ");
      setError(issues ? `${msg} — ${issues}` : msg);
    },
  });

  const decisionMut = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "APPROVED" | "REJECTED" }) =>
      updateCandidateDecision(id, decision),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-candidates"] }),
  });

  const stats = {
    total: candidates?.length || 0,
    approved: candidates?.filter(c => c.status === "APPROVED").length || 0,
    pending: candidates?.filter(c => c.status === "PENDING").length || 0,
    rejected: candidates?.filter(c => c.status === "REJECTED").length || 0,
  };

  const filtered = (candidates || []).filter(c => {
    const matchSearch = !search ||
      (c.user?.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.user?.matricNo || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS));
  const paginated = filtered.slice((page - 1) * ITEMS, page * ITEMS);

  const inputStyle = { width: "100%", padding: "9px 12px", border: "1px solid #e8eaf0", borderRadius: "8px", fontSize: "13px", color: "#374151", outline: "none", background: "#fff", boxSizing: "border-box" as const, fontFamily: "inherit" };
  const labelStyle = { display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px" };

  return (
    <div style={{ maxWidth: "1100px" }}>

      {/* Modal */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(12,26,58,0.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setShowCreate(false)}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "500px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0c1a3a" }}>Add New Candidate</h3>
              <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "20px", lineHeight: 1 }}>×</button>
            </div>
            {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>{error}</div>}
            <form onSubmit={e => { e.preventDefault(); if (!form.userId) { setError("Please select a student."); return; } createMut.mutate(form); }} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

              {/* User picker */}
              <div>
                <label style={labelStyle}>Student <span style={{ color: "#ef4444" }}>*</span></label>
                {selectedUser ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", border: "1.5px solid #2563eb", borderRadius: "8px", background: "#eff6ff" }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#0c1a3a" }}>{selectedUser.fullName || "—"}</div>
                      <div style={{ fontSize: "11px", color: "#6b7280", fontFamily: "monospace" }}>{selectedUser.matricNo}</div>
                    </div>
                    <button type="button" onClick={() => { setSelectedUser(null); setForm({ ...form, userId: "" }); setUserSearch(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "18px", lineHeight: 1 }}>×</button>
                  </div>
                ) : (
                  <div style={{ position: "relative" }}>
                    <input
                      style={{ ...inputStyle, paddingLeft: "34px" }}
                      value={userSearch}
                      onChange={e => { setUserSearch(e.target.value); setShowUserDropdown(true); }}
                      onFocus={() => setShowUserDropdown(true)}
                      placeholder="Search by name or matric number…"
                      autoComplete="off"
                    />
                    <svg style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    {showUserDropdown && userSearch.length > 0 && (
                      <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1px solid #e8eaf0", borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 300, maxHeight: "220px", overflowY: "auto" }}>
                        {filteredUsers.length === 0 ? (
                          <div style={{ padding: "14px 16px", fontSize: "13px", color: "#9ca3af", textAlign: "center" }}>No students found</div>
                        ) : filteredUsers.map(u => (
                          <div
                            key={u.id}
                            onClick={() => { setSelectedUser(u as any); setForm({ ...form, userId: u.id }); setShowUserDropdown(false); setUserSearch(""); }}
                            style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f5f6fa", transition: "background 0.1s" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#f0f7ff")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          >
                            <div style={{ fontSize: "13px", fontWeight: 600, color: "#0c1a3a" }}>{u.fullName || "(No name)"}</div>
                            <div style={{ fontSize: "11px", color: "#6b7280", fontFamily: "monospace" }}>{u.matricNo}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Position */}
              <div>
                <label style={labelStyle}>Position <span style={{ color: "#ef4444" }}>*</span></label>
                <select style={inputStyle} value={form.positionId} onChange={e => setForm({ ...form, positionId: e.target.value })} required>
                  <option value="">Select position…</option>
                  {positions?.map(p => <option key={p.id} value={p.id}>{p.name}{(p as any).election ? ` — ${(p as any).election.title}` : ""}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Photo URL <span style={{ fontWeight: 400, color: "#9ca3af" }}>(optional)</span></label>
                <input style={inputStyle} value={form.photoUrl || ""} onChange={e => setForm({ ...form, photoUrl: e.target.value })} placeholder="https://…" />
              </div>
              <div>
                <label style={labelStyle}>Manifesto <span style={{ fontWeight: 400, color: "#9ca3af" }}>(optional)</span></label>
                <textarea style={{ ...inputStyle, height: "80px", resize: "vertical" }} value={form.manifesto || ""} onChange={e => setForm({ ...form, manifesto: e.target.value })} placeholder="Campaign statement…" />
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "4px" }}>
                <button type="button" onClick={() => setShowCreate(false)} style={{ padding: "9px 18px", background: "#f5f6fa", color: "#374151", border: "1px solid #e8eaf0", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                  Cancel
                </button>
                <button type="submit" disabled={createMut.isPending} style={{ padding: "9px 18px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  {createMut.isPending ? "Adding…" : "Add Candidate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0c1a3a", marginBottom: "4px", letterSpacing: "-0.3px" }}>Candidates</h1>
          <p style={{ fontSize: "13px", color: "#9ca3af" }}>Review and approve candidate applications</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 18px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13.5px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 1px 4px rgba(37,99,235,0.25)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Candidate
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "20px" }} className="cand-stats">
        {[
          { label: "Total", value: stats.total, accent: "#2563eb", bg: "#eff6ff" },
          { label: "Approved", value: stats.approved, accent: "#16a34a", bg: "#f0fdf4" },
          { label: "Pending", value: stats.pending, accent: "#d97706", bg: "#fffbeb" },
          { label: "Rejected", value: stats.rejected, accent: "#dc2626", bg: "#fef2f2" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", border: "1px solid #e8eaf0", borderRadius: "10px", padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "8px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 700, color: s.accent, flexShrink: 0 }}>
              {s.value}
            </div>
            <div style={{ fontSize: "12px", fontWeight: 500, color: "#6b7280" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1", minWidth: "200px", maxWidth: "300px" }}>
          <svg style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Search by name or matric…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ width: "100%", padding: "8px 10px 8px 32px", border: "1px solid #e8eaf0", borderRadius: "8px", fontSize: "13px", color: "#374151", outline: "none", background: "#fff", boxSizing: "border-box" as const }} />
        </div>
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            style={{ padding: "7px 14px", borderRadius: "7px", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: statusFilter === s ? "1px solid #bfdbfe" : "1px solid #e8eaf0", background: statusFilter === s ? "#eff6ff" : "#fff", color: statusFilter === s ? "#2563eb" : "#6b7280", transition: "all 0.15s" }}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #e8eaf0", borderRadius: "12px", overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
            <div className="cand-spinner" />
          </div>
        ) : paginated.length > 0 ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "36px 2fr 1.5fr 1fr 1fr 1.5fr", padding: "10px 20px", background: "#f8f9fb", borderBottom: "1px solid #e8eaf0", gap: "12px" }}>
              {["", "Candidate", "Position", "Dept", "Status", "Actions"].map((h, i) => (
                <div key={i} style={{ fontSize: "11px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</div>
              ))}
            </div>

            {paginated.map((c, i) => {
              const cfg = STATUS_CFG[c.status] || { bg: "#f8f9fb", color: "#6b7280" };
              const isLast = i === paginated.length - 1;
              return (
                <div
                  key={c.id}
                  style={{ display: "grid", gridTemplateColumns: "36px 2fr 1.5fr 1fr 1fr 1.5fr", padding: "12px 20px", borderBottom: isLast ? "none" : "1px solid #f5f6fa", gap: "12px", alignItems: "center", transition: "background 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fafbfd")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#f0f4ff", border: "1px solid #e0e7ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "#2563eb", overflow: "hidden" }}>
                    {c.photoUrl ? <img src={c.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (c.user?.fullName?.[0] || "?").toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#0c1a3a" }}>{c.user?.fullName || "—"}</div>
                    <div style={{ fontSize: "11px", color: "#9ca3af", fontFamily: "monospace" }}>{c.user?.matricNo}</div>
                  </div>
                  <div style={{ fontSize: "12.5px", color: "#6b7280" }}>
                    {positions?.find(p => p.id === c.positionId)?.name || "—"}
                  </div>
                  <div style={{ fontSize: "12px", color: "#9ca3af" }}>CSC</div>
                  <div>
                    <span style={{ display: "inline-block", fontSize: "11px", fontWeight: 700, color: cfg.color, background: cfg.bg, padding: "3px 10px", borderRadius: "100px" }}>
                      {c.status}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    {c.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => decisionMut.mutate({ id: c.id, decision: "APPROVED" })}
                          title="Approve"
                          style={{ width: "28px", height: "28px", borderRadius: "6px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </button>
                        <button
                          onClick={() => decisionMut.mutate({ id: c.id, decision: "REJECTED" })}
                          title="Reject"
                          style={{ width: "28px", height: "28px", borderRadius: "6px", background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </>
                    )}
                    {c.status !== "PENDING" && (
                      <span style={{ fontSize: "11px", color: "#d1d5db" }}>—</span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            <div style={{ padding: "12px 20px", borderTop: "1px solid #f0f1f5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                {filtered.length === 0 ? "No entries" : `${(page - 1) * ITEMS + 1}–${Math.min(page * ITEMS, filtered.length)} of ${filtered.length}`}
              </span>
              <div style={{ display: "flex", gap: "4px" }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "5px 12px", border: "1px solid #e8eaf0", borderRadius: "6px", fontSize: "12px", fontWeight: 500, background: "#fff", color: "#374151", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.5 : 1, fontFamily: "inherit" }}>Prev</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(pg => (
                  <button key={pg} onClick={() => setPage(pg)} style={{ padding: "5px 10px", border: `1px solid ${page === pg ? "#2563eb" : "#e8eaf0"}`, borderRadius: "6px", fontSize: "12px", fontWeight: page === pg ? 700 : 500, background: page === pg ? "#2563eb" : "#fff", color: page === pg ? "#fff" : "#374151", cursor: "pointer", fontFamily: "inherit" }}>{pg}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "5px 12px", border: "1px solid #e8eaf0", borderRadius: "6px", fontSize: "12px", fontWeight: 500, background: "#fff", color: "#374151", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.5 : 1, fontFamily: "inherit" }}>Next</button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: "60px 24px", textAlign: "center" }}>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "#6b7280", marginBottom: "4px" }}>No candidates found</p>
            <p style={{ fontSize: "12.5px", color: "#9ca3af" }}>Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      <style>{`
        .cand-spinner { width:32px;height:32px;border:2.5px solid #e2e4ea;border-top-color:#2563eb;border-radius:50%;animation:cSpin 0.7s linear infinite; }
        @keyframes cSpin { to { transform:rotate(360deg); } }
        @media (max-width: 640px) { .cand-stats { grid-template-columns: repeat(2,1fr) !important; } }
      `}</style>
    </div>
  );
}
