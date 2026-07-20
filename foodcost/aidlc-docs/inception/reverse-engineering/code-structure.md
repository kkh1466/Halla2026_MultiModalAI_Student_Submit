# Code Structure

## Build System
- **Type**: npm (Next.js)
- **Configuration**: package.json, tsconfig.json, postcss.config.mjs, tailwind.config.ts, next.config.mjs
- **Build Command**: `next build`
- **Dev Command**: `next dev`
- **Seed Command**: `npx tsx prisma/seed.ts`

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 인증 Route Group (비보호)
│   │   ├── login/page.tsx        # 로그인 페이지
│   │   └── register/page.tsx     # 회원가입 페이지
│   ├── (dashboard)/              # 대시보드 Route Group (보호)
│   │   ├── layout.tsx            # 대시보드 레이아웃 (Sidebar 포함)
│   │   ├── dashboard/page.tsx    # 대시보드 메인
│   │   ├── ingredients/page.tsx  # 식재료 관리
│   │   ├── recipes/page.tsx      # 레시피/메뉴 관리
│   │   ├── cost/page.tsx         # 원가 계산 결과
│   │   └── reports/page.tsx      # 리포트/차트
│   ├── api/                      # API Route Handlers
│   │   ├── auth/                 # 인증 API
│   │   ├── ingredients/          # 식재료 API
│   │   ├── menus/                # 메뉴 API
│   │   ├── cost/                 # 원가 계산 API
│   │   ├── dashboard/            # 대시보드 API
│   │   └── reports/              # 리포트 API
│   ├── layout.tsx                # 루트 레이아웃
│   ├── page.tsx                  # 루트 페이지 (리다이렉트)
│   ├── providers.tsx             # SessionProvider 래퍼
│   └── globals.css               # 글로벌 스타일
├── components/                   # 재사용 컴포넌트
│   ├── forms/                    # 폼 컴포넌트
│   │   ├── IngredientModal.tsx   # 식재료 추가/수정 모달
│   │   └── RecipeEditor.tsx      # 레시피 편집 모달
│   ├── layout/                   # 레이아웃 컴포넌트
│   │   └── Sidebar.tsx           # 사이드바 내비게이션
│   ├── charts/                   # 차트 컴포넌트 (빈 디렉토리)
│   └── ui/                       # UI 기본 컴포넌트 (빈 디렉토리)
├── lib/                          # 유틸리티/라이브러리
│   ├── auth.ts                   # NextAuth 설정
│   ├── prisma.ts                 # Prisma 클라이언트 싱글톤
│   ├── session.ts                # 현재 사용자 조회 헬퍼
│   └── utils.ts                  # 포맷팅/계산 유틸리티
├── store/                        # 상태 관리
│   └── index.ts                  # Zustand UI 상태 스토어
├── types/                        # 타입 정의
│   └── index.ts                  # 공통 인터페이스 정의
└── middleware.ts                 # NextAuth 미들웨어 (라우트 보호)
```

## Existing Files Inventory

### Pages (App Router)
- `src/app/page.tsx` - 루트 페이지: 세션 유무에 따라 /dashboard 또는 /login으로 리다이렉트
- `src/app/layout.tsx` - 루트 레이아웃: HTML, 메타데이터, Providers 설정
- `src/app/providers.tsx` - NextAuth SessionProvider 래퍼
- `src/app/(auth)/login/page.tsx` - 로그인 페이지 (이메일 + Google/Kakao 소셜 로그인)
- `src/app/(auth)/register/page.tsx` - 회원가입 페이지 (이메일/비밀번호/이름)
- `src/app/(dashboard)/layout.tsx` - 대시보드 레이아웃 (세션 확인 + Sidebar)
- `src/app/(dashboard)/dashboard/page.tsx` - 대시보드 메인 (통계 카드 + 경고 메뉴 + 최근 메뉴)
- `src/app/(dashboard)/ingredients/page.tsx` - 식재료 CRUD 페이지 (검색, 목록, 추가/수정/삭제)
- `src/app/(dashboard)/recipes/page.tsx` - 메뉴/레시피 관리 (메뉴 생성, 레시피 편집, 원가 미리보기)
- `src/app/(dashboard)/cost/page.tsx` - 원가 계산 결과 (정렬, 상세 내역 확장, 위험도 배지)
- `src/app/(dashboard)/reports/page.tsx` - 리포트 (라인차트, 바차트, 파이차트)

### API Routes
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth 핸들러
- `src/app/api/auth/register/route.ts` - POST 회원가입
- `src/app/api/ingredients/route.ts` - GET 목록 / POST 생성
- `src/app/api/ingredients/[id]/route.ts` - PUT 수정 / DELETE 삭제
- `src/app/api/ingredients/[id]/history/route.ts` - GET 단가 이력
- `src/app/api/menus/route.ts` - GET 목록 / POST 생성
- `src/app/api/menus/[id]/route.ts` - GET 상세 / PUT 수정 / DELETE 삭제
- `src/app/api/menus/[id]/recipe/route.ts` - GET 레시피 / PUT 레시피 전체 교체
- `src/app/api/cost/route.ts` - GET 전체 메뉴 원가 계산
- `src/app/api/dashboard/route.ts` - GET 대시보드 요약 데이터
- `src/app/api/reports/route.ts` - GET 리포트 데이터

### Components
- `src/components/layout/Sidebar.tsx` - 사이드바 (내비게이션 5개 + 로그아웃)
- `src/components/forms/IngredientModal.tsx` - 식재료 추가/수정 모달
- `src/components/forms/RecipeEditor.tsx` - 레시피 편집 모달 (식재료 추가/삭제/수량 변경)

### Libraries
- `src/lib/auth.ts` - NextAuth 옵션 (Credentials + Google + Kakao, callbacks)
- `src/lib/prisma.ts` - Prisma 클라이언트 싱글톤 (hot-reload 대응)
- `src/lib/session.ts` - getCurrentUser() 헬퍼 함수
- `src/lib/utils.ts` - formatKRW, formatPercent, getCostRateLevel, calculateCostRate, calculateMargin

### State/Types
- `src/store/index.ts` - Zustand UI 상태 (사이드바 열림/닫힘만 관리)
- `src/types/index.ts` - Ingredient, Menu, RecipeItem, CostResult, DashboardSummary 인터페이스

### Middleware
- `src/middleware.ts` - 보호 라우트 설정 (dashboard, ingredients, recipes, cost, reports)

### Database
- `prisma/schema.prisma` - 5 모델 정의 (User, Ingredient, IngredientPriceHistory, Menu, RecipeItem)
- `prisma/seed.ts` - 데모 데이터 시드 (사용자 1명, 식재료 15개, 메뉴 5개)
- `prisma/dev.db` - SQLite 데이터베이스 파일

## Design Patterns

### Repository Pattern (via Prisma)
- **Location**: 모든 API Route Handlers
- **Purpose**: 데이터 접근 추상화
- **Implementation**: Prisma Client를 직접 사용하여 DB 쿼리. 별도 Repository 클래스 없이 API 핸들러에서 직접 호출

### Server-Side Authentication Guard
- **Location**: `src/app/(dashboard)/layout.tsx`, 모든 API routes
- **Purpose**: 인증된 사용자만 접근 가능하도록 보호
- **Implementation**: 레이아웃에서 getServerSession 확인 + API에서 getCurrentUser 확인

### Modal Pattern
- **Location**: `src/components/forms/IngredientModal.tsx`, `RecipeEditor.tsx`
- **Purpose**: 컨텍스트를 유지한 채 데이터 입력/수정
- **Implementation**: 오버레이 + 중앙 배치 + aria-modal 접근성 속성

### Replace-All Pattern (Recipe Management)
- **Location**: `src/app/api/menus/[id]/recipe/route.ts`
- **Purpose**: 레시피 수정 시 기존 항목 전체 삭제 후 재생성
- **Implementation**: Prisma $transaction으로 deleteMany + createMany 원자적 실행

## Critical Dependencies

### next (14.2.35)
- **Usage**: 전체 애플리케이션 프레임워크
- **Purpose**: App Router, SSR, API Routes, Image Optimization

### @prisma/client (^5.22.0)
- **Usage**: 모든 데이터베이스 쿼리
- **Purpose**: 타입 안전한 ORM, 마이그레이션, 쿼리 빌더

### next-auth (^4.24.11)
- **Usage**: 인증 전체 시스템
- **Purpose**: Credentials/OAuth 인증, JWT 세션, 미들웨어

### recharts (^2.15.0)
- **Usage**: 리포트 페이지 차트
- **Purpose**: LineChart, BarChart, PieChart 렌더링

### zod (^3.24.1)
- **Usage**: API 요청 검증
- **Purpose**: 런타임 타입 검증 및 에러 메시지 생성

### zustand (^4.5.5)
- **Usage**: 클라이언트 상태 관리
- **Purpose**: 사이드바 UI 상태 (현재 최소한의 사용)

### bcryptjs (^2.4.3)
- **Usage**: 비밀번호 해싱
- **Purpose**: 회원가입 시 해싱, 로그인 시 비교
