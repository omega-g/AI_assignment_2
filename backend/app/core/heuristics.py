"""
Heuristic evaluation functions for Connect 4.
All heuristics evaluate the game state from the AI's perspective (+AI advantage, -Human advantage).
Each heuristic returns:
    (total_score: float, breakdown: Dict[str, float])
"""
from typing import Tuple, Dict, Any, List
from app.core.board import Board, EMPTY, HUMAN, AI
from app.core.scoring import get_all_windows, count_all_connect_fours


# ---------------------------------------------------------------------------
# Heuristic 1: Connect-Four Window Evaluation
# ---------------------------------------------------------------------------

DEFAULT_WINDOW_WEIGHTS = {
    "ai_4": 100000.0,
    "ai_3": 100.0,
    "ai_2": 10.0,
    "ai_1": 1.0,
    "human_4": -100000.0,
    "human_3": -120.0,
    "human_2": -15.0,
    "human_1": -2.0,
}


def heuristic_window_evaluation(
    board: Board,
    mode: str = "classic",
    weights: Dict[str, float] = None
) -> Tuple[float, Dict[str, float]]:
    """
    Evaluates every 4-cell window on the board (horizontal, vertical, diagonal).
    Weights configurable.
    Counts:
      - 4 AI / 4 Human
      - 3 AI + 1 empty / 3 Human + 1 empty
      - 2 AI + 2 empty / 2 Human + 2 empty
      - 1 AI + 3 empty / 1 Human + 3 empty
    """
    w = weights or DEFAULT_WINDOW_WEIGHTS

    counts = {
        "ai_4": 0,
        "ai_3": 0,
        "ai_2": 0,
        "ai_1": 0,
        "human_4": 0,
        "human_3": 0,
        "human_2": 0,
        "human_1": 0,
    }

    all_windows = get_all_windows(board)

    for _, vals in all_windows:
        ai_cnt = vals.count(AI)
        hu_cnt = vals.count(HUMAN)
        em_cnt = vals.count(EMPTY)

        if ai_cnt > 0 and hu_cnt > 0:
            # Mixed window - cannot form a Connect 4 for either player
            continue

        if ai_cnt == 4:
            counts["ai_4"] += 1
        elif ai_cnt == 3 and em_cnt == 1:
            counts["ai_3"] += 1
        elif ai_cnt == 2 and em_cnt == 2:
            counts["ai_2"] += 1
        elif ai_cnt == 1 and em_cnt == 3:
            counts["ai_1"] += 1

        if hu_cnt == 4:
            counts["human_4"] += 1
        elif hu_cnt == 3 and em_cnt == 1:
            counts["human_3"] += 1
        elif hu_cnt == 2 and em_cnt == 2:
            counts["human_2"] += 1
        elif hu_cnt == 1 and em_cnt == 3:
            counts["human_1"] += 1

    breakdown = {
        "AI 4-in-a-Row": counts["ai_4"] * w["ai_4"],
        "AI 3 + 1 Empty": counts["ai_3"] * w["ai_3"],
        "AI 2 + 2 Empty": counts["ai_2"] * w["ai_2"],
        "AI 1 + 3 Empty": counts["ai_1"] * w["ai_1"],
        "Human 4-in-a-Row": counts["human_4"] * w["human_4"],
        "Human 3 + 1 Empty": counts["human_3"] * w["human_3"],
        "Human 2 + 2 Empty": counts["human_2"] * w["human_2"],
        "Human 1 + 3 Empty": counts["human_1"] * w["human_1"],
    }

    total_score = sum(breakdown.values())
    return float(total_score), breakdown


# ---------------------------------------------------------------------------
# Heuristic 2: Threat & Winning Potential
# ---------------------------------------------------------------------------

