import {
  GameState,
  SearchResult,
  MoveHistoryItem,
  BenchmarkRecord,
  AlgorithmComparisonResult
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {})
    }
  });

  if (!res.ok) {
    let errMessage = `Error ${res.status}: ${res.statusText}`;
    try {
      const errData = await res.json();
      if (errData.detail) {
        errMessage = typeof errData.detail === "string" ? errData.detail : JSON.stringify(errData.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errMessage);
  }

  return res.json();
}

export const api = {
  // Config
  getAlgorithms: () => request<any[]>("/api/config/algorithms"),
  getHeuristics: () => request<any[]>("/api/config/heuristics"),
  getGameModes: () => request<any[]>("/api/config/game-modes"),

  // Game Lifecycle
  newGame: (params: {
    width: number;
    height: number;
    mode: string;
    algorithm: string;
    heuristic: string;
    max_depth: number;
  }) => request<GameState>("/api/game/new", {
    method: "POST",
    body: JSON.stringify(params)
  }),

  getGameState: (gameId: string) => request<GameState>(`/api/game/state/${gameId}`),

  humanMove: (gameId: string, column: number) => request<{
    row: number;
    col: number;
    player: number;
    status: string;
    winner: number | null;
    ai_score: number;
    human_score: number;
    board: any;
    winning_segments: any[];
    current_player: number;
    move_history_count: number;
  }>("/api/game/move", {
    method: "POST",
    body: JSON.stringify({ game_id: gameId, column })
  }),

  aiMove: (gameId: string, consoleMode: string = "full") => request<{
    game_id: string;
    ai_move: number;
    row: number;
    col: number;
    player: number;
    status: string;
    winner: number | null;
    ai_score: number;
    human_score: number;
    current_player: number;
    board: any;
    winning_segments: any[];
    search_result: SearchResult;
    move_history_count: number;
  }>("/api/game/ai-move", {
    method: "POST",
    body: JSON.stringify({ game_id: gameId, console_mode: consoleMode })
  }),

  resetGame: (gameId: string) => request<GameState>("/api/game/reset", {
    method: "POST",
    body: JSON.stringify({ game_id: gameId })
  }),

  getLatestSearch: (gameId?: string) => request<SearchResult>(
    gameId ? `/api/game/latest-search/${gameId}` : "/api/game/latest-search"
  ),

  getHistory: (gameId: string) => request<{ game_id: string; history: MoveHistoryItem[] }>(`/api/game/history/${gameId}`),

  // Analysis
  getScenarios: () => request<any[]>("/api/analysis/scenarios"),

  compareAlgorithms: (params: {
    game_id?: string;
    board_grid?: number[][];
    width?: number;
    height?: number;
    depth: number;
    game_mode: string;
    heuristic: string;
  }) => request<{
    depth: number;
    game_mode: string;
    heuristic: string;
    board_grid: number[][];
    results: Record<string, AlgorithmComparisonResult>;
  }>("/api/analysis/compare", {
    method: "POST",
    body: JSON.stringify(params)
  }),

  runBenchmark: (params: {
    scenario_ids: string[];
    algorithm_ids: string[];
    depths: number[];
    game_mode: string;
    heuristic: string;
  }) => request<{
    records: BenchmarkRecord[];
    total_runs: number;
    game_mode: string;
    heuristic: string;
  }>("/api/analysis/benchmark", {
    method: "POST",
    body: JSON.stringify(params)
  }),

  exportCSVUrl: `${API_BASE}/api/analysis/export-csv`
};
