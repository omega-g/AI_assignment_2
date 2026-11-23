import unittest
from app.core.board import Board, EMPTY, HUMAN, AI
from app.core.heuristics import (
    heuristic_window_evaluation,
    heuristic_threat_potential,
    heuristic_strategic_positioning,
    HEURISTICS
)


class TestHeuristics(unittest.TestCase):
    def test_window_evaluation_breakdown_and_signs(self):
        # AI favorable
        b_ai = Board(7, 6)
        b_ai.drop_disc(1, AI)
        b_ai.drop_disc(2, AI)
        b_ai.drop_disc(3, AI)

        score_ai, breakdown_ai = heuristic_window_evaluation(b_ai, "classic")
        self.assertGreater(score_ai, 0)
        self.assertAlmostEqual(score_ai, sum(breakdown_ai.values()), places=3)

        # Human favorable
        b_hu = Board(7, 6)
        b_hu.drop_disc(1, HUMAN)
        b_hu.drop_disc(2, HUMAN)
        b_hu.drop_disc(3, HUMAN)

        score_hu, breakdown_hu = heuristic_window_evaluation(b_hu, "classic")
        self.assertLess(score_hu, 0)
        self.assertAlmostEqual(score_hu, sum(breakdown_hu.values()), places=3)

    def test_threat_potential_breakdown_and_signs(self):
        b_ai = Board(7, 6)
        b_ai.drop_disc(1, AI)
        b_ai.drop_disc(2, AI)
        b_ai.drop_disc(3, AI)

        score, breakdown = heuristic_threat_potential(b_ai, "classic")
        self.assertGreater(score, 0)
        self.assertAlmostEqual(score, sum(breakdown.values()), places=3)
        self.assertIn("AI Immediate Threats", breakdown)

        # In assignment mode
        score_asgn, breakdown_asgn = heuristic_threat_potential(b_ai, "assignment")
        self.assertIn("Current AI Connect 4s", breakdown_asgn)
        self.assertAlmostEqual(score_asgn, sum(breakdown_asgn.values()), places=3)

    def test_strategic_positioning_breakdown_and_signs(self):
        b = Board(7, 6)
        # Drop in center col (col 3) for AI vs edge (col 0) for Human
        b.drop_disc(3, AI)
        b.drop_disc(0, HUMAN)

        score, breakdown = heuristic_strategic_positioning(b, "classic")
        # Center advantage should make overall score positive
        self.assertGreater(score, 0)
        self.assertAlmostEqual(score, sum(breakdown.values()), places=3)
        self.assertIn("AI Center Column Control", breakdown)


if __name__ == "__main__":
    unittest.main()
