"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { verifyVote, type VerifyVoteResponse } from "@/lib/services";

export default function IntegrityPage() {
  const [voteId, setVoteId] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<VerifyVoteResponse | null>(null);

  const verifyMut = useMutation({
    mutationFn: verifyVote,
    onSuccess: (data) => {
      setResult(data);
      setError("");
    },
    onError: (err: unknown) => {
      setResult(null);
      const ax = err as { response?: { data?: { message?: string } } };
      setError(ax.response?.data?.message || "Failed to verify vote. Ensure the Vote ID is correct.");
    },
  });

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!voteId.trim()) return;
    verifyMut.mutate(voteId.trim());
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Vote Integrity Check</h1>
          <p className="page-subtitle">Verify the cryptographic hash of a submitted vote</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: "600px" }}>
        <form onSubmit={handleVerify}>
          <div className="form-group">
            <label className="form-label" htmlFor="voteId">Vote ID</label>
            <div style={{ display: "flex", gap: "12px" }}>
              <input
                id="voteId"
                className="form-input"
                style={{ flex: 1 }}
                value={voteId}
                onChange={(e) => setVoteId(e.target.value)}
                placeholder="Enter Vote ID (UUID)"
                required
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={verifyMut.isPending || !voteId.trim()}
              >
                {verifyMut.isPending ? "Verifying…" : "Verify Vote"}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="alert alert-error" style={{ marginTop: "16px" }}>
            {error}
          </div>
        )}

        {result && (
          <div style={{ marginTop: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--navy-900)", marginBottom: "16px" }}>
              Verification Result
            </h3>
            
            <div style={{
              padding: "16px",
              borderRadius: "8px",
              background: result.valid ? "var(--success-light, #ecfdf5)" : "var(--danger-light, #fef2f2)",
              border: `1px solid ${result.valid ? "var(--success)" : "var(--danger)"}`,
              marginBottom: "16px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                {result.valid ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                )}
                <span style={{ fontSize: "16px", fontWeight: 700, color: result.valid ? "var(--success)" : "var(--danger)" }}>
                  {result.valid ? "Vote is VALID & UNTAMPERED" : "Vote is INVALID or TAMPERED"}
                </span>
              </div>
              <p style={{ fontSize: "14px", color: "var(--gray-700)" }}>
                {result.valid 
                  ? "The vote record matches its cryptographic signature completely. It has not been altered in the database." 
                  : "WARNING: The database record does not match its signature. The vote data may have been tampered with!"}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "var(--gray-50)", padding: "16px", borderRadius: "8px", border: "1px solid var(--gray-200)" }}>
              <div>
                <span style={{ display: "block", fontSize: "12px", color: "var(--gray-500)", fontWeight: 600, textTransform: "uppercase" as const, marginBottom: "4px" }}>Stored Hash</span>
                <div style={{ fontFamily: "monospace", fontSize: "13px", wordBreak: "break-all", color: "var(--navy-700)", background: "white", padding: "8px", borderRadius: "4px", border: "1px solid var(--gray-200)" }}>
                  {result.stored}
                </div>
              </div>
              <div>
                <span style={{ display: "block", fontSize: "12px", color: "var(--gray-500)", fontWeight: 600, textTransform: "uppercase" as const, marginBottom: "4px" }}>Recomputed Hash</span>
                <div style={{ fontFamily: "monospace", fontSize: "13px", wordBreak: "break-all", color: result.valid ? "var(--success)" : "var(--danger)", background: "white", padding: "8px", borderRadius: "4px", border: "1px solid var(--gray-200)" }}>
                  {result.recomputed}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
