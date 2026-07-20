# 푸드코스트 자동계산 서비스 - 기술 설계서

## 1. 아키텍처 개요

### 시스템 아키텍처
Next.js 풀스택 모놀리식 아키텍처를 채택하며, App Router 기반으로 서버/클라이언트 컴포넌트를 구분하여 구현한다.

```
[Client Browser]
       │
       ▼
[Next.js App Router]
  ├── Pages (App Router)
  ├── API Routes (/api/*)
  └── Server Actions
       │
       ▼
[Prisma ORM]
       │
       ▼
[PostgreSQL (Supabase)]
```

### 디렉토리 구조
```
foodcost/
├── src/
│   ├── app/                    # App Router 페이지
│   │   ├── (auth)/             # 인증 관련 페이지 그룹
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   ├── (dashboard)/        # 인증 필요 페이지 그룹
│   │   │   ├── page.tsx        # 대시보드 (메인)
│   │   │   ├── ingredients/    # 식재료 관리
│   │   │   ├── recipes/        # 레시피/메뉴 등록
│   │   │   ├── cost/           # 원가 계산 결과
│   │   │   └── reports/        # 리포트
│   │   ├── api/                # API Routes
│   │   │   ├── auth/           # NextAuth 엔드포인트
│   │   │   ├── ingredients/    # 식재료 CRUD
│   │   │   ├── menus/          # 메뉴 CRUD
│   │   │   ├── recipes/        # 레시피 CRUD
│   │   │   └── reports/        # 리포트 데이터
│   │   ├── layout.tsx          # 루트 레이아웃
│   │   └── page.tsx            # 랜딩/리다이렉트
│   ├── components/             # 재사용 컴포넌트
│   │   ├── ui/                 # 기본 UI 컴포넌트
│   │   ├── forms/              # 폼 컴포넌트
│   │   ├── charts/             # 차트 컴포넌트
│   │   └── layout/             # 레이아웃 컴포넌트
│   ├── lib/                    # 유틸리티 및 설정
│   │   ├── prisma.ts           # Prisma 클라이언트
│   │   ├── auth.ts             # NextAuth 설정
│   │   └── utils.ts            # 공통 유틸
│   ├── store/                  # Zustand 스토어
│   │   └── index.ts
│   └── types/                  # TypeScript 타입 정의
│       └── index.ts
├── prisma/
│   ├── schema.prisma           # DB 스키마
│   └── migrations/             # 마이그레이션
├── public/                     # 정적 파일
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

---

## 2. 데이터 모델

### ERD (Entity Relationship Diagram)

```
User 1──N Ingredient
User 1──N Menu
Menu 1──N RecipeItem N──1 Ingredient
Ingredient 1──N IngredientPriceHistory
```

### 테이블 설계

#### User
| 필드 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | PK |
| email | String | 이메일 (unique) |
| password | String? | 해싱된 비밀번호 (소셜 로그인 시 null) |
| name | String | 사용자명 |
| provider | String | 인증 제공자 (credentials, google, kakao) |
| createdAt | DateTime | 생성일 |
| updatedAt | DateTime | 수정일 |

#### Ingredient (식재료)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | PK |
| userId | String | FK → User |
| name | String | 식재료명 |
| unit | String | 구매 단위 (kg, L, 개 등) |
| pricePerUnit | Float | 단가 (원) |
| category | String? | 카테고리 |
| createdAt | DateTime | 생성일 |
| updatedAt | DateTime | 수정일 |

#### IngredientPriceHistory (단가 변동 이력)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | PK |
| ingredientId | String | FK → Ingredient |
| price | Float | 당시 단가 |
| changedAt | DateTime | 변경일 |

#### Menu (메뉴)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | PK |
| userId | String | FK → User |
| name | String | 메뉴명 |
| category | String | 카테고리 |
| sellingPrice | Float | 판매가 |
| createdAt | DateTime | 생성일 |
| updatedAt | DateTime | 수정일 |

#### RecipeItem (레시피 항목)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | PK |
| menuId | String | FK → Menu |
| ingredientId | String | FK → Ingredient |
| quantity | Float | 사용량 |
| unit | String | 사용 단위 |

---

## 3. API 설계

### 인증 API
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | /api/auth/register | 회원가입 |
| POST | /api/auth/[...nextauth] | NextAuth 핸들러 |
| POST | /api/auth/forgot-password | 비밀번호 재설정 요청 |

### 식재료 API
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /api/ingredients | 식재료 목록 조회 (검색/필터) |
| POST | /api/ingredients | 식재료 등록 |
| PUT | /api/ingredients/[id] | 식재료 수정 |
| DELETE | /api/ingredients/[id] | 식재료 삭제 |
| POST | /api/ingredients/bulk | 엑셀 대량 등록 |
| GET | /api/ingredients/[id]/history | 단가 변동 이력 |

### 메뉴/레시피 API
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /api/menus | 메뉴 목록 조회 |
| POST | /api/menus | 메뉴 생성 |
| PUT | /api/menus/[id] | 메뉴 수정 |
| DELETE | /api/menus/[id] | 메뉴 삭제 |
| GET | /api/menus/[id]/recipe | 레시피 조회 |
| PUT | /api/menus/[id]/recipe | 레시피 수정 (항목 추가/삭제/수정) |

### 원가 계산 API
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /api/cost | 전체 메뉴 원가 목록 |
| GET | /api/cost/[menuId] | 개별 메뉴 원가 상세 |

### 대시보드 API
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /api/dashboard | 대시보드 요약 데이터 |

### 리포트 API
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /api/reports/monthly | 월별 원가 변동 |
| GET | /api/reports/top-cost | 원가율 높은 순 메뉴 |
| GET | /api/reports/ingredient-ratio | 식재료별 비용 비중 |

---

## 4. 컴포넌트 설계

### 레이아웃 컴포넌트
- **DashboardLayout**: 사이드바 + 콘텐츠 영역, 네비게이션
- **AuthLayout**: 인증 페이지용 중앙 정렬 레이아웃

### UI 컴포넌트
- **DataTable**: 정렬/검색/페이지네이션 지원 테이블
- **StatCard**: 통계 카드 (숫자 + 라벨 + 아이콘)
- **AlertBanner**: 경고/알림 배너
- **CostBadge**: 원가율 색상 배지 (초록/노랑/빨강)
- **Modal**: 모달 다이얼로그
- **SearchInput**: 검색 입력

### 폼 컴포넌트
- **IngredientForm**: 식재료 등록/수정 폼
- **MenuForm**: 메뉴 등록/수정 폼
- **RecipeEditor**: 레시피 항목 편집기 (식재료 선택 + 수량 입력)

### 차트 컴포넌트
- **MonthlyCostChart**: 월별 원가 변동 라인 차트 (Recharts)
- **IngredientPieChart**: 식재료별 비용 비중 파이 차트
- **CostRankingChart**: 원가율 높은 순 바 차트

---

## 5. 상태 관리

Zustand 스토어 구조:
- **authStore**: 사용자 세션 상태
- **ingredientStore**: 식재료 목록 캐시 및 필터 상태
- **menuStore**: 메뉴/레시피 편집 상태
- **uiStore**: 모달, 사이드바 등 UI 상태

---

## 6. 인증 설계

NextAuth.js를 사용하여 다음 인증 방식을 지원:
- **Credentials**: 이메일/비밀번호 (bcrypt 해싱)
- **Google OAuth**: Google 소셜 로그인
- **Kakao OAuth**: 카카오 소셜 로그인

세션 전략: JWT 기반 (Vercel 배포 최적화)

---

## 7. 원가 계산 로직

```
메뉴 원가 = Σ(식재료 단가 × 사용량 × 단위환산계수)
원가율(%) = (메뉴 원가 / 판매가) × 100
마진 = 판매가 - 메뉴 원가
```

원가율 색상 기준:
- 🟢 초록: 30% 이하 (양호)
- 🟡 노랑: 30~40% (주의)
- 🔴 빨강: 40% 초과 (위험)

---

## 8. 보안 설계

- 모든 API 엔드포인트에 인증 미들웨어 적용
- 사용자별 데이터 격리 (모든 쿼리에 userId 조건 포함)
- 비밀번호 bcrypt 해싱 (salt rounds: 12)
- CSRF 보호 (NextAuth 내장)
- 입력값 검증 (Zod schema validation)

---

## 9. 기술 스택 확정

| 항목 | 기술 | 버전 |
|------|------|------|
| 프론트엔드 | Next.js (App Router) | 14.x |
| CSS | Tailwind CSS | 3.x |
| 인증 | NextAuth.js | 4.x |
| DB | PostgreSQL | Supabase |
| ORM | Prisma | 5.x |
| 상태관리 | Zustand | 4.x |
| 차트 | Recharts | 2.x |
| 폼 검증 | Zod | 3.x |
| HTTP 클라이언트 | fetch (내장) | - |
| 배포 | Vercel | - |
| 아이콘 | Lucide React | - |
