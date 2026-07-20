# Code Quality Assessment

## Test Coverage
- **Overall**: None (테스트 미구현)
- **Unit Tests**: 없음
- **Integration Tests**: 없음
- **E2E Tests**: 없음
- **Note**: 테스트 프레임워크 자체가 설치되지 않음 (Jest, Vitest 등 없음)

## Code Quality Indicators

### Linting
- **Configured**: Yes (ESLint + eslint-config-next)
- **Configuration File**: `.eslintrc.json`
- **Coverage**: TypeScript/React lint rules 적용됨

### Code Style
- **Consistent**: Good
- **Naming Conventions**: 일관된 camelCase (변수/함수), PascalCase (컴포넌트)
- **File Organization**: 역할별 디렉토리 분리 (pages, components, lib, api)
- **Import Style**: 절대 경로 (`@/`) 일관 사용

### Documentation
- **Code Comments**: Minimal (유틸리티 함수에 JSDoc 주석 있음)
- **README**: 존재하나 상세도 미확인
- **API Documentation**: 코드 내 인라인 주석으로 간략 설명

### Type Safety
- **TypeScript Strict Mode**: Yes (`strict: true` in tsconfig.json)
- **Type Definitions**: 별도 types/index.ts에 공통 인터페이스 정의
- **Zod Validation**: API 입력에 런타임 타입 검증 적용
- **Note**: 일부 페이지에서 로컬 인터페이스 중복 정의 (types/index.ts와 불일치)

### Accessibility
- **ARIA Attributes**: 적용됨 (aria-modal, aria-label, aria-labelledby)
- **Data Test IDs**: 풍부하게 적용 (E2E 테스트 준비 상태)
- **Semantic HTML**: label + htmlFor 연결, role="alert" 에러 메시지
- **Keyboard Navigation**: 기본 브라우저 동작 의존

## Technical Debt

### 높은 우선순위
1. **테스트 부재**: 단위/통합/E2E 테스트가 전혀 없어 변경 시 회귀 위험 높음
2. **타입 중복 정의**: pages에서 인터페이스를 로컬로 재정의 (types/index.ts와 동기화 안됨)
3. **빈 디렉토리**: `charts/`, `ui/`, `cost/[menuId]/`, `ingredients/bulk/` 등 미구현 기능 흔적

### 중간 우선순위
4. **에러 핸들링 일관성**: API에서 catch 블록이 console.error만 하고 일반적인 "서버 오류" 메시지 반환
5. **Zustand 최소 활용**: 사이드바 상태만 관리, 서버 데이터 캐싱이나 낙관적 업데이트 미적용
6. **환경 변수 관리**: .env.example 존재하나 프로덕션 배포 설정 없음
7. **SQLite 제약**: 프로덕션에 적합하지 않은 DB (동시성, 확장성 한계)

### 낮은 우선순위
8. **temp-next 디렉토리**: 루트에 불필요한 임시 디렉토리 존재
9. **검색 디바운싱 없음**: 식재료 검색에서 키 입력마다 API 호출 (성능 비효율)
10. **페이지네이션 없음**: 목록 조회에서 전체 데이터 로드 (대용량 시 성능 이슈)

## Patterns and Anti-patterns

### Good Patterns
- **일관된 API 응답 형식**: `{ success, data?, error? }` 패턴 전체 적용
- **인증 가드 패턴**: 모든 API에서 동일한 getCurrentUser() 확인
- **Zod 검증**: 입력 유효성을 스키마로 관리하여 타입 안전성 확보
- **트랜잭션 사용**: 레시피 업데이트에서 원자적 연산 보장
- **레시피 삭제 보호**: 사용 중인 식재료 삭제 차단 (데이터 무결성)
- **단가 이력 자동 추적**: 가격 변경 시 이력 자동 기록 (감사 추적)
- **접근성 속성**: data-testid, aria-*, role 속성 일관 적용
- **서버 컴포넌트 활용**: 레이아웃에서 세션 확인을 서버에서 수행
- **Prisma 싱글톤**: hot-reload 시 커넥션 풀 관리

### Anti-patterns
- **Fat API Handlers**: 비즈니스 로직이 API 핸들러에 직접 구현 (서비스 레이어 없음)
- **No Error Boundary**: 클라이언트 에러 발생 시 전체 페이지 크래시 가능
- **No Loading States Skeleton**: 로딩 시 텍스트만 표시 (UX 개선 여지)
- **No Optimistic Updates**: 서버 응답까지 UI 반영 지연
- **Polling/Refetch 없음**: 다른 기기에서의 변경 감지 불가
- **confirm() 사용**: 브라우저 네이티브 confirm 대신 커스텀 모달 권장
