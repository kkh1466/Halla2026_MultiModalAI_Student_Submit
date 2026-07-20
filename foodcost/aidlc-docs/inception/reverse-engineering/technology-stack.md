# Technology Stack

## Programming Languages
| 언어 | 버전 | 용도 |
|------|------|------|
| TypeScript | ^5 | 프론트엔드 + 백엔드 전체 |
| SQL (SQLite) | - | 데이터 저장 (Prisma 통해 접근) |

## Frameworks
| 프레임워크 | 버전 | 용도 |
|------------|------|------|
| Next.js | 14.2.35 | 풀스택 웹 프레임워크 (App Router) |
| React | ^18 | UI 렌더링 |
| Tailwind CSS | ^3.4.1 | 유틸리티 CSS 스타일링 |

## Libraries
| 라이브러리 | 버전 | 용도 |
|------------|------|------|
| next-auth | ^4.24.11 | 인증 (Credentials + OAuth) |
| @prisma/client | ^5.22.0 | ORM / 데이터베이스 접근 |
| recharts | ^2.15.0 | 차트 시각화 (Line, Bar, Pie) |
| zustand | ^4.5.5 | 클라이언트 상태 관리 |
| zod | ^3.24.1 | API 요청 스키마 검증 |
| bcryptjs | ^2.4.3 | 비밀번호 해싱 |
| lucide-react | ^0.468.0 | 아이콘 컴포넌트 |

## Infrastructure
| 서비스 | 용도 |
|--------|------|
| SQLite | 로컬 파일 기반 데이터베이스 |
| Google OAuth | 소셜 로그인 (설정 필요) |
| Kakao OAuth | 소셜 로그인 (설정 필요) |

## Build Tools
| 도구 | 버전 | 용도 |
|------|------|------|
| npm | (시스템) | 패키지 매니저 |
| PostCSS | ^8 | CSS 후처리 |
| ESLint | ^8 | 코드 린팅 (eslint-config-next) |
| tsx | ^4.23.0 | TypeScript 실행 (seed 스크립트) |
| prisma CLI | ^5.22.0 | 스키마 마이그레이션, DB 관리 |

## Testing Tools
| 도구 | 버전 | 용도 |
|------|------|------|
| - | - | 테스트 프레임워크 미설정 |

## Development Tools
| 도구 | 용도 |
|------|------|
| Prisma Studio | DB 시각적 관리 (npx prisma studio) |
| Next.js Dev Server | 핫 리로드 개발 서버 |
