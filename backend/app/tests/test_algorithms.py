import unittest
from app.core.board import Board, EMPTY, HUMAN, AI
from app.core.heuristics import (
    heuristic_window_evaluation,
    heuristic_threat_potential,
    heuristic_strategic_positioning,
    HEURISTICS
)
from app.core.minimax import minimax_search
from app.core.alpha_beta import alpha_beta_search
from app.core.expectimax import expectimax_search, calculate_expectimax_probabilities
from app.core.iterative_deepening import run_single_depth_search, iterative_deepening_search
from app.core.search_tree import SearchStatistics


class TestAlgorithms(unittest.TestCase):
    def test_minimax_and_alphabeta_equivalence(self):
        """
        Minimax and Alpha-Beta must yield the EXACT same evaluation score
        when searching the same board, depth, and heuristic.
        Alpha-Beta must prune and visit fewer or equal nodes.
        """
        b = Board(7, 6)
        # Setup an early-mid game state
        b.drop_disc(3, HUMAN)
        b.drop_disc(3, AI)
        b.drop_disc(2, HUMAN)
        b.drop_disc(4, AI)

        h_entry = HEURISTICS["threat_potential"]

        # Depth 3 search
        m_stats = SearchStatistics()
        _, m_score, _ = minimax_search(
            board=b, depth=3, game_mode="classic",
            heuristic_fn=h_entry["func"], heuristic_name=h_entry["name"],
            stats=m_stats
        )

        ab_stats = SearchStatistics()
        _, ab_score, _ = alpha_beta_search(
            board=b, depth=3, game_mode="classic",
            heuristic_fn=h_entry["func"], heuristic_name=h_entry["name"],
            stats=ab_stats
        )

        # Scores must match
        self.assertAlmostEqual(m_score, ab_score, places=2)
        # Alpha-Beta must visit fewer or equal nodes
        self.assertLessEqual(ab_stats.nodes_visited, m_stats.nodes_visited)
        # Alpha-Beta should have pruned branches
        self.assertGreater(ab_stats.nodes_pruned, 0)

    def test_ai_immediate_win_detection(self):
        """AI must immediately pick the winning move in Classic mode."""
        b = Board(7, 6)
        # AI has 3 discs in row 0: cols 1, 2, 3. Empty col 4 gives immediate win!
        b.drop_disc(1, AI)
        b.drop_disc(5, HUMAN)
        b.drop_disc(2, AI)
        b.drop_disc(6, HUMAN)
        b.drop_disc(3, AI)
        b.drop_disc(5, HUMAN)

        res = run_single_depth_search(
            board=b, algorithm="alpha_beta", depth=2,
            game_mode="classic", heuristic_id="threat_potential"
        )
        # Best move must be either 0 or 4 (completes 4-in-a-row)
        self.assertIn(res["best_move"], [0, 4])
        # Win score should be very high
        self.assertGreater(res["evaluation"], 50000.0)

    def test_ai_blocks_human_immediate_win(self):
        """AI must block Human when Human is 1 disc away from winning."""
        b = Board(7, 6)
        # Human has 3 discs stacked vertically in col 2: rows 0, 1, 2. Threat is row 3 in col 2!
        b.drop_disc(2, HUMAN)  # row 0
        b.drop_disc(3, AI)     # row 0
        b.drop_disc(2, HUMAN)  # row 1
        b.drop_disc(4, AI)     # row 0
        b.drop_disc(2, HUMAN)  # row 2 - Human will win on next move if AI doesn't block!
        b.drop_disc(3, AI)     # row 1

        res = run_single_depth_search(
            board=b, algorithm="alpha_beta", depth=3,
            game_mode="classic", heuristic_id="threat_potential"
        )
        self.assertEqual(res["best_move"], 2)

    def test_expectimax_probabilities_all_cases(self):
        b = Board(7, 6)

        # Case 1: Col 3 (center) - both neighbors (2 and 4) available
        p_case1 = calculate_expectimax_probabilities(b, 3)
        self.assertEqual(len(p_case1), 3)
        p_dict = dict(p_case1)
        self.assertAlmostEqual(p_dict[3], 0.6)
        self.assertAlmostEqual(p_dict[2], 0.2)
        self.assertAlmostEqual(p_dict[4], 0.2)
        self.assertAlmostEqual(sum(p_dict.values()), 1.0)

        # Case 2a: Left border col 0 (left neighbor -1 is out of bounds)
        p_case2 = calculate_expectimax_probabilities(b, 0)
        self.assertEqual(len(p_case2), 2)
        p_dict = dict(p_case2)
        self.assertAlmostEqual(p_dict[0], 0.6)
        self.assertAlmostEqual(p_dict[1], 0.4)
        self.assertAlmostEqual(sum(p_dict.values()), 1.0)

        # Case 2b: Right border col 6 (right neighbor 7 is out of bounds)
        p_case2b = calculate_expectimax_probabilities(b, 6)
        self.assertEqual(len(p_case2b), 2)
        p_dict = dict(p_case2b)
        self.assertAlmostEqual(p_dict[6], 0.6)
        self.assertAlmostEqual(p_dict[5], 0.4)
        self.assertAlmostEqual(sum(p_dict.values()), 1.0)

        # Case 2c: Left neighbor is full
        b_full_left = Board(7, 6)
        for _ in range(6):
            b_full_left.drop_disc(2, AI)  # col 2 is now full
        p_left_full = calculate_expectimax_probabilities(b_full_left, 3)
        p_dict = dict(p_left_full)
        self.assertEqual(len(p_left_full), 2)
        self.assertAlmostEqual(p_dict[3], 0.6)
        self.assertAlmostEqual(p_dict[4], 0.4)
        self.assertAlmostEqual(sum(p_dict.values()), 1.0)

        # Case 3: Both neighbors unavailable (e.g., both cols 2 and 4 full)
        b_both_full = b_full_left.clone()
        for _ in range(6):
            b_both_full.drop_disc(4, HUMAN)  # col 4 now full too
        p_case3 = calculate_expectimax_probabilities(b_both_full, 3)
        self.assertEqual(len(p_case3), 1)
        self.assertEqual(p_case3[0], (3, 1.0))

    def test_expectimax_search_structure(self):
        b = Board(7, 6)
        b.drop_disc(3, HUMAN)
        stats = SearchStatistics()
        h_entry = HEURISTICS["window_evaluation"]

        best_move, ev, tree = expectimax_search(
            board=b, depth=2, game_mode="classic",
            heuristic_fn=h_entry["func"], heuristic_name=h_entry["name"],
            stats=stats
        )
        self.assertIsNotNone(best_move)
        self.assertIn(best_move, b.get_valid_moves())
        self.assertGreater(stats.chance_nodes_count, 0)
        # Tree root should be MAX with CHANCE children
        self.assertEqual(tree.node_type, "MAX")
        self.assertGreater(len(tree.children), 0)
        self.assertEqual(tree.children[0].node_type, "CHANCE")

    def test_iterative_deepening_respects_k(self):
        b = Board(7, 6)
        b.drop_disc(3, HUMAN)

        k = 4
        res = iterative_deepening_search(
            board=b, algorithm="alpha_beta", max_k=k,
            game_mode="classic", heuristic_id="threat_potential",
            print_console=False
        )

        self.assertEqual(res["actual_depth"], k)
        self.assertEqual(len(res["iterations_summary"]), k)
        for i, item in enumerate(res["iterations_summary"]):
            self.assertEqual(item["depth"], i + 1)
            self.assertIn(item["best_move"], range(7))
            self.assertIn(str(item["depth"]), res["iterations_trees"])


if __name__ == "__main__":
    unittest.main()
