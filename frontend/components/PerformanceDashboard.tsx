"use client";

import React, { useState } from "react";
import { AlgorithmComparisonResult } from "@/types";
import { api } from "@/lib/api";
import { BoardPreview } from "@/components/BoardPreview";
import {
  BarChart3,
  Play,
  Shield,
  Grid,
  Dice5,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

export function PerformanceDashboard() {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("early_game");
  const [depth, setDepth] = useState<number>(3);
  const [gameMode, setGameMode] = useState<string>("classic");
  const [heuristic, setHeuristic] = useState<string>("threat_potential");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [results, setResults] = useState<Record<string, AlgorithmComparisonResult> | null>(null);
  const [currentGrid, setCurrentGrid] = useState<number[][] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load scenarios on mount
  React.useEffect(() => {
    api.getScenarios()
      .then((data) => {
        setScenarios(data);
        if (data.length > 0) {
          const defaultScen = data.find((s: any) => s.id === "early_game") || data[0];
          setSelectedScenarioId(defaultScen.id);
          setCurrentGrid(defaultScen.grid);
        }
      })
      .catch((err) => console.error("Could not load scenarios:", err));
  }, []);

  const handleScenarioChange = (sId: string) => {
    setSelectedScenarioId(sId);
    const scen = scenarios.find((s) => s.id === sId);
    if (scen) setCurrentGrid(scen.grid);
  };

  const runComparison = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await api.compareAlgorithms({
        board_grid: currentGrid || undefined,
        depth,
        game_mode: gameMode,
        heuristic
      });
      setResults(resp.results);
      if (resp.board_grid) setCurrentGrid(resp.board_grid);
    } catch (err: any) {
      setError(err.message || "Failed to run comparison");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId);

  // Calculations for bar ratios
  const maxVisited = results
    ? Math.max(...Object.values(results).map((r) => r.nodes_visited), 1)
    : 1;
  const maxTime = results
    ? Math.max(...Object.values(results).map((r) => r.execution_time_ms), 0.1)
    : 1;

  return (
    <div className="space-y-6">
      {/* Controls & Scenario Picker */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          <h2 className="font-bold text-base text-slate-100">Algorithm Comparison Bench</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Scenario Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Board Scenario
            </label>
            <select
              value={selectedScenarioId}
              onChange={(e) => handleScenarioChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {selectedScenario && (
              <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                {selectedScenario.description}
              </p>
            )}
          </div>

          {/* Search Depth */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Search Depth (Depth {depth})
            </label>
            <input
              type="range"
              min={1}
              max={5}
              value={depth}
              onChange={(e) => setDepth(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-2"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>Depth 1</span>
              <span>Depth 3</span>
              <span>Depth 5</span>
            </div>
          </div>

          {/* Game Mode */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Game Mode
            </label>
            <select
              value={gameMode}
              onChange={(e) => setGameMode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="classic">Classic Connect 4 (Immediate Win)</option>
              <option value="assignment">Assignment Scoring Mode (Full Board)</option>
            </select>
          </div>

          {/* Heuristic */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Evaluation Heuristic
            </label>
            <select
              value={heuristic}
              onChange={(e) => setHeuristic(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="threat_potential">Threat and Winning Potential</option>
              <option value="window_evaluation">Connect-Four Window Evaluation</option>
              <option value="strategic_positioning">Strategic Positioning</option>
            </select>
          </div>
        </div>

        {/* Action Button & Board Preview */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {currentGrid && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Board Tested:</span>
                <BoardPreview grid={currentGrid} cellSize={14} />
              </div>
            )}
          </div>

          <button
            onClick={runComparison}
            disabled={isLoading}
            className="py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isLoading ? "Running Search on All 3 Algorithms..." : "Execute Side-by-Side Comparison"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Comparison Results Cards */}
      {results && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Algorithm 1: Minimax */}
            {results["minimax"] && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
                    <Grid className="w-4 h-4 text-cyan-400" />
                    <span>Minimax</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    No Pruning
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Selected Move:</span>
                    <span className="text-cyan-400 font-bold text-sm">
                      Column {results["minimax"].best_move !== null ? results["minimax"].best_move + 1 : "N/A"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Evaluation:</span>
                    <span className="text-emerald-400 font-bold text-sm">
                      {results["minimax"].evaluation}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Execution Time:</span>
                      <span className="text-slate-200">{results["minimax"].execution_time_ms.toFixed(1)} ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nodes Visited:</span>
                      <span className="text-slate-200">{results["minimax"].nodes_visited.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nodes Expanded:</span>
                      <span className="text-slate-200">{results["minimax"].nodes_expanded.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Leaves Evaluated:</span>
                      <span className="text-slate-200">{results["minimax"].leaves_evaluated.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nodes Pruned:</span>
                      <span className="text-slate-500">0 (N/A)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Algorithm 2: Alpha-Beta */}
            {results["alpha_beta"] && (
              <div className="bg-slate-900/90 border-2 border-cyan-500/50 rounded-2xl p-5 shadow-xl shadow-cyan-950/20 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span>Alpha-Beta Pruning</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    Optimal Pruner
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950 border border-cyan-900/50">
                    <span className="text-slate-400">Selected Move:</span>
                    <span className="text-cyan-400 font-bold text-sm">
                      Column {results["alpha_beta"].best_move !== null ? results["alpha_beta"].best_move + 1 : "N/A"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950 border border-cyan-900/50">
                    <span className="text-slate-400">Evaluation:</span>
                    <span className="text-emerald-400 font-bold text-sm">
                      {results["alpha_beta"].evaluation}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Execution Time:</span>
                      <span className="text-cyan-300 font-bold">{results["alpha_beta"].execution_time_ms.toFixed(1)} ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nodes Visited:</span>
                      <span className="text-cyan-300 font-bold">{results["alpha_beta"].nodes_visited.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nodes Expanded:</span>
                      <span className="text-slate-200">{results["alpha_beta"].nodes_expanded.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Leaves Evaluated:</span>
                      <span className="text-slate-200">{results["alpha_beta"].leaves_evaluated.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nodes Pruned:</span>
                      <span className="text-rose-400 font-bold">
                        {results["alpha_beta"].nodes_pruned.toLocaleString()} cut
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Algorithm 3: Expectimax */}
            {results["expectimax"] && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
                    <Dice5 className="w-4 h-4 text-emerald-400" />
                    <span>Expectimax</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Probabilistic
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Selected Move:</span>
                    <span className="text-emerald-400 font-bold text-sm">
                      Column {results["expectimax"].best_move !== null ? results["expectimax"].best_move + 1 : "N/A"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Expected Value:</span>
                    <span className="text-emerald-400 font-bold text-sm">
                      {results["expectimax"].evaluation}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Execution Time:</span>
                      <span className="text-slate-200">{results["expectimax"].execution_time_ms.toFixed(1)} ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nodes Visited:</span>
                      <span className="text-slate-200">{results["expectimax"].nodes_visited.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Chance Nodes:</span>
                      <span className="text-emerald-400 font-bold">{results["expectimax"].chance_nodes_count.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Leaves Evaluated:</span>
                      <span className="text-slate-200">{results["expectimax"].leaves_evaluated.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Prob Distribution:</span>
                      <span className="text-slate-300">60% col / 20% left / 20% right</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Visual Comparison Charts */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-sm text-slate-200">Comparative Performance Visualizer</h3>

            {/* Nodes Visited Chart */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400">Nodes Visited (Search Tree Size)</span>
              {Object.entries(results).map(([key, data]) => {
                const pct = (data.nodes_visited / maxVisited) * 100;
                return (
                  <div key={`chart-nodes-${key}`} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-300 capitalize">{key.replace("_", " ")}</span>
                      <span className="text-cyan-400 font-bold">{data.nodes_visited.toLocaleString()} nodes</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          key === "alpha_beta"
                            ? "bg-gradient-to-r from-cyan-500 to-blue-500"
                            : key === "minimax"
                            ? "bg-gradient-to-r from-slate-600 to-slate-400"
                            : "bg-gradient-to-r from-emerald-500 to-teal-400"
                        }`}
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Execution Time Chart */}
            <div className="space-y-2 pt-3 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-400">Execution Time (Milliseconds)</span>
              {Object.entries(results).map(([key, data]) => {
                const pct = (data.execution_time_ms / maxTime) * 100;
                return (
                  <div key={`chart-time-${key}`} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-300 capitalize">{key.replace("_", " ")}</span>
                      <span className="text-amber-400 font-bold">{data.execution_time_ms.toFixed(1)} ms</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Academic Analysis Callout */}
          <div className="p-4 bg-cyan-950/30 border border-cyan-800/60 rounded-2xl text-xs space-y-2 text-slate-300">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Algorithmic Equivalence & Efficiency Verification</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>
                <b className="text-slate-200">Score Equivalence:</b> Minimax and Alpha-Beta return identical optimal evaluation scores ({results["minimax"]?.evaluation} vs {results["alpha_beta"]?.evaluation}) as proven by game-theory theorems.
              </li>
              <li>
                <b className="text-slate-200">Pruning Efficiency:</b> Alpha-Beta pruned {results["alpha_beta"]?.nodes_pruned} branches, reducing state space from {results["minimax"]?.nodes_visited} down to {results["alpha_beta"]?.nodes_visited} visited nodes.
              </li>
              <li>
                <b className="text-slate-200">Expectimax Deviation:</b> Expectimax computes weighted expected values (EV = {results["expectimax"]?.evaluation}) because disc placement incorporates physical uncertainty (60% target, 20% left, 20% right).
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
