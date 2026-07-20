"use client";

import { useRef, useEffect } from "react";

interface MindMapNode {
  label: string;
  children: MindMapNode[];
}

interface MindMapProps {
  data: MindMapNode;
}

/**
 * 마인드맵 시각화 - 중앙에서 좌우로 뻗어나가는 트리 구조
 */
export function MindMap({ data }: MindMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // 배경
    ctx.fillStyle = "#1e1e2e";
    ctx.fillRect(0, 0, width, height);

    const colors = ["#a78bfa", "#6ee7b7", "#fbbf24", "#f87171", "#60a5fa", "#f472b6", "#34d399", "#fb923c", "#818cf8", "#2dd4bf"];
    const children = data.children;
    if (children.length === 0) return;

    // 중심 노드
    const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    // 중앙 노드
    const centerW = 120;
    const centerH = 36;
    drawRoundRect(centerX - centerW / 2, centerY - centerH / 2, centerW, centerH, 18);
    ctx.fillStyle = "#7c3aed";
    ctx.fill();
    ctx.font = "bold 13px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(data.label, centerX, centerY);

    // 1차 가지를 좌우로 분배
    const leftChildren = children.slice(0, Math.ceil(children.length / 2));
    const rightChildren = children.slice(Math.ceil(children.length / 2));

    const drawBranch = (child: MindMapNode, x: number, y: number, color: string, direction: "left" | "right") => {
      const nodeW = 90;
      const nodeH = 28;
      const nx = direction === "right" ? x : x - nodeW;

      // 1차 노드
      drawRoundRect(nx, y - nodeH / 2, nodeW, nodeH, 14);
      ctx.fillStyle = color;
      ctx.fill();

      ctx.font = "bold 11px -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#1e1e2e";
      const label = child.label.length > 7 ? child.label.slice(0, 7) + "…" : child.label;
      ctx.fillText(label, nx + nodeW / 2, y);

      // 2차 가지 (키워드)
      const subChildren = child.children || [];
      const subSpacing = 28;
      const subStartY = y - ((subChildren.length - 1) * subSpacing) / 2;
      const subOffsetX = direction === "right" ? 130 : -130;

      subChildren.forEach((sub, j) => {
        const sy = subStartY + j * subSpacing;
        const sx = x + subOffsetX;
        const subW = 80;
        const subH = 22;
        const snx = direction === "right" ? sx : sx - subW;

        // 2차 연결선
        const fromX = direction === "right" ? nx + nodeW : nx;
        const toX = direction === "right" ? snx : snx + subW;
        ctx.beginPath();
        ctx.moveTo(fromX, y);
        ctx.bezierCurveTo(fromX + (toX - fromX) * 0.5, y, toX - (toX - fromX) * 0.5, sy, toX, sy);
        ctx.strokeStyle = color + "50";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 2차 노드
        drawRoundRect(snx, sy - subH / 2, subW, subH, 11);
        ctx.fillStyle = color + "33";
        ctx.fill();
        ctx.strokeStyle = color + "88";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = "10px -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#e2e8f0";
        const subLabel = sub.label.length > 7 ? sub.label.slice(0, 7) + "…" : sub.label;
        ctx.fillText(subLabel, snx + subW / 2, sy);
      });
    };

    // 우측 가지
    const rightSpacing = height / (rightChildren.length + 1);
    rightChildren.forEach((child, i) => {
      const y = rightSpacing * (i + 1);
      const x = centerX + 100;
      const color = colors[i % colors.length];

      // 연결선
      ctx.beginPath();
      ctx.moveTo(centerX + centerW / 2, centerY);
      ctx.bezierCurveTo(centerX + 80, centerY, x - 30, y, x, y);
      ctx.strokeStyle = color + "88";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      drawBranch(child, x, y, color, "right");
    });

    // 좌측 가지
    const leftSpacing = height / (leftChildren.length + 1);
    leftChildren.forEach((child, i) => {
      const y = leftSpacing * (i + 1);
      const x = centerX - 100;
      const color = colors[(i + rightChildren.length) % colors.length];

      // 연결선
      ctx.beginPath();
      ctx.moveTo(centerX - centerW / 2, centerY);
      ctx.bezierCurveTo(centerX - 80, centerY, x + 30, y, x, y);
      ctx.strokeStyle = color + "88";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      drawBranch(child, x, y, color, "left");
    });
  }, [data]);

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full rounded-lg" style={{ display: "block" }} />
      <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-[10px] text-gray-400">
        카테고리 → 키워드 (빈도 기반 자동 생성)
      </div>
    </div>
  );
}
