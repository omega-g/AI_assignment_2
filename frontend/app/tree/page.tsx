"use client";

import React, { useState, useEffect } from "react";
import { SearchResult } from "@/types";
import { SearchTreeViewer } from "@/components/SearchTreeViewer";
import { api } from "@/lib/api";
import { searchStore } from "@/lib/searchStore";
import { GitBranch, Play, Info } from "lucide-react";

export default function SearchTreePage() {
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [testAlgorithm, setTestAlgorithm] = useState<string>("alpha_beta");
  const [testDepth, setTestDepth] = useState<number>(4);
  const testMode = "classic";
  const testHeuristic = "threat_potential";

  // Load latest search result on mount
  useEffect(() => {
    // 1. Try memory store first (instant & immune to 5MB quota)
    const inMemory = searchStore.get();
    if (inMemory) {
      setSearchResult(inMemory);
      return;
    }

    // 2. Fetch latest search from backend API
    api.getLatestSearch()
      .then((data) => {
        setSearchResult(data);
        searchStore.set(data);
      })
      .catch(() => {
        // 3. Fallback to sessionStorage if available
        try {
          const saved = sessionStorage.getItem("connect4_latest_search");
          if (saved) {
            const parsed = JSON.parse(saved);
            setSearchResult(parsed);
            searchStore.set(parsed);
          }
        } catch {
          // ignore
        }
      });
  }, []);

  // Quick search generator for demonstration
  const generateSampleSearch = async () => {
    setIsLoading(true);
    try {
      // Trigger a sample search via new game + ai move
      const tempGame = await api.newGame({
        width: 7,
        height: 6,
        mode: testMode,
        algorithm: testAlgorithm,
        heuristic: testHeuristic,
        max_depth: testDepth,
      });

      // Make 1 human move
      await api.humanMove(tempGame.game_id, 3);
      // Trigger AI move to generate genuine tree
      const aiRes = await api.aiMove(tempGame.game_id, "full");
      setSearchResult(aiRes.search_result);
      searchStore.set(aiRes.search_result);
      try {
        sessionStorage.setItem("connect4_latest_search", JSON.stringify(aiRes.search_result));
      } catch {
        // Safe: ignore 5MB quota
      }
    } catch (err) {
      console.error("Failed to generate tree:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
            <GitBranch className="w-7 h-7 text-cyan-400" />
            <span>Search Tree Visualizer</span>
          </h1>
          <p className="text-xs text-slate-400">
            Interactive trace of the AI&apos;s decision trees across iterative-deepening iterations.
          </p>
        </div>

        {searchResult && (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono">
            <span className="text-slate-400">Active Tree:</span>
            <span className="text-cyan-400 font-bold uppercase">{searchResult.algorithm}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300">Depth {searchResult.actual_depth}</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400">{searchResult.nodes_visited} Nodes</span>
          </div>
        )}
      </div>

      {/* Main Tree Viewer or Empty Generator State */}
      {searchResult ? (
        <div className="space-y-4">
          <SearchTreeViewer
            iterationsSummary={searchResult.iterations_summary}
            iterationsTrees={searchResult.iterations_trees}
            initialDepth={searchResult.actual_depth}
          />

          {/* Educational Legend & Guide */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Visual Tree Legend & Controls</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-[11px] font-mono">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded border border-cyan-400 bg-cyan-950" />
                <span className="text-slate-300">MAX Node (AI)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded border border-amber-400 bg-amber-950" />
                <span className="text-slate-300">MIN Node (Human)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded border border-emerald-400 bg-emerald-950" />
                <span className="text-slate-300">CHANCE Node</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded border border-dashed border-rose-500 bg-rose-950" />
                <span className="text-rose-400">PRUNED (Cut)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded border border-emerald-500 bg-slate-800" />
                <span className="text-slate-300">LEAF (Evaluation)</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              Drag on the canvas to pan across large trees. Click any node to open its full mathematical score breakdown, alpha/beta values, and board snapshot. Click &apos;+&apos; / &apos;−&apos; on nodes to expand or collapse subtrees.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center max-w-xl mx-auto space-y-4 shadow-xl">
          <GitBranch className="w-12 h-12 mx-auto text-cyan-400 opacity-60 animate-pulse" />
          <div>
            <h3 className="font-bold text-base text-slate-100">No Search Tree Captured Yet</h3>
            <p className="text-xs text-slate-400 mt-1">
              Either play a move in the arena so the AI searches, or generate an instant sample search tree below:
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-left">
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">Algorithm</span>
              <select
                value={testAlgorithm}
                onChange={(e) => setTestAlgorithm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
              >
                <option value="alpha_beta">Minimax with Alpha-Beta</option>
                <option value="minimax">Minimax (No Pruning)</option>
                <option value="expectimax">Expectimax (Probabilistic)</option>
              </select>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block mb-1">Search Depth (K)</span>
              <select
                value={testDepth}
                onChange={(e) => setTestDepth(parseInt(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
              >
                <option value={2}>Depth 2 (Quick)</option>
                <option value={3}>Depth 3 (Balanced)</option>
                <option value={4}>Depth 4 (Detailed)</option>
              </select>
            </div>
          </div>

          <button
            onClick={generateSampleSearch}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isLoading ? "Generating Real AI Search Tree..." : "Generate Interactive Tree Trace"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
