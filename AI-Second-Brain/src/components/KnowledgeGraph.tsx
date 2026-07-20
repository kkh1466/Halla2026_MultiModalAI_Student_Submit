"use client";

import { useRef, useEffect, useCallback, useState } from "react";

interface GraphNode {
  id: string;
  label: string;
  type: "bookmark" | "keyword";
  category?: string;
  url?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  connections?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  strength: number;
}

interface KnowledgeGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  theme?: "dark" | "light";
}

/**
 * Obsidian-style 지식 그래프 시각화
 * 다크/라이트 모드 + 발광 노드 + 곡선 엣지 + 드래그/줌 지원
 */
export function KnowledgeGraph({ nodes: initialNodes, links: initialLinks, theme = "dark" }: KnowledgeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const linksRef = useRef<{ source: GraphNode; target: GraphNode; strength: number }[]>([]);
  const themeRef = useRef(theme);

  // theme 변경 시 ref 업데이트 (canvas 재초기화 없이 다음 프레임부터 반영)
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);
  const animRef = useRef<number>(0);
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const dragRef = useRef<{ node: GraphNode | null; startX: number; startY: number; isPanning: boolean }>({
    node: null, startX: 0, startY: 0, isPanning: false
  });
  const hoveredRef = useRef<GraphNode | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: GraphNode } | null>(null);

  const initGraph = useCallback(() => {
    // 노드별 연결 수 계산
    const connectionCount = new Map<string, number>();
    for (const link of initialLinks) {
      const srcId = typeof link.source === "string" ? link.source : link.source.id;
      const tgtId = typeof link.target === "string" ? link.target : link.target.id;
      connectionCount.set(srcId, (connectionCount.get(srcId) || 0) + 1);
      connectionCount.set(tgtId, (connectionCount.get(tgtId) || 0) + 1);
    }

    // 가장 연결이 많은 노드 ID 찾기
    let hubId = "";
    let maxConns = 0;
    initialNodes.forEach((n) => {
      const c = connectionCount.get(n.id) || 0;
      if (c > maxConns) { maxConns = c; hubId = n.id; }
    });
    if (!hubId && initialNodes.length > 0) hubId = initialNodes[0].id;

    const nodes = initialNodes.map((n, i) => ({
      ...n,
      x: n.id === hubId ? 400 : 400 + Math.cos((2 * Math.PI * i) / initialNodes.length) * 150 + (Math.random() - 0.5) * 40,
      y: n.id === hubId ? 300 : 300 + Math.sin((2 * Math.PI * i) / initialNodes.length) * 150 + (Math.random() - 0.5) * 40,
      vx: 0,
      vy: 0,
      connections: connectionCount.get(n.id) || 0,
    }));

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    const links = initialLinks
      .map((l) => {
        const source = nodeMap.get(typeof l.source === "string" ? l.source : l.source.id);
        const target = nodeMap.get(typeof l.target === "string" ? l.target : l.target.id);
        if (source && target) return { source, target, strength: l.strength };
        return null;
      })
      .filter(Boolean) as { source: GraphNode; target: GraphNode; strength: number }[];

    nodesRef.current = nodes;
    linksRef.current = links;
  }, [initialNodes, initialLinks]);

  useEffect(() => {
    initGraph();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resize();
    window.addEventListener("resize", resize);

    let iteration = 0;
    const maxIterations = 300;

    const simulate = () => {
      const nodes = nodesRef.current;
      const links = linksRef.current;
      const width = canvas.width;
      const height = canvas.height;

      if (iteration < maxIterations && !dragRef.current.node) {
        const alpha = Math.max(0.01, 1 - iteration / maxIterations);

        // 반발력
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = (nodes[j].x || 0) - (nodes[i].x || 0);
            const dy = (nodes[j].y || 0) - (nodes[i].y || 0);
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = (40 * alpha) / dist;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            nodes[i].vx = (nodes[i].vx || 0) - fx;
            nodes[i].vy = (nodes[i].vy || 0) - fy;
            nodes[j].vx = (nodes[j].vx || 0) + fx;
            nodes[j].vy = (nodes[j].vy || 0) + fy;
          }
        }

        // 인력 (링크)
        for (const link of links) {
          const dx = (link.target.x || 0) - (link.source.x || 0);
          const dy = (link.target.y || 0) - (link.source.y || 0);
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - 60) * 0.012 * alpha;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          link.source.vx = (link.source.vx || 0) + fx;
          link.source.vy = (link.source.vy || 0) + fy;
          link.target.vx = (link.target.vx || 0) - fx;
          link.target.vy = (link.target.vy || 0) - fy;
        }

        // 중심 인력
        for (const node of nodes) {
          node.vx = (node.vx || 0) + (width / 2 - (node.x || 0)) * 0.001 * alpha;
          node.vy = (node.vy || 0) + (height / 2 - (node.y || 0)) * 0.001 * alpha;
        }

        // 위치 업데이트
        for (const node of nodes) {
          node.vx = (node.vx || 0) * 0.85;
          node.vy = (node.vy || 0) * 0.85;
          node.x = (node.x || 0) + (node.vx || 0);
          node.y = (node.y || 0) + (node.vy || 0);
        }

        iteration++;

        // 시뮬레이션 끝나면 허브 노드 중심으로 포커스
        if (iteration === maxIterations && nodes.length > 0) {
          // 가장 연결이 많은 노드를 찾기
          let hubIdx = 0;
          let hubMax = nodes[0].connections || 0;
          for (let i = 1; i < nodes.length; i++) {
            const c = nodes[i].connections || 0;
            if (c > hubMax) { hubMax = c; hubIdx = i; }
          }
          const hubNode = nodes[hubIdx];

          // 허브 노드를 화면 중앙에 놓고, 적당히 줌인하여 포커스
          const focusZoom = nodes.length > 20 ? 1.8 : nodes.length > 10 ? 1.5 : 1.2;
          const cx = hubNode.x || width / 2;
          const cy = hubNode.y || height / 2;
          zoomRef.current = focusZoom;
          panRef.current.x = width / 2 - cx * focusZoom;
          panRef.current.y = height / 2 - cy * focusZoom;
        }
      }

      // 렌더링
      ctx.save();
      ctx.clearRect(0, 0, width, height);

      // 배경
      const isDark = themeRef.current === "dark";
      ctx.fillStyle = isDark ? "#1e1e2e" : "#f8fafc";
      ctx.fillRect(0, 0, width, height);

      // 미세한 그리드 패턴
      ctx.strokeStyle = isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.04)";
      ctx.lineWidth = 1;
      const gridSize = 40 * zoomRef.current;
      const offsetX = panRef.current.x % gridSize;
      const offsetY = panRef.current.y % gridSize;
      for (let x = offsetX; x < width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = offsetY; y < height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      // 줌/팬 변환 적용
      ctx.translate(panRef.current.x, panRef.current.y);
      ctx.scale(zoomRef.current, zoomRef.current);

      const hovered = hoveredRef.current;

      // 엣지 그리기
      for (const link of links) {
        const sx = link.source.x || 0;
        const sy = link.source.y || 0;
        const tx = link.target.x || 0;
        const ty = link.target.y || 0;

        const isHighlighted = hovered && (link.source.id === hovered.id || link.target.id === hovered.id);

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        // 약간의 곡선
        const mx = (sx + tx) / 2 + (ty - sy) * 0.05;
        const my = (sy + ty) / 2 + (sx - tx) * 0.05;
        ctx.quadraticCurveTo(mx, my, tx, ty);

        if (isHighlighted) {
          ctx.strokeStyle = isDark ? "rgba(139, 92, 246, 0.7)" : "rgba(109, 40, 217, 0.8)";
          ctx.lineWidth = isDark ? 1.5 : 2;
        } else {
          ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(80, 60, 120, 0.35)";
          ctx.lineWidth = isDark ? 0.5 : 1;
        }
        ctx.stroke();
      }

      // 노드 그리기
      for (const node of nodes) {
        const x = node.x || 0;
        const y = node.y || 0;
        const conns = node.connections || 0;
        const isHovered = hovered?.id === node.id;
        const isConnected = hovered && links.some(
          (l) => (l.source.id === hovered.id && l.target.id === node.id) ||
                 (l.target.id === hovered.id && l.source.id === node.id)
        );

        let radius: number;
        let color: string;
        let glowColor: string;

        if (node.type === "keyword") {
          radius = Math.min(4 + conns * 0.8, 12);
          color = isDark ? "#a78bfa" : "#7c3aed";
          glowColor = isDark ? "rgba(167, 139, 250, 0.4)" : "rgba(124, 58, 237, 0.3)";
        } else {
          radius = 3 + conns * 0.3;
          color = isDark ? "#6ee7b7" : "#047857";
          glowColor = isDark ? "rgba(110, 231, 183, 0.3)" : "rgba(4, 120, 87, 0.25)";
        }

        if (isHovered) {
          radius *= 1.5;
        }

        // 발광 효과
        if (isHovered || isConnected) {
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 3);
          gradient.addColorStop(0, glowColor);
          gradient.addColorStop(1, "transparent");
          ctx.beginPath();
          ctx.arc(x, y, radius * 3, 0, 2 * Math.PI);
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        // 노드 본체
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = isHovered || isConnected ? color : node.type === "keyword"
          ? (isDark ? "rgba(167, 139, 250, 0.7)" : "rgba(124, 58, 237, 0.85)")
          : (isDark ? "rgba(110, 231, 183, 0.5)" : "rgba(4, 120, 87, 0.8)");
        ctx.fill();

        // 라벨
        if (node.type === "keyword" || isHovered || isConnected) {
          ctx.font = `${isHovered ? "bold 12px" : "11px"} -apple-system, BlinkMacSystemFont, sans-serif`;
          ctx.textAlign = "center";
          ctx.fillStyle = isHovered
            ? (isDark ? "#ffffff" : "#1e1b4b")
            : (isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(30, 20, 60, 0.9)");
          ctx.fillText(node.label.length > 15 ? node.label.slice(0, 15) + "…" : node.label, x, y + radius + 14);
        }
      }

      ctx.restore();
      animRef.current = requestAnimationFrame(simulate);
    };

    simulate();

    // 마우스 이벤트
    const getMousePos = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left - panRef.current.x) / zoomRef.current,
        y: (e.clientY - rect.top - panRef.current.y) / zoomRef.current,
      };
    };

    const findNode = (mx: number, my: number): GraphNode | null => {
      for (const node of nodesRef.current) {
        const dx = (node.x || 0) - mx;
        const dy = (node.y || 0) - my;
        const radius = node.type === "keyword" ? 12 : 8;
        if (dx * dx + dy * dy < radius * radius) return node;
      }
      return null;
    };

    const onMouseDown = (e: MouseEvent) => {
      const pos = getMousePos(e);
      const node = findNode(pos.x, pos.y);
      if (node) {
        dragRef.current = { node, startX: e.clientX, startY: e.clientY, isPanning: false };
      } else {
        dragRef.current = { node: null, startX: e.clientX, startY: e.clientY, isPanning: true };
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      const pos = getMousePos(e);

      if (dragRef.current.node) {
        dragRef.current.node.x = pos.x;
        dragRef.current.node.y = pos.y;
        dragRef.current.node.vx = 0;
        dragRef.current.node.vy = 0;
      } else if (dragRef.current.isPanning) {
        panRef.current.x += e.clientX - dragRef.current.startX;
        panRef.current.y += e.clientY - dragRef.current.startY;
        dragRef.current.startX = e.clientX;
        dragRef.current.startY = e.clientY;
      } else {
        const node = findNode(pos.x, pos.y);
        hoveredRef.current = node;
        canvas.style.cursor = node ? "pointer" : "grab";

        if (node) {
          const rect = canvas.getBoundingClientRect();
          setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, node });
        } else {
          setTooltip(null);
        }
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (dragRef.current.node) {
        // 마우스가 거의 움직이지 않았으면 클릭으로 처리
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        if (dx * dx + dy * dy < 25 && dragRef.current.node.url) {
          window.open(dragRef.current.node.url, "_blank");
        }
      }
      dragRef.current = { node: null, startX: 0, startY: 0, isPanning: false };
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.3, Math.min(3, zoomRef.current * factor));
      zoomRef.current = newZoom;
    };

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", () => {
      hoveredRef.current = null;
      setTooltip(null);
    });
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initGraph]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg"
        style={{ display: "block" }}
      />
      {/* 범례 */}
      <div className={`absolute top-3 left-3 ${theme === "dark" ? "bg-black/60" : "bg-white/80 border border-gray-200"} backdrop-blur-sm rounded-lg px-3 py-2 text-xs space-y-1.5`}>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#a78bfa]"></span>
          <span className={theme === "dark" ? "text-gray-300" : "text-gray-700"}>키워드</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#6ee7b7]"></span>
          <span className={theme === "dark" ? "text-gray-300" : "text-gray-700"}>북마크</span>
        </div>
      </div>
      {/* 조작 안내 */}
      <div className={`absolute bottom-3 right-3 ${theme === "dark" ? "bg-black/60" : "bg-white/80 border border-gray-200"} backdrop-blur-sm rounded-lg px-3 py-2 text-[10px] ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
        드래그: 이동 · 스크롤: 줌 · 북마크 노드 클릭: 링크 열기
      </div>
      {/* 툴팁 */}
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-black/80 backdrop-blur-sm rounded-md px-2.5 py-1.5 text-xs text-white max-w-48 z-10"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
        >
          <p className="font-medium line-clamp-2">{tooltip.node.label}</p>
          {tooltip.node.category && (
            <p className="text-gray-400 mt-0.5">{tooltip.node.category}</p>
          )}
        </div>
      )}
    </div>
  );
}
