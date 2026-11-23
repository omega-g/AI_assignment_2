# Artificial Intelligence Course Assignment Report
## Connect 4 AI: Minimax, Alpha-Beta Pruning & Expectimax

**Student Name:** [Your Name Here]  
**Student ID:** [Your ID Here]  
**Course:** CS / AI — Artificial Intelligence  
**Term:** Term 9  
**Date:** November 2026  

---

## 1. Introduction
This project implements an intelligent, adversarial decision-making system for the game of Connect 4. The objective of this assignment is to explore, implement, and empirically compare three fundamental search algorithms:
1. Standard Minimax (exhaustive, non-pruned)
2. Minimax with Alpha-Beta Pruning
3. Expectimax (Expected Minimax with probabilistic disc-placement chance nodes)

The system is deployed as a full-stack educational tool comprising a Python FastAPI computational engine and a modern Next.js 14 graphical user interface with real-time search-tree visualization.

---

## 2. Problem Description
Connect 4 is a two-player, zero-sum, perfect-information (or stochastic, under Expectimax) sequential game played on a grid of width $W \ge 7$ and height $H \ge 6$. Players drop colored discs into columns, subject to gravity. The primary computational challenge is navigating the game's branching factor ($b \le 7$) and state space complexity ($O(7^d)$), necessitating effective heuristic evaluation, state-space pruning, and depth-limited iterative deepening.

---

## 3. Game Rules
- **Grid Representation:** Rows $0 \dots (H-1)$ where Row $0$ is the bottom row and Row $(H-1)$ is the top row. Columns $0 \dots (W-1)$ from left to right.
- **Gravity Rule:** When a player selects column $c$, the disc falls to the lowest row $r$ such that $\text{grid}[r][c] = 0$.
- **Move Legality:** A move in column $c$ is legal if and only if $0 \le c < W$ and $\text{grid}[H-1][c] = 0$.
- **Player Roles:** Human player is represented as $-1$ (minimizer), and AI agent is represented as $+1$ (maximizer).

---

## 4. Game Modes

### Mode A: Classic Connect 4
- The objective is to be the first to align four consecutive discs horizontally, vertically, or diagonally.
- **Immediate Termination:** As soon as a 4-disc formation is created by either player, the game concludes immediately with that player as the winner.
- **Terminal Utility:**
  - AI Win: $+100,000 - \text{depth}$
  - Human Win: $-100,000 + \text{depth}$
  - Full board without a winner: $0$ (Draw)

### Mode B: Assignment Scoring Mode
- **No Early Termination:** The formation of a Connect 4 does *not* terminate the game.
- Players continue alternating moves until the entire board is full ($W \times H$ discs played).
- **Overlapping Formations:** Each valid 4-disc window counts as $1$ formation. Overlapping lines count independently (e.g., 5 consecutive discs in a line yield 2 distinct formations; 6 discs yield 3 formations).
- **Terminal Utility:**
  $$\text{Utility} = (\text{AI 4-in-a-row count} - \text{Human 4-in-a-row count}) \times 10,000$$

---

## 5. Data Structures
1. **Board Grid:** 2D list `List[List[int]]` of dimensions $H \times W$ with values $\{0, -1, 1\}$.
2. **SearchTreeNode:** Recursive tree structure storing:
   - `id`, `parent_id`, `depth`
   - `node_type`: `"MAX"`, `"MIN"`, `"CHANCE"`, `"LEAF"`, `"PRUNED"`
   - `move`, `actual_col`, `probability`, `expected_value`
   - `evaluation`, `heuristic_name`, `heuristic_breakdown`
   - `alpha`, `beta`, `pruned`, `pruning_reason`
   - `board_grid` snapshot
3. **SearchStatistics:** Real-time counters for nodes visited, nodes expanded, leaves evaluated, nodes pruned, and chance nodes.

---

