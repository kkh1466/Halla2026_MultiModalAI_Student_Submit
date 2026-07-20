# 푸드코스트 (FoodCost)

영수증 한 장으로 끝내는 요식업 원가관리 서비스

영수증 사진을 찍어 업로드하면 AI가 식재료를 자동 인식하고, 레시피 기반으로 메뉴별 원가를 실시간 계산해주는 웹 애플리케이션입니다.

## 핵심 기능

### 1. AI 영수증 자동 인식
- 영수증/견적서 이미지(JPG, PNG, WebP) 업로드 시 AI가 식재료명, 수량, 단가를 자동 추출
- CSV 파일 업로드도 지원
- GPT-4o Vision(품목명 인식) + AWS Textract(숫자/금액 OCR) 하이브리드 파이프라인
- 동일 식재료 업로드 시 단가 자동 갱신 + 이력 기록

### 2. 레시피 기반 원가 자동 계산
- 메뉴별 식재료 배합(레시피) 등록
- 원가 = 식재료 단가 x 사용량 자동 산출
- 원가율, 마진, 위험도(양호/주의/위험) 실시간 표시
- 식재료 단가 변경 시 연관 메뉴 원가 자동 반영

### 3. 대시보드 및 리포트
- 통계 요약: 총 메뉴 수, 식재료 수, 평균 원가율, 위험 메뉴 수
- 원가율 순위 바 차트
- 식재료 비용 비중 파이 차트
- 월별 단가 변동 추이 라인 차트

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| 언어 | TypeScript |
| 스타일링 | Tailwind CSS |
| DB | SQLite + Prisma ORM |
| 인증 | NextAuth.js (이메일 + Google + Kakao) |
| AI/OCR | OpenAI GPT-4o, AWS Textract |
| 차트 | Recharts |
| 상태관리 | Zustand |
| 검증 | Zod |

## 시작하기

### 사전 요구사항
- Node.js 18 이상
- OpenAI API 키
- AWS Access Key (Textract 사용 시)

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 데이터베이스 초기화
npx prisma db push

# 시드 데이터 입력 (선택)
npm run seed

# 개발 서버 실행
npm run dev
```

브라우저에서 http://localhost:3000 으로 접속합니다.

### 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 아래 내용을 입력합니다:

```env
# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# OpenAI
OPENAI_API_KEY="sk-..."

# AWS (Textract OCR)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="ap-northeast-2"

# OAuth (선택 - 소셜 로그인 사용 시)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
KAKAO_CLIENT_ID=""
KAKAO_CLIENT_SECRET=""
```

## 프로젝트 구조

```
src/
├── app/
│   ├── (auth)/          # 로그인, 회원가입
│   ├── (dashboard)/     # 대시보드, 식재료, 레시피, 원가, 리포트
│   └── api/             # REST API 엔드포인트
├── components/
│   ├── forms/           # IngredientModal, RecipeEditor, UploadModal
│   └── layout/          # Sidebar
├── lib/
│   ├── openai.ts        # AI 영수증 분석 파이프라인
│   ├── auth.ts          # NextAuth 설정
│   ├── prisma.ts        # Prisma 클라이언트
│   └── utils.ts         # 포맷팅/계산 유틸리티
└── types/               # TypeScript 인터페이스
```

## AI 파이프라인 구조

```
영수증 이미지 업로드
    │
    ├─→ AWS Textract: 텍스트 OCR (숫자/금액 정확도 보완)
    │
    ├─→ GPT-4o Vision: 품목명 + 수량 + 단가 + 금액 읽기
    │     (Structured Output JSON Schema 적용)
    │
    └─→ 코드 후처리:
          - 영수증 단가 컬럼 값 우선 사용 (역산 금지)
          - 정규식으로 품목명 내 용량 추출
          - 키워드 기반 카테고리 자동 분류
          - 동일 식재료 Upsert (단가 갱신 + 이력 기록)
```

## 데모 계정

시드 데이터를 넣었다면 아래 계정으로 로그인할 수 있습니다:

- 이메일: `demo@foodcost.kr`
- 비밀번호: `demo1234`

## 라이선스

MIT
