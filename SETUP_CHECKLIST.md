# 🚀 Action Priority Board - 설치 체크리스트

## 📋 배포 전 확인사항

### Phase 1: 로컬 환경 준비

- [ ] Node.js/Python 설치 확인
  ```bash
  node --version  # 또는 python --version
  ```

- [ ] 저장소 클론 및 파일 구조 확인
  ```bash
  git clone https://github.com/[계정]/action-priority-board.git
  cd action-priority-board
  
  # 파일 구조 확인
  tree -L 2
  ```

- [ ] 필요한 파일 모두 포함 확인
  - [ ] `index.html` ✓
  - [ ] `styles.css` ✓
  - [ ] `app.js` ✓
  - [ ] `data/latest.json` ✓
  - [ ] `scripts/fetch_news.py` ✓
  - [ ] `scripts/validate_data.py` ✓
  - [ ] `.github/workflows/update-data.yml` ✓
  - [ ] `README.md` ✓

### Phase 2: 로컬 테스트

- [ ] 로컬 웹서버 실행
  ```bash
  # Python
  python -m http.server 8000
  
  # 또는 Node.js (npx http-server)
  npx http-server
  ```

- [ ] 브라우저에서 접속 및 확인
  - [ ] `http://localhost:8000` 접속 ✓
  - [ ] 대시보드 UI 정상 표시 ✓
  - [ ] 샘플 뉴스 데이터 표시 ✓
  - [ ] 키워드 필터링 동작 ✓
  - [ ] 모달 열기/닫기 정상 ✓

- [ ] 콘솔 에러 확인 (F12 개발자 도구)
  - [ ] JavaScript 에러 없음 ✓
  - [ ] 네트워크 오류 없음 ✓

### Phase 3: GitHub 저장소 준비

- [ ] GitHub 계정 로그인
  ```bash
  git config --global user.name "Your Name"
  git config --global user.email "your@email.com"
  ```

- [ ] 저장소 Settings 확인
  - [ ] 저장소명 확인: `action-priority-board`
  - [ ] Public 설정 확인 (Pages 배포용)
  - [ ] 설명 입력: "News-driven action priority monitoring for purchasing team"

- [ ] Pages 설정
  1. Settings > Pages 이동
  2. [ ] Source: `Deploy from a branch` 선택
  3. [ ] Branch: `main` 선택
  4. [ ] Folder: `/ (root)` 선택
  5. [ ] Save 클릭
  6. [ ] 배포 URL 확인: `https://[계정].github.io/action-priority-board`

- [ ] Branch protection 설정 (선택)
  ```bash
  # main 브랜치 보호 활성화 권장
  # Settings > Branches > Add rule
  ```

### Phase 4: GitHub Actions 설정

- [ ] Secrets 등록 (필수)
  1. Settings > Secrets and variables > Actions
  2. [ ] `GITHUB_TOKEN` (자동)
  
