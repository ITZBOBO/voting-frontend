"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAdminElections, getElectionResults, getCandidates } from "@/lib/services";
import { PageHeader } from "@/components/ui/PageHeader";
import { Users, CheckCircle2, XCircle, Download, Activity, Filter, Eye } from "lucide-react";

const ITEMS_PER_PAGE = 5;

export default function LiveResultsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: elections, isLoading: loadingElections } = useQuery({
    queryKey: ["admin-elections"],
    queryFn: getAdminElections
  });

  const { data: candidatesData } = useQuery({
    queryKey: ["admin-candidates"],
    queryFn: () => getCandidates()
  });

  const { data: resultData, isLoading } = useQuery({
    queryKey: ["results", selectedId],
    queryFn: () => getElectionResults(selectedId!),
    enabled: !!selectedId,
    refetchInterval: 5000,
  });

  const activeElections = elections?.filter(e => e.status === "OPEN") || [];

  if (!selectedId && activeElections.length > 0) {
    setSelectedId(activeElections[0].id);
  }

  const tally = resultData?.tally ?? [];

  let totalVotes = 0;
  tally.forEach(pos => {
    pos.results.forEach(cand => {
      totalVotes += cand.count;
    });
  });

  const mockTotalEligible = 1250;
  const voterTurnout = totalVotes > 0 ? ((totalVotes / mockTotalEligible) * 100).toFixed(1) : "0";
  const remainingVotes = mockTotalEligible - totalVotes;

  const flatCandidatesWithVotes = tally.flatMap(pos =>
    pos.results.map(candResult => {
      const candInfo = candidatesData?.find(c => c.id === candResult.candidateId);
      return {
        ...candResult,
        positionName: pos.positionName,
        department: "Computer Science",
        status: candInfo?.status || "APPROVED",
        photoUrl: candInfo?.photoUrl,
      };
    })
  );

  const totalPages = Math.max(1, Math.ceil(flatCandidatesWithVotes.length / ITEMS_PER_PAGE));
  const paginatedCandidates = flatCandidatesWithVotes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="pb-10">
      <PageHeader title="LIVE Results" subtitle="Monitor ongoing elections in real-time" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-2.5 bg-blue-50 rounded-lg">
            <Users className="text-blue-600" size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Votes Cast</p>
            <p className="text-2xl font-bold text-[#0c1a3a] leading-tight mt-0.5">{totalVotes || "850"}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-2.5 bg-green-50 rounded-lg">
            <CheckCircle2 className="text-green-500" size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Voter Turnout</p>
            <p className="text-2xl font-bold text-[#0c1a3a] leading-tight mt-0.5">{totalVotes > 0 ? `${voterTurnout}%` : "68%"}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-2.5 bg-red-50 rounded-lg">
            <XCircle className="text-red-500" size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Remaining Votes</p>
            <p className="text-2xl font-bold text-[#0c1a3a] leading-tight mt-0.5">{totalVotes > 0 ? remainingVotes : "400"}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-gray-200 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            {/* Election Selector */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="2" />
                <path d="M8 21h8M12 17v4" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <select
                className="bg-transparent border-none outline-none text-sm font-medium text-[#0c1a3a] pr-2 cursor-pointer min-w-[180px]"
                value={selectedId || ""}
                onChange={(e) => { setSelectedId(e.target.value); setCurrentPage(1); }}
              >
                <option value="">Select Election...</option>
                {elections?.map(e => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
            </div>

            {/* Position filter (placeholder) */}
            <div className="relative">
              <select className="pr-8 pl-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 outline-none appearance-none cursor-pointer min-w-[120px]">
                <option>All Positions</option>
                <option>President</option>
                <option>Vice President</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <button className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm bg-white">
              <Filter size={15} /> Export
            </button>
          </div>
        </div>

        {/* Live Indicator */}
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between text-sm bg-white">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="font-medium text-gray-700">Live Vote Count Status</span>
            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-200">Online</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium">
            <Activity size={14} />
            <span>≈≈ just ago</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3.5 px-5 text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-200">ID</th>
                <th className="py-3.5 px-5 text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-200">IPO.</th>
                <th className="py-3.5 px-5 text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-200">Name</th>
                <th className="py-3.5 px-5 text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-200">Position</th>
                <th className="py-3.5 px-5 text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-200">Department</th>
                <th className="py-3.5 px-5 text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-200">Status</th>
                <th className="py-3.5 px-5 text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading || loadingElections ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center">
                    <div className="spinner spinner-lg mx-auto"></div>
                  </td>
                </tr>
              ) : !selectedId ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 text-sm">
                    Select an election to view live results.
                  </td>
                </tr>
              ) : paginatedCandidates.length > 0 ? (
                paginatedCandidates.map((c, idx) => (
                  <tr key={c.candidateId} className="hover:bg-blue-50/20 transition border-b border-gray-100 last:border-0">
                    <td className="py-3.5 px-5 text-sm font-medium text-gray-700">
                      {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-sm font-medium text-gray-600 border border-gray-300 shrink-0">
                        {c.photoUrl ? (
                          <img src={c.photoUrl} alt="Candidate" className="w-full h-full object-cover" />
                        ) : (
                          (c.name[0] || "?").toUpperCase()
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-sm font-semibold text-[#0c1a3a]">
                      {c.name}
                    </td>
                    <td className="py-3.5 px-5 text-sm text-gray-600">
                      {c.positionName}
                    </td>
                    <td className="py-3.5 px-5 text-sm text-gray-600">
                      {c.department}
                    </td>
                    <td className="py-3.5 px-5">
                      {c.status === "APPROVED" ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-green-100 text-green-700">
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-orange-100 text-orange-700">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <button className="flex items-center gap-1 px-3 py-1.5 bg-[#2563eb] text-white rounded text-xs font-medium hover:bg-blue-700 transition">
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 text-sm">
                    No results found. Votes might not be cast yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Footer */}
          <div className="px-5 py-3.5 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
            <div>
              Showing 1 to {Math.min(ITEMS_PER_PAGE, flatCandidatesWithVotes.length)} of {flatCandidatesWithVotes.length} entries
            </div>
            <div className="flex gap-1">
              <button
                className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 text-xs font-medium disabled:opacity-50"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border ${
                    currentPage === page
                      ? "border-[#2563eb] bg-[#2563eb] text-white"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}
              {totalPages > 3 && (
                <>
                  <span className="px-2 py-1.5 text-xs text-gray-400">...</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium border border-gray-300 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </>
              )}
              <button
                className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 text-xs font-medium disabled:opacity-50"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
