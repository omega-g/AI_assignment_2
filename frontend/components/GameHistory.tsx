"use client";

import React, { useState } from "react";
import { MoveHistoryItem } from "@/types";
import { BoardPreview } from "@/components/BoardPreview";
import { History, Eye, X } from "lucide-react";

interface GameHistoryProps {
  history: MoveHistoryItem[];
}

export function GameHistory({ history }: GameHistoryProps) {
  const [selectedMove, setSelectedMove] = useState<MoveHistoryItem | null>(null);

  if (!history || history.length === 0) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 text-center text-slate-500 text-xs">
        <History className="w-6 h-6 mx-auto mb-2 opacity-40 text-slate-400" />
        <p>No moves played yet. Start by dropping a disc!</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-sm text-slate-200">Move History ({history.length})</h3>
        </div>
        <span className="text-[10px] text-slate-500">Click entry to preview board</span>
      </div>

      <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
        {history.map((item) => {
          const isHuman = item.player === -1;
          const isSelected = selectedMove?.move_number === item.move_number;

          return (
            <button
              key={`history-${item.move_number}`}
              onClick={() => setSelectedMove(isSelected ? null : item)}
              className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between text-xs ${
                isSelected
                  ? "bg-cyan-950/40 border-cyan-500/80 text-cyan-200 ring-1 ring-cyan-500/40"
                  : "bg-slate-950/40 border-slate-800/80 hover:bg-slate-900 text-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-slate-500 w-5">#{item.move_number}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    isHuman
                      ? "bg-amber-950 text-amber-400 border border-amber-800/60"
                      : "bg-cyan-950 text-cyan-400 border border-cyan-800/60"
                  }`}
                >
                  {isHuman ? "Human" : "AI"}
                </span>
                <span className="font-medium text-slate-200">Col {item.column + 1}</span>
              </div>

              <div className="flex items-center gap-3 text-slate-400 font-mono text-[10px]">
                {item.evaluation !== undefined && (
                  <span className={item.evaluation >= 0 ? "text-emerald-400" : "text-rose-400"}>
                    {item.evaluation > 0 ? `+${item.evaluation.toFixed(1)}` : item.evaluation.toFixed(1)}
                  </span>
                )}
                {item.execution_time_ms !== undefined && (
                  <span>{item.execution_time_ms.toFixed(0)}ms</span>
                )}
                <Eye className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Snapshot Preview Modal / Popover */}
      {selectedMove && (
        <div className="mt-3 p-3.5 bg-slate-950 rounded-xl border border-cyan-800/60 shadow-lg relative animate-fadeIn">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-cyan-400">
              Snapshot: Move #{selectedMove.move_number} ({selectedMove.player === -1 ? "Human" : "AI"} Col {selectedMove.column + 1})
            </span>
            <button
              onClick={() => setSelectedMove(null)}
              className="text-slate-500 hover:text-slate-300 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex justify-center">
            <BoardPreview
              grid={selectedMove.board_grid}
              cellSize={18}
              highlightMove={[selectedMove.row, selectedMove.column]}
            />
          </div>
        </div>
      )}
    </div>
  );
}
