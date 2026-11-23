"""
Connect 4 scoring and formation detection module.
Supports:
1. Fast local Connect Four check for Classic Mode (after a move).
2. Complete full-board window counting for Assignment Scoring Mode.
3. Coordinate extraction for visual highlighting of winning lines on the frontend.
"""
from typing import Tuple, List, Dict, Any, Optional
from app.core.board import Board, EMPTY, HUMAN, AI


def check_connect_four_at(board: Board, row: int, col: int, player: int) -> bool:
    """
    Checks if the disc at (row, col) creates a Connect Four for `player`.
    Efficiently checks only the lines passing through (row, col).
    """
    if board.get_cell(row, col) != player:
        return False

    directions = [
        (0, 1),   # Horizontal
        (1, 0),   # Vertical
        (1, 1),   # Diagonal Up-Right (/)
        (-1, 1)   # Diagonal Down-Right (\)
    ]

    for dr, dc in directions:
        count = 1  # The placed disc itself

        # Check positive direction
        r, c = row + dr, col + dc
        while 0 <= r < board.height and 0 <= c < board.width and board.grid[r][c] == player:
            count += 1
            r += dr
            c += dc

        # Check negative direction
        r, c = row - dr, col - dc
        while 0 <= r < board.height and 0 <= c < board.width and board.grid[r][c] == player:
            count += 1
            r -= dr
            c -= dc

        if count >= 4:
            return True

    return False


def count_all_connect_fours(board: Board) -> Tuple[int, int]:
    """
    Counts all 4-disc formations for both AI and HUMAN across the entire board.
    Every valid 4-cell window consisting solely of one player's discs counts as 1.
    Overlapping formations count separately (e.g. 5 discs in a line = 2 formations).

    Returns:
        (ai_count, human_count)
    """
    ai_count = 0
    human_count = 0
    grid = board.grid
    w = board.width
    h = board.height

    # 1. Horizontal windows
    for r in range(h):
        for c in range(w - 3):
            val0 = grid[r][c]
            if val0 != EMPTY and val0 == grid[r][c + 1] == grid[r][c + 2] == grid[r][c + 3]:
                if val0 == AI:
                    ai_count += 1
                elif val0 == HUMAN:
                    human_count += 1

    # 2. Vertical windows
    for c in range(w):
        for r in range(h - 3):
            val0 = grid[r][c]
            if val0 != EMPTY and val0 == grid[r + 1][c] == grid[r + 2][c] == grid[r + 3][c]:
                if val0 == AI:
                    ai_count += 1
                elif val0 == HUMAN:
                    human_count += 1

    # 3. Diagonal Up-Right (/) windows
    for r in range(h - 3):
        for c in range(w - 3):
            val0 = grid[r][c]
            if val0 != EMPTY and val0 == grid[r + 1][c + 1] == grid[r + 2][c + 2] == grid[r + 3][c + 3]:
                if val0 == AI:
                    ai_count += 1
                elif val0 == HUMAN:
                    human_count += 1

    # 4. Diagonal Down-Right (\) windows
    for r in range(3, h):
        for c in range(w - 3):
            val0 = grid[r][c]
            if val0 != EMPTY and val0 == grid[r - 1][c + 1] == grid[r - 2][c + 2] == grid[r - 3][c + 3]:
                if val0 == AI:
                    ai_count += 1
                elif val0 == HUMAN:
                    human_count += 1

    return ai_count, human_count


def get_all_windows(board: Board) -> List[Tuple[List[Tuple[int, int]], List[int]]]:
    """
    Generates all 4-cell windows on the board along with their coordinates.
    Used by heuristics for detailed evaluation.

    Returns:
        List of (coords, values) tuples:
        coords: [(r0, c0), (r1, c1), (r2, c2), (r3, c3)]
        values: [val0, val1, val2, val3]
    """
    windows = []
    grid = board.grid
    w = board.width
    h = board.height

    # Horizontal
    for r in range(h):
        for c in range(w - 3):
            coords = [(r, c + i) for i in range(4)]
            values = [grid[r][c + i] for i in range(4)]
            windows.append((coords, values))

    # Vertical
    for c in range(w):
        for r in range(h - 3):
            coords = [(r + i, c) for i in range(4)]
            values = [grid[r + i][c] for i in range(4)]
            windows.append((coords, values))

    # Diagonal Up (/)
    for r in range(h - 3):
        for c in range(w - 3):
            coords = [(r + i, c + i) for i in range(4)]
            values = [grid[r + i][c + i] for i in range(4)]
            windows.append((coords, values))

    # Diagonal Down (\)
    for r in range(3, h):
        for c in range(w - 3):
            coords = [(r - i, c + i) for i in range(4)]
            values = [grid[r - i][c + i] for i in range(4)]
            windows.append((coords, values))

    return windows


def get_winning_segments(board: Board) -> List[Dict[str, Any]]:
    """
    Finds all 4-cell winning segments for visualization.
    Returns list of segment dicts: {player, direction, coords: [[r, c], ...]}
    """
    segments = []
    grid = board.grid
    w = board.width
    h = board.height

    # Horizontal
    for r in range(h):
        for c in range(w - 3):
            v = grid[r][c]
            if v != EMPTY and v == grid[r][c+1] == grid[r][c+2] == grid[r][c+3]:
                segments.append({
                    "player": v,
                    "direction": "horizontal",
                    "coords": [[r, c + i] for i in range(4)]
                })

    # Vertical
    for c in range(w):
        for r in range(h - 3):
            v = grid[r][c]
            if v != EMPTY and v == grid[r+1][c] == grid[r+2][c] == grid[r+3][c]:
                segments.append({
                    "player": v,
                    "direction": "vertical",
                    "coords": [[r + i, c] for i in range(4)]
                })

    # Diagonal Up (/)
    for r in range(h - 3):
        for c in range(w - 3):
            v = grid[r][c]
            if v != EMPTY and v == grid[r+1][c+1] == grid[r+2][c+2] == grid[r+3][c+3]:
                segments.append({
                    "player": v,
                    "direction": "diagonal_up",
                    "coords": [[r + i, c + i] for i in range(4)]
                })

    # Diagonal Down (\)
    for r in range(3, h):
        for c in range(w - 3):
            v = grid[r][c]
            if v != EMPTY and v == grid[r-1][c+1] == grid[r-2][c+2] == grid[r-3][c+3]:
                segments.append({
                    "player": v,
                    "direction": "diagonal_down",
                    "coords": [[r - i, c + i] for i in range(4)]
                })

    return segments
