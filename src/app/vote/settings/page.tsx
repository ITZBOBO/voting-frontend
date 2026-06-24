"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/lib/authStore";
import { getVoteHistory, changePassword, type VoteReceiptHistory, getCurrentUser, updateCandidateProfile } from "@/lib/services";
import { useEffect } from "react";

export default function VoterSettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "notifications" | "history" | "about" | "candidate">("profile");

  const { data: freshUser, refetch: refetchUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
  });

  const [manifesto, setManifesto] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoBase64, setPhotoBase64] = useState("");
  const [fileName, setFileName] = useState("");
  const [candLoading, setCandLoading] = useState(false);
  const [candFeedback, setCandFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const candidacy = freshUser?.candidacies?.[0] || user?.candidacies?.[0];
  useEffect(() => {
    if (candidacy) {
      setManifesto(candidacy.manifesto || "");
      setPhotoUrl(candidacy.photoUrl || "");
    }
  }, [candidacy]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCandidateSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setCandFeedback(null);
    setCandLoading(true);
    try {
      await updateCandidateProfile({
        manifesto,
        photoUrl: photoUrl || undefined,
        photoBase64: photoBase64 || undefined
      });
      setCandFeedback({ type: "success", text: "Candidate profile updated successfully!" });
      setPhotoBase64("");
      setFileName("");
      refetchUser();
    } catch (err: any) {
      setCandFeedback({
        type: "error",
        text: err.response?.data?.error || "Failed to update candidate profile.",
      });
    } finally {
      setCandLoading(false);
    }
  };

  // Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Notification Toggles (local storage or local state simulation)
  const [notifyResult, setNotifyResult] = useState(true);
  const [notifyReminder, setNotifyReminder] = useState(true);
  const [notifyNews, setNotifyNews] = useState(false);

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Query for History
  const { data: history, isLoading: historyLoading } = useQuery<VoteReceiptHistory[]>({
    queryKey: ["voter-history"],
    queryFn: getVoteHistory,
    enabled: activeTab === "history",
  });

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setFeedback({ type: "error", text: "Please fill in all password fields." });
      return;
    }

    if (newPassword.length < 6) {
      setFeedback({ type: "error", text: "New password must be at least 6 characters." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({ type: "error", text: "Passwords do not match." });
      return;
    }

    setLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setFeedback({ type: "success", text: "Password changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.response?.data?.error || "Failed to change password. Please verify current password.",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasCandidacy = (freshUser?.candidacies?.length ?? 0) > 0 || (user?.candidacies?.length ?? 0) > 0;

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: "user" },
    ...(hasCandidacy ? [{ id: "candidate" as const, label: "Candidate Profile", icon: "candidate" }] : []),
    { id: "security" as const, label: "Security", icon: "lock" },
    { id: "notifications" as const, label: "Notifications", icon: "bell" },
    { id: "history" as const, label: "Audit Log & History", icon: "history" },
    { id: "about" as const, label: "About & Help", icon: "help" },
  ];

  const initials = (user?.fullName || user?.matricNo || "?")
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <style>{`
        .vs-page { display: flex; flex-direction: column; gap: 20px; max-width: 900px; margin: 0 auto; }
        
        .vs-header { display: flex; flex-direction: column; gap: 5px; }
        .vs-title { font-size: 24px; font-weight: 800; color: #0e1628; margin: 0; }
        .vs-sub { font-size: 13px; color: #64748b; margin: 0; }

        /* Custom tabs horizontal scroll */
        .vs-tabs {
          display: flex; gap: 6px; overflow-x: auto; padding-bottom: 6px;
          border-bottom: 1px solid #e2e8f0; scrollbar-width: none;
        }
        .vs-tabs::-webkit-scrollbar { display: none; }
        
        .vs-tab-btn {
          display: flex; align-items: center; gap: 8px; padding: 10px 16px;
          border-radius: 10px; font-size: 13px; font-weight: 700; border: none;
          background: transparent; color: #64748b; cursor: pointer; white-space: nowrap;
          transition: all 0.15s; font-family: 'Manrope', sans-serif;
        }
        .vs-tab-btn.active { background: #eff6ff; color: #2563eb; }

        .vs-card {
          background: white; border-radius: 16px; border: 1px solid #e8ecf2;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04); padding: 20px;
        }
        .vs-card-title { font-size: 16px; font-weight: 800; color: #0e1628; margin: 0 0 16px; display: flex; align-items: center; gap: 10px; }
        .vs-card-desc { font-size: 12px; color: #64748b; margin: -10px 0 20px 0; }

        /* Grid profile info */
        .vs-profile-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        .vs-info-group { display: flex; flex-direction: column; gap: 4px; }
        .vs-info-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
        .vs-info-val { font-size: 14px; font-weight: 700; color: #0e1628; padding: 10px 14px; background: #f8fafc; border-radius: 10px; border: 1px solid #f1f5f9; }

        /* Input fields */
        .vs-form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        .vs-input-label { font-size: 12px; font-weight: 700; color: #475569; }
        .vs-input {
          padding: 11px 14px; border-radius: 10px; border: 1px solid #cbd5e1;
          font-size: 14px; font-family: 'Manrope', sans-serif; width: 100%; outline: none;
          transition: border-color 0.15s;
        }
        .vs-input:focus { border-color: #2563eb; }

        /* Buttons */
        .vs-btn {
          padding: 12px 20px; border-radius: 10px; border: none; font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: 'Manrope', sans-serif; transition: background 0.15s;
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
        }
        .vs-btn-primary { background: #2563eb; color: white; }
        .vs-btn-primary:hover:not(:disabled) { background: #1d4ed8; }
        .vs-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Alert notifications */
        .vs-alert { padding: 12px 14px; border-radius: 10px; font-size: 13px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
        .vs-alert-error { background: #fef2f2; border: 1px solid #fee2e2; color: #991b1b; }
        .vs-alert-success { background: #f0fdf4; border: 1px solid #dcfce7; color: #166534; }

        /* Toggles */
        .vs-toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 0; border-bottom: 1px solid #f1f5f9; }
        .vs-toggle-row:last-child { border-bottom: none; }
        .vs-toggle-label { font-size: 13px; font-weight: 700; color: #0e1628; margin-bottom: 2px; }
        .vs-toggle-sub { font-size: 11px; color: #64748b; }
        
        .vs-switch {
          position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0;
        }
        .vs-switch input { opacity: 0; width: 0; height: 0; }
        .vs-slider {
          position: absolute; cursor: pointer; inset: 0; background-color: #cbd5e1;
          transition: .2s; border-radius: 24px;
        }
        .vs-slider:before {
          position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px;
          background-color: white; transition: .2s; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }
        input:checked + .vs-slider { background-color: #2563eb; }
        input:checked + .vs-slider:before { transform: translateX(20px); }

        /* History items */
        .vs-hist-item {
          background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 14px;
          display: flex; flex-direction: column; gap: 10px; margin-bottom: 10px;
        }
        .vs-hist-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
        .vs-hist-title { font-size: 13px; font-weight: 800; color: #0e1628; margin: 0; }
        .vs-hist-pos { font-size: 11px; font-weight: 800; color: #2563eb; letter-spacing: 0.05em; text-transform: uppercase; margin-top: 2px; }
        .vs-hist-badge {
          display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 999px;
          background: #dcfce7; color: #166534; font-size: 10px; font-weight: 700;
        }
        .vs-hist-receipt {
          background: white; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 8px 10px;
          display: flex; align-items: center; justify-content: space-between; gap: 8px;
        }
        .vs-receipt-text {
          font-family: monospace; font-size: 11px; color: #475569; overflow: hidden;
          text-overflow: ellipsis; white-space: nowrap; flex: 1;
        }
        .vs-copy-btn {
          background: #f1f5f9; border: none; font-size: 10px; font-weight: 700; color: #475569;
          padding: 4px 8px; border-radius: 6px; cursor: pointer; transition: all 0.15s;
        }
        .vs-copy-btn:hover { background: #cbd5e1; color: #0f172a; }

        .vs-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 40px 20px; text-align: center; color: #64748b;
        }

        .vs-about-sec { padding: 14px 0; border-bottom: 1px solid #f1f5f9; }
        .vs-about-sec:last-child { border-bottom: none; }
        .vs-about-title { font-size: 13px; font-weight: 700; color: #0e1628; margin: 0 0 6px; }
        .vs-about-text { font-size: 12px; color: #64748b; line-height: 1.6; margin: 0; }

        @media (min-width: 600px) {
          .vs-title { font-size: 28px; }
          .vs-profile-grid { grid-template-columns: repeat(2, 1fr); }
          .vs-hist-item { flex-direction: row; align-items: center; justify-content: space-between; }
          .vs-hist-top { flex-direction: column; gap: 0; flex: 1; }
          .vs-hist-receipt { min-width: 250px; max-width: 350px; }
        }
      `}</style>

      <div className="vs-page">
        {/* Header */}
        <div className="vs-header">
          <h1 className="vs-title">Settings</h1>
          <p className="vs-sub">Review your voter profile, adjust security parameters, and verify audit receipts.</p>
        </div>

        {/* Tabs */}
        <nav className="vs-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`vs-tab-btn ${activeTab === tab.id ? "active" : ""}`}
            >
              <TabIcon name={tab.icon} active={activeTab === tab.id} />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab Contents */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === "profile" && (
              <div className="vs-card">
                <div className="vs-card-title">
                  <TabIcon name="user" active={true} size={18} />
                  My Voter Profile
                </div>
                <p className="vs-card-desc">
                  This profile information is retrieved directly from the University Registrar databases and is read-only.
                </p>

                {/* Avatar & Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#fff" }}>
                    {initials}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0e1628", margin: 0 }}>{user?.fullName || "Voter"}</h3>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 999, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", marginTop: 4 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e" }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#16a34a" }}>Verified Voter</span>
                    </div>
                  </div>
                </div>

                <div className="vs-profile-grid">
                  <div className="vs-info-group">
                    <span className="vs-info-label">Full Name</span>
                    <div className="vs-info-val">{user?.fullName || "—"}</div>
                  </div>
                  <div className="vs-info-group">
                    <span className="vs-info-label">Matric / Registration ID</span>
                    <div className="vs-info-val">{user?.matricNo || "—"}</div>
                  </div>
                  <div className="vs-info-group">
                    <span className="vs-info-label">School Email Address</span>
                    <div className="vs-info-val">{user?.schoolEmail || "—"}</div>
                  </div>
                  <div className="vs-info-group">
                    <span className="vs-info-label">Assigned Department</span>
                    <div className="vs-info-val">{user?.department || "—"}</div>
                  </div>
                  <div className="vs-info-group">
                    <span className="vs-info-label">Roles & Eligibility</span>
                    <div className="vs-info-val" style={{ textTransform: "capitalize" }}>
                      {user?.roles?.join(", ") || "Student"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="vs-card">
                <div className="vs-card-title">
                  <TabIcon name="lock" active={true} size={18} />
                  Security & Password
                </div>
                <p className="vs-card-desc">
                  Update your account password. Ensure it has at least 6 characters and contains combinations of letters and numbers.
                </p>

                {feedback && (
                  <div className={`vs-alert vs-alert-${feedback.type}`}>
                    {feedback.type === "error" ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                    {feedback.text}
                  </div>
                )}

                <form onSubmit={handlePasswordChange} style={{ maxWidth: 450 }}>
                  <div className="vs-form-group">
                    <label className="vs-input-label">Current Password</label>
                    <input
                      type="password"
                      className="vs-input"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="vs-form-group">
                    <label className="vs-input-label">New Password</label>
                    <input
                      type="password"
                      className="vs-input"
                      placeholder="•••••••• (min 6 chars)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="vs-form-group">
                    <label className="vs-input-label">Confirm New Password</label>
                    <input
                      type="password"
                      className="vs-input"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="vs-btn vs-btn-primary" disabled={loading} style={{ marginTop: 10 }}>
                    {loading ? (
                      <>
                        <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.25)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                        Updating Password...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </button>
                </form>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="vs-card">
                <div className="vs-card-title">
                  <TabIcon name="bell" active={true} size={18} />
                  Notification Preferences
                </div>
                <p className="vs-card-desc">
                  Choose how and when you want to receive alerts and notifications concerning active elections.
                </p>

                <div>
                  <div className="vs-toggle-row">
                    <div>
                      <div className="vs-toggle-label">Result Announcements</div>
                      <div className="vs-toggle-sub">Send email notifications as soon as official election tallies are finalized and published.</div>
                    </div>
                    <label className="vs-switch">
                      <input type="checkbox" checked={notifyResult} onChange={(e) => setNotifyResult(e.target.checked)} />
                      <span className="vs-slider" />
                    </label>
                  </div>

                  <div className="vs-toggle-row">
                    <div>
                      <div className="vs-toggle-label">Deadline Reminders</div>
                      <div className="vs-toggle-sub">Remind me via email/SMS 2 hours before an active election closes.</div>
                    </div>
                    <label className="vs-switch">
                      <input type="checkbox" checked={notifyReminder} onChange={(e) => setNotifyReminder(e.target.checked)} />
                      <span className="vs-slider" />
                    </label>
                  </div>

                  <div className="vs-toggle-row">
                    <div>
                      <div className="vs-toggle-label">RUNSA Press & News</div>
                      <div className="vs-toggle-sub">Receive monthly news updates and guidelines from the RUNSA electoral commission.</div>
                    </div>
                    <label className="vs-switch">
                      <input type="checkbox" checked={notifyNews} onChange={(e) => setNotifyNews(e.target.checked)} />
                      <span className="vs-slider" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="vs-card">
                <div className="vs-card-title">
                  <TabIcon name="history" active={true} size={18} />
                  Voting Audit Log
                </div>
                <p className="vs-card-desc">
                  These represent your cryptographically signed voting receipts. You can use these unique IDs to verify that your votes are securely stored in the tamper-evident tally buffer.
                </p>

                {historyLoading ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0", gap: 10 }}>
                    <div style={{ width: 22, height: 22, border: "2.5px solid #e2e8f0", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>Fetching audit records...</span>
                  </div>
                ) : history && history.length > 0 ? (
                  <div>
                    {history.map((receipt) => {
                      const dt = new Date(receipt.createdAt);
                      const fmt = dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
                      return (
                        <div key={receipt.id} className="vs-hist-item">
                          <div className="vs-hist-top">
                            <h4 className="vs-hist-title">{receipt.election?.title || "University Election"}</h4>
                            <span className="vs-hist-pos">{receipt.position?.name || "Voted Office"}</span>
                            <span style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Cast on {fmt}</span>
                          </div>
                          
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <div className="vs-hist-receipt">
                              <span className="vs-receipt-text">{receipt.receiptId}</span>
                              <button className="vs-copy-btn" onClick={() => handleCopy(receipt.receiptId)}>
                                {copiedId === receipt.receiptId ? "Copied" : "Copy"}
                              </button>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 2 }}>
                              <span className="vs-hist-badge">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                Cryptographically Authenticated
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="vs-empty">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}>
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <p style={{ fontStyle: "italic", fontSize: 13, margin: 0 }}>No voting receipts found.</p>
                    <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Your voting history will appear here once you cast a ballot in any active election.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "candidate" && candidacy && (
              <div className="vs-card">
                <div className="vs-card-title">
                  <TabIcon name="candidate" active={true} size={18} />
                  Candidate Campaign Profile
                </div>
                <p className="vs-card-desc">
                  You are registered as an aspirant/candidate for the position of <strong>{candidacy.positionName}</strong> in the <strong>{candidacy.electionTitle}</strong>. You can update your photo and manifesto campaign statement here.
                </p>

                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "999px", background: candidacy.status === "APPROVED" ? "#f0fdf4" : (candidacy.status === "REJECTED" ? "#fef2f2" : "#fffbeb"), border: `1px solid ${candidacy.status === "APPROVED" ? "#bbf7d0" : (candidacy.status === "REJECTED" ? "#fecaca" : "#fef3c7")}`, color: candidacy.status === "APPROVED" ? "#16a34a" : (candidacy.status === "REJECTED" ? "#dc2626" : "#d97706"), fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "20px" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: candidacy.status === "APPROVED" ? "#16a34a" : (candidacy.status === "REJECTED" ? "#dc2626" : "#ea580c") }} />
                  Status: {candidacy.status}
                </div>

                {candFeedback && (
                  <div className={`vs-alert vs-alert-${candFeedback.type}`}>
                    {candFeedback.type === "error" ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                    {candFeedback.text}
                  </div>
                )}

                <form onSubmit={handleCandidateSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
                    <div style={{ width: "80px", height: "100px", borderRadius: "10px", background: "#f1f5f9", border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {photoBase64 ? (
                        <img src={photoBase64} alt="Campaign Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : photoUrl ? (
                        <img src={photoUrl} alt="Campaign Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      ) : (
                        <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 700 }}>No Photo</span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: "220px" }}>
                      <div className="vs-form-group" style={{ marginBottom: 0 }}>
                        <label className="vs-input-label">Profile Photo</label>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                          <label className="vs-btn" style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", margin: 0, padding: "8px 14px", cursor: "pointer", fontSize: "12px" }}>
                            Choose Image
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: "none" }}
                              onChange={handleFileChange}
                            />
                          </label>
                          {fileName && <span style={{ fontSize: "12px", color: "#475569", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "180px" }}>{fileName}</span>}
                        </div>
                        <span style={{ fontSize: "10.5px", color: "#94a3b8", marginTop: 6, display: "block" }}>
                          Upload an image file from your device. Recommended: square aspect ratio.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="vs-form-group" style={{ marginBottom: 0 }}>
                    <label className="vs-input-label">Campaign Manifesto / Statement</label>
                    <textarea
                      className="vs-input"
                      rows={5}
                      style={{ resize: "vertical", height: "120px" }}
                      placeholder="Write your campaign points or statement here to convince voters..."
                      value={manifesto}
                      onChange={(e) => setManifesto(e.target.value)}
                    />
                  </div>

                  <div>
                    <button type="submit" className="vs-btn vs-btn-primary" disabled={candLoading} style={{ minWidth: "120px" }}>
                      {candLoading ? "Saving..." : "Save Profile"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "about" && (
              <div className="vs-card">
                <div className="vs-card-title">
                  <TabIcon name="help" active={true} size={18} />
                  Help Center & About
                </div>
                
                <div className="vs-about-sec">
                  <h4 className="vs-about-title">How do I verify my vote?</h4>
                  <p className="vs-about-text">
                    Under the <strong>Audit Log & History</strong> tab, copy your cryptographically secure voting Receipt ID. You can run this receipt through the official election audit verification portal to verify that your ballot remains untampered.
                  </p>
                </div>

                <div className="vs-about-sec">
                  <h4 className="vs-about-title">Are my votes anonymous?</h4>
                  <p className="vs-about-text">
                    Yes, absolutely. The system employs dual-buffer separation. When you vote, your identity is recorded solely to prevent double voting (via the VoteReceipt ledger), while your actual vote is hashed and stored completely separate in the PendingTally buffer. No link exists between your identity and your choices.
                  </p>
                </div>

                <div className="vs-about-sec">
                  <h4 className="vs-about-title">About VoteHub</h4>
                  <p className="vs-about-text">
                    VoteHub is a high-integrity, secure university e-voting portal designed to provide fully anonymous, verifiable, and transparent student council and departmental elections.
                  </p>
                  <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 12 }}>
                    System Version: 1.4.0 (Production Build)<br />
                    Electoral Commission: RUNSA
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}

function TabIcon({ name, active, size = 15 }: { name: string; active: boolean; size?: number }) {
  const col = active ? "#2563eb" : "#64748b";
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: col, strokeWidth: active ? 2.5 : 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "candidate":
      return <svg {...p}><circle cx="12" cy="8" r="7"/><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"/><polyline points="8.21 13.89 12 10.5 15.79 13.89"/></svg>;
    case "user":
      return <svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
    case "lock":
      return <svg {...p}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
    case "bell":
      return <svg {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
    case "history":
      return <svg {...p}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><polyline points="3 3 3 8 8 8"/><line x1="12" y1="7" x2="12" y2="12"/><line x1="12" y1="12" x2="16" y2="14"/></svg>;
    case "help":
      return <svg {...p}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
    default:
      return null;
  }
}
