"""
Game management endpoints for Connect 4 sessions.
"""
from typing import Dict, Optional, Any
from fastapi import APIRouter, HTTPException
from app.core.board import HUMAN, AI
from app.core.game import Game, GameMode, GameStatus
from app.core.iterative_deepening import iterative_deepening_search
from app.models.schemas import NewGameRequest, MoveRequest, AIMoveRequest, ResetGameRequest

router = APIRouter(prefix="/api/game", tags=["Game"])

# In-memory session store
GAMES: Dict[str, Game] = {}
GLOBAL_LATEST_SEARCH: Optional[Dict[str, Any]] = None
GAME_LATEST_SEARCHES: Dict[str, Any] = {}


@router.post("/new")
def create_game(req: NewGameRequest):
    mode_enum = GameMode.ASSIGNMENT if req.mode == "assignment" else GameMode.CLASSIC
    game = Game(
        width=req.width,
        height=req.height,
        mode=mode_enum,
        algorithm=req.algorithm,
        heuristic=req.heuristic,
        max_depth=req.max_depth
    )
    GAMES[game.game_id] = game
    return game.to_dict()


@router.get("/state/{game_id}")
def get_game_state(game_id: str):
    game = GAMES.get(game_id)
    if not game:
        raise HTTPException(status_code=404, detail=f"Game '{game_id}' not found")
    return game.to_dict()


@router.post("/move")
def human_move(req: MoveRequest):
    game = GAMES.get(req.game_id)
    if not game:
        raise HTTPException(status_code=404, detail=f"Game '{req.game_id}' not found")

    if game.status != GameStatus.ONGOING:
        raise HTTPException(status_code=400, detail=f"Game is over with status: {game.status.value}")

    if game.current_player != HUMAN:
        raise HTTPException(status_code=400, detail="It is not Human's turn")

    try:
        result = game.make_move(col=req.column, expected_player=HUMAN)
        result["game_id"] = game.game_id
        result["current_player"] = game.current_player
        result["move_history_count"] = len(game.move_history)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/ai-move")
def ai_move(req: AIMoveRequest):
    game = GAMES.get(req.game_id)
    if not game:
        raise HTTPException(status_code=404, detail=f"Game '{req.game_id}' not found")

    if game.status != GameStatus.ONGOING:
        raise HTTPException(status_code=400, detail=f"Game is over with status: {game.status.value}")

    if game.current_player != AI:
        raise HTTPException(status_code=400, detail="It is not AI's turn")

    # Run actual iterative deepening AI search
    try:
        search_res = iterative_deepening_search(
            board=game.board,
            algorithm=game.algorithm,
            max_k=game.max_depth,
            game_mode=game.mode.value,
            heuristic_id=game.heuristic,
            print_console=True,
            console_mode=req.console_mode
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Search error: {str(e)}")

    best_move = search_res["best_move"]
    if best_move is None or not game.board.is_valid_move(best_move):
        # Fallback to any valid move if search returned None
        valid_moves = game.board.get_valid_moves()
        if not valid_moves:
            raise HTTPException(status_code=400, detail="Board has no valid moves remaining")
        best_move = valid_moves[0]

    # Execute move on board
    ai_meta = {
        "ai_algorithm": game.algorithm,
        "ai_heuristic": game.heuristic,
        "evaluation": search_res["evaluation"],
        "actual_depth": search_res["actual_depth"],
        "execution_time_ms": search_res["execution_time_ms"],
        "nodes_visited": search_res["nodes_visited"]
    }
    move_res = game.make_move(col=best_move, expected_player=AI, ai_metadata=ai_meta)

    # Cache latest search result for retrieval without browser storage limits
    global GLOBAL_LATEST_SEARCH
    GLOBAL_LATEST_SEARCH = search_res
    GAME_LATEST_SEARCHES[game.game_id] = search_res

    return {
        "game_id": game.game_id,
        "ai_move": best_move,
        "row": move_res["row"],
        "col": move_res["col"],
        "player": AI,
        "status": game.status.value,
        "winner": game.winner,
        "ai_score": game.ai_score,
        "human_score": game.human_score,
        "current_player": game.current_player,
        "board": game.board.to_dict(),
        "winning_segments": move_res["winning_segments"],
        "search_result": search_res,
        "move_history_count": len(game.move_history)
    }


@router.get("/latest-search")
def get_global_latest_search():
    if not GLOBAL_LATEST_SEARCH:
        raise HTTPException(status_code=404, detail="No AI search has been executed yet")
    return GLOBAL_LATEST_SEARCH


@router.get("/latest-search/{game_id}")
def get_game_latest_search(game_id: str):
    search = GAME_LATEST_SEARCHES.get(game_id) or GLOBAL_LATEST_SEARCH
    if not search:
        raise HTTPException(status_code=404, detail=f"No AI search found for game '{game_id}'")
    return search


@router.post("/reset")
def reset_game(req: ResetGameRequest):
    game = GAMES.get(req.game_id)
    if not game:
        raise HTTPException(status_code=404, detail=f"Game '{req.game_id}' not found")
    game.reset()
    return game.to_dict()


@router.get("/history/{game_id}")
def get_game_history(game_id: str):
    game = GAMES.get(game_id)
    if not game:
        raise HTTPException(status_code=404, detail=f"Game '{game_id}' not found")
    return {
        "game_id": game_id,
        "history": game.move_history
    }
