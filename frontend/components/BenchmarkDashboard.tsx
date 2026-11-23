"use client";

import React, { useState } from "react";
import { BenchmarkRecord } from "@/types";
import { api } from "@/lib/api";
import {
  Gauge,
  Play,
  Download,
  CheckSquare,
  Square,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";

export function BenchmarkDashboard() {
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([
    "empty_board",
    "early_game",
    "ai_threat",
    "human_threat"
  ]);

  const [selectedAlgorithms, setSelectedAlgorithms] = useState<string[]>([
    "alpha_beta",
    "minimax",
    "expectimax"
  ]);

  const [selectedDepths, setSelectedDepths] = useState<number[]>([1, 2, 3, 4]);
  const [gameMode, setGameMode] = useState<string>("classic");
  const [heuristic, setHeuristic] = useState<string>("threat_potential");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [records, setRecords] = useState<BenchmarkRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const scenarioOptions = [
    { id: "empty_board", name: "Empty Board (Opening)" },
    { id: "early_game", name: "Early Game (4 moves played)" },
    { id: "ai_threat", name: "AI Immediate Threat (Win in 1 move)" },
    { id: "human_threat", name: "Human Threat (Urgent block)" },
    { id: "mid_game", name: "Mid-Game (12 moves played)" },
    { id: "multiple_formations", name: "Multiple Formations (Dense grid)" },
  ];

  const algorithmOptions = [
    { id: "alpha_beta", name: "Minimax with Alpha-Beta" },
    { id: "minimax", name: "Minimax (No Pruning)" },
    { id: "expectimax", name: "Expectimax (Probabilistic)" },
  ];

  const depthOptions = [1, 2, 3, 4, 5];

  const toggleScenario = (id: string) => {
    setSelectedScenarios((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAlgorithm = (id: string) => {
    setSelectedAlgorithms((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleDepth = (d: number) => {
    setSelectedDepths((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)
    );
  };

  const runBenchmark = async () => {
    if (selectedScenarios.length === 0 || selectedAlgorithms.length === 0 || selectedDepths.length === 0) {
      setError("Please select at least one scenario, algorithm, and depth.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const resp = await api.runBenchmark({
        scenario_ids: selectedScenarios,
        algorithm_ids: selectedAlgorithms,
        depths: selectedDepths,
        game_mode: gameMode,
        heuristic
      });
      setRecords(resp.records);
    } catch (err: any) {
      setError(err.message || "Benchmark failed");
    } finally {
      setIsLoading(false);
    }
  };

  const exportCSV = async () => {
    if (records.length === 0) return;
    try {
      const res = await fetch(api.exportCSVUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records })
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `connect4_benchmark_${gameMode}_${heuristic}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Benchmark Setup Form */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Gauge className="w-5 h-5 text-cyan-400" />
          <h2 className="font-bold text-base text-slate-100">AI Empirical Benchmark Suite</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Scenarios */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              1. Benchmark Scenarios ({selectedScenarios.length})
            </label>
            <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
              {scenarioOptions.map((s) => {
                const isSelected = selectedScenarios.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleScenario(s.id)}
                    className="w-full flex items-center gap-2 text-xs text-left p-1.5 rounded hover:bg-slate-900 text-slate-300"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                    <span>{s.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Algorithms & Depths */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                2. Target Algorithms ({selectedAlgorithms.length})
              </label>
              <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
                {algorithmOptions.map((algo) => {
                  const isSelected = selectedAlgorithms.includes(algo.id);
                  return (
                    <button
                      key={algo.id}
                      type="button"
                      onClick={() => toggleAlgorithm(algo.id)}
                      className="w-full flex items-center gap-2 text-xs text-left p-1.5 rounded hover:bg-slate-900 text-slate-300"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600 shrink-0" />
                      )}
                      <span>{algo.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Search Depths (K)
              </label>
              <div className="flex gap-2">
                {depthOptions.map((d) => {
                  const isSelected = selectedDepths.includes(d);
                  return (
                    <button
                      key={`depth-${d}`}
                      type="button"
                      onClick={() => toggleDepth(d)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                        isSelected
                          ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm shadow-cyan-500/30"
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      D{d}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Global Settings */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                3. Game Mode & Heuristic
              </label>
              <div className="space-y-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Game Mode</span>
                  <select
                    value={gameMode}
                    onChange={(e) => setGameMode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="classic">Classic Connect 4 (Immediate Win)</option>
                    <option value="assignment">Assignment Scoring Mode (Full Board)</option>
                  </select>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Heuristic Function</span>
                  <select
                    value={heuristic}
                    onChange={(e) => setHeuristic(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="threat_potential">Threat and Winning Potential</option>
                    <option value="window_evaluation">Connect-Four Window Evaluation</option>
                    <option value="strategic_positioning">Strategic Positioning</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-1">
              <span className="text-xs font-mono text-slate-400">
                Total Execution Runs:{" "}
                <b className="text-cyan-400">
                  {selectedScenarios.length * selectedAlgorithms.length * selectedDepths.length}
                </b>
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-between items-center border-t border-slate-800">
          <button
            onClick={runBenchmark}
            disabled={isLoading}
            className="py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isLoading ? "Running Benchmark Matrix..." : "Start Empirical Benchmark Suite"}</span>
          </button>

          {records.length > 0 && (
            <button
              onClick={exportCSV}
              className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-emerald-600/30 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV ({records.length} records)</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Benchmark Results Table */}
      {records.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-200">
                Benchmark Results Table ({records.length} runs executed)
              </h3>
            </div>
            <button
              onClick={exportCSV}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold hover:underline"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV File</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-2.5">Scenario</th>
                  <th className="p-2.5">Algorithm</th>
                  <th className="p-2.5">Depth</th>
                  <th className="p-2.5">Best Move</th>
                  <th className="p-2.5">Evaluation</th>
                  <th className="p-2.5">Time (ms)</th>
                  <th className="p-2.5">Visited</th>
                  <th className="p-2.5">Expanded</th>
                  <th className="p-2.5">Leaves</th>
                  <th className="p-2.5">Pruned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {records.map((r, i) => (
                  <tr key={`rec-${i}`} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-2.5 text-slate-300 font-sans">{r.scenario_name}</td>
                    <td className="p-2.5 font-bold">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          r.algorithm === "alpha_beta"
                            ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                            : r.algorithm === "minimax"
                            ? "bg-slate-800 text-slate-300"
                            : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                        }`}
                      >
                        {r.algorithm}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-200">K={r.depth}</td>
                    <td className="p-2.5 text-cyan-400 font-bold">Col {r.best_move + 1}</td>
                    <td className="p-2.5">
                      <span className={r.evaluation >= 0 ? "text-emerald-400" : "text-rose-400"}>
                        {r.evaluation > 0 ? `+${r.evaluation}` : r.evaluation}
                      </span>
                    </td>
                    <td className="p-2.5 text-amber-400 font-bold">{r.execution_time_ms.toFixed(1)}</td>
                    <td className="p-2.5 text-slate-200">{r.nodes_visited.toLocaleString()}</td>
                    <td className="p-2.5 text-slate-400">{r.nodes_expanded.toLocaleString()}</td>
                    <td className="p-2.5 text-slate-400">{r.leaves_evaluated.toLocaleString()}</td>
                    <td className="p-2.5 text-rose-400">{r.nodes_pruned > 0 ? r.nodes_pruned.toLocaleString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
