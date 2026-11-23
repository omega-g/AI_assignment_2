"""
Configuration endpoints providing available options and descriptions to the frontend.
"""
from fastapi import APIRouter
from app.core.heuristics import HEURISTICS

router = APIRouter(prefix="/api/config", tags=["Configuration"])


@router.get("/algorithms")
def get_algorithms():
    return [
        {
            "id": "minimax",
            "name": "Minimax without Alpha-Beta",
            "badge": "Brute-force",
            "description": "Standard deterministic Minimax exploring all legal subtrees without branch pruning.",
            "type": "Deterministic"
        },
        {
            "id": "alpha_beta",
            "name": "Minimax with Alpha-Beta Pruning",
            "badge": "Optimal & Pruned",
            "description": "Prunes provably suboptimal branches where alpha >= beta while preserving the exact optimal minimax score.",
            "type": "Deterministic"
        },
        {
            "id": "expectimax",
            "name": "Expectimax (Probabilistic)",
            "badge": "Chance Nodes",
            "description": "Models disc drop uncertainty (60% chosen col, 20% left, 20% right). AI maximizes expected utility.",
            "type": "Stochastic"
        }
    ]


@router.get("/heuristics")
def get_heuristics():
    return [
        {
            "id": "window_evaluation",
            "name": HEURISTICS["window_evaluation"]["name"],
            "description": HEURISTICS["window_evaluation"]["description"],
            "focus": "Examines all horizontal, vertical, and diagonal 4-disc windows with weighted scores."
        },
        {
            "id": "threat_potential",
            "name": HEURISTICS["threat_potential"]["name"],
            "description": HEURISTICS["threat_potential"]["description"],
            "focus": "Prioritizes immediate winning drops and urgent blocking of opponent 3-in-a-rows."
        },
        {
            "id": "strategic_positioning",
            "name": HEURISTICS["strategic_positioning"]["name"],
            "description": HEURISTICS["strategic_positioning"]["description"],
            "focus": "Emphasizes center-column dominance, board proximity, forks, and threat creation."
        }
    ]


@router.get("/game-modes")
def get_game_modes():
    return [
        {
            "id": "classic",
            "name": "Classic Connect 4",
            "rule": "Early Termination",
            "description": "First player to connect four discs in a row (horizontally, vertically, or diagonally) immediately wins."
        },
        {
            "id": "assignment",
            "name": "Assignment Scoring Mode",
            "rule": "Full Board Play",
            "description": "Game continues until the board is completely full. Each valid 4-disc window counts as 1. Overlapping formations count separately."
        }
    ]
