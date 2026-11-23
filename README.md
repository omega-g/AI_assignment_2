# Connect 4 AI — Minimax, Alpha-Beta Pruning & Expectimax Studio

A university-grade Artificial Intelligence Connect 4 application featuring genuine implementations of **Minimax without Pruning**, **Minimax with Alpha-Beta Pruning**, and **Expectimax (Expected Minimax)**, complete with interactive search tree visualization, console execution logging, multi-scenario algorithm comparison, and an empirical benchmarking engine.

---

## 1. Project Overview

This project was built for a university Artificial Intelligence course assignment to demonstrate the theoretical correctness, explainability, and empirical performance differences among adversarial search algorithms.

Key highlights:
- **No Hardcoding or Fake Trees**: All decisions derive from actual recursive search on real board states.
- **Three Core Algorithms**: Standard Minimax, Minimax with Alpha-Beta Pruning, and Expectimax with Chance nodes.
- **Two Selectable Game Modes**: Classic Connect 4 (early termination) and Assignment Scoring Mode (full-board play with overlapping formation scoring).
- **Iterative Deepening**: Progressive searches from depth 1 up to $K$, reporting telemetry per completed iteration and preserving trees for inspection.
- **Search Tree Visualization**: Interactive canvas supporting zooming, panning, branch collapse/expansion, node selection, mini-board state snapshots, alpha/beta bounds, and mathematical heuristic score breakdowns.
- **Console Tree Logging**: Mandatory recursive ASCII tree printer in backend terminal traces every AI search move.
- **Empirical Benchmarking**: Matrix evaluation across reproducible board scenarios with one-click CSV export.

---

## 2. Technology Stack

- **Backend**:
  - Python 3.12+ / 3.14
  - FastAPI & Pydantic v2
  - Uvicorn ASGI Server
  - Python `unittest` test suite
- **Frontend**:
  - Next.js 14 (App Router)
  - TypeScript & React 18
  - Tailwind CSS
  - Lucide React Icons
- **Communication**:
  - RESTful JSON API on `http://127.0.0.1:8000`

---

## 3. Directory Architecture

```text
connect4-ai/
│
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI entry point & CORS
│   │   ├── api/
│   │   │   ├── game_routes.py       # Session, moves, AI trigger, reset
│   │   │   ├── analysis_routes.py   # Comparison & benchmark matrix
│   │   │   └── config_routes.py     # Algorithms, heuristics, modes metadata
│   │   │
│   │   ├── core/
│   │   │   ├── board.py             # Board grid, gravity, validation
│   │   │   ├── scoring.py           # Connect 4 detection & overlapping window counter
│   │   │   ├── game.py              # Classic & Assignment game state orchestrator
│   │   │   ├── heuristics.py        # 3 heuristic evaluation functions + breakdowns
│   │   │   ├── minimax.py           # Standard exhaustive Minimax
│   │   │   ├── alpha_beta.py        # Alpha-Beta pruning with cut tracking
│   │   │   ├── expectimax.py        # Expectimax with Chance nodes & probabilities
│   │   │   ├── iterative_deepening.py # 1..K search loop & tree collection
│   │   │   ├── search_tree.py       # SearchTreeNode & Console Tree Printer
│   │   │   └── benchmark.py         # Reproducible scenarios & CSV generator
│   │   │
│   │   ├── models/
│   │   │   └── schemas.py           # Pydantic request/response models
│   │   │
│   │   └── tests/
│   │       ├── test_board.py        # Gravity, dimensions, clone tests
│   │       ├── test_scoring.py      # Horizontal, vertical, diagonal, overlapping tests
│   │       ├── test_game.py         # Classic termination vs Assignment continuation
│   │       ├── test_algorithms.py   # Equivalence, pruning, probabilities, ID limits
│   │       ├── test_heuristics.py   # Breakdown sums, advantage signs
│   │       └── test_api_endpoints.py# REST endpoint verification
│   │
│   ├── requirements.txt
│   └── README.md
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx               # Root layout & theme
│   │   ├── page.tsx                 # Default redirect to /play
│   │   ├── play/page.tsx            # Arena: Board, setup, turn status, history
│   │   ├── tree/page.tsx            # Dedicated tree inspector & generator
│   │   ├── compare/page.tsx         # Algorithm side-by-side comparison bench
│   │   └── benchmark/page.tsx       # Empirical benchmark runner & CSV export
│   │
│   ├── components/
│   │   ├── Navbar.tsx               # Header navigation & backend status
│   │   ├── Connect4Board.tsx        # Interactive board with ghost drops & animations
│   │   ├── GameSetup.tsx            # Mode, algorithm, heuristic & depth controls
│   │   ├── GameStatus.tsx           # Scores, turn badges, AI telemetry
│   │   ├── GameHistory.tsx          # Historical move log with board snapshot popover
│   │   ├── SearchTreeViewer.tsx     # Zoomable, pannable, collapsible SVG tree canvas
│   │   ├── BoardPreview.tsx         # Miniature board snapshot component
│   │   ├── PerformanceDashboard.tsx # Comparative bar charts & metrics
│   │   └── BenchmarkDashboard.tsx   # Matrix runner, data table & CSV download
│   │
│   ├── lib/
│   │   └── api.ts                   # Typed API client
│   └── types/
│       └── index.ts                 # Shared TypeScript interfaces
│
├── run_backend.bat                  # Starts FastAPI server
├── run_frontend.bat                 # Starts Next.js server
├── run_all.bat                      # Starts both servers simultaneously
├── run_tests.bat                    # Runs 28 automated tests
└── README.md
```

