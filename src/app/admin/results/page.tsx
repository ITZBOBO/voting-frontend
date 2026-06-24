"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAdminElections, getElectionResults, getCandidates } from "@/lib/services";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Trophy, Medal } from "lucide-react";

const CHART_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#6366f1", "#ec4899", "#14b8a6"];

const MEDAL: { [k: number]: { border: string; bg: string; label: string; icon: React.ReactNode } } = {
  0: { border: "#fde68a", bg: "#fffbeb", label: "#d97706", icon: <Medal size={16} color="#d97706" /> },
  1: { border: "#d1d5db", bg: "#f9fafb", label: "#6b7280", icon: <Medal size={16} color="#6b7280" /> },
  2: { border: "#fed7aa", bg: "#fff7ed", label: "#ea580c", icon: <Medal size={16} color="#ea580c" /> },
};

export default function AdminResultsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: elections } = useQuery({ queryKey: ["admin-elections"], queryFn: getAdminElections });
  const { data: candidates } = useQuery({ queryKey: ["admin-candidates"], queryFn: () => getCandidates() });
  const { data: resultData, isLoading } = useQuery({
    queryKey: ["results", selectedId],
    queryFn: () => getElectionResults(selectedId!),
    enabled: !!selectedId,
  });

  const closedElections = elections?.filter(e => ["CLOSED", "ARCHIVED", "OPEN"].includes(e.status)) || [];
  useEffect(() => { if (!selectedId && closedElections.length > 0) setSelectedId(closedElections[0].id); }, [closedElections]);

  const tally = resultData?.tally ?? [];
  const totalVotes = tally.reduce((s, p) => s + p.results.reduce((a, c) => a + c.count, 0), 0);

  const exportToPDF = () => {
    if (!resultData || !selectedId) return;
    const election = elections?.find((e) => e.id === selectedId);
    if (!election) return;

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text(`${election.title} - Official Results`, 14, 22);
    
    // Stats
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Total Votes Cast: ${totalVotes}`, 14, 30);
    doc.text(`Election Status: ${election.status}`, 14, 36);
    
    let currentY = 46;

    tally.forEach((pos) => {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(20, 20, 20);
      doc.text(`Position: ${pos.positionName}`, 14, currentY);
      currentY += 6;
      
      const posTotalVotes = pos.results.reduce((a, c) => a + c.count, 0);
      const sorted = [...pos.results].sort((a, b) => b.count - a.count);
      
      const tableData = sorted.map((cand, idx) => {
        const pct = posTotalVotes > 0 ? ((cand.count / posTotalVotes) * 100).toFixed(1) + "%" : "0%";
        let status = "";
        if (idx === 0 && cand.count > 0) status = "Winner";
        return [
          cand.name,
          (cand as any).departmentCode || (cand as any).department || "—",
          cand.count.toString(),
          pct,
          status
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [["Candidate Name", "Department", "Votes", "Percentage", "Status"]],
        body: tableData,
        headStyles: { fillColor: [37, 99, 235] },
        margin: { left: 14 },
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 14;
    });

    doc.save(`${election.title.replace(/\s+/g, '_')}_Results.pdf`);
  };

  return (
    <div style={{ maxWidth: "1100px" }}>

      {/* Header */}
      <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0c1a3a", marginBottom: "4px", letterSpacing: "-0.3px" }}>Results</h1>
          <p style={{ fontSize: "13px", color: "#9ca3af" }}>Official outcomes for completed elections</p>
        </div>
        {selectedId && tally.length > 0 && (
          <button
            onClick={exportToPDF}
            style={{ display: "flex", alignItems: "center", gap: "8px", background: "#2563eb", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "opacity 0.2s" }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export PDF
          </button>
        )}
      </div>

      {/* Stats + Selector */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "12px", marginBottom: "24px", alignItems: "stretch" }} className="res-top">
        {[
          { label: "Total Votes Cast", value: totalVotes.toLocaleString(), accent: "#2563eb", bg: "#eff6ff" },
          { label: "Positions", value: tally.length, accent: "#16a34a", bg: "#f0fdf4" },
          { label: "Election Status", value: elections?.find(e => e.id === selectedId)?.status || "—", accent: "#7c3aed", bg: "#f5f3ff" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", border: "1px solid #e8eaf0", borderRadius: "10px", padding: "16px 18px", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "8px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", fontWeight: 700, color: s.accent, flexShrink: 0 }}>
              {typeof s.value === "number" ? s.value : (typeof s.value === "string" && s.value.length < 4 ? s.value : "—")}
            </div>
            <div>
              <div style={{ fontSize: "17px", fontWeight: 700, color: "#0c1a3a", lineHeight: 1 }}>
                {typeof s.value === "string" && s.value.length >= 4 ? (
                  <span style={{ fontSize: "12px", fontWeight: 700, color: s.accent, background: s.bg, padding: "2px 10px", borderRadius: "100px" }}>{s.value}</span>
                ) : s.value}
              </div>
              <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "3px" }}>{s.label}</div>
            </div>
          </div>
        ))}

        {/* Election selector */}
        <div style={{ background: "#fff", border: "1px solid #e8eaf0", borderRadius: "10px", padding: "12px 16px" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Election</label>
          <select
            value={selectedId || ""}
            onChange={e => setSelectedId(e.target.value || null)}
            style={{ padding: "7px 10px", border: "1px solid #e8eaf0", borderRadius: "7px", fontSize: "13px", color: "#374151", background: "#f8f9fb", outline: "none", fontFamily: "inherit", cursor: "pointer", maxWidth: "220px" }}
          >
            <option value="">Select election…</option>
            {closedElections.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </div>
      </div>

      {/* Results */}
      {selectedId && isLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
          <div className="res-spinner" />
        </div>
      ) : selectedId && tally.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {tally.map((pos) => {
            const posTotalVotes = pos.results.reduce((a, c) => a + c.count, 0);
            const sorted = [...pos.results].map((c, idx) => ({
              ...c,
              photoUrl: candidates?.find(cd => cd.id === c.candidateId)?.photoUrl,
              color: CHART_COLORS[idx % CHART_COLORS.length],
            })).sort((a, b) => b.count - a.count);

            const chartData = sorted.map(c => ({ name: c.name, value: c.count, color: c.color }));

            return (
              <div key={pos.positionId} style={{ background: "#fff", border: "1px solid #e8eaf0", borderRadius: "12px", overflow: "hidden" }}>
                {/* Position header */}
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f1f5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "10px", background: "#fffbeb", color: "#d97706" }}>
                      <Trophy size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>Winner</div>
                      <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0c1a3a" }}>{sorted[0]?.name || pos.positionName}</h3>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "18px", fontWeight: 700, color: "#0c1a3a" }}>{posTotalVotes}</div>
                    <div style={{ fontSize: "11px", color: "#9ca3af" }}>Total votes · {pos.positionName}</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0", flexWrap: "wrap" }}>
                  {/* Left: bars */}
                  <div style={{ flex: 2, minWidth: "280px", padding: "20px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {sorted.map((cand, idx) => {
                        const pct = posTotalVotes > 0 ? (cand.count / posTotalVotes) * 100 : 0;
                        const medal = MEDAL[idx];
                        return (
                          <div
                            key={cand.candidateId}
                            style={{
                              padding: medal ? "14px" : "0",
                              borderRadius: medal ? "10px" : "0",
                              background: medal ? medal.bg : "transparent",
                              border: medal ? `1px solid ${medal.border}` : "none",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#f0f4ff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, border: "1px solid #e0e7ff" }}>
                                {cand.photoUrl ? <img src={cand.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (
                                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#2563eb" }}>{(cand.name[0] || "?").toUpperCase()}</span>
                                )}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  {medal && <div style={{ display: "flex", alignItems: "center" }}>{medal.icon}</div>}
                                  <span style={{ fontSize: "13.5px", fontWeight: idx === 0 ? 700 : 500, color: "#0c1a3a" }}>{cand.name}</span>
                                </div>
                              </div>
                              <div style={{ textAlign: "right", flexShrink: 0 }}>
                                <span style={{ fontSize: "15px", fontWeight: 700, color: medal ? medal.label : "#6b7280" }}>{pct.toFixed(1)}%</span>
                                <div style={{ fontSize: "11px", color: "#9ca3af" }}>{cand.count} votes</div>
                              </div>
                            </div>
                            <div style={{ height: "6px", background: "#f0f1f5", borderRadius: "100px", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${pct}%`, background: cand.color, borderRadius: "100px", transition: "width 1s ease" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Pie */}
                  {posTotalVotes > 0 && (
                    <div style={{ width: "220px", flexShrink: 0, padding: "20px 16px", display: "flex", flexDirection: "column", alignItems: "center", borderLeft: "1px solid #f0f1f5" }}>
                      <div style={{ width: "160px", height: "160px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={chartData} innerRadius="40%" outerRadius="80%" dataKey="value" stroke="none" animationDuration={1200}>
                              {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                            <Tooltip formatter={(v: any, n: any) => [`${v} votes`, n]} contentStyle={{ borderRadius: "8px", border: "1px solid #e8eaf0", fontSize: "12px" }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "6px", marginTop: "12px" }}>
                        {sorted.map(c => {
                          const pct = posTotalVotes > 0 ? (c.count / posTotalVotes) * 100 : 0;
                          return (
                            <div key={c.candidateId} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }}>
                              <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: c.color, flexShrink: 0 }} />
                              <span style={{ flex: 1, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                              <span style={{ fontWeight: 700, color: "#374151", flexShrink: 0 }}>{pct.toFixed(0)}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : selectedId && !isLoading ? (
        <div style={{ background: "#fff", border: "1px solid #e8eaf0", borderRadius: "12px", padding: "60px 24px", textAlign: "center" }}>
          <p style={{ fontSize: "14px", fontWeight: 500, color: "#6b7280" }}>No results available for this election yet.</p>
        </div>
      ) : !selectedId ? (
        <div style={{ background: "#fff", border: "1px solid #e8eaf0", borderRadius: "12px", padding: "60px 24px", textAlign: "center" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "12px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </div>
          <p style={{ fontSize: "14px", fontWeight: 500, color: "#6b7280", marginBottom: "4px" }}>No election selected</p>
          <p style={{ fontSize: "12.5px", color: "#9ca3af" }}>Select a closed or active election above to view results</p>
        </div>
      ) : null}

      <style>{`
        .res-spinner { width:32px;height:32px;border:2.5px solid #e2e4ea;border-top-color:#2563eb;border-radius:50%;animation:rSpin 0.7s linear infinite; }
        @keyframes rSpin { to { transform:rotate(360deg); } }
        @media (max-width: 860px) { .res-top { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 560px) { .res-top { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
