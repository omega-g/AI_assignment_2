"use client";

import React, { useState } from "react";
import { GameMode, AlgorithmType, HeuristicType } from "@/types";
import { Settings2, Play, Shield, Dice5, Grid } from "lucide-react";

interface GameSetupProps {
  onStartGame: (config: {
    width: number;
    height: number;
    mode: GameMode;
    algorithm: AlgorithmType;
    heuristic: HeuristicType;
    max_depth: number;
  }) => void;
  initialConfig?: {
    width: number;
    height: number;
    mode: GameMode;
    algorithm: AlgorithmType;
    heuristic: HeuristicType;
    max_depth: number;
  };
  isLoading?: boolean;
}

export function GameSetup({ onStartGame, initialConfig, isLoading = false }: GameSetupProps) {
  const [width, setWidth] = useState<number>(initialConfig?.width || 7);
  const [height, setHeight] = useState<number>(initialConfig?.height || 6);
  const [mode, setMode] = useState<GameMode>(initialConfig?.mode || "classic");
  const [algorithm, setAlgorithm] = useState<AlgorithmType>(initialConfig?.algorithm || "alpha_beta");
  const [heuristic, setHeuristic] = useState<HeuristicType>(initialConfig?.heuristic || "threat_potential");
  const [maxDepth, setMaxDepth] = useState<number>(initialConfig?.max_depth || 5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartGame({
      width,
      height,
      mode,
      algorithm,
      heuristic,
      max_depth: maxDepth
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-800 text-slate-100">
        <Settings2 className="w-5 h-5 text-cyan-400" />
        <h2 className="font-bold text-base tracking-tight">Game Configuration & AI Engine</h2>
      </div>

      <div className="space-y-5">
        {/* 1. Board Dimensions */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Board Dimensions (Min: 7x6)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-slate-400">Columns (Width): {width}</span>
              <input
                type="range"
                min={7}
                max={10}
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
            <div>
              <span className="text-xs text-slate-400">Rows (Height): {height}</span>
              <input
                type="range"
                min={6}
                max={10}
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* 2. Game Mode */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Game Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setMode("classic")}
              className={`p-3 rounded-xl border text-left transition-all ${
                mode === "classic"
                  ? "bg-cyan-950/40 border-cyan-500/80 text-cyan-300 ring-1 ring-cyan-500/50"
                  : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div className="font-semibold text-sm flex items-center justify-between">
                <span>Classic Connect 4</span>
                <span className="text-[10px] bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-800 font-mono">Standard</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                First player to connect 4 discs in any direction immediately wins the game.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMode("assignment")}
              className={`p-3 rounded-xl border text-left transition-all ${
                mode === "assignment"
                  ? "bg-purple-950/40 border-purple-500/80 text-purple-300 ring-1 ring-purple-500/50"
                  : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div className="font-semibold text-sm flex items-center justify-between">
                <span>Assignment Mode</span>
                <span className="text-[10px] bg-purple-950 text-purple-400 px-1.5 py-0.5 rounded border border-purple-800 font-mono">Full-Board</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Game continues until board is full! Overlapping 4-disc formations count separately.
              </p>
            </button>
          </div>
        </div>

        {/* 3. AI Algorithm */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            AI Search Algorithm
          </label>
          <div className="grid grid-cols-1 gap-2">
            {[
              {
                id: "alpha_beta",
                name: "Minimax with Alpha-Beta Pruning",
                badge: "Recommended",
                desc: "Full Minimax intelligence with optimal branch pruning (alpha >= beta).",
                icon: Shield
              },
              {
                id: "minimax",
                name: "Minimax without Pruning",
                badge: "Brute-Force",
                desc: "Evaluates every exhaustive subtree branch. Demonstrates full game tree expansion.",
                icon: Grid
              },
              {
                id: "expectimax",
                name: "Expectimax (Expected Minimax)",
                badge: "Probabilistic",
                desc: "Models disc drop uncertainty with Chance nodes (60% chosen, 20% left, 20% right).",
                icon: Dice5
              }
            ].map((algo) => {
              const Icon = algo.icon;
              const isSelected = algorithm === algo.id;
              return (
                <button
                  key={algo.id}
                  type="button"
                  onClick={() => setAlgorithm(algo.id as AlgorithmType)}
                  className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                    isSelected
                      ? "bg-cyan-950/40 border-cyan-500/80 text-cyan-200 ring-1 ring-cyan-500/50 shadow-sm"
                      : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className={`p-2 rounded-lg mt-0.5 ${isSelected ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-800 text-slate-400"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-slate-200">{algo.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {algo.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{algo.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Heuristic Function */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Evaluation Heuristic
          </label>
          <select
            value={heuristic}
            onChange={(e) => setHeuristic(e.target.value as HeuristicType)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="threat_potential">Threat and Winning Potential (Immediate Drops & Defense)</option>
            <option value="window_evaluation">Connect-Four Window Evaluation (All 4-Cell Line Formations)</option>
            <option value="strategic_positioning">Strategic Positioning (Center Control & Forks)</option>
          </select>
        </div>

        {/* 5. Maximum Search Depth K */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Maximum Search Depth (K)
            </label>
            <span className="text-sm font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              K = {maxDepth} {maxDepth <= 4 ? "(Fast)" : maxDepth <= 6 ? "(Balanced)" : "(Deep)"}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={maxDepth}
            onChange={(e) => setMaxDepth(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>1 (Instant)</span>
            <span>3 (Quick)</span>
            <span>5 (Recommended)</span>
            <span>8 (Extensive)</span>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{isLoading ? "Starting Game..." : "Start Game with Configuration"}</span>
        </button>
      </div>
    </form>
  );
}
