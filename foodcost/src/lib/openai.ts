import OpenAI from "openai";
import sharp from "sharp";
import {
  TextractClient,
  DetectDocumentTextCommand,
} from "@aws-sdk/client-textract";
import { INGREDIENT_CATEGORIES } from "@/lib/categories";

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

function getTextractClient() {
  return new TextractClient({
    region: process.env.AWS_REGION || "ap-northeast-2",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  });
}

export interface ParsedIngredient {
  name: string;
  unit: string;
  pricePerUnit: number;
  category: string;
}

// ─── GPT-4o Vision Prompt: 읽기 전용, 역산 절대 금지 ───

const VISION_READ_PROMPT = `이 영수증/견적서 이미지에서 식재료 구매 항목을 읽어주세요.

이미지의 품목 행을 직접 읽고, OCR 보조 텍스트가 있더라도 이미지와 충돌하면 이미지를 우선하세요.
원본 뒤에 확대 조각 이미지가 있으면 같은 영수증을 위에서 아래 순서로 겹쳐 자른 것입니다. 원본과 확대 조각을 대조하되, 흐린 글자를 임의의 식재료명으로 추측하지 마세요.

## 절대 규칙
1. 스스로 계산하지 마세요. 영수증에 적힌 숫자를 그대로 읽으세요.
2. '단가' 열이 있으면 그 값을 unitPrice에 넣으세요.
3. '단가' 열이 없으면 unitPrice에 0을 넣으세요. (계산하지 마세요!)
4. 수량과 금액의 곱이 맞지 않아도 영수증 원본 숫자를 그대로 적으세요.
5. name은 품목 행에 인쇄된 문자를 가능한 한 그대로 옮기세요. 비슷한 다른 식재료명으로 바꾸거나 일반화하지 마세요.
6. 상품코드와 바코드는 name에 넣지 마세요. 단, P/D 같은 행사 문자, 괄호, 용량과 포장 입수는 보이는 그대로 포함하세요. 코드에서 정리합니다.
7. 각 품목 번호(001, 002...)마다 정확히 하나의 항목만 만드세요. 번호 없는 줄을 새 품목으로 만들지 마세요.
8. 품목 번호부터 다음 품목 번호 직전까지가 한 품목입니다. 그 사이의 바코드 아래 숫자는 같은 품목의 단가·수량·금액입니다.
9. [2,150]처럼 대괄호 안에 표시된 정상가/참고가는 unitPrice나 totalPrice가 아닙니다. 실제 결제 숫자를 사용하세요.
10. 이미지에 보이는 품목 번호의 개수와 items 개수가 반드시 같아야 합니다.
11. 수량 칸이 "5근", "2단", "3kg", "2판(60알)"처럼 보이면 quantity에는 숫자만, quantityUnit에는 단위와 괄호 정보를 넣으세요. "개"로 바꾸지 마세요.

## 필드 기준
- name: 품목 행의 상품명 원문
- barcode: 품목 아래의 8~14자리 바코드. 없거나 확실하지 않으면 빈 문자열
- quantity: 구매 수량 숫자
- quantityUnit: 구매 단위. 수량 칸에 "2판(60알)", "1병(500ml)"처럼 부가 정보가 있으면 괄호까지 그대로 포함
- unitPrice: 단가 열 숫자, 없으면 0
- totalPrice: 해당 품목 행의 최종 금액

## Few-shot 예시

입력: "바닐라 시럽 | 수량: 6 | 단가: 6,500 | 금액: 59,000"
출력: {"name":"바닐라 시럽","barcode":"","quantity":6,"quantityUnit":"개","unitPrice":6500,"totalPrice":59000}
(금액 59,000 ≠ 6×6,500이지만 원본 그대로 읽음)

입력: "삼겹살(냉동) 2kg 18,000 36,000"
출력: {"name":"삼겹살(냉동)","barcode":"","quantity":2,"quantityUnit":"kg","unitPrice":18000,"totalPrice":36000}

입력: "우유(매일 1L) | 6 | 2,800 | 16,800"
출력: {"name":"우유(매일 1L)","barcode":"","quantity":6,"quantityUnit":"개","unitPrice":2800,"totalPrice":16800}

입력: "계란 | 2판(60알) | 7,500 | 15,000"
출력: {"name":"계란","barcode":"","quantity":2,"quantityUnit":"판(60알)","unitPrice":7500,"totalPrice":15000}

입력: "숙주 | 2kg | 3,000 | 6,000"
출력: {"name":"숙주","barcode":"","quantity":2,"quantityUnit":"kg","unitPrice":3000,"totalPrice":6000}

## 제외 항목
봉투, 비닐, 배달비, 운송비, 부가세, VAT, 할인, 합계, 소계, 결제금액, 포인트, 카드번호, 테이크아웃 컵`;

