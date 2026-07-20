# 푸드코스트 자동계산 서비스 - 구현 태스크 목록

## Task 1: 프로젝트 초기 설정
- [ ] Next.js 14 프로젝트 생성 (App Router, TypeScript, Tailwind CSS)
- [ ] 필수 의존성 설치 (prisma, @prisma/client, next-auth, zustand, recharts, zod, bcryptjs, lucide-react)
- [ ] Tailwind CSS 설정 (tailwind.config.ts 커스터마이징)
- [ ] TypeScript 설정 (tsconfig.json 경로 별칭)
- [ ] 프로젝트 디렉토리 구조 생성
- [ ] 환경변수 파일 (.env.example) 생성
- [ ] Prisma 초기화

## Task 2: 데이터 모델 구현
- [ ] Prisma schema 작성 (User, Ingredient, IngredientPriceHistory, Menu, RecipeItem)
- [ ] 관계 설정 및 인덱스 정의
- [ ] Prisma Client 싱글톤 설정 (src/lib/prisma.ts)

## Task 3: 인증 구현
- [ ] NextAuth.js 설정 (src/lib/auth.ts)
- [ ] Credentials Provider 구현 (이메일/비밀번호)
- [ ] Google OAuth Provider 설정
- [ ] Kakao OAuth Provider 설정
- [ ] 회원가입 API (POST /api/auth/register)
- [ ] 로그인 페이지 UI (src/app/(auth)/login/page.tsx)
- [ ] 회원가입 페이지 UI (src/app/(auth)/register/page.tsx)
- [ ] 인증 미들웨어 (middleware.ts)

## Task 4: 공통 레이아웃 및 UI 컴포넌트
- [ ] 루트 레이아웃 (src/app/layout.tsx)
- [ ] 대시보드 레이아웃 + 사이드바 (src/app/(dashboard)/layout.tsx)
- [ ] 공통 UI 컴포넌트 (Button, Input, Card, Modal, Badge, DataTable)
- [ ] Zustand 스토어 설정

## Task 5: 식재료 관리 기능
- [ ] 식재료 CRUD API (GET/POST/PUT/DELETE /api/ingredients)
- [ ] 단가 변동 이력 API (GET /api/ingredients/[id]/history)
- [ ] 식재료 목록 페이지 (검색/필터 포함)
- [ ] 식재료 등록/수정 모달
- [ ] 단가 변동 이력 표시
- [ ] 엑셀 대량 업로드 (POST /api/ingredients/bulk)

## Task 6: 레시피/메뉴 등록 기능
- [ ] 메뉴 CRUD API (GET/POST/PUT/DELETE /api/menus)
- [ ] 레시피 API (GET/PUT /api/menus/[id]/recipe)
- [ ] 메뉴 목록 페이지
- [ ] 메뉴 등록 페이지 (메뉴명, 카테고리, 판매가)
- [ ] 레시피 편집기 (식재료 선택 + 사용량 입력)
- [ ] 실시간 원가 계산 표시
- [ ] 원가율/마진 자동 계산

## Task 7: 원가 계산 결과 페이지
- [ ] 원가 계산 API (GET /api/cost)
- [ ] 전체 메뉴 원가 목록 페이지
- [ ] 원가율 색상 배지 (초록/노랑/빨강)
- [ ] 메뉴별 상세 원가 조회

## Task 8: 대시보드
- [ ] 대시보드 API (GET /api/dashboard)
- [ ] 전체 메뉴 수 통계 카드
- [ ] 평균 원가율 통계 카드
- [ ] 원가율 30% 초과 경고 알림
- [ ] 최근 수정 메뉴 리스트

## Task 9: 리포트
- [ ] 리포트 API (GET /api/reports/monthly, top-cost, ingredient-ratio)
- [ ] 월별 원가 변동 라인 차트
- [ ] 원가율 높은 순 메뉴 정렬
- [ ] 식재료별 비용 비중 파이차트

## Task 10: 마무리
- [ ] 반응형 디자인 검증 및 수정
- [ ] 에러 핸들링 통합
- [ ] 환경 변수 문서화
