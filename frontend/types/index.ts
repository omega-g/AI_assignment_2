export type Player = 0 | -1 | 1; // 0 = empty, -1 = human, 1 = AI

export type GameMode = "classic" | "assignment";
export type AlgorithmType = "minimax" | "alpha_beta" | "expectimax";
export type HeuristicType = "window_evaluation" | "threat_potential" | "strategic_positioning";
export type GameStatus = "ongoing" | "ai_won" | "human_won" | "draw";

export interface WinningSegment {
  player: number;
  direction: "horizontal" | "vertical" | "diagonal_up" | "diagonal_down";
  coords: [number, number][];
}

export interface BoardState {
  width: number;
  height: number;
  grid: number[][]; // [row][col] where row 0 is bottom
  last_move: [number, number] | null;
  valid_moves: number[];
  is_full: boolean;
}

export interface SearchTreeNodeData {
  id: string;
  parent_id: string | null;
  depth: number;
  node_type: "MAX" | "MIN" | "CHANCE" | "LEAF" | "PRUNED";
  move: number | null;
  actual_col: number | null;
  player: number;
  evaluation: number | null;
  heuristic_name: string | null;
  heuristic_breakdown: Record<string, number> | null;
  alpha: number | string | null;
  beta: number | string | null;
  probability: number | null;
  expected_value: number | null;
  pruned: boolean;
  pruning_reason: string | null;
  board_grid: number[][];
  children: SearchTreeNodeData[];
  has_more_children?: boolean;
  child_count?: number;
}

export interface IterationSummary {
  depth: number;
  best_move: number;
  evaluation: number;
  execution_time_ms: number;
  nodes_visited: number;
  nodes_expanded: number;
  leaves_evaluated: number;
  nodes_pruned: number;
  chance_nodes_count: number;
  max_depth_reached: number;
}

export interface SearchResult {
  best_move: number;
  evaluation: number;
  actual_depth: number;
  max_depth: number;
  algorithm: string;
  heuristic: string;
  game_mode: string;
  execution_time_ms: number;
  nodes_visited: number;
  nodes_expanded: number;
  leaves_evaluated: number;
  nodes_pruned: number;
  chance_nodes_count: number;
  iterations_summary: IterationSummary[];
  iterations_trees: Record<string, SearchTreeNodeData>;
  selected_tree: SearchTreeNodeData;
}

export interface GameState {
  game_id: string;
  width: number;
  height: number;
  mode: GameMode;
  algorithm: AlgorithmType;
  heuristic: HeuristicType;
  max_depth: number;
  current_player: number;
  status: GameStatus;
  winner: number | null;
  ai_score: number;
  human_score: number;
  board: BoardState;
  winning_segments: WinningSegment[];
  move_history_count: number;
}

export interface MoveHistoryItem {
  move_number: number;
  player: number;
  column: number;
  row: number;
  board_grid: number[][];
  mode: string;
  ai_score: number;
  human_score: number;
  status: string;
  winner: number | null;
  ai_algorithm?: string;
  ai_heuristic?: string;
  evaluation?: number;
  actual_depth?: number;
  execution_time_ms?: number;
  nodes_visited?: number;
}

export interface BenchmarkRecord {
  scenario_id: string;
  scenario_name: string;
  algorithm: string;
  depth: number;
  best_move: number;
  evaluation: number;
  execution_time_ms: number;
  nodes_visited: number;
  nodes_expanded: number;
  leaves_evaluated: number;
  nodes_pruned: number;
  chance_nodes_count: number;
  game_mode: string;
  heuristic: string;
}

export interface AlgorithmComparisonResult {
  algorithm: string;
  depth: number;
  best_move: number;
  evaluation: number;
  execution_time_ms: number;
  nodes_visited: number;
  nodes_expanded: number;
  leaves_evaluated: number;
  nodes_pruned: number;
  chance_nodes_count: number;
}