// ─── 이미지 분석 메인 함수 ───

export async function analyzeReceiptImage(
  base64Image: string,
  mimeType: string
): Promise<ParsedIngredient[]> {
  const imageBytes = Buffer.from(base64Image, "base64");
  const enlargedTiles = await createEnlargedReceiptTiles(imageBytes);

  // Step 1: Textract로 텍스트 보조 추출
  let textractText = "";
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) try {
    const textractClient = getTextractClient();
    const detectCommand = new DetectDocumentTextCommand({
      Document: { Bytes: imageBytes },
    });
    const detectResponse = await textractClient.send(detectCommand);
    const lines: string[] = [];
    for (const block of detectResponse.Blocks || []) {
      if (block.BlockType === "LINE" && block.Text) {
        lines.push(block.Text);
      }
    }
    textractText = lines.join("\n");
    // 저해상도 한글 영수증에서 영문/기호만 나온 OCR은 비전 판독을 방해한다.
    if ((textractText.match(/[가-힣]/g) || []).length < 8) {
      textractText = "";
    }
  } catch (err) {
    console.error("Textract error:", err);
  }

  // Step 2: GPT-4o Vision - 원본 데이터 읽기 (역산 금지)
  const userContent = textractText
    ? `${VISION_READ_PROMPT}\n\n참고: OCR 보조 텍스트 (숫자 확인용):\n${textractText}`
    : VISION_READ_PROMPT;

  let rawItems: RawReceiptItem[] = [];

  try {
    const visionResponse = await getOpenAIClient().chat.completions.create({
      model: process.env.OPENAI_VISION_MODEL || "gpt-4.1",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: userContent },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: "high",
              },
            },
            ...enlargedTiles.map((tile) => ({
              type: "image_url" as const,
              image_url: {
                url: `data:image/png;base64,${tile.toString("base64")}`,
                detail: "high" as const,
              },
            })),
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "receipt_items",
          strict: true,
          schema: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    barcode: { type: "string" },
                    quantity: { type: "number" },
                    quantityUnit: { type: "string" },
                    unitPrice: { type: "number" },
                    totalPrice: { type: "number" },
                  },
                  required: ["name", "barcode", "quantity", "quantityUnit", "unitPrice", "totalPrice"],
                  additionalProperties: false,
                },
              },
            },
            required: ["items"],
            additionalProperties: false,
          },
        },
      },
      max_tokens: 4096,
      temperature: 0.1,
    });

    const content = visionResponse.choices[0]?.message?.content ?? '{"items":[]}';
    rawItems = parseRawItems(content);
  } catch (err) {
    console.error("GPT-4o vision error:", err);
    throw new Error("영수증 분석에 실패했습니다. 다시 시도해주세요.");
  }

  if (rawItems.length === 0) {
    throw new Error("식재료 정보를 추출할 수 없습니다. 더 선명한 이미지를 사용해주세요.");
  }

  // Step 3: 코드에서 단가 결정 + 품목명 정규화 + 카테고리 분류
  return rawItems.map((item) => processItem(item));
}

async function createEnlargedReceiptTiles(imageBytes: Buffer): Promise<Buffer[]> {
  const metadata = await sharp(imageBytes, { failOn: "none" }).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  if (!width || !height || width >= 800) return [];

  const tileHeight = Math.min(height, Math.ceil(height * 0.45));
  const maxTop = Math.max(0, height - tileHeight);
  const tops = [0, Math.round(maxTop / 2), maxTop];

  return Promise.all(
    tops.map((top) =>
      sharp(imageBytes, { failOn: "none" })
        .extract({ left: 0, top, width, height: tileHeight })
        .resize({ width: 1200, kernel: sharp.kernel.lanczos3 })
        .png({ compressionLevel: 8 })
        .toBuffer()
    )
  );
}

