import unittest
from app.api.config_routes import get_algorithms, get_heuristics, get_game_modes
from app.api.game_routes import create_game, human_move, ai_move, get_game_state, reset_game
from app.api.analysis_routes import list_scenarios, run_comparison, run_benchmark, export_csv
from app.models.schemas import NewGameRequest, MoveRequest, AIMoveRequest, ResetGameRequest, CompareRequest, BenchmarkRequest, ExportCSVRequest
from app.core.board import HUMAN, AI


class TestAPIEndpoints(unittest.TestCase):
    def test_config_endpoints(self):
        algos = get_algorithms()
        self.assertEqual(len(algos), 3)
        algo_ids = [a["id"] for a in algos]
        self.assertIn("minimax", algo_ids)
        self.assertIn("alpha_beta", algo_ids)
        self.assertIn("expectimax", algo_ids)

        heuristics = get_heuristics()
        self.assertEqual(len(heuristics), 3)

        modes = get_game_modes()
        self.assertEqual(len(modes), 2)

    def test_game_lifecycle_api(self):
        # 1. New Game
        req_new = NewGameRequest(
            width=7, height=6, mode="classic",
            algorithm="alpha_beta", heuristic="threat_potential", max_depth=3
        )
        game_dict = create_game(req_new)
        game_id = game_dict["game_id"]
        self.assertIsNotNone(game_id)
        self.assertEqual(game_dict["status"], "ongoing")
        self.assertEqual(game_dict["current_player"], HUMAN)

        # 2. Human Move in column 3
        req_move = MoveRequest(game_id=game_id, column=3)
        move_res = human_move(req_move)
        self.assertEqual(move_res["col"], 3)
        self.assertEqual(move_res["player"], HUMAN)
        self.assertEqual(move_res["current_player"], AI)

        # 3. AI Move
        req_ai = AIMoveRequest(game_id=game_id, console_mode="stats")
        ai_res = ai_move(req_ai)
        self.assertIn(ai_res["ai_move"], range(7))
        self.assertEqual(ai_res["player"], AI)
        self.assertIn("search_result", ai_res)
        self.assertIn("iterations_summary", ai_res["search_result"])
        self.assertIn("selected_tree", ai_res["search_result"])

        # 4. Get State
        state = get_game_state(game_id)
        self.assertEqual(state["game_id"], game_id)
        self.assertEqual(state["move_history_count"], 2)

        # 5. Reset
        reset_res = reset_game(ResetGameRequest(game_id=game_id))
        self.assertEqual(reset_res["status"], "ongoing")
        self.assertEqual(reset_res["current_player"], HUMAN)
        self.assertEqual(reset_res["move_history_count"], 0)

    def test_analysis_endpoints(self):
        scenarios = list_scenarios()
        self.assertGreater(len(scenarios), 3)

        # Comparison
        comp_req = CompareRequest(depth=2, game_mode="classic", heuristic="threat_potential")
        comp_res = run_comparison(comp_req)
        self.assertIn("results", comp_res)
        self.assertIn("minimax", comp_res["results"])
        self.assertIn("alpha_beta", comp_res["results"])
        self.assertIn("expectimax", comp_res["results"])

        # Benchmark
        bm_req = BenchmarkRequest(
            scenario_ids=["empty_board"],
            algorithm_ids=["alpha_beta"],
            depths=[1, 2],
            game_mode="classic",
            heuristic="threat_potential"
        )
        bm_res = run_benchmark(bm_req)
        self.assertEqual(len(bm_res["records"]), 2)

        # CSV Export
        csv_res = export_csv(ExportCSVRequest(records=bm_res["records"]))
        self.assertIn("empty_board", csv_res.body.decode("utf-8"))
        self.assertIn("alpha_beta", csv_res.body.decode("utf-8"))

    def test_search_tree_json_strict_rfc_compliance(self):
        """
        Tests that trees containing infinite bounds (alpha=-inf, beta=+inf)
        serialize cleanly under strict json.dumps(allow_nan=False) as enforced by FastAPI/Starlette.
        """
        import json
        req_new = NewGameRequest(
            width=7, height=6, mode="classic",
            algorithm="alpha_beta", heuristic="threat_potential", max_depth=5
        )
        game_dict = create_game(req_new)
        game_id = game_dict["game_id"]

        # Human drops col 3
        human_move(MoveRequest(game_id=game_id, column=3))

        # AI Move (generates depth 5 alpha-beta tree)
        ai_res = ai_move(AIMoveRequest(game_id=game_id, console_mode="stats"))

        # Must be strictly JSON compliant with allow_nan=False
        serialized_json = json.dumps(ai_res, allow_nan=False)
        self.assertIsInstance(serialized_json, str)
        self.assertNotIn("NaN", serialized_json)
        self.assertNotIn("Infinity", serialized_json)


if __name__ == "__main__":
    unittest.main()
