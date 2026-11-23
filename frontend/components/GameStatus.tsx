"use client";

import React from "react";
import Link from "next/link";
import { GameState, SearchResult } from "@/types";
import { RotateCcw, GitBranch, Sparkles, User, Bot, Trophy, Swords } from "lucide-react";

interface GameStatusProps {
  game: GameState;
  isAiThinking: boolean;
  onReset: () => void;
  onTriggerAiMove?: () => void;
  lastSearchResult?: SearchResult | null;
}

export function GameStatus({
  game,
  isAiThinking,
  onReset,
  onTriggerAiMove,
  lastSearchResult,
}: GameStatusProps) {
  const isHumanTurn = game.current_player === -1;
  const isGameOver = game.status !== "ongoing";

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-4">
      {/* Header and Turn Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords className="w-5 h-5 text-cyan-400" />
          <span className="font-bold text-sm text-slate-200">Match Arena</span>
        </div>
        <div className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
          {game.mode === "classic" ? "Classic Mode" : "Assignment Scoring Mode"}
        </div>
      </div>

      {/* Scores & Turn Panel */}
      <div className="grid grid-cols-2 gap-3">
        {/* Human Player Card */}
        <div
          className={`p-3.5 rounded-xl border transition-all ${
            isHumanTurn && !isGameOver
              ? "bg-amber-950/30 border-amber-500/60 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10"
              : "bg-slate-950/40 border-slate-800/80"
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs">
              <User className="w-3.5 h-3.5" />
              <span>Human</span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-100 font-mono">{game.human_score}</span>
            <span className="text-[10px] text-slate-400">
              {game.mode === "classic" ? (game.winner === -1 ? "Winner" : "Discs") : "Formations"}
            </span>
          </div>
          {isHumanTurn && !isGameOver && (
            <div className="text-[10px] text-amber-400 font-semibold mt-1 flex items-center gap-1 animate-pulse">
              <span>● Your Turn to Drop</span>
            </div>
          )}
        </div>

        {/* AI Player Card */}
        <div
          className={`p-3.5 rounded-xl border transition-all ${
            !isHumanTurn && !isGameOver
              ? "bg-cyan-950/30 border-cyan-500/60 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-500/10"
              : "bg-slate-950/40 border-slate-800/80"
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-xs">
              <Bot className="w-3.5 h-3.5" />
              <span>AI ({game.algorithm})</span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-100 font-mono">{game.ai_score}</span>
            <span className="text-[10px] text-slate-400">
              {game.mode === "classic" ? (game.winner === 1 ? "Winner" : "Discs") : "Formations"}
            </span>
          </div>
          {!isHumanTurn && !isGameOver && (
            <div className="text-[10px] text-cyan-400 font-semibold mt-1 flex items-center gap-1 animate-pulse">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>{isAiThinking ? "Searching Search Tree..." : "AI's Turn"}</span>
            </div>
          )}
        </div>
      </div>

      {/* Game Over Banner */}
      {isGameOver && (
        <div
          className={`p-4 rounded-xl border text-center ${
            game.status === "ai_won"
              ? "bg-cyan-950/40 border-cyan-500/60 text-cyan-300"
              : game.status === "human_won"
              ? "bg-amber-950/40 border-amber-500/60 text-amber-300"
              : "bg-slate-900 border-slate-700 text-slate-300"
          }`}
        >
          <div className="flex items-center justify-center gap-2 font-bold text-base mb-1">
            <Trophy className="w-5 h-5" />
            <span>
              {game.status === "ai_won"
                ? "AI Agent Won the Match!"
                : game.status === "human_won"
                ? "Human Player Won the Match!"
                : "Match Concluded in a Draw!"}
            </span>
          </div>
          <p className="text-xs opacity-80">
            {game.mode === "classic"
              ? "4 discs connected in a line."
              : `Final Score: AI ${game.ai_score} - Human ${game.human_score}`}
          </p>
        </div>
      )}

      {/* AI Last Move Telemetry Card */}
      {lastSearchResult && (
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 font-semibold">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Search Telemetry</span>
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              {lastSearchResult.execution_time_ms.toFixed(1)} ms
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
            <div>
              <span className="text-slate-400 text-[10px] block">Selected Col:</span>
              <span className="text-cyan-400 font-bold">Col {lastSearchResult.best_move + 1}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Evaluation:</span>
              <span className={lastSearchResult.evaluation >= 0 ? "text-emerald-400" : "text-rose-400"}>
                {lastSearchResult.evaluation > 0 ? `+${lastSearchResult.evaluation.toFixed(1)}` : lastSearchResult.evaluation.toFixed(1)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Depth Reached:</span>
              <span>{lastSearchResult.actual_depth} / {lastSearchResult.max_depth}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Nodes Visited:</span>
              <span>{lastSearchResult.nodes_visited.toLocaleString()}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center">
            <Link
              href="/tree"
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold text-[11px] hover:underline"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Inspect Search Tree ({lastSearchResult.actual_depth} Iterations)</span>
            </Link>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onReset}
          className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Board</span>
        </button>

        {!isHumanTurn && !isGameOver && onTriggerAiMove && (
          <button
            onClick={onTriggerAiMove}
            disabled={isAiThinking}
            className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-600/30 disabled:opacity-50"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>{isAiThinking ? "Thinking..." : "Trigger AI Turn"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
