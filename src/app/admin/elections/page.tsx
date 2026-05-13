"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminElections, updateElectionStatus, deleteAllElections, type Election } from "@/lib/services";
import Link from "next/link";

const STATUS_CONFIG: Record<string, { bg: string; color: string; dot: string }> = {
  OPEN:     { bg: "#f0fdf4", color: "#16a34a", dot: "#22c55e" },
  DRAFT:    { bg: "#f8fafc", color: "#64748b", dot: "#94a3b8" },
  CLOSED:   { bg: "#fffbeb", color: "#d97706", dot: "#f59e0b" },
  ARCHIVED: { bg: "#f5f3ff", color: "#7c3aed", dot: "#8b5cf6" },
};

const STATUS_FLOW: Record<string, Election["status"][]> = {
  DRAFT: ["OPEN"],
  OPEN:  ["CLOSED"],
  CLOSED: ["ARCHIVED"],
  ARCHIVED: [],
};

const NEXT_LABEL: Record<string, { label: string; bg: string; hover: string }> = {
  OPEN:     { label: "→ Open",     bg: "#16a34a", hover: "#15803d" },
  CLOSED:   { label: "→ Close",    bg: "#d97706", hover: "#b45309" },
  ARCHIVED: { label: "→ Archive",  bg: "#7c3aed", hover: "#6d28d9" },
};

