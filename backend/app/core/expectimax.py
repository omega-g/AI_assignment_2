"""
Expectimax / Expected Minimax Algorithm.
Implements the university assignment's probabilistic disc-placement model:
- MAX nodes: AI chooses action that maximizes expected utility.
- MIN nodes: Human chooses action that minimizes AI utility.
- CHANCE nodes: Calculate weighted expected values based on physical drop uncertainty.

Probability Model:
- Case 1: Chosen column and both neighbors are available:
    Chosen: 0.6, Left: 0.2, Right: 0.2
- Case 2: Only one neighboring column is available:
    Chosen: 0.6, Available neighbor: 0.4
- Case 3: No neighboring columns are available:
    Chosen: 1.0

A neighbor is unavailable if outside the board or full.
"""
from typing import Optional, Tuple, Callable, List
from app.core.board import Board, EMPTY, HUMAN, AI
from app.core.scoring import check_connect_four_at, count_all_connect_fours
from app.core.search_tree import SearchTreeNode, SearchStatistics


WIN_SCORE = 100000.0


def calculate_expectimax_probabilities(board: Board, chosen_col: int) -> List[Tuple[int, float]]:
    """
    Computes the outcome distribution for dropping a disc into `chosen_col`.
    Dedicated function ensuring transparent probability calculations.

    Returns:
        List of (actual_column, probability)
    """
    left_col = chosen_col - 1
    right_col = chosen_col + 1

    left_available = (left_col >= 0) and board.is_valid_move(left_col)
    right_available = (right_col < board.width) and board.is_valid_move(right_col)

    if left_available and right_available:
        # Case 1: Both neighbors available
        return [
            (chosen_col, 0.6),
            (left_col, 0.2),
            (right_col, 0.2)
        ]
    elif left_available and not right_available:
        # Case 2a: Only left neighbor available
        return [
            (chosen_col, 0.6),
            (left_col, 0.4)
        ]
    elif not left_available and right_available:
        # Case 2b: Only right neighbor available
        return [
            (chosen_col, 0.6),
            (right_col, 0.4)
        ]
    else:
        # Case 3: Neither neighbor available
        return [
            (chosen_col, 1.0)
        ]