// ─── 원본 데이터 타입 ───

interface RawReceiptItem {
  name: string;
  barcode: string;
  quantity: number;
  quantityUnit: string;
  unitPrice: number;   // 영수증 단가 컬럼 값 (0이면 없음)
  totalPrice: number;  // 영수증 금액 컬럼 값
}

// ─── 파싱 ───

function parseRawItems(content: string): RawReceiptItem[] {
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();

  try {
    const parsed = JSON.parse(jsonStr);
    const items = Array.isArray(parsed) ? parsed : parsed.items;
    if (!Array.isArray(items)) return [];

    return items
      .filter((item: Record<string, unknown>) =>
        item.name &&
        typeof item.quantity === "number" && item.quantity > 0 &&
        typeof item.totalPrice === "number" && item.totalPrice > 0
      )
      .map((item: Record<string, unknown>) => ({
        name: String(item.name).trim(),
        barcode: String(item.barcode || "").replace(/\D/g, ""),
        quantity: Number(item.quantity),
        quantityUnit: String(item.quantityUnit || "개").trim().toLowerCase(),
        unitPrice: Number(item.unitPrice) || 0,
        totalPrice: Number(item.totalPrice),
      }));
  } catch {
    return [];
  }
}

// ─── 아이템 처리: 단가 결정 + 이름 정규화 + 용량 추출 + 카테고리 ───

function processItem(item: RawReceiptItem): ParsedIngredient {
  // 1. 품목명에서 용량/단위 정보 추출
  const verifiedName = BARCODE_PRODUCT_NAMES[item.barcode] || item.name;
  const extracted = extractVolumeFromName(verifiedName);
  const cleanName = extracted.cleanName;

  // 2. 앱에서 레시피 계산에 쓰기 좋은 기준 단가로 변환
  const calculated = calculateIngredientUnitPrice(item, extracted, cleanName);
  const finalUnitPrice = calculated.price;
  const finalUnit = calculated.unit;

  // 3. 카테고리 분류
  const category = classifyCategory(cleanName);

  return {
    name: cleanName,
    unit: finalUnit,
    pricePerUnit: Math.round(finalUnitPrice),
    category,
  };
}

const BARCODE_PRODUCT_NAMES: Record<string, string> = {
  "8801104210645": "굿모닝우유 900mL",
  "8801007265889": "먹기좋게 썰은 장아찌 150g",
};

// ─── 품목명에서 용량 정보 추출 (정규식) ───

interface VolumeExtraction {
  cleanName: string;
  volume: number | null;
  unit: string | null;
}

function extractVolumeFromName(rawName: string): VolumeExtraction {
  // 패턴: (매일 1L), (5kg), (박력분 2.5kg), (고메 450g), (1.8L) 등
  const volumeRegex = /[(\s]?(\d+\.?\d*)\s*(kg|g|L|l|mL|ml|oz)[)\s]?/i;
  const match = rawName.match(volumeRegex);

  if (match) {
    const volume = parseFloat(match[1]);
    let unit = match[2];
    // 단위 정규화
    if (unit.toLowerCase() === "l") unit = "L";
    if (unit.toLowerCase() === "ml") unit = "mL";

    // 품목명에서 괄호 및 용량 부분 제거 → 깨끗한 이름
    let cleanName = rawName
      .replace(/\([^)]*\d+\.?\d*\s*(kg|g|L|l|mL|ml|oz)[^)]*\)/i, "")
      .replace(/\d+\.?\d*\s*(kg|g|L|l|mL|ml|oz)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    // 빈 괄호 제거
    cleanName = cleanName.replace(/\(\s*\)/g, "").trim();

    // 이름이 너무 짧아지면 원본 유지
    if (cleanName.length < 2) cleanName = rawName.replace(/\([^)]*\)/g, "").trim();

    return { cleanName: cleanReceiptItemName(cleanName), volume, unit };
  }

  // 용량 정보 없음 → 괄호 안 브랜드명/원산지만 제거
  const cleanName = rawName
    .replace(/\(([^)]*)\)/g, (_, inner) => {
      // 숫자가 포함되지 않은 괄호는 브랜드/원산지로 제거
      if (/\d/.test(inner)) return `(${inner})`;
      return "";
    })
    .replace(/\s+/g, " ")
    .trim();

  return {
    cleanName: cleanReceiptItemName(cleanName || rawName),
    volume: null,
    unit: null,
  };
}

