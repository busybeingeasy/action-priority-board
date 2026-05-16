# 📊 Action Priority Board (APB)

**현대그린푸드 공산품구매팀을 위한 뉴스 기반 액션 우선순위 대시보드**

> 분산된 정보를 한눈에 모아 **"오늘 내가 먼저 움직여야 할 품목과 협력사"**를 파악하는 시스템

---

## 🎯 핵심 기능

### 1️⃣ **오늘의 액션 카드**
- 상위 3개의 우선순위 뉴스를 카드 형식으로 표시
- 리스크 레벨(높음/중간/낮음)별 시각적 구분
- 클릭하여 상세 정보 및 원문 링크 확인

### 2️⃣ **뉴스 피드**
- 내 키워드와 매칭된 모든 뉴스를 시간 역순으로 표시
- 협력사/품목/원료/정책 카테고리별로 자동 태그 지정
- 필터링으로 원하는 정보만 빠르게 검색

### 3️⃣ **키워드 커스터마이징**
- 기본 키워드(회사/팀 레벨): 협력사, 품목, 원료, 정책 총 200+개
- 개인별 추가/제거: 자신의 담당 분야에만 집중
- 로컬스토리지에 저장되어 매번 설정 유지

### 4️⃣ **자동 리스크 분류**
- AI 기반 뉴스 내용 분석으로 리스크 레벨 자동 판정
- 높음: 공장 화재, 공급 중단 등 긴급 이슈
- 중간: 단가 인상, 협상 진행 등 주의 필요
- 낮음: 일반 뉴스, 모니터링 차원

---

## 📦 설치 및 배포

### 필수 사항
- GitHub 계정 (Pages 배포용)
- Python 3.8+ (로컬 테스트용, 선택)

### Step 1: 저장소 초기화

```bash
# 1. GitHub에서 새 저장소 생성
#    이름: action-priority-board (또는 원하는 이름)
#    설정: Public (Pages 배포용)

# 2. 로컬에 클론
git clone https://github.com/[당신의계정]/action-priority-board.git
cd action-priority-board

# 3. 파일 구조 설정
# 다음과 같이 파일들을 배치하세요:
# 
# action-priority-board/
# ├── index.html
# ├── styles.css
# ├── app.js
# ├── data/
# │   └── latest.json
# ├── scripts/
# │   ├── fetch_news.py
# │   └── validate_data.py
# └── .github/
#     └── workflows/
#         └── update-data.yml
```

### Step 2: GitHub Pages 활성화

1. 저장소 Settings > Pages 이동
2. Source: `Deploy from a branch`
3. Branch: `main` / Folder: `/ (root)` 선택
4. Save

→ 몇 분 후 `https://[계정].github.io/action-priority-board` 에서 대시보드 접근 가능

### Step 3: GitHub Actions 설정 (선택 - 자동 갱신)

#### 3-1. GitHub Secrets 설정

저장소 Settings > Secrets and variables > Actions > New repository secret

**필수:**
- `GITHUB_TOKEN`: (자동으로 제공됨)

**선택 (뉴스 API 사용 시):**
- `NAVER_CLIENT_ID`: Naver Developer 계정에서 발급
- `NAVER_CLIENT_SECRET`: 위와 동일
- `SLACK_WEBHOOK_URL`: Slack 알림용 (선택)

#### 3-2. Naver API 키 발급

1. https://developers.naver.com 로그인
2. Application 등록 (이름: APB News Crawler)
3. API 선택: `검색 > 뉴스 API`
4. Client ID, Secret 복사 → GitHub Secrets에 등록

#### 3-3. 워크플로우 활성화

- `.github/workflows/update-data.yml`은 자동으로 감지됨
- 매일 오전 9시(한국 시간)에 자동 실행
- Actions 탭에서 실행 현황 확인 가능

---

## 🔄 데이터 갱신 방식

### 자동 갱신 (GitHub Actions)

**매일 오전 9시(한국 시간)에 자동 실행:**

```
1️⃣ fetch_news.py 실행
   ↓
   네이버 뉴스 RSS → 식품/유통 관련 기사 수집
   Google News RSS → 키워드별 뉴스 수집
   Naver News API → 추가 뉴스 (선택)
   ↓
2️⃣ 데이터 병합 및 정제
   ↓
   중복 제거, 리스크 분류, 날짜 표준화
   ↓
3️⃣ data/latest.json 생성
   ↓
4️⃣ GitHub에 자동 커밋
   ↓
5️⃣ GitHub Pages에 즉시 반영
```

### 수동 갱신

**로컬에서 테스트하거나 즉시 갱신이 필요한 경우:**

```bash
# Python 의존성 설치
pip install feedparser requests beautifulsoup4

# 뉴스 수집
python scripts/fetch_news.py

# 데이터 검증
python scripts/validate_data.py

# 결과 확인
cat data/latest.json | python -m json.tool
```

### 수동 갱신 트리거 (GitHub UI)

1. 저장소 Actions 탭 이동
2. "Update News Data Daily" 선택
3. "Run workflow" 클릭
4. 수 초 내 실행 시작

---

## 📋 기본 키워드 (Default Keywords)

### 협력사 (35개)
SPC, CJ, 오뚜기, 동원F&B, 해태, 롯데칠성, 농심, 풀무원, 샘표, 코자, 오상, 대상, 멕시카나, 이조, 미원, 우양, LG생활건강, 매일유업, 남양유업, 서울우유, 지창, 팬토스, KEKOIL, 한올유지, 흑마, 삼양, 한샘, 한동식품, 대한식품, BI, DL, 삼진, 한영, CFS, 광동제약, 안심나라

