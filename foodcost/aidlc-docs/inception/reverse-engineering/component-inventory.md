# Component Inventory

## Application Packages
- **foodcost** (단일 Next.js 애플리케이션) - 푸드코스트 풀스택 웹 앱

## Page Components (11개)
| 경로 | 목적 | 렌더링 |
|------|------|--------|
| `src/app/page.tsx` | 루트 리다이렉트 | Server |
| `src/app/layout.tsx` | 루트 레이아웃 | Server |
| `src/app/providers.tsx` | SessionProvider 래퍼 | Client |
| `src/app/(auth)/login/page.tsx` | 로그인 | Client |
| `src/app/(auth)/register/page.tsx` | 회원가입 | Client |
| `src/app/(dashboard)/layout.tsx` | 대시보드 레이아웃 | Server |
| `src/app/(dashboard)/dashboard/page.tsx` | 대시보드 메인 | Client |
| `src/app/(dashboard)/ingredients/page.tsx` | 식재료 관리 | Client |
| `src/app/(dashboard)/recipes/page.tsx` | 레시피/메뉴 관리 | Client |
| `src/app/(dashboard)/cost/page.tsx` | 원가 계산 결과 | Client |
| `src/app/(dashboard)/reports/page.tsx` | 리포트/차트 | Client |

## Reusable Components (3개)
| 경로 | 목적 | 타입 |
|------|------|------|
| `src/components/layout/Sidebar.tsx` | 사이드바 네비게이션 | Client |
| `src/components/forms/IngredientModal.tsx` | 식재료 CRUD 모달 | Client |
| `src/components/forms/RecipeEditor.tsx` | 레시피 편집 모달 | Client |

## API Route Handlers (11개)
| 경로 | 메서드 | 목적 |
|------|--------|------|
| `api/auth/[...nextauth]/route.ts` | GET/POST | NextAuth 핸들러 |
| `api/auth/register/route.ts` | POST | 회원가입 |
| `api/ingredients/route.ts` | GET/POST | 식재료 목록/생성 |
| `api/ingredients/[id]/route.ts` | PUT/DELETE | 식재료 수정/삭제 |
| `api/ingredients/[id]/history/route.ts` | GET | 단가 이력 조회 |
| `api/menus/route.ts` | GET/POST | 메뉴 목록/생성 |
| `api/menus/[id]/route.ts` | GET/PUT/DELETE | 메뉴 CRUD |
| `api/menus/[id]/recipe/route.ts` | GET/PUT | 레시피 조회/교체 |
| `api/cost/route.ts` | GET | 원가 계산 |
| `api/dashboard/route.ts` | GET | 대시보드 데이터 |
| `api/reports/route.ts` | GET | 리포트 데이터 |

## Library Modules (4개)
| 경로 | 목적 |
|------|------|
| `src/lib/auth.ts` | NextAuth 설정 (providers, callbacks) |
| `src/lib/prisma.ts` | Prisma 클라이언트 싱글톤 |
| `src/lib/session.ts` | 현재 사용자 조회 유틸리티 |
| `src/lib/utils.ts` | 포맷팅 및 계산 유틸리티 함수 |

## State/Type Modules (2개)
| 경로 | 목적 |
|------|------|
| `src/store/index.ts` | Zustand UI 상태 (사이드바) |
| `src/types/index.ts` | 공통 TypeScript 인터페이스 |

## Infrastructure Packages
- 없음 (로컬 개발 전용, 별도 인프라 코드 없음)

## Shared Packages
- 없음 (단일 모놀리식 프로젝트)

## Test Packages
- 없음 (테스트 코드 미작성)

## Empty Directories (미사용)
- `src/components/charts/` - 차트 컴포넌트 디렉토리 (비어있음)
- `src/components/ui/` - UI 기본 컴포넌트 디렉토리 (비어있음)
- `src/app/api/cost/[menuId]/` - 개별 메뉴 원가 API (비어있음)
- `src/app/api/ingredients/bulk/` - 식재료 일괄 처리 API (비어있음)

## Total Count
- **Total Source Files**: 29
- **Pages**: 11
- **Components**: 3
- **API Routes**: 11
- **Libraries**: 4
- **State/Types**: 2
- **Infrastructure**: 0
- **Tests**: 0
