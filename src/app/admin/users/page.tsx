"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDepartments, type Department } from "@/lib/services";
import api from "@/lib/api";

interface AdminUser {
  id: string; matricNo: string; fullName: string; schoolEmail: string | null;
  isActive: boolean; department: string | null; departmentId: string | null;
  roles: string[]; createdAt: string;
}

async function getUsers(): Promise<AdminUser[]> {
  const { data } = await api.get("/admin/users");
  return data;
}
async function toggleActivate({ id, isActive }: { id: string; isActive: boolean }) {
  const { data } = await api.patch(`/admin/users/${id}/activate`, { isActive });
  return data;
}
async function assignDepartment({ id, departmentId }: { id: string; departmentId: string | null }) {
  const { data } = await api.patch(`/admin/users/${id}/department`, { departmentId });
  return data;
}

const ROLE_CFG: Record<string, { bg: string; color: string }> = {
  super_admin:  { bg: "#f5f3ff", color: "#7c3aed" },
  admin:        { bg: "#eff6ff", color: "#2563eb" },
  student:      { bg: "#f0fdf4", color: "#16a34a" },
  executive:    { bg: "#fff7ed", color: "#ea580c" },
  pro:          { bg: "#fdf2f8", color: "#9d174d" },
};

export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const { data: users, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: getUsers });
  const { data: departments } = useQuery({ queryKey: ["admin-departments"], queryFn: getDepartments });

  const toggleMut = useMutation({
    mutationFn: toggleActivate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
  const deptMut = useMutation({
    mutationFn: assignDepartment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const allRoles = Array.from(new Set((users || []).flatMap(u => u.roles)));

  const filtered = (users || []).filter(u => {
    const matchSearch = !search ||
      u.matricNo.toLowerCase().includes(search.toLowerCase()) ||
      (u.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.schoolEmail || "").toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "ALL" || u.roles.includes(roleFilter);
    return matchSearch && matchRole;
  });

  return (
    <div style={{ maxWidth: "1100px" }}>

      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0c1a3a", marginBottom: "4px", letterSpacing: "-0.3px" }}>Voters</h1>
        <p style={{ fontSize: "13px", color: "#9ca3af" }}>Manage registered voters and assign department access</p>
      </div>

      {/* Notice */}
      <div style={{ display: "flex", gap: "10px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px" }}>
        <span style={{ fontSize: "15px", flexShrink: 0 }}>🔒</span>
        <p style={{ fontSize: "12.5px", color: "#92400e", lineHeight: 1.5, margin: 0 }}>
          <strong>Department is admin-controlled.</strong> Assign a student's department only after verifying their official enrollment. This determines which departmental elections they can vote in.
        </p>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1", minWidth: "200px", maxWidth: "300px" }}>
          <svg style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            placeholder="Search by matric, name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "8px 10px 8px 32px", border: "1px solid #e8eaf0", borderRadius: "8px", fontSize: "13px", color: "#374151", outline: "none", background: "#fff", boxSizing: "border-box" as const }}
          />
        </div>

        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          style={{ padding: "8px 12px", border: "1px solid #e8eaf0", borderRadius: "8px", fontSize: "12.5px", color: "#374151", background: "#fff", outline: "none", fontFamily: "inherit", cursor: "pointer" }}
        >
          <option value="ALL">All Roles</option>
          {allRoles.map(r => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
        </select>

        <span style={{ fontSize: "12px", color: "#9ca3af", marginLeft: "auto" }}>
          {filtered.length} user{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #e8eaf0", borderRadius: "12px", overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
            <div className="users-spinner" />
          </div>
        ) : filtered.length > 0 ? (
          <>
            {/* Table Header */}
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr 1.5fr 1.5fr 1fr 1fr 1fr", padding: "10px 20px", background: "#f8f9fb", borderBottom: "1px solid #e8eaf0", gap: "12px" }}>
              {["Matric No", "Full Name", "Email", "Department", "Roles", "Status", "Action"].map(h => (
                <div key={h} style={{ fontSize: "11px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</div>
              ))}
            </div>

            {filtered.map((u, i) => {
              const isLast = i === filtered.length - 1;
              return (
                <div
                  key={u.id}
                  style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr 1.5fr 1.5fr 1fr 1fr 1fr", padding: "13px 20px", borderBottom: isLast ? "none" : "1px solid #f5f6fa", gap: "12px", alignItems: "center", transition: "background 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fafbfd")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ fontFamily: "monospace", fontSize: "12px", color: "#374151" }}>{u.matricNo}</div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#0c1a3a" }}>{u.fullName || "—"}</div>
                  <div style={{ fontSize: "12px", color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.schoolEmail || "—"}</div>
                  <div>
                    <select
                      value={u.departmentId ?? ""}
                      onChange={e => deptMut.mutate({ id: u.id, departmentId: e.target.value || null })}
                      style={{ padding: "5px 8px", border: "1px solid #e8eaf0", borderRadius: "6px", fontSize: "12px", color: "#374151", background: "#fff", outline: "none", cursor: "pointer", maxWidth: "100%", fontFamily: "inherit" }}
                    >
                      <option value="">— Unassigned —</option>
                      {(departments as Department[] | undefined)?.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {u.roles.map(r => {
                      const rc = ROLE_CFG[r] || { bg: "#f5f6fa", color: "#6b7280" };
                      return (
                        <span key={r} style={{ fontSize: "10px", fontWeight: 700, color: rc.color, background: rc.bg, padding: "2px 8px", borderRadius: "100px", textTransform: "capitalize" }}>
                          {r.replace("_", " ")}
                        </span>
                      );
                    })}
                  </div>
                  <div>
                    <span style={{ display: "inline-block", fontSize: "11px", fontWeight: 700, color: u.isActive ? "#16a34a" : "#dc2626", background: u.isActive ? "#f0fdf4" : "#fef2f2", padding: "3px 10px", borderRadius: "100px" }}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div>
                    <button
                      disabled={toggleMut.isPending}
                      onClick={() => toggleMut.mutate({ id: u.id, isActive: !u.isActive })}
                      style={{
                        padding: "6px 14px",
                        background: u.isActive ? "#fef2f2" : "#f0fdf4",
                        color: u.isActive ? "#dc2626" : "#16a34a",
                        border: `1px solid ${u.isActive ? "#fecaca" : "#bbf7d0"}`,
                        borderRadius: "7px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "all 0.15s",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <div style={{ padding: "60px 24px", textAlign: "center" }}>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "#6b7280" }}>No users found</p>
          </div>
        )}
      </div>

      <style>{`
        .users-spinner { width:32px;height:32px;border:2.5px solid #e2e4ea;border-top-color:#2563eb;border-radius:50%;animation:uSpin 0.7s linear infinite; }
        @keyframes uSpin { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
}