### 품목 (40개+)
**제과류:** 제과, 비스킷, 스낵, 초콜릿, 캔디, 껌
**음료:** 음료, 기능성음료, 에너지음료, 음료수, 스포츠음료
**면류:** 라면, 면류, 국수, 파스타
**장류:** 장류, 고추장, 된장, 간장, 된장국
**유지류:** 유지류, 올리브유, 참기름, 들기름, 카놀라유, 팜유
**소스류:** 소스류, 마요네즈, 토마토소스, 카레, 고추장소스, 명란젓
**기타:** 간편식, 유제품, 계란, 수산물, 고기 등

### 원료 (50개+)
**곡물:** 밀, 쌀, 옥수수, 보리, 콩, 팥, 검은콩, 들깨
**유지:** 팜유, 카놀라유, 해바라기유, 참기름, 들기름, 포도씨유
**기타:** 설탕, 소금, 계란, 밀가루, 카카오, 커피 등

### 정책/물류 (30개+)
**관세:** 할당관세, 세율, 수입관세, 부가세
**운임:** 운임, 해상운임, SCFI, WCI, 선박료
**경제지표:** 환율, BDI, 유가, CPI, PPI 등

---

## 🛠️ 커스터마이징 가이드

### 기본 키워드 수정

`app.js`의 `DEFAULT_KEYWORDS` 객체를 수정:

```javascript
const DEFAULT_KEYWORDS = {
    협력사: [
        'SPC', 'CJ', 'OO회사', // 추가/수정
        ...
    ],
    품목: [ ... ],
    원료: [ ... ],
    정책: [ ... ]
};
```

저장 후:
```bash
git add app.js
git commit -m "Update default keywords"
git push
```

### UI 색상 변경

`styles.css`의 `:root` 색상 변수 수정:

```css
:root {
    --primary-navy: #0a1f3f;      /* 메인 네이비 */
    --primary-blue: #1e5ba8;       /* 포인트 블루 */
    --risk-red: #dc2626;           /* 높음 리스크 */
    --risk-orange: #ef8537;        /* 중간 리스크 */
    --risk-yellow: #f59e0b;        /* 낮음 리스크 */
    /* ... 기타 색상 ... */
}
```

### 뉴스 소스 추가

`scripts/fetch_news.py`의 `NEWS_KEYWORDS` 또는 뉴스 소스 함수 수정:

```python
# RSS 소스 추가
ADDITIONAL_RSS = [
    "https://example.com/rss/feed",
    "https://another-source.com/news",
]

def fetch_custom_news():
    # 새로운 뉴스 소스 추가
    ...
```

---

## 📊 데이터 구조

### `data/latest.json` 형식

```json
{
  "lastUpdated": "2024-12-19T09:30:00Z",
  "news": [
    {
      "id": 1,
      "title": "SPC, 분당 공장 생산량 30% 감소...",
      "source": "식품음료신문",
      "date": "2024-12-19T07:45:00Z",
      "url": "https://...",
      "content": "제과업체 SPC가...",
      "riskLevel": "high",
      "matchedKeywords": {
        "협력사": ["SPC"],
        "품목": ["제과", "비스킷"],
        "원료": [],
        "정책": []
      }
    },
    ...
  ]
}
```

---

## 🚨 문제 해결

### Issue 1: GitHub Pages에서 404 에러

**원인:** 저장소 설정에서 Pages가 활성화되지 않음

**해결:**
```
Settings > Pages > Source: Deploy from a branch > Branch: main
```

### Issue 2: Actions 워크플로우 실행 안 됨

**원인:** `.github/workflows/update-data.yml` 경로 오류

**확인:**
```bash
# 파일 구조 확인
ls -la .github/workflows/
```

### Issue 3: Naver API 호출 실패

**원인:** Secrets에 클라이언트 ID/Secret 미등록

**해결:** GitHub Settings > Secrets > 아래 정보 추가:
- `NAVER_CLIENT_ID`
- `NAVER_CLIENT_SECRET`

### Issue 4: 데이터가 갱신되지 않음

**원인:** Actions 실행 실패

**확인:**
```
저장소 > Actions > Update News Data Daily > 최신 실행 로그 확인
```

---

## 📞 지원 및 피드백

### 기능 요청
- 대시보드 개선 사항은 Issues 탭에 등록

### 데이터 추가
- 추가로 모니터링할 협력사/품목/원료는 대시보드의 "⚙️ 키워드 설정"에서 직접 추가 가능

### 배포 이슈
- 로컬에서 `python -m http.server 8000` 실행 후 `localhost:8000`에서 테스트 가능

---

## 📈 로드맵

### Phase 1 (완료)
- ✅ 뉴스 기반 액션 우선순위 보드
- ✅ 키워드 자동 매칭
- ✅ 개인화 커스터마이징

### Phase 2 (예정)
- 🔄 원료가격 차트 추가
- 🔄 환율/해상운임 지표 통합
- 🔄 협력사별 단가 협의 기록 관리

### Phase 3 (계획)
- 📌 할당관세 D-day 알림
- 📌 시장가 vs 공급가 비교
- 📌 협력사 협의 코멘트 자동 생성

---

## 📝 라이센스

**내부용 시스템**  
현대그린푸드 공산품구매팀 전용

---

**마지막 업데이트:** 2024-12-19  
**버전:** 1.0 (MVP)

