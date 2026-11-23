# Connect 4 AI — FastAPI Backend

Modular, high-performance Python backend powering AI algorithms, game rules, heuristic evaluations, search tree generation, and benchmarking for Connect 4.

## Core Capabilities

1. **Algorithms**:
   - `minimax.py`: Standard deterministic Minimax (MAX = AI, MIN = Human).
   - `alpha_beta.py`: Minimax with Alpha-Beta Pruning, pruning suboptimal subtrees where $\alpha \ge \beta$.
   - `expectimax.py`: Expectimax with Chance nodes modeling physical disc drop probabilities.
2. **Game Modes**:
   - `Classic`: Immediate termination on 4-in-a-row.
   - `Assignment Scoring Mode`: Game continues until board is full; counts total overlapping 4-disc windows.
3. **Heuristics**:
   - `heuristic_window_evaluation`: Weighted score of all 4-cell lines.
   - `heuristic_threat_potential`: Prioritizes immediate winning drops and threat blocking.
   - `heuristic_strategic_positioning`: Centers control, positional proximity, and threat forks.
4. **Console Tree Printing**:
   - Formatted recursive ASCII tree printed directly to backend terminal on every AI move.
5. **Testing**:
   - Comprehensive test suite in `backend/app/tests/` covering rules, scoring, algorithms, and endpoints.

## Running Tests

```bash
run_tests.bat
```
or via command line:
```bash
python -m unittest discover -s backend/app/tests -v
```
