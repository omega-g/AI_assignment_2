"""
Iterative Deepening Search Engine.
Sequentially executes searches from depth 1 up to K, records statistics and trees
for every completed iteration, and returns the deepest completed iteration.
"""
import time
import math
from typing import Dict, Any, List, Optional
from app.core.board import Board
from app.core.heuristics import get_heuristic_function, HEURISTICS
from app.core.search_tree import SearchStatistics, print_search_tree_console
from app.core.minimax import minimax_search
from app.core.alpha_beta import alpha_beta_search
from app.core.expectimax import expectimax_search


def run_single_depth_search(
    board: Board,
    algorithm: str,
    depth: int,
    game_mode: str,
    heuristic_id: str
) -> Dict[str, Any]:
    """Runs a single search algorithm at an exact depth limit."""
    heuristic_entry = HEURISTICS.get(heuristic_id, HEURISTICS["threat_potential"])
    heuristic_fn = heuristic_entry["func"]
    heuristic_name = heuristic_entry["name"]

    stats = SearchStatistics()
    start_time = time.perf_counter()

    if algorithm == "minimax":
        best_move, best_score, tree_root = minimax_search(
            board=board,
            depth=depth,
            game_mode=game_mode,
            heuristic_fn=heuristic_fn,
            heuristic_name=heuristic_name,
            is_maximizing=True,
            stats=stats
        )
    elif algorithm == "alpha_beta":
        best_move, best_score, tree_root = alpha_beta_search(
            board=board,
            depth=depth,
            game_mode=game_mode,
            heuristic_fn=heuristic_fn,
            heuristic_name=heuristic_name,
            alpha=-float("inf"),
            beta=float("inf"),
            is_maximizing=True,
            stats=stats
        )
    elif algorithm == "expectimax":
        best_move, best_score, tree_root = expectimax_search(
            board=board,
            depth=depth,
            game_mode=game_mode,
            heuristic_fn=heuristic_fn,
            heuristic_name=heuristic_name,
            is_maximizing=True,
            stats=stats
        )
    else:
        raise ValueError(f"Unknown algorithm '{algorithm}'")

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    safe_eval = 0.0
    if best_score is not None:
        if math.isinf(best_score):
            safe_eval = 100000.0 if best_score > 0 else -100000.0
        elif not math.isnan(best_score):
            safe_eval = round(best_score, 2)

    return {
        "depth": depth,
        "best_move": best_move,
        "evaluation": safe_eval,
        "execution_time_ms": round(elapsed_ms, 2),
        "nodes_visited": stats.nodes_visited,
        "nodes_expanded": stats.nodes_expanded,
        "leaves_evaluated": stats.leaves_evaluated,
        "nodes_pruned": stats.nodes_pruned,
        "chance_nodes_count": stats.chance_nodes_count,
        "max_depth_reached": stats.max_depth_reached,
        "tree_root": tree_root,
        "stats": stats,
        "heuristic_name": heuristic_name
    }


def iterative_deepening_search(
    board: Board,
    algorithm: str = "alpha_beta",
    max_k: int = 5,
    game_mode: str = "classic",
    heuristic_id: str = "threat_potential",
    print_console: bool = True,
    console_mode: str = "full"
) -> Dict[str, Any]:
    """
    Performs iterative deepening search starting at depth 1 up to max_k.
    Preserves completed iterations and trees.
    """
    if max_k < 1:
        raise ValueError("Maximum search depth K must be >= 1")
    if max_k > 8:
        # Protect against freeze/crash while allowing deep exploration
        raise ValueError("Maximum search depth K is limited to 8 to maintain responsiveness")

    completed_iterations: List[Dict[str, Any]] = []
    deepest_result: Optional[Dict[str, Any]] = None

    for d in range(1, max_k + 1):
        try:
            iter_result = run_single_depth_search(
                board=board,
                algorithm=algorithm,
                depth=d,
                game_mode=game_mode,
                heuristic_id=heuristic_id
            )
            completed_iterations.append(iter_result)
            deepest_result = iter_result
        except Exception as e:
            # If an iteration fails, stop and do not report it as completed
            print(f"[Warning] Iterative deepening stopped at depth {d}: {e}")
            break

    if not deepest_result:
        raise RuntimeError("Iterative deepening could not complete any iteration")

    # Console tree printing of the deepest completed iteration
    if print_console:
        print_search_tree_console(
            root=deepest_result["tree_root"],
            algorithm=algorithm,
            game_mode=game_mode,
            max_depth=max_k,
            actual_depth=deepest_result["depth"],
            heuristic_name=deepest_result["heuristic_name"],
            stats=deepest_result["stats"],
            best_move=deepest_result["best_move"],
            best_score=deepest_result["evaluation"],
            execution_time_ms=deepest_result["execution_time_ms"],
            mode=console_mode
        )

    # Prepare response payload
    iterations_summary = []
    iterations_trees = {}

    for item in completed_iterations:
        d = item["depth"]
        item_eval = item["evaluation"]
        if item_eval is not None and math.isinf(item_eval):
            item_eval = 100000.0 if item_eval > 0 else -100000.0

        iterations_summary.append({
            "depth": d,
            "best_move": item["best_move"],
            "evaluation": item_eval,
            "execution_time_ms": item["execution_time_ms"],
            "nodes_visited": item["nodes_visited"],
            "nodes_expanded": item["nodes_expanded"],
            "leaves_evaluated": item["leaves_evaluated"],
            "nodes_pruned": item["nodes_pruned"],
            "chance_nodes_count": item["chance_nodes_count"],
            "max_depth_reached": item["max_depth_reached"],
        })
        # Serialize the tree (capped at 6 levels deep per tree to preserve browser memory)
        iterations_trees[str(d)] = item["tree_root"].to_dict(max_depth_limit=6)

    deepest_eval = deepest_result["evaluation"]
    if deepest_eval is not None and math.isinf(deepest_eval):
        deepest_eval = 100000.0 if deepest_eval > 0 else -100000.0

    return {
        "best_move": deepest_result["best_move"],
        "evaluation": deepest_eval,
        "actual_depth": deepest_result["depth"],
        "max_depth": max_k,
        "algorithm": algorithm,
        "heuristic": heuristic_id,
        "game_mode": game_mode,
        "execution_time_ms": deepest_result["execution_time_ms"],
        "nodes_visited": deepest_result["nodes_visited"],
        "nodes_expanded": deepest_result["nodes_expanded"],
        "leaves_evaluated": deepest_result["leaves_evaluated"],
        "nodes_pruned": deepest_result["nodes_pruned"],
        "chance_nodes_count": deepest_result["chance_nodes_count"],
        "iterations_summary": iterations_summary,
        "iterations_trees": iterations_trees,
        "selected_tree": iterations_trees[str(deepest_result["depth"])]
    }
