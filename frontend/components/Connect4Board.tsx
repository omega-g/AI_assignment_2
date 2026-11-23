"use client";

import React, { useState } from "react";
import { BoardState, WinningSegment } from "@/types";
import { ChevronDown } from "lucide-react";

interface Connect4BoardProps {
  board: BoardState;
  onDropDisc: (col: number) => void;
  isHumanTurn: boolean;
  isAiThinking: boolean;
  isGameOver: boolean;
  winningSegments: WinningSegment[];
}

export function Connect4Board({
  board,
  onDropDisc,
  isHumanTurn,
  isAiThinking,
  isGameOver,
  winningSegments,
}: Connect4BoardProps) {
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);

  const { width, height, grid, valid_moves, last_move } = board;

  // Set of winning coordinates for fast lookup: "r,c"
  const winningCells = new Set<string>();
  winningSegments.forEach((seg) => {
    seg.coords.forEach(([r, c]) => {
      winningCells.add(`${r},${c}`);
    });
  });

  const handleColumnClick = (col: number) => {
    if (!isHumanTurn || isAiThinking || isGameOver) return;
    if (!valid_moves.includes(col)) return;
    onDropDisc(col);
  };

  return (
    <div className="flex flex-col items-center select-none">
      {/* Column Drop Buttons Header */}
      <div
        className="grid gap-2 sm:gap-3 mb-2 px-3 sm:px-4"
        style={{ gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: width }, (_, col) => {
          const isValid = valid_moves.includes(col);
          const canDrop = isHumanTurn && !isAiThinking && !isGameOver && isValid;

          return (
            <button
              key={`drop-btn-${col}`}
              onClick={() => handleColumnClick(col)}
              onMouseEnter={() => setHoveredCol(col)}
              onMouseLeave={() => setHoveredCol(null)}
              disabled={!canDrop}
              title={isValid ? `Drop in Column ${col + 1}` : "Column is full"}
              className={`h-9 sm:h-11 w-9 sm:w-12 rounded-xl flex flex-col items-center justify-center font-bold text-xs sm:text-sm transition-all duration-200 ${
                canDrop
                  ? hoveredCol === col
                    ? "bg-amber-400 text-slate-950 scale-105 shadow-lg shadow-amber-500/40 translate-y-0.5"
                    : "bg-slate-800/80 hover:bg-slate-700 text-amber-400 border border-amber-500/30"
                  : "bg-slate-900/50 text-slate-600 border border-slate-800 cursor-not-allowed opacity-50"
              }`}
            >
              <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${hoveredCol === col ? "animate-bounce" : ""}`} />
              <span className="text-[10px] sm:text-xs font-mono">{col + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Main Board Casing */}
      <div className="relative p-3 sm:p-5 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/80 border-2 border-slate-700/80 shadow-2xl shadow-indigo-950/50 backdrop-blur-md">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-radial-pattern opacity-10 pointer-events-none rounded-2xl" />

        <div
          className="grid gap-2 sm:gap-3 relative z-10"
          style={{ gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))` }}
        >
          {/* Render from row (height-1) at the top down to row 0 at the bottom */}
          {Array.from({ length: height }, (_, rIdx) => {
            const r = height - 1 - rIdx;

            return Array.from({ length: width }, (_, c) => {
              const cellValue = grid[r][c];
              const isWinningCell = winningCells.has(`${r},${c}`);
              const isLastMove = last_move && last_move[0] === r && last_move[1] === c;

              // Check if hovered ghost disc should appear here
              const nextOpenRow = board.grid.findIndex((row) => row[c] === 0);
              const isGhost =
                isHumanTurn &&
                !isAiThinking &&
                !isGameOver &&
                hoveredCol === c &&
                nextOpenRow === r &&
                cellValue === 0;

              return (
                <div
                  key={`cell-${r}-${c}`}
                  onClick={() => handleColumnClick(c)}
                  onMouseEnter={() => setHoveredCol(c)}
                  onMouseLeave={() => setHoveredCol(null)}
                  className={`w-9 h-9 sm:w-14 sm:h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 relative ${
                    cellValue === 0 && !isGhost
                      ? "bg-slate-950/90 shadow-inner border border-slate-800/80"
                      : ""
                  }`}
                >
                  {/* Human Disc (Amber / Yellow) */}
                  {cellValue === -1 && (
                    <div
                      className={`w-full h-full rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 border-2 border-amber-200 shadow-md shadow-amber-500/40 flex items-center justify-center transition-all ${
                        isWinningCell ? "ring-4 ring-amber-300 animate-pulse scale-105" : ""
                      } ${isLastMove ? "ring-2 ring-white/80" : ""}`}
                    >
                      <div className="w-1/2 h-1/2 rounded-full border border-amber-300/40" />
                    </div>
                  )}

                  {/* AI Disc (Cyan / Blue) */}
                  {cellValue === 1 && (
                    <div
                      className={`w-full h-full rounded-full bg-gradient-to-br from-cyan-300 via-cyan-500 to-blue-600 border-2 border-cyan-200 shadow-md shadow-cyan-500/40 flex items-center justify-center transition-all ${
                        isWinningCell ? "ring-4 ring-cyan-300 animate-pulse scale-105" : ""
                      } ${isLastMove ? "ring-2 ring-white/80" : ""}`}
                    >
                      <div className="w-1/2 h-1/2 rounded-full border border-cyan-300/40" />
                    </div>
                  )}

                  {/* Ghost preview disc on hover */}
                  {isGhost && (
                    <div className="w-full h-full rounded-full bg-amber-400/25 border-2 border-dashed border-amber-400/60 animate-pulse" />
                  )}

                  {/* Last Move Marker Indicator */}
                  {isLastMove && !isWinningCell && (
                    <span className="absolute w-2 h-2 rounded-full bg-white shadow-sm pointer-events-none animate-ping" />
                  )}
                </div>
              );
            });
          })}
        </div>

        {/* Board base footers */}
        <div className="flex justify-between mt-3 px-2 text-[10px] text-slate-500 font-mono">
          <span>Dimensions: {width} x {height}</span>
          <span>{board.is_full ? "Board Full" : `${valid_moves.length} Legal Columns`}</span>
        </div>
      </div>
    </div>
  );
}
