"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPositions, createPosition, getAdminElections, type CreatePositionPayload } from "@/lib/services";

export default function PositionsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreatePositionPayload>({ name: "", electionId: "" });
  const [error, setError] = useState("");

  const { data: elections } = useQuery({ queryKey: ["admin-elections"], queryFn: getAdminElections });
  const { data: positions, isLoading } = useQuery({ queryKey: ["admin-positions"], queryFn: () => getPositions() });

  const createMut = useMutation({
    mutationFn: createPosition,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-positions"] }); setShowCreate(false); setForm({ name: "", electionId: "" }); setError(""); },
    onError: (e: unknown) => { const ax = e as { response?: { data?: { error?: string } } }; setError(ax.response?.data?.error || "Failed."); },
  });

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Positions</h1><p className="page-subtitle">Manage election positions</p></div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create Position</button>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Create New Position</h3>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={(e) => { e.preventDefault(); if (!form.electionId) { setError("Select an election."); return; } createMut.mutate(form); }}>
              <div className="form-group">
                <label className="form-label">Election</label>
                <select className="form-select" value={form.electionId} onChange={(e) => setForm({ ...form, electionId: e.target.value })} required>
                  <option value="">Select election…</option>
                  {elections?.map((el) => <option key={el.id} value={el.id}>{el.title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Position Name</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. President, Secretary" required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMut.isPending}>{createMut.isPending ? "Creating…" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="loading-page"><div className="spinner spinner-lg" /></div>
      ) : positions && positions.length > 0 ? (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-wrapper" style={{ border: "none" }}>
            <table>
              <thead><tr><th>Name</th><th>Election</th><th>Max Winners</th><th>Created</th></tr></thead>
              <tbody>
                {positions.map((pos) => (
                  <tr key={pos.id}>
                    <td style={{ fontWeight: 500, color: "var(--navy-900)" }}>{pos.name}</td>
                    <td>{elections?.find((e) => e.id === pos.electionId)?.title || `—`}</td>
                    <td>{pos.maxWinners}</td>
                    <td>{new Date(pos.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card"><div className="empty-state"><p>No positions found.</p></div></div>
      )}
    </div>
  );
}
