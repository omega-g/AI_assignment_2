import unittest
from app.core.board import EMPTY, HUMAN, AI
from app.core.game import Game, GameMode, GameStatus


class TestGame(unittest.TestCase):
    def test_classic_mode_immediate_win(self):
        game = Game(width=7, height=6, mode=GameMode.CLASSIC)
        # Human drops 0, AI drops 0, Human drops 1, AI drops 1, Human drops 2, AI drops 2, Human drops 3 -> Human wins!
        game.make_move(0, HUMAN)
        game.make_move(0, AI)
        game.make_move(1, HUMAN)
        game.make_move(1, AI)
        game.make_move(2, HUMAN)
        game.make_move(2, AI)
        res = game.make_move(3, HUMAN)

        self.assertEqual(game.status, GameStatus.HUMAN_WON)
        self.assertEqual(game.winner, HUMAN)
        self.assertEqual(res["winner"], HUMAN)
        self.assertEqual(len(game.move_history), 7)

        # Further moves rejected
        with self.assertRaises(ValueError):
            game.make_move(3, AI)

    def test_assignment_mode_does_not_terminate_on_connect_four(self):
        game = Game(width=7, height=6, mode=GameMode.ASSIGNMENT)
        # Create a 4-in-a-row for Human
        game.make_move(0, HUMAN)
        game.make_move(0, AI)
        game.make_move(1, HUMAN)
        game.make_move(1, AI)
        game.make_move(2, HUMAN)
        game.make_move(2, AI)
        game.make_move(3, HUMAN)

        # Crucial check: in Assignment mode, the game MUST remain ONGOING!
        self.assertEqual(game.status, GameStatus.ONGOING)
        self.assertIsNone(game.winner)
        self.assertEqual(game.human_score, 1)
        self.assertEqual(game.ai_score, 0)
        self.assertEqual(game.current_player, AI)

        # AI can still play!
        res = game.make_move(3, AI)
        self.assertEqual(game.status, GameStatus.ONGOING)

    def test_assignment_mode_full_board_winner(self):
        # Let's test full-board termination on a minimal 7x6 board
        game = Game(width=7, height=6, mode=GameMode.ASSIGNMENT)

        # Fill the board row by row so we control the exact formations
        # Rows 0, 1: AI (cols 0..3 get 4 in a row)
        # We can fill the board using direct drops
        for c in range(7):
            for r in range(6):
                # Player alternating to keep it simple, but let's just make valid moves
                p = game.current_player
                game.make_move(c, p)

        self.assertNotEqual(game.status, GameStatus.ONGOING)
        self.assertTrue(game.status in (GameStatus.AI_WON, GameStatus.HUMAN_WON, GameStatus.DRAW))

    def test_turn_enforcement(self):
        game = Game(width=7, height=6, mode=GameMode.CLASSIC)
        # Human must play first
        with self.assertRaises(ValueError):
            game.make_move(0, AI)

        game.make_move(0, HUMAN)
        # Now AI must play
        with self.assertRaises(ValueError):
            game.make_move(1, HUMAN)


if __name__ == "__main__":
    unittest.main()
