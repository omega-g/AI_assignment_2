import unittest
from app.core.board import Board, EMPTY, HUMAN, AI


class TestBoard(unittest.TestCase):
    def test_dimensions_validation(self):
        # Default 7x6
        b = Board()
        self.assertEqual(b.width, 7)
        self.assertEqual(b.height, 6)

        # Custom valid
        b8x7 = Board(8, 7)
        self.assertEqual(b8x7.width, 8)
        self.assertEqual(b8x7.height, 7)

        # Invalid dimensions
        with self.assertRaises(ValueError):
            Board(6, 6)
        with self.assertRaises(ValueError):
            Board(7, 5)

    def test_gravity_and_dropping(self):
        b = Board(7, 6)
        # Drop first disc in column 3
        r1 = b.drop_disc(3, AI)
        self.assertEqual(r1, 0)
        self.assertEqual(b.get_cell(0, 3), AI)

        # Drop second disc in column 3
        r2 = b.drop_disc(3, HUMAN)
        self.assertEqual(r2, 1)
        self.assertEqual(b.get_cell(1, 3), HUMAN)

        # Valid moves should still include 3
        self.assertIn(3, b.get_valid_moves())

        # Fill the rest of column 3 (height=6, already has 2)
        b.drop_disc(3, AI)     # row 2
        b.drop_disc(3, HUMAN)  # row 3
        b.drop_disc(3, AI)     # row 4
        r6 = b.drop_disc(3, HUMAN)  # row 5
        self.assertEqual(r6, 5)

        # Now column 3 is full
        self.assertFalse(b.is_valid_move(3))
        self.assertNotIn(3, b.get_valid_moves())

        # Attempting to drop into full column raises ValueError
        with self.assertRaises(ValueError):
            b.drop_disc(3, AI)

    def test_bounds_and_invalid_player(self):
        b = Board(7, 6)
        with self.assertRaises(ValueError):
            b.drop_disc(-1, AI)
        with self.assertRaises(ValueError):
            b.drop_disc(7, AI)
        with self.assertRaises(ValueError):
            b.drop_disc(2, 99)

    def test_clone_independence(self):
        b = Board(7, 6)
        b.drop_disc(2, AI)
        clone = b.clone()
        self.assertEqual(clone.get_cell(0, 2), AI)

        clone.drop_disc(2, HUMAN)
        self.assertEqual(clone.get_cell(1, 2), HUMAN)
        self.assertEqual(b.get_cell(1, 2), EMPTY)  # Original unchanged

    def test_is_full(self):
        b = Board(7, 6)
        self.assertFalse(b.is_full())
        for c in range(7):
            for _ in range(6):
                b.drop_disc(c, AI)
        self.assertTrue(b.is_full())
        self.assertEqual(b.get_valid_moves(), [])


if __name__ == "__main__":
    unittest.main()
