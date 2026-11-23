"""
Core Board representation for Connect 4.
Grid orientation:
- row 0 is the BOTTOM of the board
- row (height - 1) is the TOP of the board
- column 0 is the LEFT of the board
- column (width - 1) is the RIGHT of the board
"""
from typing import List, Optional, Tuple, Dict, Any

EMPTY: int = 0
HUMAN: int = -1
AI: int = 1


class Board:
    def __init__(self, width: int = 7, height: int = 6):
        if width < 7:
            raise ValueError(f"Width must be >= 7, got {width}")
        if height < 6:
            raise ValueError(f"Height must be >= 6, got {height}")
        self.width: int = width
        self.height: int = height
        # grid[row][col]: 0 is empty, -1 is human, 1 is AI
        self.grid: List[List[int]] = [[EMPTY for _ in range(width)] for _ in range(height)]
        self.last_move: Optional[Tuple[int, int]] = None  # (row, col) of last move

    def is_valid_move(self, col: int) -> bool:
        """A move is valid if the column is within bounds and the top cell is empty."""
        if col < 0 or col >= self.width:
            return False
        return self.grid[self.height - 1][col] == EMPTY

    def get_valid_moves(self) -> List[int]:
        """Returns all column indices that are not full."""
        return [c for c in range(self.width) if self.grid[self.height - 1][c] == EMPTY]

    def get_next_open_row(self, col: int) -> Optional[int]:
        """Returns the lowest row in the specified column that is empty, or None if full."""
        if col < 0 or col >= self.width:
            return None
        for r in range(self.height):
            if self.grid[r][col] == EMPTY:
                return r
        return None

    def drop_disc(self, col: int, player: int) -> int:
        """
        Drops a disc for the given player into the column.
        Returns the row index where the disc landed.
        Raises ValueError if the move is invalid or column is full.
        """
        if player not in (HUMAN, AI):
            raise ValueError(f"Invalid player: {player}")
        if not self.is_valid_move(col):
            raise ValueError(f"Column {col} is full or out of bounds (0-{self.width - 1})")

        row = self.get_next_open_row(col)
        if row is None:
            raise ValueError(f"Column {col} is full")

        self.grid[row][col] = player
        self.last_move = (row, col)
        return row

    def is_full(self) -> bool:
        """Returns True if every column's top cell is occupied."""
        return all(self.grid[self.height - 1][c] != EMPTY for c in range(self.width))

    def get_cell(self, row: int, col: int) -> int:
        """Gets the cell value at row, col."""
        if 0 <= row < self.height and 0 <= col < self.width:
            return self.grid[row][col]
        raise IndexError(f"Cell ({row}, {col}) is out of bounds for {self.width}x{self.height}")

    def clone(self) -> "Board":
        """Creates an independent deep copy of the board."""
        new_board = Board(self.width, self.height)
        new_board.grid = [row[:] for row in self.grid]
        new_board.last_move = self.last_move
        return new_board

    @classmethod
    def from_grid(cls, grid: List[List[int]]) -> "Board":
        """
        Constructs a Board instance from a given 2D list.
        Row 0 must be the bottom row.
        """
        height = len(grid)
        width = len(grid[0]) if height > 0 else 0
        board = cls(width=width, height=height)
        board.grid = [row[:] for row in grid]
        return board

    def to_dict(self) -> Dict[str, Any]:
        """Serializes the board for JSON responses."""
        return {
            "width": self.width,
            "height": self.height,
            "grid": self.grid,
            "last_move": self.last_move,
            "valid_moves": self.get_valid_moves(),
            "is_full": self.is_full()
        }

    def __repr__(self) -> str:
        lines = []
        for r in range(self.height - 1, -1, -1):
            row_str = " ".join(
                "X" if self.grid[r][c] == AI else "O" if self.grid[r][c] == HUMAN else "."
                for c in range(self.width)
            )
            lines.append(f"| {row_str} |")
        lines.append("-" * (self.width * 2 + 3))
        lines.append("  " + " ".join(str(c) for c in range(self.width)))
        return "\n".join(lines)
