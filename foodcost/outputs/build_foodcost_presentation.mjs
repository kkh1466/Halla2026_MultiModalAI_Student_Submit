import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const OUT_DIR = "C:/Users/user/Desktop/foodcost/outputs";
const ASSET_DIR = path.join(OUT_DIR, "assets");
const PREVIEW_DIR = path.join(OUT_DIR, "foodcost_ppt_preview");
const FINAL_PPTX = path.join(OUT_DIR, "foodcost_project_presentation.pptx");
const HERO_IMAGE = path.join(ASSET_DIR, "foodcost-ai-hero.png");

const W = 1280;
const H = 720;
const C = {
  ink: "#101418",
  muted: "#5B6470",
  faint: "#EEF1F4",
  line: "#C7CDD4",
  blue: "#2F80ED",
  green: "#23A35A",
  red: "#E04F4F",
  yellow: "#F2B84B",
  dark: "#222831",
};

async function writeBlob(filePath, blob) {
  await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
}

async function readImageBlob(imagePath) {
  const bytes = await fs.readFile(imagePath);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function addText(slide, text, x, y, w, h, size, options = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    position: { left: x, top: y, width: w, height: h },
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  shape.text = text;
  shape.text.style = {
    fontSize: size,
    typeface: "Malgun Gothic",
    color: options.color || C.ink,
    bold: Boolean(options.bold),
    alignment: options.alignment || "left",
    verticalAlignment: options.verticalAlignment || "top",
    autoFit: options.autoFit || "shrinkText",
    wrap: "square",
  };
  return shape;
}

function addTitle(slide, title, subtitle) {
  addText(slide, title, 58, 42, 1060, 78, 48, { bold: true });
  if (subtitle) addText(slide, subtitle, 60, 116, 930, 44, 22, { color: C.muted });
  addText(slide, "FoodCost AI", 1114, 54, 110, 28, 16, { color: C.muted, alignment: "right" });
}

function addFooter(slide, n) {
  slide.shapes.add({
    geometry: "rect",
    position: { left: 58, top: 668, width: 1080, height: 1 },
    fill: C.line,
    line: { style: "solid", fill: C.line, width: 0 },
  });
  addText(slide, String(n).padStart(2, "0"), 1160, 650, 64, 32, 16, { color: C.muted, alignment: "right" });
}

function panel(slide, x, y, w, h, fill = C.faint, line = "none") {
  return slide.shapes.add({
    geometry: "roundRect",
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: { style: "solid", fill: line, width: line === "none" ? 0 : 1 },
    borderRadius: "rounded-md",
  });
}

function bulletList(slide, items, x, y, w, startSize = 24, gap = 44, color = C.ink) {
  items.forEach((item, i) => {
    addText(slide, "•", x, y + i * gap + 2, 26, 28, startSize, { color });
    addText(slide, item, x + 32, y + i * gap, w - 32, 38, startSize, { color });
  });
}

function metric(slide, value, label, x, y, w, color) {
  panel(slide, x, y, w, 128, "#FFFFFF", C.line);
  addText(slide, value, x + 24, y + 22, w - 48, 46, 36, { bold: true, color });
  addText(slide, label, x + 24, y + 74, w - 48, 38, 19, { color: C.muted });
}

function flowStep(slide, label, detail, x, y, w, color) {
  panel(slide, x, y, w, 118, "#FFFFFF", C.line);
  slide.shapes.add({
    geometry: "rect",
    position: { left: x, top: y, width: 8, height: 118 },
    fill: color,
    line: { style: "solid", fill: color, width: 0 },
  });
  addText(slide, label, x + 22, y + 18, w - 42, 34, 23, { bold: true });
  addText(slide, detail, x + 22, y + 58, w - 42, 46, 16, { color: C.muted });
}

async function main() {
  await fs.mkdir(PREVIEW_DIR, { recursive: true });
  const heroBytes = await readImageBlob(HERO_IMAGE);

  const deck = Presentation.create({ slideSize: { width: W, height: H } });

  {
    const slide = deck.slides.add();
    slide.background.fill = "#FFFFFF";
    slide.images.add({
      blob: heroBytes,
      contentType: "image/png",
      alt: "Restaurant owner reviewing an AI food cost dashboard",
      fit: "cover",
      position: { left: 0, top: 0, width: W, height: H },
    });
    panel(slide, 0, 0, 575, H, "#FFFFFF", "none");
    addText(slide, "AI 기반\n푸드코스트\n자동계산 서비스", 58, 94, 460, 260, 58, { bold: true });
    addText(slide, "영수증과 CSV를 식재료 데이터로 바꾸고,\n레시피 기반 원가율과 마진을 바로 보여주는\n소상공인용 원가 관리 웹 서비스", 62, 390, 430, 104, 23, { color: C.muted });
    addText(slide, "프로젝트 발표", 64, 54, 180, 28, 18, { color: C.blue, bold: true });
    addText(slide, "FoodCost AI", 64, 610, 240, 32, 21, { bold: true });
  }

  {
    const slide = deck.slides.add();
    addTitle(slide, "문제는 입력 부담과 원가 판단의 지연입니다", "외식업 사장은 매입 자료, 레시피, 판매가를 함께 봐야 하지만 이 과정이 대부분 수작업입니다.");
    bulletList(slide, [
      "영수증·거래명세서의 품목과 단가를 직접 옮겨 적어야 함",
      "식재료 가격 변동이 메뉴 원가율에 반영되기까지 시간이 걸림",
      "어떤 메뉴가 30% 기준을 넘는지 즉시 판단하기 어려움",
      "소규모 매장일수록 별도 ERP 없이 엑셀과 기억에 의존함",
    ], 80, 220, 560, 25, 52);
    metric(slide, "원가율", "판매가 대비 식재료 비용", 720, 210, 210, C.blue);
    metric(slide, "마진", "판매가 - 총 원가", 960, 210, 210, C.green);
    metric(slide, "30%", "주의 메뉴 기준선", 720, 370, 210, C.yellow);
    metric(slide, "40%+", "위험 메뉴 기준선", 960, 370, 210, C.red);
    addFooter(slide, 2);
  }

  {
    const slide = deck.slides.add();
    addTitle(slide, "기획의 초점은 ‘입력 자동화 → 원가 의사결정’입니다", "사용자가 데이터를 넣는 순간부터 메뉴별 판단 지표까지 이어지는 하나의 업무 흐름을 만들었습니다.");
    flowStep(slide, "1. 매입 자료 입력", "영수증 이미지 또는 CSV 파일 업로드", 78, 230, 230, C.blue);
    flowStep(slide, "2. 식재료 정리", "품목명, 단위, 단가, 카테고리 추출", 330, 230, 230, C.green);
    flowStep(slide, "3. 레시피 연결", "메뉴별 식재료 사용량과 판매가 입력", 582, 230, 230, C.yellow);
    flowStep(slide, "4. 원가 계산", "단위 변환 후 총 원가, 원가율, 마진 산출", 834, 230, 230, C.red);
    flowStep(slide, "5. 리포트 확인", "위험 메뉴와 식재료 비용 비중 시각화", 330, 410, 482, C.dark);
    addText(slide, "→", 300, 262, 32, 36, 30, { color: C.muted });
    addText(slide, "→", 552, 262, 32, 36, 30, { color: C.muted });
    addText(slide, "→", 804, 262, 32, 36, 30, { color: C.muted });
    addText(slide, "핵심 가치: 반복 입력을 줄이고, 가격 변동이 메뉴 손익에 미치는 영향을 빠르게 확인합니다.", 82, 590, 1020, 42, 25, { bold: true });
    addFooter(slide, 3);
  }

  {
    const slide = deck.slides.add();
    addTitle(slide, "AI 모델은 입력 유형별 역할을 분리해 선정했습니다", "이미지 이해, OCR 보조, 텍스트 정규화가 각각 다른 난이도를 갖기 때문입니다.");
    panel(slide, 76, 190, 520, 380, "#FFFFFF", C.line);
    addText(slide, "AI·문서 인식", 110, 220, 420, 36, 28, { bold: true });
    bulletList(slide, [
      "OpenAI Vision 모델: 영수증 이미지에서 품목·수량·금액 추출",
      "AWS Textract: OCR 보조 텍스트로 숫자와 행 구조 보강",
      "gpt-4o-mini: CSV·텍스트 기반 식재료 정보 정리",
      "JSON Schema 응답: 후처리 가능한 구조화 결과 확보",
    ], 110, 290, 420, 20, 52);
    panel(slide, 676, 190, 520, 380, "#FFFFFF", C.line);
    addText(slide, "웹·데이터 기술", 710, 220, 420, 36, 28, { bold: true });
    bulletList(slide, [
      "Next.js 14 App Router와 TypeScript로 풀스택 구현",
      "NextAuth와 bcrypt 기반 사용자 인증 및 데이터 격리",
      "Prisma + SQLite로 메뉴·레시피·가격 이력 저장",
      "Recharts로 원가율, 비용 비중, 가격 추이를 시각화",
    ], 710, 290, 420, 20, 52);
    addText(slide, "근거: package.json, src/lib/openai.ts, prisma/schema.prisma", 78, 620, 900, 24, 15, { color: C.muted });
    addFooter(slide, 4);
  }

  {
    const slide = deck.slides.add();
    addTitle(slide, "멀티모달 파이프라인은 검토 가능한 데이터로 끝납니다", "이미지·CSV 입력을 바로 DB에 넣지 않고, 사용자가 선택·수정할 수 있는 리뷰 단계를 둔 점이 구현 완성도의 핵심입니다.");
    flowStep(slide, "이미지/CSV 업로드", "10MB 이하 파일, JPG/PNG/WebP/CSV 지원", 80, 218, 220, C.blue);
    flowStep(slide, "AI 추출", "품목명·수량·단가·총액을 구조화", 326, 218, 220, C.green);
    flowStep(slide, "정규화", "단위 보정, 품목명 정리, 카테고리 분류", 572, 218, 220, C.yellow);
    flowStep(slide, "리뷰/선택", "테이블에서 품목 선택 및 이름 수정", 818, 218, 220, C.red);
    flowStep(slide, "Upsert 저장", "신규 식재료 생성 또는 기존 단가 갱신", 449, 410, 384, C.dark);
    addText(slide, "이미지 모델의 추론 결과를 그대로 믿기보다, 업무 데이터로 쓰기 전 사람이 확인하는 UX를 설계했습니다.", 90, 590, 980, 44, 24, { bold: true });
    addFooter(slide, 5);
  }

  {
    const slide = deck.slides.add();
    addTitle(slide, "구현은 핵심 업무 화면과 API까지 연결되어 있습니다", "단순 데모가 아니라 인증, CRUD, 원가 계산, 리포트까지 한 서비스 흐름으로 구성했습니다.");
    const rows = [
      ["영역", "구현 내용", "대표 파일"],
      ["인증", "회원가입, 로그인, 세션 보호", "src/lib/auth.ts"],
      ["식재료", "CRUD, 검색·필터, 업로드 분석", "api/ingredients/*"],
      ["레시피/메뉴", "메뉴별 판매가와 식재료 사용량 관리", "api/menus/*"],
      ["원가 계산", "단위 변환, 총 원가, 원가율, 마진", "api/cost, lib/units.ts"],
      ["리포트", "원가율 순위, 식재료 비중, 가격 추이", "api/reports"],
    ];
    const tableX = 80;
    const tableY = 202;
    const rowH = 58;
    const widths = [170, 560, 390];
    rows.forEach((row, i) => {
      const y = tableY + i * rowH;
      const isHeader = i === 0;
      panel(slide, tableX, y, 1120, rowH, isHeader ? C.dark : i % 2 === 0 ? C.faint : "#FFFFFF", C.line);
      let x = tableX;
      row.forEach((cell, j) => {
        addText(slide, cell, x + 18, y + 16, widths[j] - 28, 28, isHeader ? 19 : 17, {
          bold: isHeader || j === 0,
          color: isHeader ? "#FFFFFF" : j === 0 ? C.blue : C.ink,
        });
        x += widths[j];
      });
    });
    addText(slide, "데이터 모델은 User → Ingredient/Menu → RecipeItem → PriceHistory 관계로, 사용자별 원가 데이터를 분리합니다.", 84, 600, 960, 36, 22, { color: C.muted });
    addFooter(slide, 6);
  }

  {
    const slide = deck.slides.add();
    addTitle(slide, "결과 품질은 계산 근거와 시각화로 검증됩니다", "원가율 기준과 식재료 비중을 명확히 보여주어 실제 매장 운영 판단에 바로 연결됩니다.");
    slide.charts.add("bar", {
      position: { left: 84, top: 210, width: 520, height: 310 },
      categories: ["양호", "주의", "위험"],
      series: [{ name: "원가율 기준", values: [28, 35, 45], fill: C.blue }],
      hasLegend: false,
      dataLabels: { showValue: true, position: "outEnd" },
      yAxis: { majorGridlines: { style: "solid", fill: "#E5E7EB", width: 1 } },
    });
    panel(slide, 694, 212, 430, 84, "#FFFFFF", C.line);
    addText(slide, "단위 변환", 724, 228, 150, 28, 24, { bold: true, color: C.blue });
    addText(slide, "kg↔g, L↔mL 변환 후 레시피 원가 계산", 724, 262, 360, 24, 17, { color: C.muted });
    panel(slide, 694, 318, 430, 84, "#FFFFFF", C.line);
    addText(slide, "가격 이력", 724, 334, 150, 28, 24, { bold: true, color: C.green });
    addText(slide, "단가 변경 시 추이를 리포트에서 확인", 724, 368, 360, 24, 17, { color: C.muted });
    panel(slide, 694, 424, 430, 84, "#FFFFFF", C.line);
    addText(slide, "운영 판단", 724, 440, 150, 28, 24, { bold: true, color: C.red });
    addText(slide, "30% 초과 메뉴를 우선 개선 대상으로 표시", 724, 474, 360, 24, 17, { color: C.muted });
    addFooter(slide, 7);
  }

  {
    const slide = deck.slides.add();
    addTitle(slide, "평가지표별 근거가 서비스 안에 직접 대응됩니다", "발표 심사 기준에 맞춰 기능과 기술 선택의 이유를 한눈에 정리했습니다.");
    const items = [
      ["1. 주제 적합성 및 기획력", "외식업 원가 관리라는 명확한 현장 문제를 영수증 입력 자동화와 메뉴 손익 판단으로 해결"],
      ["2. AI 모델 및 기술 선정", "Vision, Textract, CSV LLM 분석, Prisma/Next.js를 입력 특성에 맞게 분리 적용"],
      ["3. 멀티모달 연계 완성도", "이미지·CSV 업로드 → AI 추출 → 리뷰 → DB 저장 → 대시보드까지 연결"],
      ["4. 결과 품질 및 활용성", "원가율, 마진, 위험 메뉴, 식재료 비중, 가격 추이를 실제 운영 지표로 제공"],
    ];
    items.forEach((item, i) => {
      const y = 190 + i * 104;
      panel(slide, 80, y, 1110, 76, i % 2 === 0 ? "#FFFFFF" : C.faint, C.line);
      addText(slide, item[0], 110, y + 18, 330, 34, 23, { bold: true, color: i === 0 ? C.blue : i === 1 ? C.green : i === 2 ? C.yellow : C.red });
      addText(slide, item[1], 470, y + 18, 680, 40, 20, { color: C.ink });
    });
    addFooter(slide, 8);
  }

  {
    const slide = deck.slides.add();
    addTitle(slide, "FoodCost AI는 작은 매장의 원가 감각을 데이터화합니다", "다음 단계는 정확도 검증과 운영 자동화를 더 깊게 연결하는 것입니다.");
    bulletList(slide, [
      "영수증 이미지 인식 정확도 평가 세트 구축",
      "식재료 표준명 사전과 바코드 매핑 확대",
      "가격 변동 알림과 메뉴 가격 조정 추천",
      "클라우드 배포 환경에서 사용자별 데이터 백업 강화",
    ], 100, 220, 720, 26, 58);
    panel(slide, 870, 220, 250, 260, "#FFFFFF", C.line);
    addText(slide, "핵심 메시지", 900, 250, 190, 32, 24, { bold: true });
    addText(slide, "입력은 AI가 줄이고,\n판단은 데이터가 빠르게\n도와주는 원가 관리 서비스", 900, 310, 190, 112, 22, { color: C.muted });
    addFooter(slide, 9);
  }

  for (const [index, slide] of deck.slides.items.entries()) {
    const png = await deck.export({ slide, format: "png", scale: 1 });
    await writeBlob(path.join(PREVIEW_DIR, `slide-${String(index + 1).padStart(2, "0")}.png`), png);
    const layout = await slide.export({ format: "layout" });
    await fs.writeFile(path.join(PREVIEW_DIR, `slide-${String(index + 1).padStart(2, "0")}.layout.json`), await layout.text(), "utf8");
  }

  const montage = await deck.export({ format: "webp", montage: true, scale: 1 });
  await writeBlob(path.join(PREVIEW_DIR, "montage.webp"), montage);

  const pptx = await PresentationFile.exportPptx(deck);
  await pptx.save(FINAL_PPTX);
  console.log(FINAL_PPTX);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
