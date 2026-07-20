# API Documentation

## REST APIs

### 인증 (Auth)

#### POST /api/auth/register
- **Purpose**: 이메일/비밀번호 회원가입
- **Request**:
  ```json
  { "email": "string", "password": "string (min 6)", "name": "string" }
  ```
- **Response (201)**:
  ```json
  { "success": true, "data": { "id": "string", "email": "string", "name": "string" } }
  ```
- **Errors**: 400 (유효성 실패), 409 (이미 등록된 이메일)

#### NextAuth Endpoints (/api/auth/[...nextauth])
- **POST /api/auth/callback/credentials** - 이메일/비밀번호 로그인
- **GET /api/auth/signin** - 로그인 페이지 리다이렉트
- **GET /api/auth/session** - 현재 세션 정보
- **POST /api/auth/signout** - 로그아웃

---

### 식재료 (Ingredients)

#### GET /api/ingredients
- **Purpose**: 현재 사용자의 식재료 목록 조회
- **Query Params**: `search` (이름 검색), `category` (카테고리 필터)
- **Response**:
  ```json
  { "success": true, "data": [Ingredient[]] }
  ```

#### POST /api/ingredients
- **Purpose**: 새 식재료 등록 (+ 초기 단가 이력 생성)
- **Request**:
  ```json
  { "name": "string", "unit": "string", "pricePerUnit": "number", "category?": "string" }
  ```
- **Response (201)**:
  ```json
  { "success": true, "data": Ingredient }
  ```
- **Validation**: Zod schema (name min 1, unit min 1, pricePerUnit min 0)

#### PUT /api/ingredients/{id}
- **Purpose**: 식재료 정보 수정 (단가 변경 시 이력 자동 기록)
- **Request**:
  ```json
  { "name?": "string", "unit?": "string", "pricePerUnit?": "number", "category?": "string" }
  ```
- **Response**: `{ "success": true, "data": Ingredient }`
- **Side Effect**: pricePerUnit 변경 시 IngredientPriceHistory 자동 추가

#### DELETE /api/ingredients/{id}
- **Purpose**: 식재료 삭제
- **Guard**: 레시피에서 사용 중인 식재료는 삭제 불가 (409)
- **Response**: `{ "success": true }`
- **Errors**: 404 (없음), 409 (레시피에서 사용 중)

#### GET /api/ingredients/{id}/history
- **Purpose**: 식재료 단가 변동 이력 조회 (최근 20건)
- **Response**:
  ```json
  { "success": true, "data": [IngredientPriceHistory[]] }
  ```

---

### 메뉴 (Menus)

#### GET /api/menus
- **Purpose**: 현재 사용자의 메뉴 목록 조회 (레시피 + 식재료 포함)
- **Response**:
  ```json
  { "success": true, "data": [Menu with recipeItems with ingredient] }
  ```

#### POST /api/menus
- **Purpose**: 새 메뉴 생성
- **Request**:
  ```json
  { "name": "string", "category": "string", "sellingPrice": "number" }
  ```
- **Response (201)**: `{ "success": true, "data": Menu }`

#### GET /api/menus/{id}
- **Purpose**: 메뉴 상세 조회 (레시피 포함)
- **Response**: `{ "success": true, "data": Menu with recipeItems }`

#### PUT /api/menus/{id}
- **Purpose**: 메뉴 정보 수정 (이름, 카테고리, 판매가)
- **Request**:
  ```json
  { "name?": "string", "category?": "string", "sellingPrice?": "number" }
  ```
- **Response**: `{ "success": true, "data": Menu }`

#### DELETE /api/menus/{id}
- **Purpose**: 메뉴 삭제 (연관 레시피 자동 삭제 - Cascade)
- **Response**: `{ "success": true }`

---

### 레시피 (Recipe)

#### GET /api/menus/{id}/recipe
- **Purpose**: 특정 메뉴의 레시피 항목 조회
- **Response**:
  ```json
  { "success": true, "data": [RecipeItem with ingredient] }
  ```

#### PUT /api/menus/{id}/recipe
- **Purpose**: 레시피 전체 교체 (기존 삭제 + 새 항목 생성, 트랜잭션)
- **Request**:
  ```json
  { "items": [{ "ingredientId": "string", "quantity": "number (min 0.001)", "unit": "string" }] }
  ```
- **Response**: `{ "success": true, "data": [RecipeItem with ingredient] }`

---

### 원가 계산 (Cost)

#### GET /api/cost
- **Purpose**: 전체 메뉴의 원가 계산 결과
- **Response**:
  ```json
  {
    "success": true,
    "data": [{
      "menuId": "string",
      "menuName": "string",
      "category": "string",
      "totalCost": "number",
      "sellingPrice": "number",
      "costRate": "number",
      "margin": "number",
      "items": [{ "ingredientName", "quantity", "unit", "unitPrice", "itemCost" }]
    }]
  }
  ```
- **Calculation**: totalCost = SUM(ingredient.pricePerUnit * recipeItem.quantity)

---

### 대시보드 (Dashboard)

#### GET /api/dashboard
- **Purpose**: 대시보드 요약 데이터 (통계, 경고 메뉴, 최근 메뉴)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "totalMenus": "number",
      "totalIngredients": "number",
      "averageCostRate": "number",
      "highCostMenus": [MenuCost[] (costRate > 30%, max 5)],
      "recentMenus": [MenuCost[] (max 5)]
    }
  }
  ```

---

### 리포트 (Reports)

#### GET /api/reports
- **Purpose**: 분석 리포트 데이터 (순위, 비중, 추이)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "costRanking": [{ "menuName", "category", "totalCost", "sellingPrice", "costRate" }],
      "ingredientRatio": [{ "name", "cost" }],
      "monthlyTrend": [{ "month", "avgPrice", "changeCount" }]
    }
  }
  ```

---

## Data Models

### User
- **Fields**: id (cuid), email (unique), password (nullable), name, provider, createdAt, updatedAt
- **Relationships**: has many Ingredients, has many Menus
- **Validation**: email unique

### Ingredient
- **Fields**: id (cuid), userId, name, unit, pricePerUnit (Float), category (nullable), createdAt, updatedAt
- **Relationships**: belongs to User, has many RecipeItems, has many IngredientPriceHistory
- **Indexes**: [userId], [userId, name]

### IngredientPriceHistory
- **Fields**: id (cuid), ingredientId, price (Float), changedAt (default now)
- **Relationships**: belongs to Ingredient (Cascade delete)
- **Indexes**: [ingredientId], [ingredientId, changedAt]

### Menu
- **Fields**: id (cuid), userId, name, category, sellingPrice (Float, default 0), createdAt, updatedAt
- **Relationships**: belongs to User, has many RecipeItems
- **Indexes**: [userId], [userId, category]

### RecipeItem
- **Fields**: id (cuid), menuId, ingredientId, quantity (Float), unit
- **Relationships**: belongs to Menu (Cascade), belongs to Ingredient (Cascade)
- **Constraints**: unique [menuId, ingredientId]
- **Indexes**: [menuId], [ingredientId]

---

## Common API Response Format

모든 API는 통일된 응답 형식을 사용:
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

## Authentication Pattern

모든 보호된 API는 동일한 인증 패턴을 따름:
```typescript
const user = await getCurrentUser();
if (!user) {
  return NextResponse.json(
    { success: false, error: "인증이 필요합니다." },
    { status: 401 }
  );
}
```
