"""
Benchmarking and Algorithm Comparison Engine.
Provides reproducible board scenarios, multi-algorithm execution, metrics collection,
and CSV/JSON export formatting.
"""
from typing import List, Dict, Any, Optional
import io
import csv
from app.core.board import Board, EMPTY, HUMAN, AI
from app.core.iterative_deepening import run_single_depth_search


def get_benchmark_scenarios() -> Dict[str, Dict[str, Any]]:
    """
    Returns standard reproducible board scenarios for testing and reporting.
    All scenarios have valid gravity and next player defined.
    """
    scenarios = {}

    # Scenario 1: Empty Board
    b1 = Board(7, 6)
    scenarios["empty_board"] = {
        "id": "empty_board",
        "name": "Empty Board",
        "description": "Standard opening 7x6 board with all columns available.",
        "board": b1,
        "grid": [r[:] for r in b1.grid],
        "next_player": AI
    }

    # Scenario 2: Early Game (Opening moves)
    b2 = Board(7, 6)
    b2.drop_disc(3, HUMAN)
    b2.drop_disc(3, AI)
    b2.drop_disc(2, HUMAN)
    b2.drop_disc(4, AI)
    scenarios["early_game"] = {
        "id": "early_game",
        "name": "Early Game Opening",
        "description": "4 moves played; center column contest between AI and Human.",
        "board": b2,
        "grid": [r[:] for r in b2.grid],
        "next_player": AI
    }

    # Scenario 3: AI Immediate Threat (Win in 1 move)
    # AI has 3 horizontal discs in row 0 at cols 1, 2, 3; col 4 or 0 completes 4!
    b3 = Board(7, 6)
    b3.drop_disc(1, AI)
    b3.drop_disc(5, HUMAN)
    b3.drop_disc(2, AI)
    b3.drop_disc(6, HUMAN)
    b3.drop_disc(3, AI)
    b3.drop_disc(5, HUMAN)
    scenarios["ai_threat"] = {
        "id": "ai_threat",
        "name": "AI Immediate Threat",
        "description": "AI has 3-in-a-row in row 0 (cols 1,2,3) with immediate win available at col 0 or col 4.",
        "board": b3,
        "grid": [r[:] for r in b3.grid],
        "next_player": AI
    }

    # Scenario 4: Human Immediate Threat (AI must defend)
    # Human has 3 vertical discs in col 2 (rows 0, 1, 2); Human is threatening row 3!
    b4 = Board(7, 6)
    b4.drop_disc(2, HUMAN)  # row 0
    b4.drop_disc(3, AI)     # row 0
    b4.drop_disc(2, HUMAN)  # row 1
    b4.drop_disc(4, AI)     # row 0
    b4.drop_disc(2, HUMAN)  # row 2 - threatening row 3!
    b4.drop_disc(3, AI)     # row 1
    scenarios["human_threat"] = {
        "id": "human_threat",
        "name": "Human Urgent Threat",
        "description": "Human has 3 vertical discs in column 2; AI must block column 2 immediately.",
        "board": b4,
        "grid": [r[:] for r in b4.grid],
        "next_player": AI
    }

    # Scenario 5: Mid Game (Cluttered center)
    b5 = Board(7, 6)
    moves = [
        (3, HUMAN), (3, AI), (3, HUMAN), (3, AI),
        (2, HUMAN), (4, AI), (2, HUMAN), (4, AI),
        (1, HUMAN), (5, AI), (2, HUMAN), (4, AI)
    ]
    for col, p in moves:
        b5.drop_disc(col, p)
    scenarios["mid_game"] = {
        "id": "mid_game",
        "name": "Mid-Game Complex Board",
        "description": "12 discs placed; complex diagonal and vertical interactions in center columns.",
        "board": b5,
        "grid": [r[:] for r in b5.grid],
        "next_player": AI
    }

    # Scenario 6: Multiple Formations (Assignment Mode stress test)
    b6 = Board(7, 6)
    setup = [
        (0, AI), (0, HUMAN), (1, AI), (1, HUMAN), (2, AI), (2, HUMAN),
        (3, AI), (3, HUMAN), (4, AI), (4, HUMAN), (5, AI), (5, HUMAN)
    ]
    for col, p in setup:
        b6.drop_disc(col, p)
    scenarios["multiple_formations"] = {
        "id": "multiple_formations",
        "name": "Multiple Formations Board",
        "description": "Dense lower board with multiple horizontal lines and overlapping threats.",
        "board": b6,
        "grid": [r[:] for r in b6.grid],
        "next_player": AI
    }

    return scenarios