export default function ElectionsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: elections, isLoading } = useQuery({
    queryKey: ["admin-elections"],
    queryFn: getAdminElections,
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Election["status"] }) =>
      updateElectionStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-elections"] }),
  });

  const deleteAllMut = useMutation({
    mutationFn: deleteAllElections,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-elections"] });
      setShowConfirm(false);
    },
  });

  const filtered = elections?.filter((el) =>
    el.title.toLowerCase().includes(search.toLowerCase()) ||
    (el.type?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: "1100px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0c1a3a", marginBottom: "4px", letterSpacing: "-0.3px" }}>Elections</h1>
          <p style={{ fontSize: "13px", color: "#9ca3af" }}>Create and manage all RUNSA elections</p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {elections && elections.length > 0 && (
            <button
              onClick={() => setShowConfirm(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 16px", background: "#fff0f0", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "8px", fontSize: "13.5px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#dc2626"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#dc2626"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#fff0f0"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.borderColor = "#fca5a5"; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              Delete All
            </button>
          )}
          <Link
            href="/admin/elections/create"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 18px", background: "#2563eb", color: "#fff", borderRadius: "8px", fontSize: "13.5px", fontWeight: 600, textDecoration: "none", boxShadow: "0 1px 4px rgba(37,99,235,0.25)", whiteSpace: "nowrap" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Create Election
          </Link>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ position: "relative", maxWidth: "320px" }}>
          <svg style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            placeholder="Search elections…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "9px 12px 9px 36px", border: "1px solid #e8eaf0", borderRadius: "8px", fontSize: "13px", color: "#374151", outline: "none", background: "#fff", boxSizing: "border-box" }}
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "280px" }}>
          <div className="el-spinner" />
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div style={{ background: "#fff", border: "1px solid #e8eaf0", borderRadius: "12px", overflow: "hidden" }}>
          {/* Table Header */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", padding: "10px 20px", background: "#f8f9fb", borderBottom: "1px solid #e8eaf0", gap: "12px" }}>
            {["Title", "Type", "Status", "Start", "End", "Actions"].map((h) => (
              <div key={h} style={{ fontSize: "11px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {filtered.map((el, i) => {
            const style = STATUS_CONFIG[el.status] || STATUS_CONFIG.ARCHIVED;
            const nextStatuses = STATUS_FLOW[el.status] || [];
            const isLast = i === filtered.length - 1;

            return (
              <div
                key={el.id}
                style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", padding: "14px 20px", borderBottom: isLast ? "none" : "1px solid #f5f6fa", gap: "12px", alignItems: "center", transition: "background 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#fafbfd")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div>
                  <Link href={`/admin/elections/${el.id}`} style={{ fontSize: "13.5px", fontWeight: 600, color: "#0c1a3a", textDecoration: "none" }}>
                    {el.title}
                  </Link>
                  {el.department?.name && (
                    <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>{el.department.name}</div>
                  )}
                </div>
                <div style={{ fontSize: "12.5px", color: "#6b7280" }}>{el.type?.name || "General"}</div>
                <div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 700, color: style.color, background: style.bg, padding: "3px 10px", borderRadius: "100px", letterSpacing: "0.5px" }}>
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: style.dot, flexShrink: 0 }} />
                    {el.status}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>{new Date(el.startAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>{new Date(el.endAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {nextStatuses.map((ns) => {
                    const nc = NEXT_LABEL[ns];
                    return (
                      <button
                        key={ns}
                        onClick={() => statusMut.mutate({ id: el.id, status: ns })}
                        disabled={statusMut.isPending}
                        style={{ padding: "5px 12px", background: nc?.bg || "#2563eb", color: "#fff", border: "none", borderRadius: "6px", fontSize: "11.5px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "opacity 0.15s" }}
                      >
                        {nc?.label || `→ ${ns}`}
                      </button>
                    );
                  })}
                  <Link
                    href={`/admin/elections/${el.id}`}
                    style={{ display: "inline-flex", alignItems: "center", padding: "5px 12px", background: "#f5f6fa", color: "#374151", border: "1px solid #e8eaf0", borderRadius: "6px", fontSize: "11.5px", fontWeight: 500, textDecoration: "none" }}
                  >
                    Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e8eaf0", borderRadius: "12px", padding: "64px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "12px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <p style={{ fontSize: "14px", fontWeight: 500, color: "#6b7280", marginBottom: "4px" }}>No elections found</p>
          <p style={{ fontSize: "12.5px", color: "#9ca3af", marginBottom: "16px" }}>Create your first election to get started</p>
          <Link href="/admin/elections/create" style={{ padding: "8px 20px", background: "#2563eb", color: "#fff", borderRadius: "8px", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
            Create Election →
          </Link>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, animation: "fadeIn 0.15s ease" }}>
          <div style={{ background: "#fff", borderRadius: "14px", padding: "32px 28px", maxWidth: "420px", width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", animation: "slideUp 0.2s ease" }}>
            {/* Icon */}
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "#fff0f0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </div>
            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#0c1a3a", textAlign: "center", marginBottom: "8px" }}>Delete All Elections?</h2>
            <p style={{ fontSize: "13.5px", color: "#6b7280", textAlign: "center", marginBottom: "6px", lineHeight: 1.6 }}>
              This will permanently delete <strong style={{ color: "#dc2626" }}>{elections?.length} election{elections?.length !== 1 ? "s" : ""}</strong> along with all their positions, candidates, and votes.
            </p>
            <p style={{ fontSize: "12px", color: "#9ca3af", textAlign: "center", marginBottom: "24px" }}>This action cannot be undone.</p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={deleteAllMut.isPending}
                style={{ flex: 1, padding: "10px", background: "#f5f6fa", color: "#374151", border: "1px solid #e8eaf0", borderRadius: "8px", fontSize: "13.5px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteAllMut.mutate()}
                disabled={deleteAllMut.isPending}
                style={{ flex: 1, padding: "10px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13.5px", fontWeight: 600, cursor: deleteAllMut.isPending ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: deleteAllMut.isPending ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                {deleteAllMut.isPending ? (
                  <><span className="el-spinner" style={{ width: "14px", height: "14px", borderWidth: "2px", borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} /> Deleting…</>
                ) : "Yes, Delete All"}
              </button>
            </div>
            {deleteAllMut.isError && (
              <p style={{ fontSize: "12px", color: "#dc2626", textAlign: "center", marginTop: "12px" }}>Failed to delete. Please try again.</p>
            )}
          </div>
        </div>
      )}

      <style>{`
        .el-spinner { width:32px;height:32px;border:2.5px solid #e2e4ea;border-top-color:#2563eb;border-radius:50%;animation:elSpin 0.7s linear infinite; }
        @keyframes elSpin { to { transform:rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { transform:translateY(16px); opacity:0; } to { transform:translateY(0); opacity:1; } }
        @media (max-width: 700px) { .el-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
