"""
Search Tree data structures, tracking, serialization, and console printer.
Designed for genuine search trace capture without fabrication.
"""
from typing import List, Dict, Any, Optional
import uuid
import math


class SearchTreeNode:
    def __init__(
        self,
        node_id: Optional[str] = None,
        parent_id: Optional[str] = None,
        depth: int = 0,
        node_type: str = "MAX",  # MAX, MIN, CHANCE, LEAF, PRUNED
        board_grid: Optional[List[List[int]]] = None,
        move: Optional[int] = None,
        actual_col: Optional[int] = None,
        player: int = 1,
        evaluation: Optional[float] = None,
        heuristic_name: Optional[str] = None,
        heuristic_breakdown: Optional[Dict[str, float]] = None,
        alpha: Optional[float] = None,
        beta: Optional[float] = None,
        probability: Optional[float] = None,
        expected_value: Optional[float] = None,
        pruned: bool = False,
        pruning_reason: Optional[str] = None,
    ):
        self.id: str = node_id or str(uuid.uuid4())[:8]
        self.parent_id: Optional[str] = parent_id
        self.depth: int = depth
        self.node_type: str = node_type
        self.board_grid: List[List[int]] = board_grid or []
        self.move: Optional[int] = move
        self.actual_col: Optional[int] = actual_col
        self.player: int = player
        self.evaluation: Optional[float] = evaluation
        self.heuristic_name: Optional[str] = heuristic_name
        self.heuristic_breakdown: Optional[Dict[str, float]] = heuristic_breakdown
        self.alpha: Optional[float] = alpha
        self.beta: Optional[float] = beta
        self.probability: Optional[float] = probability
        self.expected_value: Optional[float] = expected_value
        self.pruned: bool = pruned
        self.pruning_reason: Optional[str] = pruning_reason
        self.children: List["SearchTreeNode"] = []

    def add_child(self, child: "SearchTreeNode") -> None:
        child.parent_id = self.id
        self.children.append(child)

    def to_dict(self, max_depth_limit: int = 6, current_depth: int = 0) -> Dict[str, Any]:
        """Serializes the node and its subtree recursively with JSON-safe numerical values."""
        def _safe_float(v: Optional[float], r: int = 2) -> Optional[float]:
            if v is None or math.isnan(v):
                return None
            if math.isinf(v):
                return 100000.0 if v > 0 else -100000.0
            return round(v, r)

        def _safe_bound(v: Optional[float], r: int = 2) -> Optional[Any]:
            if v is None or math.isnan(v):
                return None
            if math.isinf(v):
                return "∞" if v > 0 else "-∞"
            return round(v, r)

        safe_breakdown = None
        if self.heuristic_breakdown:
            safe_breakdown = {
                k: _safe_float(v, 2) or 0.0
                for k, v in self.heuristic_breakdown.items()
            }

        data: Dict[str, Any] = {
            "id": self.id,
            "parent_id": self.parent_id,
            "depth": self.depth,
            "node_type": self.node_type,
            "move": self.move,
            "actual_col": self.actual_col,
            "player": self.player,
            "evaluation": _safe_float(self.evaluation, 2),
            "heuristic_name": self.heuristic_name,
            "heuristic_breakdown": safe_breakdown,
            "alpha": _safe_bound(self.alpha, 2),
            "beta": _safe_bound(self.beta, 2),
            "probability": _safe_float(self.probability, 3),
            "expected_value": _safe_float(self.expected_value, 2),
            "pruned": self.pruned,
            "pruning_reason": self.pruning_reason,
            "board_grid": self.board_grid,
            "children": []
        }

        if current_depth < max_depth_limit:
            data["children"] = [
                child.to_dict(max_depth_limit, current_depth + 1)
                for child in self.children
            ]
        elif self.children:
            data["has_more_children"] = True
            data["child_count"] = len(self.children)

        return data


