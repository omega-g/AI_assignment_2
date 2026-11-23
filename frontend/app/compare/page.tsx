"use client";

import React from "react";
import { PerformanceDashboard } from "@/components/PerformanceDashboard";
import { BarChart3 } from "lucide-react";

export default function ComparePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-cyan-400" />
          <span>Algorithm Comparison Dashboard</span>
        </h1>
        <p className="text-xs text-slate-400">
          Compare Minimax, Alpha-Beta Pruning, and Expectimax on the identical board state and heuristic.
        </p>
      </div>

      <PerformanceDashboard />
    </div>
  );
}
