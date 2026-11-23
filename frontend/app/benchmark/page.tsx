"use client";

import React from "react";
import { BenchmarkDashboard } from "@/components/BenchmarkDashboard";
import { Gauge } from "lucide-react";

export default function BenchmarkPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
          <Gauge className="w-7 h-7 text-cyan-400" />
          <span>Empirical Benchmark & CSV Export</span>
        </h1>
        <p className="text-xs text-slate-400">
          Run automated benchmarks across depths and scenarios for your university assignment report.
        </p>
      </div>

      <BenchmarkDashboard />
    </div>
  );
}
