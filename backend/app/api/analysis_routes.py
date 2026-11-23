"""
Analysis, Comparison, and Benchmarking endpoints.
"""
from fastapi import APIRouter, HTTPException, Response
from app.core.board import Board
from app.core.benchmark import (
    get_benchmark_scenarios,
    compare_algorithms,
    run_benchmark_suite,
    generate_benchmark_csv
)
from app.api.game_routes import GAMES
from app.models.schemas import CompareRequest, BenchmarkRequest, ExportCSVRequest

router = APIRouter(prefix="/api/analysis", tags=["Analysis"])


@router.get("/scenarios")
def list_scenarios():
    scenarios = get_benchmark_scenarios()
    output = []
    for s_id, s_data in scenarios.items():
        output.append({
            "id": s_id,
            "name": s_data["name"],
            "description": s_data["description"],
            "grid": s_data["grid"]
        })
    return output


@router.post("/compare")
def run_comparison(req: CompareRequest):
    """Runs Minimax, Alpha-Beta, and Expectimax against the same board state."""
    if req.game_id:
        game = GAMES.get(req.game_id)
        if not game:
            raise HTTPException(status_code=404, detail=f"Game '{req.game_id}' not found")
        board = game.board
        mode = game.mode.value
    elif req.board_grid:
        board = Board.from_grid(req.board_grid)
        mode = req.game_mode
    else:
        board = Board(width=req.width or 7, height=req.height or 6)
        mode = req.game_mode

    try:
        comparison_data = compare_algorithms(
            board=board,
            depth=req.depth,
            game_mode=mode,
            heuristic_id=req.heuristic
        )
        return comparison_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")


@router.post("/benchmark")
def run_benchmark(req: BenchmarkRequest):
    """Executes benchmark suite across scenarios, algorithms, and depths."""
    try:
        results = run_benchmark_suite(
            scenario_ids=req.scenario_ids,
            algorithm_ids=req.algorithm_ids,
            depths=req.depths,
            game_mode=req.game_mode,
            heuristic_id=req.heuristic
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Benchmark failed: {str(e)}")


@router.post("/export-csv")
def export_csv(req: ExportCSVRequest):
    """Converts benchmark result records into downloadable CSV format."""
    csv_content = generate_benchmark_csv(req.records)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=connect4_benchmark.csv"}
    )
