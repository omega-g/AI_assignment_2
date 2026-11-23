import unittest
from app.core.board import Board, EMPTY, HUMAN, AI
from app.core.scoring import check_connect_four_at, count_all_connect_fours, get_winning_segments


class TestScoring(unittest.TestCase):
    def test_horizontal_connect_four(self):
        b = Board(7, 6)
        # Drop 4 AI discs in row 0: cols 1, 2, 3, 4
        for c in (1, 2, 3, 4):
            r = b.drop_disc(c, AI)
            if c < 4:
                self.assertFalse(check_connect_four_at(b, r, c, AI))
            else:
                self.assertTrue(check_connect_four_at(b, r, c, AI))

        ai_fours, human_fours = count_all_connect_fours(b)
        self.assertEqual(ai_fours, 1)
        self.assertEqual(human_fours, 0)

    def test_vertical_connect_four(self):
        b = Board(7, 6)
        # Drop 4 HUMAN discs in col 2
        for i in range(4):
            r = b.drop_disc(2, HUMAN)
            if i < 3:
                self.assertFalse(check_connect_four_at(b, r, 2, HUMAN))
            else:
                self.assertTrue(check_connect_four_at(b, r, 2, HUMAN))

        ai_fours, human_fours = count_all_connect_fours(b)
        self.assertEqual(ai_fours, 0)
        self.assertEqual(human_fours, 1)

    def test_diagonal_up_connect_four(self):
        # Diagonal /: (0,0), (1,1), (2,2), (3,3)
        b = Board(7, 6)
        # Setup column 1: 1 dummy, then AI
        b.drop_disc(1, HUMAN)  # row 0
        # Setup column 2: 2 dummies, then AI
        b.drop_disc(2, HUMAN)  # row 0
        b.drop_disc(2, HUMAN)  # row 1
        # Setup column 3: 3 dummies, then AI
        b.drop_disc(3, HUMAN)  # row 0
        b.drop_disc(3, HUMAN)  # row 1
        b.drop_disc(3, HUMAN)  # row 2

        # Drop diagonal AI discs one by one and check
        r0 = b.drop_disc(0, AI)  # (0, 0)
        self.assertFalse(check_connect_four_at(b, r0, 0, AI))

        r1 = b.drop_disc(1, AI)  # (1, 1)
        self.assertFalse(check_connect_four_at(b, r1, 1, AI))

        r2 = b.drop_disc(2, AI)  # (2, 2)
        self.assertFalse(check_connect_four_at(b, r2, 2, AI))

        r3 = b.drop_disc(3, AI)  # (3, 3) - 4th disc completes the diagonal!
        self.assertTrue(check_connect_four_at(b, r3, 3, AI))

        ai_fours, _ = count_all_connect_fours(b)
        self.assertEqual(ai_fours, 1)

    def test_diagonal_down_connect_four(self):
        # Diagonal \: (3,0), (2,1), (1,2), (0,3)
        b = Board(7, 6)
        # col 0: 3 dummies, then AI
        b.drop_disc(0, HUMAN)  # row 0
        b.drop_disc(0, HUMAN)  # row 1
        b.drop_disc(0, HUMAN)  # row 2
        r0 = b.drop_disc(0, AI)  # row 3

        # col 1: 2 dummies, then AI
        b.drop_disc(1, HUMAN)  # row 0
        b.drop_disc(1, HUMAN)  # row 1
        r1 = b.drop_disc(1, AI)  # row 2

        # col 2: 1 dummy, then AI
        b.drop_disc(2, HUMAN)  # row 0
        r2 = b.drop_disc(2, AI)  # row 1

        # col 3: AI
        r3 = b.drop_disc(3, AI)  # row 0

        self.assertTrue(check_connect_four_at(b, r3, 3, AI))
        ai_fours, _ = count_all_connect_fours(b)
        self.assertEqual(ai_fours, 1)

    def test_overlapping_formations(self):
        """
        Five consecutive discs belonging to the same player produce two separate Connect Four formations.
        Six consecutive discs produce three.
        """
        b = Board(7, 6)
        # 5 AI discs horizontally in row 0: cols 0, 1, 2, 3, 4
        for c in range(5):
            b.drop_disc(c, AI)

        ai_fours, human_fours = count_all_connect_fours(b)
        self.assertEqual(ai_fours, 2)
        self.assertEqual(human_fours, 0)

        # 6th AI disc in col 5 -> now 3 formations (0..3, 1..4, 2..5)
        b.drop_disc(5, AI)
        ai_fours, human_fours = count_all_connect_fours(b)
        self.assertEqual(ai_fours, 3)

    def test_mixed_windows_not_counted(self):
        b = Board(7, 6)
        # Alternating: AI, HUMAN, AI, AI in row 0
        b.drop_disc(0, AI)
        b.drop_disc(1, HUMAN)
        b.drop_disc(2, AI)
        b.drop_disc(3, AI)

        ai_fours, human_fours = count_all_connect_fours(b)
        self.assertEqual(ai_fours, 0)
        self.assertEqual(human_fours, 0)

    def test_winning_segments(self):
        b = Board(7, 6)
        for c in range(4):
            b.drop_disc(c, AI)
        segments = get_winning_segments(b)
        self.assertEqual(len(segments), 1)
        self.assertEqual(segments[0]["player"], AI)
        self.assertEqual(segments[0]["direction"], "horizontal")


if __name__ == "__main__":
    unittest.main()
