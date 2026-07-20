import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const outDir = path.resolve("outputs/data-flow-diagrams");

const theme = {
  bg: "#f7f4ef",
  ink: "#1f2933",
  muted: "#5d6875",
  line: "#8a94a6",
  client: "#2f80ed",
  server: "#0f766e",
  data: "#7c3aed",
  external: "#c2410c",
  calc: "#b45309",
  white: "#ffffff",
};

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function textLines(text, maxChars = 15) {
  const words = String(text).split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function markerDefs() {
  return `
    <defs>
      <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
        <path d="M0,0 L0,6 L9,3 z" fill="${theme.line}" />
      </marker>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#1f2933" flood-opacity="0.12"/>
      </filter>
    </defs>`;
}

function node({ id, x, y, w, h, label, sub, fill = theme.white, stroke = theme.line }) {
  const titleLines = textLines(label, w > 190 ? 17 : 13);
  const titleY = y + (sub ? 26 : h / 2 - (titleLines.length - 1) * 8);
  const title = titleLines
    .map((line, index) => `<tspan x="${x + w / 2}" y="${titleY + index * 18}">${esc(line)}</tspan>`)
    .join("");
  const subText = sub
    ? `<text x="${x + w / 2}" y="${y + h - 18}" text-anchor="middle" class="sub">${esc(sub)}</text>`
    : "";
  return `
    <g id="${esc(id)}" filter="url(#shadow)">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <text text-anchor="middle" class="label">${title}</text>
      ${subText}
    </g>`;
}

function store({ id, x, y, w, h, label, sub, fill = theme.white, stroke = theme.data }) {
  return `
    <g id="${esc(id)}" filter="url(#shadow)">
      <path d="M${x},${y + 12} C${x},${y - 4} ${x + w},${y - 4} ${x + w},${y + 12} L${x + w},${y + h - 12} C${x + w},${y + h + 4} ${x},${y + h + 4} ${x},${y + h - 12} Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <path d="M${x},${y + 12} C${x},${y + 28} ${x + w},${y + 28} ${x + w},${y + 12}" fill="none" stroke="${stroke}" stroke-width="2"/>
      <text x="${x + w / 2}" y="${y + 44}" text-anchor="middle" class="label">${esc(label)}</text>
      <text x="${x + w / 2}" y="${y + 66}" text-anchor="middle" class="sub">${esc(sub)}</text>
    </g>`;
}

function arrow(x1, y1, x2, y2, label = "", bend = "") {
  const d = bend || `M${x1},${y1} L${x2},${y2}`;
  const lx = (x1 + x2) / 2;
  const ly = (y1 + y2) / 2 - 8;
  return `
    <path d="${d}" fill="none" stroke="${theme.line}" stroke-width="2.2" marker-end="url(#arrow)"/>
    ${label ? `<text x="${lx}" y="${ly}" text-anchor="middle" class="edge">${esc(label)}</text>` : ""}`;
}

function frame({ title, subtitle, width = 1400, height = 900, content }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${markerDefs()}
  <style>
    @font-face { font-family: InterFallback; src: local("Arial"); }
    .title { font: 700 34px InterFallback, Arial, sans-serif; fill: ${theme.ink}; }
    .subtitle { font: 400 17px InterFallback, Arial, sans-serif; fill: ${theme.muted}; }
    .label { font: 700 17px InterFallback, Arial, sans-serif; fill: ${theme.ink}; }
    .sub { font: 400 13px InterFallback, Arial, sans-serif; fill: ${theme.muted}; }
    .edge { font: 600 13px InterFallback, Arial, sans-serif; fill: ${theme.muted}; paint-order: stroke; stroke: ${theme.bg}; stroke-width: 5px; }
    .band { font: 800 13px InterFallback, Arial, sans-serif; letter-spacing: 1.2px; fill: ${theme.white}; }
  </style>
  <rect width="100%" height="100%" fill="${theme.bg}"/>
  <text x="64" y="62" class="title">${esc(title)}</text>
  <text x="64" y="92" class="subtitle">${esc(subtitle)}</text>
  ${content}
</svg>`;
}

const diagrams = [
  {
    name: "01-overall-data-flow",
    svg: frame({
      title: "푸드코스트 전체 데이터 흐름도",
      subtitle: "사용자 화면에서 Next.js API, 인증, Prisma, SQLite까지 이어지는 핵심 흐름",
      content: `
        <rect x="64" y="132" width="280" height="38" rx="6" fill="${theme.client}"/><text x="204" y="156" text-anchor="middle" class="band">CLIENT</text>
        <rect x="430" y="132" width="460" height="38" rx="6" fill="${theme.server}"/><text x="660" y="156" text-anchor="middle" class="band">NEXT.JS SERVER</text>
        <rect x="980" y="132" width="330" height="38" rx="6" fill="${theme.data}"/><text x="1145" y="156" text-anchor="middle" class="band">DATA / EXTERNAL</text>
        ${node({ id: "user", x: 92, y: 220, w: 220, h: 82, label: "사용자", sub: "업로드, 입력, 조회", stroke: theme.client })}
        ${node({ id: "pages", x: 92, y: 380, w: 220, h: 98, label: "대시보드 UI", sub: "React pages + forms", stroke: theme.client })}
        ${node({ id: "auth", x: 470, y: 220, w: 190, h: 82, label: "NextAuth", sub: "세션/권한 확인", stroke: theme.server })}
        ${node({ id: "api", x: 520, y: 380, w: 260, h: 98, label: "API Route Handlers", sub: "/api/* 요청 처리", stroke: theme.server })}
        ${node({ id: "logic", x: 520, y: 570, w: 260, h: 98, label: "비즈니스 로직", sub: "검증, 단위 변환, 계산", stroke: theme.calc })}
        ${store({ id: "db", x: 1010, y: 355, w: 250, h: 118, label: "SQLite DB", sub: "Prisma schema", stroke: theme.data })}
        ${node({ id: "ai", x: 1010, y: 560, w: 250, h: 96, label: "OpenAI / Textract", sub: "영수증/CSV 분석", stroke: theme.external })}
        ${arrow(202, 302, 202, 380, "화면 조작")}
        ${arrow(312, 429, 520, 429, "fetch")}
        ${arrow(650, 380, 570, 302, "getCurrentUser")}
        ${arrow(660, 302, 660, 380, "세션 결과")}
        ${arrow(780, 429, 1010, 414, "Prisma CRUD")}
        ${arrow(650, 478, 650, 570, "계산/정규화")}
        ${arrow(780, 620, 1010, 608, "파일 분석")}
        ${arrow(1010, 440, 780, 440, "조회/저장 결과")}
        ${arrow(520, 628, 312, 452, "JSON 응답")}
      `,
    }),
  },
  {
    name: "02-upload-ai-flow",
    svg: frame({
      title: "영수증 및 CSV 업로드 데이터 흐름도",
      subtitle: "파일 업로드 후 AI 분석 결과를 검토하고 재료 DB에 upsert하는 흐름",
      content: `
        ${node({ id: "upload", x: 70, y: 210, w: 230, h: 90, label: "UploadModal", sub: "이미지 또는 CSV 선택", stroke: theme.client })}
        ${node({ id: "uploadApi", x: 380, y: 210, w: 260, h: 90, label: "POST /api/ingredients/upload", sub: "파일 타입/크기 검증", stroke: theme.server })}
        ${node({ id: "branch", x: 730, y: 210, w: 230, h: 90, label: "분석 분기", sub: "CSV vs 이미지", stroke: theme.calc })}
        ${node({ id: "csv", x: 1080, y: 125, w: 240, h: 88, label: "analyzeCsvText", sub: "gpt-4o-mini", stroke: theme.external })}
        ${node({ id: "image", x: 1080, y: 305, w: 240, h: 96, label: "analyzeReceiptImage", sub: "Sharp tiles + Vision", stroke: theme.external })}
        ${node({ id: "textract", x: 820, y: 470, w: 240, h: 84, label: "AWS Textract", sub: "OCR 보조 텍스트", stroke: theme.external })}
        ${node({ id: "parsed", x: 730, y: 630, w: 250, h: 92, label: "ParsedIngredient[]", sub: "name, unit, price, category", stroke: theme.calc })}
        ${node({ id: "review", x: 390, y: 630, w: 250, h: 92, label: "사용자 검토", sub: "수정 후 저장", stroke: theme.client })}
        ${node({ id: "upsert", x: 90, y: 630, w: 230, h: 92, label: "POST /api/ingredients/upsert", sub: "생성/수정/변경 없음", stroke: theme.server })}
        ${store({ id: "ingredient", x: 90, y: 430, w: 230, h: 112, label: "Ingredient", sub: "현재 단가", stroke: theme.data })}
        ${store({ id: "history", x: 390, y: 430, w: 250, h: 112, label: "PriceHistory", sub: "단가 변경 이력", stroke: theme.data })}
        ${arrow(300, 255, 380, 255, "multipart/form-data")}
        ${arrow(640, 255, 730, 255, "파일 내용")}
        ${arrow(960, 238, 1080, 176, "CSV")}
        ${arrow(960, 272, 1080, 352, "이미지")}
        ${arrow(1080, 352, 1060, 512, "OCR 보조", "M1080,352 C1000,390 1000,455 1060,512")}
        ${arrow(1200, 213, 980, 630, "JSON 추출", "M1200,213 C1205,520 1040,600 980,660")}
        ${arrow(1200, 401, 980, 676, "JSON 추출", "M1200,401 C1195,560 1050,650 980,676")}
        ${arrow(730, 676, 640, 676, "분석 결과")}
        ${arrow(390, 676, 320, 676, "저장")}
        ${arrow(205, 630, 205, 542, "upsert")}
        ${arrow(320, 676, 390, 542, "가격 변경 시", "M320,676 C350,590 360,548 390,506")}
      `,
    }),
  },
  {
    name: "03-cost-report-flow",
    svg: frame({
      title: "메뉴 원가 계산 및 리포트 데이터 흐름도",
      subtitle: "레시피 항목과 재료 단가를 결합해 원가율, 마진, 차트 데이터를 만드는 흐름",
      content: `
        ${node({ id: "recipes", x: 70, y: 185, w: 240, h: 88, label: "RecipeEditor", sub: "메뉴별 재료/수량 입력", stroke: theme.client })}
        ${node({ id: "recipeApi", x: 390, y: 185, w: 260, h: 88, label: "PUT /api/menus/{id}/recipe", sub: "레시피 전체 교체", stroke: theme.server })}
        ${store({ id: "menuDb", x: 760, y: 160, w: 230, h: 112, label: "Menu", sub: "판매가/카테고리", stroke: theme.data })}
        ${store({ id: "recipeDb", x: 1040, y: 160, w: 250, h: 112, label: "RecipeItem", sub: "수량/사용 단위", stroke: theme.data })}
        ${store({ id: "ingredientDb", x: 900, y: 360, w: 250, h: 112, label: "Ingredient", sub: "단가/기준 단위", stroke: theme.data })}
        ${node({ id: "costApi", x: 390, y: 410, w: 260, h: 92, label: "GET /api/cost", sub: "메뉴+레시피+재료 조회", stroke: theme.server })}
        ${node({ id: "unit", x: 390, y: 610, w: 260, h: 92, label: "calculateRecipeItemCost", sub: "단위 호환 및 금액 계산", stroke: theme.calc })}
        ${node({ id: "costPage", x: 70, y: 610, w: 240, h: 92, label: "Cost Page", sub: "총원가/원가율/마진", stroke: theme.client })}
        ${node({ id: "reportsApi", x: 760, y: 610, w: 250, h: 92, label: "GET /api/reports", sub: "순위/비중/추이 집계", stroke: theme.server })}
        ${node({ id: "charts", x: 1060, y: 610, w: 240, h: 92, label: "Reports Page", sub: "Recharts 시각화", stroke: theme.client })}
        ${arrow(310, 229, 390, 229, "레시피 저장")}
        ${arrow(650, 229, 760, 216, "메뉴 확인")}
        ${arrow(650, 246, 1040, 216, "항목 재생성")}
        ${arrow(520, 410, 900, 416, "include ingredient")}
        ${arrow(900, 386, 990, 272, "관계 조회", "M900,386 C850,310 930,270 990,216")}
        ${arrow(520, 502, 520, 610, "계산 대상")}
        ${arrow(390, 656, 310, 656, "계산 결과")}
        ${arrow(650, 656, 760, 656, "같은 계산 로직")}
        ${arrow(1010, 656, 1060, 656, "차트 데이터")}
        ${arrow(1010, 610, 1040, 472, "가격 이력/재료 비중", "M1010,610 C1110,560 1190,500 1150,416")}
      `,
    }),
  },
  {
    name: "04-data-model-flow",
    svg: frame({
      title: "데이터 모델 관계 흐름도",
      subtitle: "사용자 소유 데이터, 레시피 연결, 가격 이력의 관계",
      content: `
        ${store({ id: "user", x: 110, y: 220, w: 250, h: 118, label: "User", sub: "email, name, provider", stroke: theme.data })}
        ${store({ id: "ingredients", x: 520, y: 140, w: 270, h: 128, label: "Ingredient", sub: "name, unit, pricePerUnit", stroke: theme.data })}
        ${store({ id: "menus", x: 520, y: 420, w: 270, h: 128, label: "Menu", sub: "name, category, sellingPrice", stroke: theme.data })}
        ${store({ id: "history", x: 990, y: 120, w: 270, h: 128, label: "IngredientPriceHistory", sub: "price, changedAt", stroke: theme.data })}
        ${store({ id: "recipe", x: 990, y: 420, w: 270, h: 128, label: "RecipeItem", sub: "quantity, unit", stroke: theme.data })}
        ${node({ id: "auth", x: 110, y: 520, w: 250, h: 92, label: "인증 경계", sub: "모든 조회는 userId로 제한", stroke: theme.server })}
        ${node({ id: "delete", x: 520, y: 660, w: 270, h: 92, label: "Cascade / Guard", sub: "메뉴 삭제는 recipe 삭제, 사용 중 재료 삭제 제한", stroke: theme.calc })}
        ${arrow(360, 260, 520, 196, "1:N")}
        ${arrow(360, 302, 520, 476, "1:N")}
        ${arrow(790, 196, 990, 184, "1:N 가격 변경")}
        ${arrow(790, 476, 990, 476, "1:N 레시피 구성")}
        ${arrow(990, 512, 790, 232, "N:1 재료 참조", "M990,512 C910,395 870,300 790,232")}
        ${arrow(235, 520, 235, 338, "세션 사용자")}
        ${arrow(655, 548, 655, 660, "삭제 규칙")}
        <text x="960" y="320" class="subtitle">RecipeItem은 Menu와 Ingredient를 연결합니다.</text>
        <text x="960" y="350" class="subtitle">원가 = 수량 x 재료 단가(단위 변환 적용)</text>
      `,
    }),
  },
];

await fs.mkdir(outDir, { recursive: true });

for (const diagram of diagrams) {
  const svgPath = path.join(outDir, `${diagram.name}.svg`);
  const pngPath = path.join(outDir, `${diagram.name}.png`);
  await fs.writeFile(svgPath, diagram.svg, "utf8");
  await sharp(Buffer.from(diagram.svg)).png().toFile(pngPath);
}

console.log(`Generated ${diagrams.length} SVG files and ${diagrams.length} PNG files in ${outDir}`);
