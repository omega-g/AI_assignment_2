"use client";

import React, { useState, useEffect } from "react";
import { GameState, SearchResult, MoveHistoryItem, GameMode, AlgorithmType, HeuristicType } from "@/types";
import { api } from "@/lib/api";
import { Connect4Board } from "@/components/Connect4Board";
import { GameSetup } from "@/components/GameSetup";
import { GameStatus } from "@/components/GameStatus";
import { GameHistory } from "@/components/GameHistory";
import { searchStore } from "@/lib/searchStore";
import { AlertCircle, SlidersHorizontal, Gamepad2 } from "lucide-react";

export default function PlayPage() {
  const [game, setGame] = useState<GameState | null>(null);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [history, setHistory] = useState<MoveHistoryItem[]>([]);
  const [lastSearchResult, setLastSearchResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState<boolean>(false);

  // Initialize a new default game on first mount
  useEffect(() => {
    startNewGame({
      width: 7,
      height: 6,
      mode: "classic",
      algorithm: "alpha_beta",
      heuristic: "threat_potential",
      max_depth: 5,
    });
  }, []);

  const startNewGame = async (config: {
    width: number;
    height: number;
    mode: GameMode;
    algorithm: AlgorithmType;
    heuristic: HeuristicType;
    max_depth: number;
  }) => {
    setError(null);
    try {
      const newGame = await api.newGame(config);
      setGame(newGame);
      setHistory([]);
      setLastSearchResult(null);
      setShowConfig(false);
      searchStore.clear();
      try {
        sessionStorage.removeItem("connect4_latest_search");
      } catch {
        // ignore
      }
    } catch (err: any) {
      setError(err.message || "Failed to start new game");
    }
  };

  const handleHumanDrop = async (col: number) => {
    if (!game || isAiThinking || game.status !== "ongoing" || game.current_player !== -1) return;

    setError(null);
    try {
      const res = await api.humanMove(game.game_id, col);
      setGame((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          board: res.board,
          current_player: res.current_player,
          status: res.status as any,
          winner: res.winner,
          ai_score: res.ai_score,
          human_score: res.human_score,
          winning_segments: res.winning_segments || [],
          move_history_count: res.move_history_count,
        };
      });

      // Update history
      const histResp = await api.getHistory(game.game_id);
      setHistory(histResp.history);

      // If game is still ongoing, trigger AI move automatically!
      if (res.status === "ongoing" && res.current_player === 1) {
        triggerAiMove(game.game_id);
      }
    } catch (err: any) {
      setError(err.message || "Move failed");
    }
  };

  const triggerAiMove = async (gameId?: string) => {
    const targetId = gameId || game?.game_id;
    if (!targetId || isAiThinking) return;

    setIsAiThinking(true);
    setError(null);
    try {
      const res = await api.aiMove(targetId, "full");
      setGame((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          board: res.board,
          current_player: res.current_player,
          status: res.status as any,
          winner: res.winner,
          ai_score: res.ai_score,
          human_score: res.human_score,
          winning_segments: res.winning_segments || [],
          move_history_count: res.move_history_count,
        };
      });

      setLastSearchResult(res.search_result);
      // Save search result in memory store (immune to browser 5MB quota)
      searchStore.set(res.search_result);
      try {
        sessionStorage.setItem("connect4_latest_search", JSON.stringify(res.search_result));
      } catch {
        // Safe: browser sessionStorage 5MB quota exceeded for deep trees, searchStore in memory preserves it!
      }

      const histResp = await api.getHistory(targetId);
      setHistory(histResp.history);
    } catch (err: any) {
      setError(err.message || "AI search failed");
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleReset = async () => {
    if (!game) return;
    try {
      const resetState = await api.resetGame(game.game_id);
      setGame(resetState);
      setHistory([]);
      setLastSearchResult(null);
      searchStore.clear();
      try {
        sessionStorage.removeItem("connect4_latest_search");
      } catch {
        // ignore
      }
    } catch (err: any) {
      setError(err.message || "Failed to reset game");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
            <Gamepad2 className="w-7 h-7 text-cyan-400" />
            <span>Connect 4 Arena</span>
          </h1>
          <p className="text-xs text-slate-400">
            Play against Minimax, Alpha-Beta Pruning, or Expectimax with live search telemetry.
          </p>
        </div>

        <button
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition-all shadow-sm"
        >
          <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
          <span>{showConfig ? "Close Settings" : "Configure AI & Board"}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Configuration Drawer */}
      {showConfig && (
        <div className="animate-fadeIn">
          <GameSetup
            onStartGame={startNewGame}
            initialConfig={
              game
                ? {
                    width: game.width,
                    height: game.height,
                    mode: game.mode,
                    algorithm: game.algorithm,
                    heuristic: game.heuristic,
                    max_depth: game.max_depth,
                  }
                : undefined
            }
          />
        </div>
      )}

      {/* Main Play Grid Layout */}
      {game && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Board Canvas (7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <Connect4Board
              board={game.board}
              onDropDisc={handleHumanDrop}
              isHumanTurn={game.current_player === -1}
              isAiThinking={isAiThinking}
              isGameOver={game.status !== "ongoing"}
              winningSegments={game.winning_segments}
            />
          </div>

          {/* Right Column: Status & History (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-5 w-full">
            <GameStatus
              game={game}
              isAiThinking={isAiThinking}
              onReset={handleReset}
              onTriggerAiMove={() => triggerAiMove()}
              lastSearchResult={lastSearchResult}
            />

            <GameHistory history={history} />
          </div>
        </div>
      )}
    </div>
  );
}