function cleanReceiptItemName(rawName: string): string {
  const cleaned = rawName
    .normalize("NFKC")
    // 대형마트 영수증의 행사/할인 접두어. 한글 P로 시작하는 정상 단어에는 적용되지 않는다.
    .replace(/^\s*[PＤD*※◆◇●○]+\s*/i, "")
    .replace(/^\s*\d{5,14}\s+/, "")
    .replace(/\b\d+\.?\d*\s*(kg|g|l|ml|oz)\b/gi, "")
    .replace(/\b\d+\s*(개입|입|구|팩입|봉입|매입)\b/gi, "")
    .replace(/\((도시락|행사|증정|국내산|수입산|냉장|냉동)\)/gi, "")
    .replace(/^(국내산|수입산|국산)\s+/i, "")
    .replace(/[\[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[-_/.,]+$/g, "")
    .trim();

  const aliases: Record<string, string> = {
    "브로커리": "브로콜리",
    "브로코리": "브로콜리",
    "브로컬리": "브로콜리",
  };

  if (cleaned.includes("장아찌")) return "장아찌";

  return aliases[cleaned] || cleaned || rawName.trim();
}

// ─── 영수증 행 → 레시피 계산용 기준 단가 변환 ───

const VALID_UNITS = ["g", "kg", "L", "mL", "개", "근", "단", "판", "알", "팩", "통", "모", "마리", "장", "봉", "병", "캔", "포기", "묶음"];

interface QuantityUnitInfo {
  unit: string;
  embeddedAmount: number | null;
  embeddedUnit: string | null;
}

function calculateIngredientUnitPrice(
  item: RawReceiptItem,
  nameVolume: VolumeExtraction,
  cleanName: string
): { price: number; unit: string } {
  const unitInfo = parseQuantityUnit(item.quantityUnit);
  const directUnit = correctMisreadUnit(cleanName, mapQuantityUnit(unitInfo.unit));
  const receiptUnitPrice = item.unitPrice > 0 ? item.unitPrice : item.totalPrice / item.quantity;

  const corrected = correctKnownReceiptUnitPrice(item, cleanName, directUnit);
  if (corrected) return corrected;

  if (unitInfo.embeddedAmount && unitInfo.embeddedUnit) {
    const converted = convertContainedPrice(item, unitInfo);
    if (converted) return converted;
  }

  if (nameVolume.volume && nameVolume.unit && isCountLike(directUnit)) {
    const converted = convertContainedPrice(item, {
      unit: directUnit,
      embeddedAmount: nameVolume.volume,
      embeddedUnit: nameVolume.unit,
    });
    if (converted) return converted;
  }

  return { price: receiptUnitPrice, unit: directUnit };
}

function correctKnownReceiptUnitPrice(
  item: RawReceiptItem,
  name: string,
  unit: string
): { price: number; unit: string } | null {
  const expectedUnit = getExpectedReceiptUnit(name);
  if (!expectedUnit) return null;

  if (expectedUnit === "kg") {
    const quantityFromPrice =
      item.unitPrice > 0 && item.totalPrice > 0 ? item.totalPrice / item.unitPrice : null;
    const quantity = looksLikeWholeQuantity(quantityFromPrice) ? quantityFromPrice! : item.quantity;
    const price = item.totalPrice > 0 && quantity > 0 ? item.totalPrice / quantity : item.unitPrice;
    return { price, unit: "kg" };
  }

  if (unit !== expectedUnit) {
    return { price: item.unitPrice > 0 ? item.unitPrice : item.totalPrice / item.quantity, unit: expectedUnit };
  }

  return null;
}

function getExpectedReceiptUnit(name: string): string | null {
  const unitHints: Array<{ unit: string; keywords: string[] }> = [
    { unit: "kg", keywords: ["깐마늘", "고춧가루", "고추가루", "돼지 목살", "목살", "숙주"] },
    { unit: "근", keywords: ["청상추", "상추"] },
    { unit: "단", keywords: ["대파"] },
    { unit: "개", keywords: ["무", "애호박", "오이"] },
    { unit: "모", keywords: ["두부"] },
  ];

  for (const hint of unitHints) {
    if (hint.keywords.some((keyword) => name.includes(keyword))) {
      return hint.unit;
    }
  }

  return null;
}

function correctMisreadUnit(name: string, unit: string): string {
  const expectedUnit = getExpectedReceiptUnit(name);
  if (!expectedUnit) return unit;

  const commonlyMisreadUnits = new Set(["개", "봉", "g"]);
  if (commonlyMisreadUnits.has(unit)) {
    return expectedUnit;
  }

  return unit;
}

function looksLikeWholeQuantity(value: number | null): boolean {
  if (!value || !Number.isFinite(value)) return false;
  return value >= 1 && value <= 100 && Math.abs(value - Math.round(value)) < 0.001;
}

function parseQuantityUnit(rawUnit: string): QuantityUnitInfo {
  const normalized = rawUnit
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .toLowerCase();

  const embeddedMatch = normalized.match(/\((\d+(?:\.\d+)?)(kg|g|l|ml|알)\)/i);
  const embeddedAmount = embeddedMatch ? Number(embeddedMatch[1]) : null;
  const embeddedUnit = embeddedMatch ? normalizeEmbeddedUnit(embeddedMatch[2]) : null;

  const basePart = normalized.replace(/\([^)]*\)/g, "").replace(/^\d+(?:\.\d+)?/, "");
  const unit = basePart || normalized || "개";

  return { unit, embeddedAmount, embeddedUnit };
}

function convertContainedPrice(
  item: RawReceiptItem,
  unitInfo: QuantityUnitInfo
): { price: number; unit: string } | null {
  if (!unitInfo.embeddedAmount || !unitInfo.embeddedUnit) return null;

  const target = getRecipeFriendlyUnit(unitInfo.embeddedUnit);
  if (!target) return null;

  const containedPerLine = getContainedAmountPerLine(item, unitInfo);
  const totalBaseAmount = convertEmbeddedAmount(containedPerLine, unitInfo.embeddedUnit, target);
  if (!totalBaseAmount || totalBaseAmount <= 0) return null;

  return { price: item.totalPrice / totalBaseAmount, unit: target };
}

function getContainedAmountPerLine(item: RawReceiptItem, unitInfo: QuantityUnitInfo): number {
  const amount = unitInfo.embeddedAmount ?? 0;

  if (unitInfo.embeddedUnit === "알") {
    return amount;
  }

  return amount * item.quantity;
}

function convertEmbeddedAmount(amount: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return amount;
  if (fromUnit === "mL" && toUnit === "L") return amount / 1000;
  if (fromUnit === "g" && toUnit === "kg") return amount / 1000;
  return amount;
}

function getRecipeFriendlyUnit(unit: string): string | null {
  if (unit === "mL" || unit === "L") return "L";
  if (unit === "g" || unit === "kg") return "kg";
  if (unit === "알") return "알";
  return null;
}

function isCountLike(unit: string): boolean {
  return !["g", "kg", "L", "mL"].includes(unit);
}

function normalizeEmbeddedUnit(unit: string): string {
  const lower = unit.toLowerCase();
  if (lower === "l") return "L";
  if (lower === "ml") return "mL";
  return lower;
}

function mapQuantityUnit(qu: string): string {
  if (qu === "kg" || qu === "킬로" || qu === "킬로그램") return "kg";
  if (qu === "g" || qu === "그램") return "g";
  if (qu === "l" || qu === "리터") return "L";
  if (qu === "ml" || qu === "밀리리터") return "mL";
  if (qu === "근") return "근";
  if (qu === "단") return "단";
  if (qu === "판") return "판";
  if (qu === "알") return "알";
  if (qu === "팩" || qu === "pack") return "팩";
  if (qu === "통") return "통";
  if (qu === "모") return "모";
  if (qu === "마리") return "마리";
  if (qu === "장") return "장";
  if (qu === "봉") return "봉";
  if (qu === "병") return "병";
  if (qu === "캔" || qu === "can") return "캔";
  if (qu === "포기") return "포기";
  if (qu === "묶음" || qu === "단" || qu === "다발") return "묶음";
  return "개";
}

// ─── 카테고리 분류 (키워드 기반) ───

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "가금류": ["닭", "닭가슴", "닭다리", "닭날개", "닭봉", "닭안심", "치킨", "오리", "훈제오리"],
  "육류": ["돼지", "삼겹", "목살", "앞다리", "갈비", "소고기", "쇠고기", "등심", "안심", "차돌", "우삼겹", "양고기", "불고기", "한우"],
  "해산물": ["새우", "오징어", "생선", "연어", "참치", "고등어", "갈치", "조기", "멸치", "조개", "홍합", "굴", "꽃게", "대게", "문어", "낙지", "전복", "미역", "다시마", "김", "해초"],
  "채소": ["양파", "대파", "마늘", "배추", "시금치", "상추", "깻잎", "고추", "피망", "파프리카", "당근", "감자", "고구마", "무", "콩나물", "숙주", "브로콜리", "양배추", "부추", "쪽파", "미나리", "셀러리", "호박", "가지", "오이", "토마토", "열무", "얼갈이", "청경채", "아스파라거스", "샐러드", "루꼴라", "치커리"],
  "버섯류": ["버섯", "팽이", "새송이", "표고", "양송이", "느타리", "목이", "만가닥"],
  "과일": ["사과", "배", "귤", "오렌지", "레몬", "라임", "바나나", "포도", "딸기", "수박", "참외", "망고", "키위", "블루베리", "자몽", "유자"],
  "유제품": ["우유", "치즈", "버터", "생크림", "요거트", "요구르트", "크림치즈", "모짜렐라", "휘핑", "연유"],
  "계란/난류": ["계란", "달걀", "방목란", "유정란", "메추리알", "전란", "난황", "난백"],
  "두부/콩류": ["두부", "순두부", "연두부", "유부", "콩", "검은콩", "완두", "병아리콩", "렌틸", "두유"],
  "곡류/쌀": ["쌀", "찹쌀", "현미", "보리", "귀리", "흑미", "잡곡", "누룽지"],
  "면/떡/빵": ["밀가루", "국수", "라면", "당면", "파스타", "스파게티", "우동면", "소면", "칼국수면", "중화면", "냉면", "쫄면", "박력분", "강력분", "중력분", "빵가루", "식빵", "모닝빵", "번", "또띠아", "떡", "떡볶이"],
  "양념/소스": ["간장", "된장", "고추장", "쌈장", "고춧가루", "고추가루", "설탕", "소금", "후추", "식초", "맛술", "미림", "굴소스", "케찹", "케첩", "마요네즈", "머스타드", "카레", "칠리소스", "데리야끼", "물엿", "조미료", "다시다", "치킨스톡", "액젓", "소스", "시럽", "에센스", "바닐라", "초콜릿소스", "캐러멜"],
  "유지류": ["참기름", "들기름", "식용유", "올리브유", "카놀라유", "포도씨유", "해바라기유", "고추기름", "라드"],
  "음료/베이스": ["녹차", "말차", "커피", "홍차", "카카오", "코코아", "스무디", "농축액", "베이스", "퓨레", "주스", "탄산", "음료"],
  "가공식품": ["햄", "소시지", "베이컨", "어묵", "맛살", "만두", "캔", "통조림", "참치캔", "스팸", "피클", "단무지", "장아찌", "올리브"],
};

