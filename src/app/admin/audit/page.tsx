"use client";

import { useQuery } from "@tanstack/react-query";
import { getAuditLogs } from "@/lib/services";

export default function AuditLogsPage() {
  const { data: logs, isLoading, error } = useQuery({ queryKey: ["audit-logs"], queryFn: getAuditLogs, retry: false });

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Audit Logs</h1><p className="page-subtitle">System activity and action history</p></div>
      </div>
      {isLoading ? (
        <div className="loading-page"><div className="spinner spinner-lg" /></div>
      ) : error ? (
        <div className="card" style={{ border: "1px solid var(--danger)", background: "var(--danger-light, #fef2f2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--danger)", marginBottom: "8px" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <h3 style={{ fontSize: "16px", fontWeight: 600 }}>Blocked by Missing Backend Endpoint</h3>
          </div>
          <p style={{ fontSize: "14px", color: "var(--danger)" }}>The backend route <strong>GET /admin/audit-logs</strong> does not exist in the Express application. This page cannot function until the endpoint is implemented.</p>
        </div>
      ) : logs && logs.length > 0 ? (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-wrapper" style={{ border: "none" }}>
            <table>
              <thead><tr><th>Timestamp</th><th>Action</th><th>Entity</th><th>Actor</th><th>Details</th></tr></thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: "nowrap", fontSize: "13px" }}>{new Date(log.createdAt).toLocaleString()}</td>
                    <td><span className="badge badge-draft" style={{ textTransform: "none" }}>{log.action}</span></td>
                    <td style={{ fontSize: "13px" }}>{log.entityType} #{log.entityId.slice(0, 8)}</td>
                    <td>{log.actor ? `${log.actor.fullName}` : `User #${log.actorId.slice(0, 8)}`}</td>
                    <td style={{ fontSize: "13px", color: "var(--gray-600)", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {typeof log.details === "object" ? JSON.stringify(log.details) : String(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card"><div className="empty-state"><p>No audit logs recorded yet.</p></div></div>
      )}
    </div>
  );
}