class SearchStatistics:
    def __init__(self):
        self.nodes_visited: int = 0
        self.nodes_expanded: int = 0
        self.leaves_evaluated: int = 0
        self.nodes_pruned: int = 0
        self.max_depth_reached: int = 0
        self.chance_nodes_count: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "nodes_visited": self.nodes_visited,
            "nodes_expanded": self.nodes_expanded,
            "leaves_evaluated": self.leaves_evaluated,
            "nodes_pruned": self.nodes_pruned,
            "max_depth_reached": self.max_depth_reached,
            "chance_nodes_count": self.chance_nodes_count,
        }


# ---------------------------------------------------------------------------
# Mandatory Console Tree Printer
# ---------------------------------------------------------------------------

def print_search_tree_console(
    root: SearchTreeNode,
    algorithm: str,
    game_mode: str,
    max_depth: int,
    actual_depth: int,
    heuristic_name: str,
    stats: SearchStatistics,
    best_move: Optional[int],
    best_score: Optional[float],
    execution_time_ms: float,
    mode: str = "full",  # "full", "compact", "stats"
    max_nodes_to_print: int = 150
) -> None:
    """
    Prints a formatted, readable search tree to stdout as required by the assignment.
    Supports 'full', 'compact', and 'stats' modes with a truncation warning when capped.
    """
    print("=" * 64)
    print("AI SEARCH EXECUTION TRACE")
    print(f"Algorithm:       {algorithm}")
    print(f"Game Mode:       {game_mode}")
    print(f"Maximum Depth:   {max_depth}")
    print(f"Actual Depth:    {actual_depth}")
    print(f"Heuristic:       {heuristic_name}")
    print("=" * 64)

    if mode != "stats":
        printed_count = [0]
        lines = []

        def recurse_print(node: SearchTreeNode, prefix: str, is_tail: bool):
            if printed_count[0] >= max_nodes_to_print:
                return

            printed_count[0] += 1
            connector = "\\-- " if is_tail else "|-- "

            # Build node label
            if node.move is not None:
                move_str = f"Col {node.move}"
                if node.actual_col is not None and node.actual_col != node.move:
                    move_str += f" (slipped to {node.actual_col})"
            else:
                move_str = "ROOT"

            type_str = f"[{node.node_type}]"
            details = []

            if node.evaluation is not None:
                details.append(f"Score: {round(node.evaluation, 1)}")
            if node.expected_value is not None:
                details.append(f"EV: {round(node.expected_value, 2)}")
            if node.probability is not None:
                details.append(f"Prob: {round(node.probability, 2)}")
            if node.alpha is not None and node.beta is not None and node.node_type not in ("LEAF", "PRUNED"):
                details.append(f"α={round(node.alpha, 1)} β={round(node.beta, 1)}")
            if node.pruned:
                details.append(f"PRUNED: {node.pruning_reason or 'cut'}")

            detail_str = f" ({', '.join(details)})" if details else ""

            if prefix == "":
                lines.append(f"{move_str} {type_str}{detail_str}")
            else:
                lines.append(f"{prefix}{connector}{move_str} -> {type_str}{detail_str}")

            child_prefix = prefix + ("    " if is_tail else "|   ")
            child_count = len(node.children)

            for i, child in enumerate(node.children):
                if printed_count[0] >= max_nodes_to_print:
                    lines.append(f"{child_prefix}|-- ... [Tree print truncated: exceeded {max_nodes_to_print} nodes]")
                    break
                is_last_child = (i == child_count - 1)
                recurse_print(child, child_prefix, is_last_child)

        recurse_print(root, "", True)
        print("\n".join(lines))

    print("=" * 64)
    print("SEARCH RESULT SUMMARY")
    print(f"Best Move:        Column {best_move}")
    print(f"Evaluation:       {round(best_score, 2) if best_score is not None else 'N/A'}")
    print(f"Nodes Visited:    {stats.nodes_visited}")
    print(f"Nodes Expanded:   {stats.nodes_expanded}")
    print(f"Leaves Evaluated: {stats.leaves_evaluated}")
    print(f"Nodes Pruned:     {stats.nodes_pruned}")
    if stats.chance_nodes_count > 0:
        print(f"Chance Nodes:     {stats.chance_nodes_count}")
    print(f"Execution Time:   {execution_time_ms:.2f} ms")
    print("=" * 64)