def heuristic_threat_potential(
    board: Board,
    mode: str = "classic"
) -> Tuple[float, Dict[str, float]]:
    """
    Evaluates:
    - Immediate winning opportunities: where a 3-in-a-row has its 4th empty cell
      as the NEXT playable cell in that column (can win on the very next drop).
    - Immediate Human winning threats (critical defense).
    - Future threats (empty cell is above playable cell).
    - 3-in-a-row formations.
    - 2-in-a-row formations.
    - Directional formations (horizontal, vertical, diagonal).
    """
    ai_immediate_threats = 0
    human_immediate_threats = 0
    ai_future_threats = 0
    human_future_threats = 0

    ai_3_count = 0
    human_3_count = 0
    ai_2_count = 0
    human_2_count = 0

    windows = get_all_windows(board)

    for coords, vals in windows:
        ai_cnt = vals.count(AI)
        hu_cnt = vals.count(HUMAN)
        em_cnt = vals.count(EMPTY)

        if ai_cnt > 0 and hu_cnt > 0:
            continue

        if ai_cnt == 3 and em_cnt == 1:
            ai_3_count += 1
            # Find the empty cell coordinate
            empty_idx = vals.index(EMPTY)
            er, ec = coords[empty_idx]
            # Check if this empty cell is immediately playable
            next_open = board.get_next_open_row(ec)
            if next_open == er:
                ai_immediate_threats += 1
            elif next_open is not None and next_open < er:
                ai_future_threats += 1

        elif hu_cnt == 3 and em_cnt == 1:
            human_3_count += 1
            empty_idx = vals.index(EMPTY)
            er, ec = coords[empty_idx]
            next_open = board.get_next_open_row(ec)
            if next_open == er:
                human_immediate_threats += 1
            elif next_open is not None and next_open < er:
                human_future_threats += 1

        elif ai_cnt == 2 and em_cnt == 2:
            ai_2_count += 1
        elif hu_cnt == 2 and em_cnt == 2:
            human_2_count += 1

    # Weights tailored for strategic urgency
    score_ai_imm = ai_immediate_threats * 1500.0
    score_hu_imm = human_immediate_threats * -2000.0  # Slightly higher weight to block human wins
    score_ai_fut = ai_future_threats * 120.0
    score_hu_fut = human_future_threats * -150.0
    score_ai_3 = (ai_3_count - ai_immediate_threats - ai_future_threats) * 80.0
    score_hu_3 = (human_3_count - human_immediate_threats - human_future_threats) * -90.0
    score_ai_2 = ai_2_count * 15.0
    score_hu_2 = human_2_count * -18.0

    breakdown = {
        "AI Immediate Threats": score_ai_imm,
        "Human Immediate Threats": score_hu_imm,
        "AI Future Threats": score_ai_fut,
        "Human Future Threats": score_hu_fut,
        "AI 3-in-a-Row Formations": score_ai_3,
        "Human 3-in-a-Row Formations": score_hu_3,
        "AI 2-in-a-Row Formations": score_ai_2,
        "Human 2-in-a-Row Formations": score_hu_2,
    }

    # In assignment mode, include current 4-in-a-row count weight
    if mode == "assignment":
        ai_fours, human_fours = count_all_connect_fours(board)
        breakdown["Current AI Connect 4s"] = ai_fours * 5000.0
        breakdown["Current Human Connect 4s"] = human_fours * -5000.0

    total_score = sum(breakdown.values())
    return float(total_score), breakdown


# ---------------------------------------------------------------------------
# Heuristic 3: Strategic Positioning
# ---------------------------------------------------------------------------