def expectimax_search(
    board: Board,
    depth: int,
    game_mode: str,
    heuristic_fn: Callable,
    heuristic_name: str,
    is_maximizing: bool = True,
    stats: Optional[SearchStatistics] = None,
    parent_id: Optional[str] = None,
    move_taken: Optional[int] = None,
    actual_col: Optional[int] = None,
    probability: Optional[float] = None,
    current_depth: int = 0
) -> Tuple[Optional[int], float, SearchTreeNode]:
    """
    Expectimax Search with explicit Chance nodes and probabilistic transitions.
    Returns:
        (best_move, expected_value, search_tree_node)
    """
    if stats is None:
        stats = SearchStatistics()

    stats.nodes_visited += 1
    stats.max_depth_reached = max(stats.max_depth_reached, current_depth)

    node_type = "MAX" if is_maximizing else "MIN"
    current_player = AI if is_maximizing else HUMAN

    node = SearchTreeNode(
        parent_id=parent_id,
        depth=current_depth,
        node_type=node_type,
        board_grid=[row[:] for row in board.grid],
        move=move_taken,
        actual_col=actual_col,
        player=current_player,
        probability=probability
    )

    # 1. Check terminal game state from previous move (if any)
    if actual_col is not None and board.last_move is not None:
        last_r, last_c = board.last_move
        prev_player = HUMAN if is_maximizing else AI

        if game_mode == "classic":
            if check_connect_four_at(board, last_r, last_c, prev_player):
                stats.leaves_evaluated += 1
                node.node_type = "LEAF"
                node.heuristic_name = "Terminal (Win/Loss)"
                score = (WIN_SCORE - current_depth) if prev_player == AI else (-WIN_SCORE + current_depth)
                node.evaluation = score
                node.expected_value = score
                node.heuristic_breakdown = {
                    "Terminal Connect Four": score,
                    "Depth Adjustment": float(-current_depth if prev_player == AI else current_depth)
                }
                return None, score, node

            if board.is_full():
                stats.leaves_evaluated += 1
                node.node_type = "LEAF"
                node.heuristic_name = "Terminal (Draw)"
                node.evaluation = 0.0
                node.expected_value = 0.0
                node.heuristic_breakdown = {"Draw": 0.0}
                return None, 0.0, node

        elif game_mode == "assignment":
            if board.is_full():
                stats.leaves_evaluated += 1
                ai_fours, human_fours = count_all_connect_fours(board)
                score = float(ai_fours - human_fours) * 10000.0
                node.node_type = "LEAF"
                node.heuristic_name = "Terminal (Full Board Formations)"
                node.evaluation = score
                node.expected_value = score
                node.heuristic_breakdown = {
                    "Final AI Formations": float(ai_fours * 10000),
                    "Final Human Formations": float(-human_fours * 10000)
                }
                return None, score, node

    # 2. Check depth cutoff
    if depth == 0:
        stats.leaves_evaluated += 1
        score, breakdown = heuristic_fn(board, game_mode)
        node.node_type = "LEAF"
        node.heuristic_name = heuristic_name
        node.evaluation = score
        node.expected_value = score
        node.heuristic_breakdown = breakdown
        return None, score, node

    # 3. Explore legal action choices
    valid_moves = board.get_valid_moves()
    if not valid_moves:
        stats.leaves_evaluated += 1
        score, breakdown = heuristic_fn(board, game_mode)
        node.node_type = "LEAF"
        node.heuristic_name = heuristic_name
        node.evaluation = score
        node.expected_value = score
        node.heuristic_breakdown = breakdown
        return None, score, node

    stats.nodes_expanded += 1
    best_move: Optional[int] = None

    if is_maximizing:
        best_expected_val = -float("inf")

        for chosen_col in valid_moves:
            # Create a CHANCE node for this intended drop
            stats.chance_nodes_count += 1
            chance_node = SearchTreeNode(
                parent_id=node.id,
                depth=current_depth,
                node_type="CHANCE",
                board_grid=[row[:] for row in board.grid],
                move=chosen_col,
                player=AI
            )

            # Compute outcome probabilities for this chosen action
            outcomes = calculate_expectimax_probabilities(board, chosen_col)
            expected_val = 0.0

            for actual_c, prob in outcomes:
                cloned = board.clone()
                cloned.drop_disc(actual_c, AI)

                _, child_val, outcome_node = expectimax_search(
                    board=cloned,
                    depth=depth - 1,
                    game_mode=game_mode,
                    heuristic_fn=heuristic_fn,
                    heuristic_name=heuristic_name,
                    is_maximizing=False,
                    stats=stats,
                    parent_id=chance_node.id,
                    move_taken=chosen_col,
                    actual_col=actual_c,
                    probability=prob,
                    current_depth=current_depth + 1
                )
                chance_node.add_child(outcome_node)
                expected_val += prob * child_val

            chance_node.expected_value = expected_val
            chance_node.evaluation = expected_val
            node.add_child(chance_node)

            if expected_val > best_expected_val:
                best_expected_val = expected_val
                best_move = chosen_col

        node.evaluation = best_expected_val
        node.expected_value = best_expected_val
        return best_move, best_expected_val, node

    else:
        worst_expected_val = float("inf")

        for chosen_col in valid_moves:
            stats.chance_nodes_count += 1
            chance_node = SearchTreeNode(
                parent_id=node.id,
                depth=current_depth,
                node_type="CHANCE",
                board_grid=[row[:] for row in board.grid],
                move=chosen_col,
                player=HUMAN
            )

            outcomes = calculate_expectimax_probabilities(board, chosen_col)
            expected_val = 0.0

            for actual_c, prob in outcomes:
                cloned = board.clone()
                cloned.drop_disc(actual_c, HUMAN)

                _, child_val, outcome_node = expectimax_search(
                    board=cloned,
                    depth=depth - 1,
                    game_mode=game_mode,
                    heuristic_fn=heuristic_fn,
                    heuristic_name=heuristic_name,
                    is_maximizing=True,
                    stats=stats,
                    parent_id=chance_node.id,
                    move_taken=chosen_col,
                    actual_col=actual_c,
                    probability=prob,
                    current_depth=current_depth + 1
                )
                chance_node.add_child(outcome_node)
                expected_val += prob * child_val

            chance_node.expected_value = expected_val
            chance_node.evaluation = expected_val
            node.add_child(chance_node)

            if expected_val < worst_expected_val:
                worst_expected_val = expected_val
                best_move = chosen_col

        node.evaluation = worst_expected_val
        node.expected_value = worst_expected_val
        return best_move, worst_expected_val, node