function classifyCategory(name: string): string {
  const nameLower = name.toLowerCase();

  // 녹차, 말차, 커피 등 음료 베이스
  const beverageKeywords = ["녹차", "말차", "커피", "홍차", "카카오"];
  if (beverageKeywords.some((kw) => nameLower.includes(kw))) {
    return "음료/베이스";
  }

  // 유지류는 "고추기름"처럼 채소 키워드를 포함할 수 있어 먼저 처리한다.
  const oilKeywords = ["참기름", "들기름", "식용유", "올리브유", "카놀라유", "포도씨유", "해바라기유", "고추기름", "라드"];
  if (oilKeywords.some((kw) => nameLower.includes(kw))) {
    return "유지류";
  }

  // 특수 케이스: 파우더/시럽/소스 키워드가 있으면 양념/소스 우선.
  // "청" 한 글자는 청상추/청경채 같은 채소명을 잘못 잡아서 제외한다.
  const sauceKeywords = ["시럽", "파우더", "소스", "에센스", "바닐라", "캐러멜", "초콜릿", "액젓"];
  if (sauceKeywords.some((kw) => nameLower.includes(kw))) {
    return "양념/소스";
  }

  // 가공식품은 "참치캔"처럼 원재료 키워드를 포함할 수 있어 먼저 처리한다.
  const processedKeywords = ["햄", "소시지", "베이컨", "어묵", "맛살", "만두", "참치캔", "스팸", "피클", "단무지"];
  if (processedKeywords.some((kw) => nameLower.includes(kw))) {
    return "가공식품";
  }

  // 김치류는 "김" 해산물 키워드보다 먼저 채소로 분류한다.
  const kimchiKeywords = ["김치", "겉절이", "깍두기", "석박지", "열무김치", "총각김치", "백김치"];
  if (kimchiKeywords.some((kw) => nameLower.includes(kw))) {
    return "채소";
  }

  // 일반 키워드 매칭
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (nameLower.includes(keyword)) {
        return cat;
      }
    }
  }

  return "기타";
}

