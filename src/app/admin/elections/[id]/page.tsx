"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminElections, updateElectionStatus, setAllowedRoles, getPositions, getCandidates, getRoles, type Election } from "@/lib/services";

export default function ElectionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const electionId = id as string;

  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [rolesMsg, setRolesMsg] = useState("");

  const { data: elections } = useQuery({ queryKey: ["admin-elections"], queryFn: getAdminElections });
  const election = elections?.find((e) => e.id === electionId);

  const { data: positions, isLoading: loadingPos } = useQuery({ queryKey: ["positions", electionId], queryFn: () => getPositions(electionId), enabled: !!electionId });
  const { data: roles, error: rolesError } = useQuery({ queryKey: ["roles"], queryFn: getRoles, retry: false });
  const { data: candidates } = useQuery({ queryKey: ["candidates-all"], queryFn: () => getCandidates() });

  const statusMut = useMutation({
    mutationFn: (status: Election["status"]) => updateElectionStatus(electionId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-elections"] }),
  });

  const rolesMut = useMutation({
    mutationFn: (roleNames: string[]) => setAllowedRoles(electionId, roleNames),
    onSuccess: () => { setRolesMsg("Allowed roles updated!"); setTimeout(() => setRolesMsg(""), 3000); },
    onError: () => setRolesMsg("Failed to update roles."),
  });

  if (!election) return <div className="loading-page"><div className="spinner spinner-lg" /></div>;

  const electionCandidates = candidates?.filter((c) => positions?.some((p) => p.id === c.positionId));
  const statusFlow: Record<string, Election["status"][]> = { DRAFT: ["OPEN"], OPEN: ["CLOSED"], CLOSED: ["ARCHIVED"], ARCHIVED: [] };

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => router.push("/admin/elections")} style={{ marginBottom: "8px" }}>← Back to Elections</button>
          <h1 className="page-title">{election.title}</h1>
          <p className="page-subtitle">{election.department?.name || "Campus-wide"} &middot; {election.type?.name || "Election"}</p>
        </div>
        <span className={`badge badge-${election.status.toLowerCase()}`}>{election.status}</span>
      </div>

      <div className="flex flex-col md:grid md:grid-cols-2 gap-4 mb-6">
        <div className="card">
          <h3 className="card-title">Election Details</h3>
          <div style={{ display: "grid", gap: "12px", marginTop: "12px", fontSize: "14px" }}>
            <div><strong>Start:</strong> {election.startAt ? new Date(election.startAt).toLocaleString() : "TBD"}</div>
            <div><strong>End:</strong> {election.endAt ? new Date(election.endAt).toLocaleString() : "TBD"}</div>
          </div>
          {statusFlow[election.status]?.length > 0 && (
            <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
              {statusFlow[election.status].map((ns) => (
                <button key={ns} className={`btn btn-sm ${ns === "OPEN" ? "btn-success" : ns === "CLOSED" ? "btn-danger" : "btn-secondary"}`}
                  onClick={() => statusMut.mutate(ns)} disabled={statusMut.isPending}>Move to {ns}</button>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="card-title">Allowed Voter Roles</h3>
          {election.status !== "DRAFT" ? (
            <p style={{ fontSize: "14px", color: "var(--gray-500)", marginTop: "12px" }}>Roles can only be modified when election is in DRAFT status.</p>
          ) : (
            <>
              {rolesError && (
                <div className="alert alert-error" style={{ marginTop: "12px", marginBottom: "12px" }}>
                  <strong>Blocked by Backend:</strong> GET /admin/roles is missing. Cannot fetch or manage election roles.
                </div>
              )}
              {rolesMsg && <div className={`alert ${rolesMsg.includes("updated") ? "alert-success" : "alert-error"}`}>{rolesMsg}</div>}
              <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {roles?.map((role) => (
                  <label key={role.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" }}>
                    <input type="checkbox" checked={selectedRoles.includes(role.name)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedRoles([...selectedRoles, role.name]);
                        else setSelectedRoles(selectedRoles.filter((r) => r !== role.name));
                      }} />
                    {role.name}
                  </label>
                ))}
              </div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: "12px" }}
                onClick={() => rolesMut.mutate(selectedRoles)}
                disabled={rolesMut.isPending || selectedRoles.length === 0}>Save Allowed Roles</button>
            </>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: "16px" }}>
        <div className="card-header"><h3 className="card-title">Positions ({positions?.length ?? 0})</h3></div>
        {loadingPos ? <div className="loading-page"><div className="spinner" /></div> : positions && positions.length > 0 ? (
          <div className="table-wrapper" style={{ border: "none" }}>
            <table>
              <thead><tr><th>Name</th><th>Max Winners</th><th>Candidates</th></tr></thead>
              <tbody>
                {positions.map((pos) => (
                  <tr key={pos.id}>
                    <td style={{ fontWeight: 500 }}>{pos.name}</td>
                    <td>{pos.maxWinners}</td>
                    <td>{electionCandidates?.filter((c) => c.positionId === pos.id).length ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="empty-state"><p>No positions created yet.</p></div>}
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title">Candidates ({electionCandidates?.length ?? 0})</h3></div>
        {electionCandidates && electionCandidates.length > 0 ? (
          <div className="table-wrapper" style={{ border: "none" }}>
            <table>
              <thead><tr><th>Name</th><th>Position</th><th>Status</th></tr></thead>
              <tbody>
                {electionCandidates.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.user?.fullName || c.user?.matricNo || "—"}</td>
                    <td>{positions?.find((p) => p.id === c.positionId)?.name || "—"}</td>
                    <td><span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="empty-state"><p>No candidates yet.</p></div>}
      </div>
    </div>
  );
}