def heuristic_strategic_positioning(
    board: Board,
    mode: str = "classic"
) -> Tuple[float, Dict[str, float]]:
    """
    Evaluates:
    - Center-column control (center column participates in more 4-windows than edge).
    - Proximity to center for all discs.
    - Vertical stacking balance.
    - Fork / Multiple Threat creation (having two winning opportunities simultaneously).
    - Blunder avoidance (giving opponent an immediate win directly above our drop).
    """
    w = board.width
    h = board.height
    center_col = w // 2

    center_score_ai = 0.0
    center_score_hu = 0.0
    proximity_score_ai = 0.0
    proximity_score_hu = 0.0

    # 1. Column weighting based on distance to center
    for r in range(h):
        for c in range(w):
            val = board.grid[r][c]
            if val == EMPTY:
                continue
            dist_to_center = abs(c - center_col)
            # Center bonus: max at center, drops off toward margins
            pos_weight = (w // 2 + 1) - dist_to_center

            if val == AI:
                proximity_score_ai += pos_weight * 8.0
                if c == center_col:
                    center_score_ai += 20.0
            elif val == HUMAN:
                proximity_score_hu += pos_weight * 8.0
                if c == center_col:
                    center_score_hu += 20.0

    # 2. Count threats and check for forks (multiple simultaneous immediate threats)
    windows = get_all_windows(board)
    ai_threat_cols = set()
    hu_threat_cols = set()

    for coords, vals in windows:
        ai_cnt = vals.count(AI)
        hu_cnt = vals.count(HUMAN)
        em_cnt = vals.count(EMPTY)

        if ai_cnt == 3 and em_cnt == 1:
            empty_idx = vals.index(EMPTY)
            er, ec = coords[empty_idx]
            if board.get_next_open_row(ec) == er:
                ai_threat_cols.add(ec)

        elif hu_cnt == 3 and em_cnt == 1:
            empty_idx = vals.index(EMPTY)
            er, ec = coords[empty_idx]
            if board.get_next_open_row(ec) == er:
                hu_threat_cols.add(ec)

    # A fork occurs if a player has 2 or more distinct threat columns
    ai_fork_score = 400.0 if len(ai_threat_cols) >= 2 else (len(ai_threat_cols) * 120.0)
    hu_fork_score = -500.0 if len(hu_threat_cols) >= 2 else (len(hu_threat_cols) * -140.0)

    # 3. Base window connectivity
    ai_open_windows = 0
    hu_open_windows = 0
    for _, vals in windows:
        ai_cnt = vals.count(AI)
        hu_cnt = vals.count(HUMAN)
        if ai_cnt > 0 and hu_cnt == 0:
            ai_open_windows += ai_cnt
        elif hu_cnt > 0 and ai_cnt == 0:
            hu_open_windows += hu_cnt

    window_potential_ai = ai_open_windows * 5.0
    window_potential_hu = hu_open_windows * 5.0

    breakdown = {
        "AI Center Column Control": center_score_ai,
        "Human Center Column Control": -center_score_hu,
        "AI Central Proximity": proximity_score_ai,
        "Human Central Proximity": -proximity_score_hu,
        "AI Fork & Threat Creation": ai_fork_score,
        "Human Fork & Threat Creation": hu_fork_score,
        "AI Window Potential": window_potential_ai,
        "Human Window Potential": -window_potential_hu,
    }

    if mode == "assignment":
        ai_fours, human_fours = count_all_connect_fours(board)
        breakdown["Current AI Formations"] = ai_fours * 5000.0
        breakdown["Current Human Formations"] = human_fours * -5000.0

    total_score = sum(breakdown.values())
    return float(total_score), breakdown


# Heuristic Registry
HEURISTICS = {
    "window_evaluation": {
        "id": "window_evaluation",
        "name": "Connect-Four Window Evaluation",
        "description": "Evaluates every 4-cell window by counting AI vs Human discs with configurable weights.",
        "func": heuristic_window_evaluation
    },
    "threat_potential": {
        "id": "threat_potential",
        "name": "Threat and Winning Potential",
        "description": "Analyzes immediate winning drops, open-ended 3-in-a-row threats, and defense urgency.",
        "func": heuristic_threat_potential
    },
    "strategic_positioning": {
        "id": "strategic_positioning",
        "name": "Strategic Positioning",
        "description": "Evaluates center column dominance, positional proximity, threat forks, and connectivity.",
        "func": heuristic_strategic_positioning
    }
}


def get_heuristic_function(heuristic_id: str):
    """Retrieves the heuristic evaluation function by ID."""
    entry = HEURISTICS.get(heuristic_id)
    if not entry:
        raise ValueError(f"Unknown heuristic '{heuristic_id}'. Available: {list(HEURISTICS.keys())}")
    return entry["func"]