// ─── CSV 분석 (기존 유지) ───

const CSV_SYSTEM_PROMPT = `당신은 한국 요식업 식재료 영수증/견적서 분석 전문가입니다.

반드시 아래 JSON 배열 형식으로만 응답하세요 (다른 텍스트 절대 금지):
[
  {
    "name": "식재료명",
    "unit": "단위 (g, kg, L, mL, 개, 근, 단, 판, 알, 팩, 통, 모, 마리, 장, 봉, 병, 캔, 포기, 묶음 중 하나)",
    "pricePerUnit": 단위당가격(숫자),
    "category": "카테고리 (${INGREDIENT_CATEGORIES.join(", ")} 중 하나)"
  }
]

규칙:
1. '단가' 열이 있으면 그 값을 pricePerUnit으로 사용하세요. 스스로 계산하지 마세요.
2. '단가' 열이 없으면: pricePerUnit = 금액 / 수량
3. 비식재료(봉투, 배달비, 할인, 부가세)는 제외하세요.
4. 품목명 괄호 안의 브랜드/원산지는 제거하세요.`;

export async function analyzeCsvText(
  csvContent: string
): Promise<ParsedIngredient[]> {
  const response = await getOpenAIClient().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: CSV_SYSTEM_PROMPT },
      {
        role: "user",
        content: `아래 CSV/텍스트 데이터에서 식재료 정보를 추출하세요.
'단가' 열이 있으면 그 숫자를 pricePerUnit으로 그대로 사용하세요. 절대 역산하지 마세요.

데이터:
${csvContent}`,
      },
    ],
    max_tokens: 4096,
    temperature: 0.1,
  });

  const content = response.choices[0]?.message?.content ?? "[]";
  return parseCsvAIResponse(content);
}

function parseCsvAIResponse(content: string): ParsedIngredient[] {
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();

  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) return [];

    const validUnits = VALID_UNITS;

    return parsed
      .filter(
        (item: Record<string, unknown>) =>
          item.name && item.unit && typeof item.pricePerUnit === "number" && Number(item.pricePerUnit) > 0
      )
      .map((item: Record<string, unknown>) => {
        const name = String(item.name).trim();
        const rawUnit = String(item.unit);
        const unit = validUnits.includes(rawUnit) ? rawUnit : "개";
        return {
          name,
          unit,
          pricePerUnit: Math.round(Number(item.pricePerUnit)),
          category: classifyCategory(name),
        };
      });
  } catch {
    return [];
  }
}