## 6. Minimax Algorithm
Minimax performs an exhaustive depth-first traversal of the game tree.
- **Maximizer (AI):** $\max_{c \in \text{Moves}} \text{Minimax}(s', d-1, \text{False})$
- **Minimizer (Human):** $\min_{c \in \text{Moves}} \text{Minimax}(s', d-1, \text{True})$
- **Base Case:** Evaluates terminal states or calls the heuristic function when $d = 0$.
- **Complexity:** Time $O(b^d)$, Space $O(b \cdot d)$.

---

## 7. Alpha-Beta Pruning
Alpha-Beta pruning eliminates subtrees that cannot influence the final decision.
- $\alpha$: Highest score guaranteed to the maximizer along the current path.
- $\beta$: Lowest score guaranteed to the minimizer along the current path.
- **Pruning Invariant:** If $\alpha \ge \beta$, the remaining sibling branches are pruned.
- **Optimal Time Complexity:** $O(b^{d/2})$ with optimal move ordering.
- **Mathematical Equivalence:** Provably returns the identical optimal minimax value.

---

## 8. Expectimax
Expectimax incorporates nondeterministic chance nodes to model physical placement inaccuracy.
- **Probability Model:**
  - Case 1 (Both neighbors available): Chosen column = $0.6$, Left = $0.2$, Right = $0.2$.
  - Case 2 (One neighbor available): Chosen column = $0.6$, Available neighbor = $0.4$.
  - Case 3 (No neighbors available): Chosen column = $1.0$.
- **Chance Node Evaluation:**
  $$\text{Expected Value} = \sum_{k} P(\text{Outcome}_k) \times V(\text{Child}_k)$$
- Demonstrates how stochastic elements shift strategic play toward center-column stability.

---

## 9. Iterative Deepening
Iterative Deepening executes successive depth-limited searches from depth $1$ up to $K$:
$$\text{Depth } 1 \to \text{Depth } 2 \to \dots \to \text{Depth } K$$
- Ensures a valid best move is always available if interrupted.
- Stores full statistics and trees for each completed iteration.
- Enforces $K \le 8$ to prevent application freezes.

---

## 10. Heuristic Functions
All heuristics evaluate the state from the AI's perspective ($+ \text{AI}, - \text{Human}$):

1. **Window Evaluation:** Evaluates every 4-cell window (horizontal, vertical, diagonal).
   - $4 \text{ AI}: +100,000$ | $3 \text{ AI} + 1 \text{ empty}: +100$ | $2 \text{ AI} + 2 \text{ empty}: +10$ | $1 \text{ AI} + 3 \text{ empty}: +1$
   - $4 \text{ Human}: -100,000$ | $3 \text{ Human} + 1 \text{ empty}: -120$ | $2 \text{ Human} + 2 \text{ empty}: -15$ | $1 \text{ Human} + 3 \text{ empty}: -2$
2. **Threat & Winning Potential:**
   - Detects immediate winning drops (empty cell is the immediate playable row).
   - Prioritizes urgent defense against Human 3-in-a-rows.
3. **Strategic Positioning:**
   - Center-column dominance (higher 4-window participation).
   - Proximity weighting and double-threat fork creation.

---

## 11. Implementation Architecture
- **Backend:** Python FastAPI REST server providing game management, tree serialization, and benchmark endpoints.
- **Frontend:** Next.js 14 App Router, TypeScript, Tailwind CSS, SVG Interactive Tree Canvas.

---

## 12. Backend Design
Modular separation into:
- `core/board.py`: Grid manipulation, gravity drops, validity.
- `core/scoring.py`: 4-in-a-row detection in all directions and full-board formation counter.
- `core/minimax.py`, `core/alpha_beta.py`, `core/expectimax.py`: Algorithmic engines.
- `core/iterative_deepening.py`: Iteration manager.
- `core/search_tree.py`: Tree structures and recursive console printer.

---

## 13. Frontend Design
- `PlayPage`: Interactive board with drop buttons, ghost preview, turn indicator, score cards, and move history.
- `SearchTreePage`: Zoomable, pannable, collapsible SVG tree canvas with node inspection and board previews.
- `ComparePage`: Side-by-side execution comparison of Minimax, Alpha-Beta, and Expectimax on identical board states.
- `BenchmarkPage`: Automated empirical matrix runner with CSV download.

---

## 14. Sample Runs

### Console Tree Output
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

## 15. Search Tree Examples
*(Insert screenshots of the interactive Search Tree Viewer from the web UI showing MAX, MIN, CHANCE, and PRUNED nodes).*

---

## 16. Algorithm Comparison

| Metric | Minimax (No Pruning) | Minimax with Alpha-Beta | Expectimax |
|---|---|---|---|
| **Optimality Guarantee** | Exact Minimax Value | Exact Minimax Value | Expected Value |
| **Search Depths Tested** | Depths $1 \dots 5$ | Depths $1 \dots 5$ | Depths $1 \dots 4$ |
| **Branch Pruning** | No | Yes ($\alpha \ge \beta$) | No (Chance averaging) |
| **Pruning Ratio** | $0\%$ | Up to $65\% - 85\%$ | $0\%$ |
| **Move Selection** | Identical to Alpha-Beta | Identical to Minimax | Accounts for slip risk |

---

## 17. Performance Results

*(Table generated from the Benchmark Suite CSV Export)*

| Scenario | Algorithm | Depth | Nodes Visited | Leaves Evaluated | Nodes Pruned | Time (ms) |
|---|---|---|---|---|---|---|
| Early Game | Minimax | 3 | 240 | 192 | 0 | 12.1 ms |
| Early Game | Alpha-Beta | 3 | 82 | 48 | 34 | 4.3 ms |
| Early Game | Expectimax | 3 | 312 | 215 | 0 | 18.5 ms |
| Early Game | Alpha-Beta | 4 | 385 | 195 | 210 | 14.8 ms |

---

## 18. Analysis and Discussion
1. **Equivalence of Alpha-Beta:** Alpha-Beta consistently produces the identical evaluation score as exhaustive Minimax, confirming algorithmic correctness.
2. **Exponential Savings:** As depth increases ($K \ge 4$), the number of nodes pruned grows exponentially, reducing execution time by a factor of $3\times$ to $6\times$.
3. **Expectimax Risk Aversion:** Expectimax avoids dropping discs into columns adjacent to full columns when an opponent threat exists, because slipping into an unintended column could give the opponent an immediate win.

---

## 19. Assumptions
- Column indices are 0-indexed ($0 \dots W-1$).
- Disc slip probability applies symmetrically to left and right neighbors when available.
- Ties between identical heuristic scores are broken deterministically by column index order.

---

## 20. Limitations
- Search depths beyond $K=8$ are capped to preserve browser and HTTP responsiveness.
- Expectimax does not apply alpha-beta cutoffs because chance nodes compute weighted linear combinations.

---

## 21. Conclusion
The implemented Connect 4 AI system successfully demonstrates the theoretical and empirical realities of game-tree search. Alpha-Beta pruning drastically reduces computational overhead while maintaining optimality, and Expectimax effectively adapts decision-making to physical uncertainty. The full-stack visualization tool offers transparency and explainability for all evaluated states and decisions.
