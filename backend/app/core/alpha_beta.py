"""
Minimax Algorithm with Alpha-Beta Pruning.
Maintains alpha and beta bounds, prunes suboptimal branches, tracks pruned counts,
and records explicit pruned indicators in the search tree.
"""
from typing import Optional, Tuple, Callable
from app.core.board import Board, EMPTY, HUMAN, AI
from app.core.scoring import check_connect_four_at, count_all_connect_fours
from app.core.search_tree import SearchTreeNode, SearchStatistics


WIN_SCORE = 100000.0


def alpha_beta_search(
    board: Board,
    depth: int,
    game_mode: str,
    heuristic_fn: Callable,
    heuristic_name: str,
    alpha: float = -float("inf"),
    beta: float = float("inf"),
    is_maximizing: bool = True,
    stats: Optional[SearchStatistics] = None,
    parent_id: Optional[str] = None,
    move_taken: Optional[int] = None,
    actual_col: Optional[int] = None,
    current_depth: int = 0
) -> Tuple[Optional[int], float, SearchTreeNode]:
    """
    Minimax with Alpha-Beta Pruning.
    Returns:
        (best_move, best_score, search_tree_node)
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
        alpha=alpha,
        beta=beta
    )

    # 1. Check terminal game state from previous move (if any)
    if move_taken is not None and board.last_move is not None:
        last_r, last_c = board.last_move
        prev_player = HUMAN if is_maximizing else AI

        if game_mode == "classic":
            if check_connect_four_at(board, last_r, last_c, prev_player):
                stats.leaves_evaluated += 1
                node.node_type = "LEAF"
                node.heuristic_name = "Terminal (Win/Loss)"
                score = (WIN_SCORE - current_depth) if prev_player == AI else (-WIN_SCORE + current_depth)
                node.evaluation = score
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
                node.heuristic_breakdown = {
                    "Final AI Formations": float(ai_fours * 10000),
                    "Final Human Formations": float(-human_fours * 10000)
                }
                return None, score, node

    # 2. Depth cutoff
    if depth == 0:
        stats.leaves_evaluated += 1
        score, breakdown = heuristic_fn(board, game_mode)
        node.node_type = "LEAF"
        node.heuristic_name = heuristic_name
        node.evaluation = score
        node.heuristic_breakdown = breakdown
        return None, score, node

    # 3. Legal moves
    valid_moves = board.get_valid_moves()
    if not valid_moves:
        stats.leaves_evaluated += 1
        score, breakdown = heuristic_fn(board, game_mode)
        node.node_type = "LEAF"
        node.heuristic_name = heuristic_name
        node.evaluation = score
        node.heuristic_breakdown = breakdown
        return None, score, node

    stats.nodes_expanded += 1
    best_move: Optional[int] = None

    if is_maximizing:
        max_eval = -float("inf")
        curr_alpha = alpha

        for idx, col in enumerate(valid_moves):
            cloned = board.clone()
            cloned.drop_disc(col, AI)
            _, child_eval, child_node = alpha_beta_search(
                board=cloned,
                depth=depth - 1,
                game_mode=game_mode,
                heuristic_fn=heuristic_fn,
                heuristic_name=heuristic_name,
                alpha=curr_alpha,
                beta=beta,
                is_maximizing=False,
                stats=stats,
                parent_id=node.id,
                move_taken=col,
                actual_col=col,
                current_depth=current_depth + 1
            )
            node.add_child(child_node)

            if child_eval > max_eval:
                max_eval = child_eval
                best_move = col

            curr_alpha = max(curr_alpha, max_eval)
            node.alpha = curr_alpha
            node.beta = beta

            if curr_alpha >= beta:
                # Alpha cutoff: prune remaining branches
                stats.nodes_pruned += (len(valid_moves) - 1 - idx)
                if idx < len(valid_moves) - 1:
                    pruned_node = SearchTreeNode(
                        parent_id=node.id,
                        depth=current_depth + 1,
                        node_type="PRUNED",
                        pruned=True,
                        pruning_reason=f"Alpha ({curr_alpha:.1f}) >= Beta ({beta:.1f})"
                    )
                    node.add_child(pruned_node)
                break

        node.evaluation = max_eval
        return best_move, max_eval, node

    else:
        min_eval = float("inf")
        curr_beta = beta

        for idx, col in enumerate(valid_moves):
            cloned = board.clone()
            cloned.drop_disc(col, HUMAN)
            _, child_eval, child_node = alpha_beta_search(
                board=cloned,
                depth=depth - 1,
                game_mode=game_mode,
                heuristic_fn=heuristic_fn,
                heuristic_name=heuristic_name,
                alpha=alpha,
                beta=curr_beta,
                is_maximizing=True,
                stats=stats,
                parent_id=node.id,
                move_taken=col,
                actual_col=col,
                current_depth=current_depth + 1
            )
            node.add_child(child_node)

            if child_eval < min_eval:
                min_eval = child_eval
                best_move = col

            curr_beta = min(curr_beta, min_eval)
            node.alpha = alpha
            node.beta = curr_beta

            if alpha >= curr_beta:
                # Beta cutoff: prune remaining branches
                stats.nodes_pruned += (len(valid_moves) - 1 - idx)
                if idx < len(valid_moves) - 1:
                    pruned_node = SearchTreeNode(
                        parent_id=node.id,
                        depth=current_depth + 1,
                        node_type="PRUNED",
                        pruned=True,
                        pruning_reason=f"Alpha ({alpha:.1f}) >= Beta ({curr_beta:.1f})"
                    )
                    node.add_child(pruned_node)
                break

        node.evaluation = min_eval
        return best_move, min_eval, node
