"""
Pydantic schemas for Connect 4 REST API.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class NewGameRequest(BaseModel):
    width: int = Field(default=7, ge=7, le=10, description="Board width (min 7)")
    height: int = Field(default=6, ge=6, le=10, description="Board height (min 6)")
    mode: str = Field(default="classic", description="'classic' or 'assignment'")
    algorithm: str = Field(default="alpha_beta", description="'minimax', 'alpha_beta', or 'expectimax'")
    heuristic: str = Field(default="threat_potential", description="'window_evaluation', 'threat_potential', or 'strategic_positioning'")
    max_depth: int = Field(default=5, ge=1, le=8, description="Maximum Search Depth K (1-8)")


class MoveRequest(BaseModel):
    game_id: str
    column: int = Field(ge=0, description="Column index to drop disc")


class AIMoveRequest(BaseModel):
    game_id: str
    console_mode: str = Field(default="full", description="'full', 'compact', or 'stats'")


class ResetGameRequest(BaseModel):
    game_id: str


class CompareRequest(BaseModel):
    game_id: Optional[str] = None
    board_grid: Optional[List[List[int]]] = None
    width: Optional[int] = 7
    height: Optional[int] = 6
    depth: int = Field(default=4, ge=1, le=6)
    game_mode: str = Field(default="classic")
    heuristic: str = Field(default="threat_potential")


class BenchmarkRequest(BaseModel):
    scenario_ids: List[str] = Field(default=["empty_board", "early_game", "ai_threat", "human_threat"])
    algorithm_ids: List[str] = Field(default=["minimax", "alpha_beta", "expectimax"])
    depths: List[int] = Field(default=[1, 2, 3, 4])
    game_mode: str = Field(default="classic")
    heuristic: str = Field(default="threat_potential")


class ExportCSVRequest(BaseModel):
    records: List[Dict[str, Any]]
