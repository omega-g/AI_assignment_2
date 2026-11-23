"""
Connect 4 Game state and rule orchestrator.
Manages:
- Both Classic Mode (early termination on 4-in-a-row) and Assignment Scoring Mode (full-board play).
- Turn order, move history, scores, and win/draw detection.
"""
import uuid
from enum import Enum
from typing import Optional, List, Dict, Any
from app.core.board import Board, EMPTY, HUMAN, AI
from app.core.scoring import check_connect_four_at, count_all_connect_fours, get_winning_segments


class GameMode(str, Enum):
    CLASSIC = "classic"
    ASSIGNMENT = "assignment"


class GameStatus(str, Enum):
    ONGOING = "ongoing"
    AI_WON = "ai_won"
    HUMAN_WON = "human_won"
    DRAW = "draw"


class Game:
    def __init__(
        self,
        width: int = 7,
        height: int = 6,
        mode: GameMode = GameMode.CLASSIC,
        algorithm: str = "alpha_beta",
        heuristic: str = "threat_potential",
        max_depth: int = 5,
        game_id: Optional[str] = None
    ):
        self.game_id: str = game_id or str(uuid.uuid4())
        self.board: Board = Board(width=width, height=height)
        self.mode: GameMode = mode
        self.algorithm: str = algorithm
        self.heuristic: str = heuristic
        self.max_depth: int = max_depth

        self.current_player: int = HUMAN  # Human plays first by default
        self.status: GameStatus = GameStatus.ONGOING
        self.winner: Optional[int] = None

        self.ai_score: int = 0
        self.human_score: int = 0
        self.move_history: List[Dict[str, Any]] = []

    def make_move(
        self,
        col: int,
        expected_player: Optional[int] = None,
        ai_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Executes a move in column `col`.
        Enforces turns, updates board, calculates scores, and determines terminal state.
        """
        if self.status != GameStatus.ONGOING:
            raise ValueError(f"Game is already over with status {self.status.value}")

        player = self.current_player
        if expected_player is not None and expected_player != player:
            raise ValueError(f"It is player {player}'s turn, not {expected_player}'s")

        if not self.board.is_valid_move(col):
            raise ValueError(f"Move in column {col} is invalid or column is full")

        # Execute disc drop
        row = self.board.drop_disc(col, player)

        # Update scoring and terminal conditions depending on GameMode
        if self.mode == GameMode.CLASSIC:
            has_won = check_connect_four_at(self.board, row, col, player)
            if has_won:
                self.status = GameStatus.AI_WON if player == AI else GameStatus.HUMAN_WON
                self.winner = player
                if player == AI:
                    self.ai_score = 1
                else:
                    self.human_score = 1
            elif self.board.is_full():
                self.status = GameStatus.DRAW
                self.winner = None
            else:
                self.current_player = AI if player == HUMAN else HUMAN

        elif self.mode == GameMode.ASSIGNMENT:
            # Assignment Scoring Mode does NOT terminate when 4-in-a-row is formed!
            # Count current formations
            ai_fours, human_fours = count_all_connect_fours(self.board)
            self.ai_score = ai_fours
            self.human_score = human_fours

            if self.board.is_full():
                if self.ai_score > self.human_score:
                    self.status = GameStatus.AI_WON
                    self.winner = AI
                elif self.human_score > self.ai_score:
                    self.status = GameStatus.HUMAN_WON
                    self.winner = HUMAN
                else:
                    self.status = GameStatus.DRAW
                    self.winner = None
            else:
                self.current_player = AI if player == HUMAN else HUMAN

        # Record history entry
        record: Dict[str, Any] = {
            "move_number": len(self.move_history) + 1,
            "player": player,
            "column": col,
            "row": row,
            "board_grid": [r[:] for r in self.board.grid],
            "mode": self.mode.value,
            "ai_score": self.ai_score,
            "human_score": self.human_score,
            "status": self.status.value,
            "winner": self.winner
        }
        if ai_metadata:
            record.update(ai_metadata)

        self.move_history.append(record)

        return {
            "row": row,
            "col": col,
            "player": player,
            "status": self.status.value,
            "winner": self.winner,
            "ai_score": self.ai_score,
            "human_score": self.human_score,
            "board": self.board.to_dict(),
            "winning_segments": get_winning_segments(self.board) if self.status != GameStatus.ONGOING else []
        }

    def reset(self) -> None:
        """Resets the game state with the same configuration."""
        self.board = Board(width=self.board.width, height=self.board.height)
        self.current_player = HUMAN
        self.status = GameStatus.ONGOING
        self.winner = None
        self.ai_score = 0
        self.human_score = 0
        self.move_history = []

    def to_dict(self) -> Dict[str, Any]:
        """Serializes the game state for API responses."""
        return {
            "game_id": self.game_id,
            "width": self.board.width,
            "height": self.board.height,
            "mode": self.mode.value,
            "algorithm": self.algorithm,
            "heuristic": self.heuristic,
            "max_depth": self.max_depth,
            "current_player": self.current_player,
            "status": self.status.value,
            "winner": self.winner,
            "ai_score": self.ai_score,
            "human_score": self.human_score,
            "board": self.board.to_dict(),
            "winning_segments": get_winning_segments(self.board) if self.status != GameStatus.ONGOING else [],
            "move_history_count": len(self.move_history)
        }