---

## 4. Quick Start & Installation

### Prerequisites
- Python 3.12+ installed
- Node.js 18+ and npm installed

### 1-Click Startup (Windows)
Double-click:
```bash
run_all.bat
```
This opens two terminal windows:
- Backend running on `http://127.0.0.1:8000` (Swagger docs at `/docs`)
- Frontend running on `http://localhost:3000`

### Manual Startup

#### Backend
```bash
# In project root:
run_backend.bat
# Or manually:
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Running Tests
```bash
run_tests.bat
```
Output:
```text
Ran 28 tests in 0.124s
OK
```

---

## 5. Game Rules & Modes

### Player Representation
- `EMPTY = 0` (Neutral slot)
- `HUMAN = -1` (Yellow / Amber discs)
- `AI = 1` (Blue / Cyan discs, MAX player)

### Mode A: Classic Connect 4
1. Standard Connect 4 rules.
2. Players take turns dropping discs into columns; gravity pulls discs to the lowest open row.
3. As soon as a player connects 4 discs in a line (horizontal, vertical, diagonal-up, or diagonal-down), **the game terminates immediately**.
4. Full board with no 4-in-a-row results in a Draw.
5. In AI search: terminal utility is $\text{WIN\_SCORE} - \text{depth}$ for AI (encouraging fastest win) and $-\text{WIN\_SCORE} + \text{depth}$ for Human (encouraging longest defense).

### Mode B: Assignment Scoring Mode
1. **The game does NOT terminate when a player connects four!**
2. Play continues turn-by-turn until the board is completely full.
3. When the board is full, the total number of Connect Four formations is counted across the entire board for both players.
4. **Overlapping formations count separately!**
   - 4 consecutive discs = 1 formation
   - 5 consecutive discs = 2 formations (e.g. indices 0..3 and 1..4)
   - 6 consecutive discs = 3 formations
   - 7 consecutive discs = 4 formations
5. The player with the higher formation score wins. Draw if scores are equal.

---

## 6. AI Algorithms

### 1. Minimax without Alpha-Beta Pruning
- AI turns are MAX nodes; Human turns are MIN nodes.
- Exhaustively evaluates all legal moves down to depth limit $K$ or terminal states.
- Accurately tracks `nodes_visited`, `nodes_expanded`, `leaves_evaluated`, and constructs the full search tree.

### 2. Minimax with Alpha-Beta Pruning
- Maximizer maintains $\alpha$ (highest value guaranteed to MAX so far).
- Minimizer maintains $\beta$ (lowest value guaranteed to MIN so far).
- Pruning condition: Whenever $\alpha \ge \beta$, search in the remaining sibling branches is aborted.
- Inserts explicit `PRUNED` indicator nodes into the tree record with the exact condition (e.g. `Alpha (120) >= Beta (85)`).
- **Mathematical Guarantee**: Produces the **exact same optimal score** as Minimax on identical states while searching substantially fewer nodes.

### 3. Expectimax (Expected Minimax)
- Models physical uncertainty in disc dropping:
  - **MAX nodes**: AI chooses the intended column $c$ that maximizes expected utility.
  - **MIN nodes**: Human chooses the intended column $c$ that minimizes expected AI utility.
  - **CHANCE nodes**: For each chosen column $c$, a chance node branches into actual drop locations with probabilities:
    $$\text{Expected Value} = \sum (\text{Probability} \times \text{Child Value})$$
- **Probabilistic Drop Model**:
  - **Case 1 (Both neighbors available)**:
    - Chosen column $c$: $0.6$ ($60\%$)
    - Left column $c - 1$: $0.2$ ($20\%$)
    - Right column $c + 1$: $0.2$ ($20\%$)
  - **Case 2 (Only one neighbor available)**:
    - Chosen column $c$: $0.6$ ($60\%$)
    - Available neighbor: $0.4$ ($40\%$)
  - **Case 3 (Neither neighbor available)**:
    - Chosen column $c$: $1.0$ ($100\%$)
  - Neighbor unavailable if outside board ($c-1 < 0$ or $c+1 \ge \text{width}$) or column is full.

---

## 7. Iterative Deepening

- Maximum configured depth $K$ ($1 \le K \le 8$).
- Loops iteratively from depth $d = 1$ to $K$:
  $$\text{Depth } 1 \longrightarrow \text{Depth } 2 \longrightarrow \dots \longrightarrow \text{Depth } K$$
- Each iteration records:
  - Depth $d$
  - Best move selected
  - Evaluation score
  - Nodes visited, expanded, evaluated, pruned
  - Search tree corresponding to that exact iteration
  - Execution time in milliseconds
- The system returns the result of the deepest completed iteration.
- The user can inspect the search tree of any completed iteration on the Search Tree page.

---

## 8. Heuristic Functions

### Heuristic 1: Connect-Four Window Evaluation
Scans every 4-cell window across the board.
- AI 4: $+100,000$
- AI 3 + 1 empty: $+100$
- AI 2 + 2 empty: $+10$
- AI 1 + 3 empty: $+1$
- Human 4: $-100,000$
- Human 3 + 1 empty: $-120$
- Human 2 + 2 empty: $-15$
- Human 1 + 3 empty: $-2$
- Mixed AI & Human: $0$

### Heuristic 2: Threat & Winning Potential
Evaluates tactical opportunities:
- Immediate AI winning drops (3-in-a-row where 4th cell is next playable row): $+1,500$
- Immediate Human winning threats (urgent defense needed): $-2,000$
- Future threats (empty cell is above playable row): $+120$ AI / $-150$ Human
- 3-in-a-row formations: $+80$ AI / $-90$ Human
- 2-in-a-row formations: $+15$ AI / $-18$ Human

### Heuristic 3: Strategic Positioning
Focuses on board structure and positional dominance:
- Center-column dominance (center col participates in up to 4x more 4-windows): $+20$ per disc
- Proximity weighting toward center: $+8$ per column distance tier
- Double-threat forks (creating two simultaneous winning threats): $+400$ AI / $-500$ Human
- Open window potential

---

## 9. Mandatory Console Tree Printing

On every AI search move, the backend terminal prints the actual recursive search tree with indentations and summary metrics:

```text
================================================================
AI SEARCH EXECUTION TRACE
Algorithm:       alpha_beta
Game Mode:       classic
Maximum Depth:   3
Actual Depth:    3
Heuristic:       Threat and Winning Potential
================================================================
ROOT [MAX] (Score: 20.0, α=20.0 β=inf)
|-- Col 1 -> [MIN] (Score: 20.0, α=20.0 β=inf)
|   |-- Col 1 -> [MAX] (Score: 20.0, α=20.0 β=inf)
|   |   |-- Col 1 -> LEAF (Score: 20.0)
|   |   |-- Col 2 -> LEAF (Score: 35.0)
|   |   \-- Col 3 -> LEAF (Score: 10.0)
|   \-- Col 2 -> [MAX] (Score: 40.0, α=20.0 β=40.0)
|       |-- PRUNED: Alpha (20.0) >= Beta (40.0)
================================================================
SEARCH RESULT SUMMARY
Best Move:        Column 4
Evaluation:       20.0
Nodes Visited:    155
Nodes Expanded:   31
Leaves Evaluated: 124
Nodes Pruned:     63
Execution Time:   6.23 ms
================================================================
```

---

## 10. REST API Specification

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/game/new` | Create game session with width, height, mode, algorithm, heuristic, $K$ |
| `POST` | `/api/game/move` | Make human move in column; checks win/draw/scores |
| `POST` | `/api/game/ai-move` | Triggers iterative deepening AI search, updates board, returns tree & telemetry |
| `GET` | `/api/game/state/{id}` | Returns current game state and winning segments |
| `POST` | `/api/game/reset` | Resets game with same configuration |
| `GET` | `/api/game/history/{id}` | Returns move history log with board snapshots |
| `GET` | `/api/config/algorithms` | List available algorithms with metadata |
| `GET` | `/api/config/heuristics` | List available heuristics with descriptions |
| `GET` | `/api/config/game-modes` | List available game modes and rules |
| `GET` | `/api/analysis/scenarios` | Predefined reproducible board benchmark scenarios |
| `POST` | `/api/analysis/compare` | Compares Minimax, Alpha-Beta, Expectimax side-by-side |
| `POST` | `/api/analysis/benchmark` | Runs benchmark matrix across scenarios $\times$ algorithms $\times$ depths |
| `POST` | `/api/analysis/export-csv` | Generates downloadable `.csv` spreadsheet file |

---

## 11. Known Limitations & Design Notes

1. **Maximum Search Depth ($K$)**: To prevent browser/thread timeouts during live gameplay, $K$ is limited to $8$ ($K=5$ recommended for instant response).
2. **Expectimax Pruning**: Standard Alpha-Beta pruning cannot be directly applied to Expectimax chance nodes because chance values are weighted averages rather than $\max/\min$ bounds.
3. **Tree Serialization Capping**: To protect browser memory from rendering millions of nodes when $K \ge 6$, tree visualization sends up to $6$ plies per iteration while all statistics (nodes visited, expanded, pruned) remain exact.
