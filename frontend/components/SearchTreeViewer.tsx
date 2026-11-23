"use client";

import React, { useState, useMemo, useRef } from "react";
import { SearchTreeNodeData, IterationSummary } from "@/types";
import { BoardPreview } from "@/components/BoardPreview";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Scissors,
  Layers,
  Sparkles
} from "lucide-react";

interface SearchTreeViewerProps {
  iterationsSummary: IterationSummary[];
  iterationsTrees: Record<string, SearchTreeNodeData>;
  initialDepth?: number;
}

interface LayoutNode {
  data: SearchTreeNodeData;
  x: number;
  y: number;
  width: number;
  height: number;
  children: LayoutNode[];
}

export function SearchTreeViewer({
  iterationsSummary,
  iterationsTrees,
  initialDepth,
}: SearchTreeViewerProps) {
  const [selectedDepth, setSelectedDepth] = useState<number>(
    initialDepth || (iterationsSummary.length > 0 ? iterationsSummary[iterationsSummary.length - 1].depth : 1)
  );

  const [selectedNode, setSelectedNode] = useState<SearchTreeNodeData | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  // Zoom & Pan state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 400, y: 60 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const activeTreeRoot = iterationsTrees[String(selectedDepth)];

  // Toggle node branch collapse
  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Build recursive tree layout coordinates
  const { layoutTree } = useMemo(() => {
    if (!activeTreeRoot) return { layoutTree: null, totalNodesCount: 0 };

    let count = 0;
    const NODE_WIDTH = 110;
    const NODE_HEIGHT = 60;
    const HORIZONTAL_GAP = 24;
    const VERTICAL_GAP = 90;

    function buildLayout(node: SearchTreeNodeData, depth: number): LayoutNode {
      count++;
      const isCollapsed = collapsedIds.has(node.id);
      const childLayouts: LayoutNode[] = [];

      if (!isCollapsed && node.children && node.children.length > 0) {
        node.children.forEach((c) => {
          childLayouts.push(buildLayout(c, depth + 1));
        });
      }

      return {
        data: node,
        x: 0,
        y: depth * (NODE_HEIGHT + VERTICAL_GAP),
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        children: childLayouts,
      };
    }

    // Two-pass positioning
    function positionSubtree(node: LayoutNode, leftOffset: number): number {
      if (node.children.length === 0) {
        node.x = leftOffset + node.width / 2;
        return leftOffset + node.width + HORIZONTAL_GAP;
      }

      let currentLeft = leftOffset;
      node.children.forEach((child) => {
        currentLeft = positionSubtree(child, currentLeft);
      });

      const firstChild = node.children[0];
      const lastChild = node.children[node.children.length - 1];
      node.x = (firstChild.x + lastChild.x) / 2;

      return Math.max(currentLeft, node.x + node.width / 2 + HORIZONTAL_GAP);
    }

    const rootLayout = buildLayout(activeTreeRoot, 0);
    positionSubtree(rootLayout, 0);

    return { layoutTree: rootLayout, totalNodesCount: count };
  }, [activeTreeRoot, collapsedIds]);

  // Handle Drag / Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Flatten layout nodes and edge links for rendering
  const { renderedNodes, renderedEdges } = useMemo(() => {
    const nodes: LayoutNode[] = [];
    const edges: { x1: number; y1: number; x2: number; y2: number; id: string; isPruned: boolean }[] = [];

    function traverse(node: LayoutNode) {
      nodes.push(node);
      node.children.forEach((c) => {
        edges.push({
          x1: node.x,
          y1: node.y + node.height,
          x2: c.x,
          y2: c.y,
          id: `${node.data.id}-${c.data.id}`,
          isPruned: c.data.node_type === "PRUNED" || c.data.pruned,
        });
        traverse(c);
      });
    }

    if (layoutTree) traverse(layoutTree);
    return { renderedNodes: nodes, renderedEdges: edges };
  }, [layoutTree]);

  if (!activeTreeRoot) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-500">
        <Layers className="w-8 h-8 mx-auto mb-2 opacity-40 text-cyan-400" />
        <p>No search tree data available for this move.</p>
      </div>
    );
  }

  const activeIterationInfo = iterationsSummary.find((s) => s.depth === selectedDepth);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[750px] relative">
      {/* Top Bar: Iteration Tabs & Controls */}
      <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-10">
        {/* Iteration Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Iteration:</span>
          </span>
          {iterationsSummary.map((summary) => (
            <button
              key={`iter-${summary.depth}`}
              onClick={() => {
                setSelectedDepth(summary.depth);
                setSelectedNode(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                selectedDepth === summary.depth
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
              }`}
            >
              <span>Depth {summary.depth}</span>
              <span className="text-[10px] opacity-75 font-normal">
                ({summary.nodes_visited} nodes)
              </span>
            </button>
          ))}
        </div>

        {/* Viewport Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-slate-400">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.15, 2.5))}
            className="p-1.5 hover:text-white rounded hover:bg-slate-800"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-mono px-1 text-slate-300">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.15, 0.3))}
            className="p-1.5 hover:text-white rounded hover:bg-slate-800"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 400, y: 60 });
            }}
            className="p-1.5 hover:text-white rounded hover:bg-slate-800"
            title="Reset View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* SVG Tree Viewport */}
        <div
          className="flex-1 h-full cursor-grab active:cursor-grabbing bg-radial-grid select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg className="w-full h-full">
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Edges */}
              {renderedEdges.map((edge) => (
                <path
                  key={edge.id}
                  d={`M ${edge.x1} ${edge.y1} C ${edge.x1} ${(edge.y1 + edge.y2) / 2}, ${edge.x2} ${(edge.y1 + edge.y2) / 2}, ${edge.x2} ${edge.y2}`}
                  fill="none"
                  stroke={edge.isPruned ? "#ef4444" : "#475569"}
                  strokeWidth={edge.isPruned ? 2 : 1.5}
                  strokeDasharray={edge.isPruned ? "4 4" : undefined}
                  className="transition-colors duration-150"
                />
              ))}

              {/* Nodes */}
              {renderedNodes.map((n) => {
                const node = n.data;
                const isSelected = selectedNode?.id === node.id;
                const isCollapsed = collapsedIds.has(node.id);
                const hasChildren = node.children && node.children.length > 0;

                // Node coloring by type
                const bgFill = "#0f172a";
                let strokeColor = "#334155";
                let badgeText = "#94a3b8";

                if (node.node_type === "MAX") {
                  strokeColor = isSelected ? "#06b6d4" : "#0284c7";
                  badgeText = "#38bdf8";
                } else if (node.node_type === "MIN") {
                  strokeColor = isSelected ? "#f59e0b" : "#d97706";
                  badgeText = "#fbbf24";
                } else if (node.node_type === "CHANCE") {
                  strokeColor = isSelected ? "#10b981" : "#059669";
                  badgeText = "#34d399";
                } else if (node.node_type === "PRUNED") {
                  strokeColor = "#ef4444";
                  badgeText = "#f87171";
                } else if (node.node_type === "LEAF") {
                  strokeColor = node.evaluation && node.evaluation >= 0 ? "#10b981" : "#f43f5e";
                  badgeText = "#94a3b8";
                }

                return (
                  <g
                    key={node.id}
                    transform={`translate(${n.x - n.width / 2}, ${n.y})`}
                    className="cursor-pointer group"
                    onClick={() => setSelectedNode(node)}
                  >
                    {/* Node Rectangle */}
                    <rect
                      width={n.width}
                      height={n.height}
                      rx={10}
                      fill={bgFill}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      strokeDasharray={node.node_type === "PRUNED" ? "4 4" : undefined}
                      className="transition-all hover:stroke-cyan-400 filter drop-shadow-md"
                    />

                    {/* Node Header Label */}
                    <text
                      x={8}
                      y={18}
                      fill={badgeText}
                      fontSize={10}
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {node.node_type}
                    </text>

                    {/* Move / Slip Text */}
                    <text
                      x={8}
                      y={34}
                      fill="#e2e8f0"
                      fontSize={11}
                      fontWeight="600"
                    >
                      {node.move !== null
                        ? `Col ${node.move + 1}${
                            node.actual_col !== null && node.actual_col !== node.move
                              ? ` -> ${node.actual_col + 1}`
                              : ""
                          }`
                        : "ROOT"}
                    </text>

                    {/* Score / EV Text */}
                    <text
                      x={8}
                      y={48}
                      fill={
                        node.node_type === "PRUNED"
                          ? "#ef4444"
                          : node.evaluation !== null && node.evaluation >= 0
                          ? "#34d399"
                          : "#f87171"
                      }
                      fontSize={10}
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {node.node_type === "PRUNED"
                        ? "PRUNED"
                        : node.expected_value !== null
                        ? `EV: ${node.expected_value.toFixed(1)}`
                        : node.evaluation !== null
                        ? `Eval: ${node.evaluation.toFixed(1)}`
                        : ""}
                    </text>

                    {/* Collapse / Expand Button */}
                    {hasChildren && (
                      <g
                        transform={`translate(${n.width - 20}, ${n.height - 20})`}
                        onClick={(e) => toggleCollapse(node.id, e)}
                        className="hover:scale-110 transition-transform"
                      >
                        <circle r={8} fill="#1e293b" stroke="#475569" strokeWidth={1} />
                        <text
                          textAnchor="middle"
                          dy={3}
                          fontSize={9}
                          fill="#94a3b8"
                          fontWeight="bold"
                        >
                          {isCollapsed ? "+" : "−"}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Quick Stats Overlay */}
          {activeIterationInfo && (
            <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur border border-slate-800 p-2.5 rounded-xl text-xs font-mono text-slate-400 space-y-1 shadow-lg pointer-events-none">
              <div className="flex gap-4">
                <span>Depth: <b className="text-cyan-400">{activeIterationInfo.depth}</b></span>
                <span>Best: <b className="text-cyan-400">Col {activeIterationInfo.best_move + 1}</b></span>
                <span>Score: <b className="text-emerald-400">{activeIterationInfo.evaluation}</b></span>
              </div>
              <div className="flex gap-4 text-[11px] text-slate-500">
                <span>Visited: {activeIterationInfo.nodes_visited}</span>
                <span>Pruned: {activeIterationInfo.nodes_pruned}</span>
                <span>Leaves: {activeIterationInfo.leaves_evaluated}</span>
                <span>Time: {activeIterationInfo.execution_time_ms.toFixed(1)}ms</span>
              </div>
            </div>
          )}
        </div>

        {/* Selected Node Details Sidebar */}
        {selectedNode && (
          <div className="w-80 md:w-96 bg-slate-900/95 border-l border-slate-800 p-4 overflow-y-auto space-y-4 z-20 custom-scrollbar animate-slideLeft">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-200">Node Inspector</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    selectedNode.node_type === "MAX"
                      ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                      : selectedNode.node_type === "MIN"
                      ? "bg-amber-950 text-amber-300 border border-amber-800"
                      : selectedNode.node_type === "CHANCE"
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      : selectedNode.node_type === "PRUNED"
                      ? "bg-rose-950 text-rose-300 border border-rose-800"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {selectedNode.node_type}
                </span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            {/* Board State Snapshot */}
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-2">
                Board State at this Search Node:
              </span>
              <div className="flex justify-center bg-slate-950 p-2 rounded-xl border border-slate-800">
                <BoardPreview
                  grid={selectedNode.board_grid}
                  cellSize={20}
                  highlightMove={
                    selectedNode.actual_col !== null ? [0, selectedNode.actual_col] : null
                  }
                />
              </div>
            </div>

            {/* Key Metadata Table */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Node ID:</span>
                <span className="text-slate-200">{selectedNode.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tree Depth:</span>
                <span className="text-slate-200">{selectedNode.depth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Chosen Move:</span>
                <span className="text-cyan-400 font-bold">
                  {selectedNode.move !== null ? `Column ${selectedNode.move + 1}` : "Root Node"}
                </span>
              </div>
              {selectedNode.actual_col !== null && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Actual Drop Col:</span>
                  <span className="text-amber-400 font-bold">
                    Column {selectedNode.actual_col + 1}
                  </span>
                </div>
              )}
              {selectedNode.probability !== null && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Drop Probability:</span>
                  <span className="text-emerald-400 font-bold">
                    {(selectedNode.probability * 100).toFixed(0)}%
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Evaluation:</span>
                <span
                  className={
                    selectedNode.evaluation && selectedNode.evaluation >= 0
                      ? "text-emerald-400 font-bold"
                      : "text-rose-400 font-bold"
                  }
                >
                  {selectedNode.evaluation !== null ? selectedNode.evaluation.toFixed(2) : "N/A"}
                </span>
              </div>
              {selectedNode.expected_value !== null && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Expected Value:</span>
                  <span className="text-emerald-400 font-bold">
                    {selectedNode.expected_value.toFixed(2)}
                  </span>
                </div>
              )}
              {selectedNode.alpha !== null && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Alpha Bound:</span>
                  <span className="text-cyan-400 font-bold">{selectedNode.alpha}</span>
                </div>
              )}
              {selectedNode.beta !== null && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Beta Bound:</span>
                  <span className="text-amber-400 font-bold">{selectedNode.beta}</span>
                </div>
              )}
              {selectedNode.pruned && (
                <div className="pt-2 border-t border-slate-800 text-rose-400">
                  <div className="font-bold flex items-center gap-1">
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Pruning Reason:</span>
                  </div>
                  <p className="text-[11px] mt-0.5">{selectedNode.pruning_reason || "Cut by Alpha >= Beta"}</p>
                </div>
              )}
            </div>

            {/* Heuristic Breakdown for Leaf Nodes */}
            {selectedNode.heuristic_breakdown && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Heuristic Score Breakdown:</span>
                </span>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs font-mono">
                  <div className="text-[10px] text-slate-400 mb-1">
                    Heuristic: <b className="text-slate-200">{selectedNode.heuristic_name}</b>
                  </div>
                  {Object.entries(selectedNode.heuristic_breakdown).map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">{k}:</span>
                      <span className={v > 0 ? "text-emerald-400 font-bold" : v < 0 ? "text-rose-400 font-bold" : "text-slate-500"}>
                        {v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)}
                      </span>
                    </div>
                  ))}
                  <div className="pt-1.5 border-t border-slate-800 flex justify-between font-bold text-xs">
                    <span className="text-slate-200">Total Score:</span>
                    <span className={selectedNode.evaluation && selectedNode.evaluation >= 0 ? "text-emerald-400" : "text-rose-400"}>
                      {selectedNode.evaluation?.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
