"use client";

import React from "react";

interface BoardPreviewProps {
  grid: number[][]; // [row][col], row 0 is bottom
  cellSize?: number;
  highlightMove?: [number, number] | null;
}

export function BoardPreview({ grid, cellSize = 16, highlightMove = null }: BoardPreviewProps) {
  if (!grid || grid.length === 0) return null;

  const height = grid.length;
  const width = grid[0].length;

  return (
    <div className="inline-block p-2 rounded-lg bg-slate-900 border border-slate-800 shadow-inner">
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`
        }}
      >
        {/* Render from top row (height-1) down to row 0 */}
        {Array.from({ length: height }, (_, rIdx) => {
          const r = height - 1 - rIdx;
          return grid[r].map((cell, c) => {
            const isHighlight = highlightMove && highlightMove[0] === r && highlightMove[1] === c;
            let bgClass = "bg-slate-950 border-slate-800";
            if (cell === 1) bgClass = "bg-cyan-500 border-cyan-400 shadow-sm shadow-cyan-500/50";
            if (cell === -1) bgClass = "bg-amber-400 border-amber-300 shadow-sm shadow-amber-500/50";

            return (
              <div
                key={`${r}-${c}`}
                style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
                className={`rounded-full border transition-all ${bgClass} ${
                  isHighlight ? "ring-2 ring-white animate-pulse" : ""
                }`}
                title={`(${r}, ${c}): ${cell === 1 ? "AI" : cell === -1 ? "Human" : "Empty"}`}
              />
            );
          });
        })}
      </div>
    </div>
  );
}