- [ ] Secrets 등록 (선택 - 뉴스 API)
  1. Naver Developer (https://developers.naver.com)
     - [ ] Application 등록
     - [ ] `검색 > 뉴스` API 선택
     - [ ] Client ID 복사
     - [ ] Secret 복사
  2. GitHub Secrets 추가
     - [ ] `NAVER_CLIENT_ID` = [발급받은 ID]
     - [ ] `NAVER_CLIENT_SECRET` = [발급받은 Secret]

- [ ] Slack 알림 설정 (선택)
  1. Slack Workspace Admin 권한으로 로그인
  2. 앱 디렉토리에서 "Incoming Webhooks" 추가
  3. 채널 선택 (예: #구매팀)
  4. Webhook URL 복사
  5. GitHub Secrets에 `SLACK_WEBHOOK_URL` 추가

- [ ] 워크플로우 파일 확인
  ```bash
  cat .github/workflows/update-data.yml
  
  # 다음 내용 포함 확인:
  # - schedule: 매일 오전 9시 (UTC 0:00)
  # - fetch_news.py 실행
  # - validate_data.py 실행
  # - GitHub Pages 배포
  ```

### Phase 5: 배포 및 검증

- [ ] 첫 번째 커밋 및 푸시
  ```bash
  git add .
  git commit -m "Initial commit: Action Priority Board MVP"
  git push origin main
  ```

- [ ] GitHub Pages 배포 확인
  1. Actions 탭 확인
  2. [ ] Deploy workflow 성공 여부 확인
  3. [ ] 배포 URL에 접속
  4. [ ] 대시보드 정상 표시 확인

- [ ] Actions 수동 실행 테스트
  1. Actions 탭 > "Update News Data Daily"
  2. [ ] "Run workflow" 클릭
  3. [ ] 수 초 내 실행 확인
  4. [ ] fetch_news.py 완료 확인
  5. [ ] validate_data.py 완료 확인
  6. [ ] data/latest.json 갱신 확인

- [ ] 실제 뉴스 데이터 확인
  ```bash
  # 로컬에서 실행
  python scripts/fetch_news.py
  python scripts/validate_data.py
  
  # 또는 GitHub에서 data/latest.json 확인
  # commit 로그에서 "🤖 Update news data" 확인
  ```

### Phase 6: 팀 공유 준비

- [ ] 기본 키워드 확인 및 조정
  - [ ] 협력사 35개 확인
  - [ ] 품목 40+개 확인
  - [ ] 원료 50+개 확인
  - [ ] 정책/물류 30+개 확인
  - [ ] 빠진 협력사/품목 있으면 `app.js` 수정

- [ ] 팀 공유용 문서 준비
  - [ ] README.md 한글 확인
  - [ ] 사용 방법 설명서 준비
  - [ ] 키워드 커스터마이징 튜토리얼 작성

- [ ] 데모 실연
  - [ ] 대시보드 UI 소개
  - [ ] 키워드 필터링 시연
  - [ ] 뉴스 상세 보기 시연
  - [ ] 키워드 추가/제거 시연

- [ ] 팀 공유
  - [ ] 대시보드 URL 공유: `https://[계정].github.io/action-priority-board`
  - [ ] README.md 링크 공유
  - [ ] 피드백 채널 설정 (Issues, Slack 등)

---

## 🔍 배포 후 모니터링

### 일일 체크

- [ ] 매일 오전 9시 이후 데이터 갱신 확인
  ```bash
  # GitHub Actions 탭에서 "Update News Data Daily" 실행 확인
  ```

- [ ] 뉴스 데이터 품질 확인
  ```bash
  # 최소 5개 이상의 뉴스 수집 확인
  # 리스크 분포 확인 (높음:중간:낮음 = 20:50:30 정도)
  ```

### 주간 리뷰

- [ ] 팀 피드백 수집
  - [ ] 사용 난이도 (낮음/중간/높음)
  - [ ] 유용성 평가 (1-5점)
  - [ ] 개선 사항 피드백

- [ ] 데이터 품질 분석
  - [ ] 뉴스 소스 다양성 확인
  - [ ] 리스크 분류 정확도 확인
  - [ ] 누락된 협력사/품목 확인

- [ ] 시스템 안정성
  - [ ] Actions 실행 성공률
  - [ ] 에러 로그 확인
  - [ ] API 호출 한도 확인 (Naver)

### 월간 최적화

- [ ] 기본 키워드 갱신
  - [ ] 새로운 협력사 추가
  - [ ] 단종된 협력사 제거
  - [ ] 핫한 이슈 키워드 추가

- [ ] 뉴스 소스 평가
  - [ ] 노이즈가 많은 소스 제거
  - [ ] 정확도 높은 소스 확대
  - [ ] 새로운 소스 추가

- [ ] UI/UX 개선
  - [ ] 팀 의견 반영
  - [ ] 색상/레이아웃 최적화
  - [ ] 로딩 속도 개선

---

## 🆘 트러블슈팅

### 문제: GitHub Pages에서 404

```
해결책:
1. Settings > Pages 재확인
2. Branch가 main인지 확인
3. public 폴더 아닌 root 선택 확인
4. 5분 대기 후 재접속
```

### 문제: Actions 실행 안 됨

```
해결책:
1. .github/workflows/update-data.yml 경로 확인
2. 파일 YAML 문법 검사 (yamllint 등)
3. 저장소 Actions 탭에서 권한 확인
4. Workflow 수동 트리거 테스트
```

### 문제: Naver API 호출 실패

```
해결책:
1. Client ID/Secret 유효성 확인
2. API 할당량 확인 (Naver Developer Console)
3. 네트워크 연결 확인
4. 스크립트 로그 확인: GitHub Actions > Details
```

### 문제: 뉴스 데이터 갱신 안 됨

```
해결책:
1. data/latest.json 타임스탬프 확인
2. GitHub Actions 로그 확인
3. 수동 갱신 테스트:
   python scripts/fetch_news.py
4. 데이터 검증:
   python scripts/validate_data.py
```

---

## ✅ 최종 확인

- [ ] 모든 체크리스트 항목 완료
- [ ] 팀원 3명 이상 테스트 완료
- [ ] 피드백 항목 정리
- [ ] Phase 2 로드맵 계획 수립

**배포 완료 시점:** `_________________`

**담당자:** `_________________`

**다음 검토일:** `_________________`