def compare_algorithms(
    board: Board,
    depth: int,
    game_mode: str = "classic",
    heuristic_id: str = "threat_potential"
) -> Dict[str, Any]:
    """
    Runs Minimax, Alpha-Beta, and Expectimax on the identical board state and configuration.
    Returns fair comparison metrics.
    """
    results = {}
    algorithms = ["minimax", "alpha_beta", "expectimax"]

    for algo in algorithms:
        cloned_board = board.clone()
        res = run_single_depth_search(
            board=cloned_board,
            algorithm=algo,
            depth=depth,
            game_mode=game_mode,
            heuristic_id=heuristic_id
        )
        results[algo] = {
            "algorithm": algo,
            "depth": depth,
            "best_move": res["best_move"],
            "evaluation": res["evaluation"],
            "execution_time_ms": res["execution_time_ms"],
            "nodes_visited": res["nodes_visited"],
            "nodes_expanded": res["nodes_expanded"],
            "leaves_evaluated": res["leaves_evaluated"],
            "nodes_pruned": res["nodes_pruned"],
            "chance_nodes_count": res["chance_nodes_count"]
        }

    return {
        "depth": depth,
        "game_mode": game_mode,
        "heuristic": heuristic_id,
        "board_grid": [row[:] for row in board.grid],
        "results": results
    }


def run_benchmark_suite(
    scenario_ids: List[str],
    algorithm_ids: List[str],
    depths: List[int],
    game_mode: str = "classic",
    heuristic_id: str = "threat_potential"
) -> Dict[str, Any]:
    """
    Executes benchmark matrix: Scenarios x Algorithms x Depths.
    Collects execution times, node counts, pruning stats.
    """
    all_scenarios = get_benchmark_scenarios()
    records: List[Dict[str, Any]] = []

    for s_id in scenario_ids:
        scenario = all_scenarios.get(s_id)
        if not scenario:
            continue

        for algo in algorithm_ids:
            for d in depths:
                board_copy = scenario["board"].clone()
                res = run_single_depth_search(
                    board=board_copy,
                    algorithm=algo,
                    depth=d,
                    game_mode=game_mode,
                    heuristic_id=heuristic_id
                )
                records.append({
                    "scenario_id": s_id,
                    "scenario_name": scenario["name"],
                    "algorithm": algo,
                    "depth": d,
                    "best_move": res["best_move"],
                    "evaluation": res["evaluation"],
                    "execution_time_ms": res["execution_time_ms"],
                    "nodes_visited": res["nodes_visited"],
                    "nodes_expanded": res["nodes_expanded"],
                    "leaves_evaluated": res["leaves_evaluated"],
                    "nodes_pruned": res["nodes_pruned"],
                    "chance_nodes_count": res["chance_nodes_count"],
                    "game_mode": game_mode,
                    "heuristic": heuristic_id
                })

    return {
        "records": records,
        "total_runs": len(records),
        "game_mode": game_mode,
        "heuristic": heuristic_id
    }


def generate_benchmark_csv(records: List[Dict[str, Any]]) -> str:
    """Generates CSV string from benchmark records."""
    if not records:
        return ""

    fieldnames = [
        "scenario_id", "scenario_name", "algorithm", "depth", "best_move",
        "evaluation", "execution_time_ms", "nodes_visited", "nodes_expanded",
        "leaves_evaluated", "nodes_pruned", "chance_nodes_count", "game_mode", "heuristic"
    ]

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for row in records:
        writer.writerow({k: row.get(k, "") for k in fieldnames})

    return output.getvalue()
