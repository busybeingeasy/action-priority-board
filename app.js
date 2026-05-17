// ==========================================
// Action Priority Board - 메인 로직
// ==========================================

// 전역 상태
let appState = {
    allNews: [],
    keywords: {},
    filteredNews: [],
    lastUpdated: null,
};

// 기본 키워드 설정 (상세 버전)
const DEFAULT_KEYWORDS = {
    협력사: [
        'SPC', 'CJ', '오뚜기', '동원F&B', '해태', '롯데칠성', '농심', '풀무원',
        '샘표', '코자', '오상', '대상', '멕시카나', '이조', '미원', '우양',
        'LG생활건강', '매일유업', '남양유업', '서울우유', '지창', '팬토스',
        'KEKOIL', '한올유지', '흑마', '삼양', '한샘', '한동식품', '대한식품',
        'BI', 'DL', '삼진', '한영', 'CFS', '광동제약', '안심나라'
    ],
    품목: [
        '제과', '비스킷', '스낵', '초콜릿', '캔디', '껌',
        '음료', '기능성음료', '에너지음료', '음료수', '스포츠음료',
        '라면', '면류', '국수', '파스타',
        '장류', '고추장', '된장', '간장', '된장국',
        '유지류', '올리브유', '참기름', '들기름', '카놀라유', '팜유',
        '소스류', '마요네즈', '토마토소스', '카레', '고추장소스', '명란젓',
        '간편식', '컵라면', '김밥', '주먹밥', '도시락',
        '유제품', '요거트', '치즈', '버터', '우유', '분유',
        '계란', '계란가공품',
        '수산물', '건어물', '해산물', '수산가공품',
        '고기', '육가공품', '소시지', '햄', '베이컨'
    ],
    원료: [
        '밀', '쌀', '옥수수', '보리', '콩', '팥', '검은콩', '들깨',
        '팜유', '카놀라유', '해바라기유', '참기름', '들기름', '포도씨유',
        '설탕', '고과당액', '포도당', '올리고당', '스테비아',
        '소금', '천일염', '정제염',
        '계란', '전란',
        '밀가루', '옥수수전분', '감자전분', '타피오카전분',
        '유제품', '탈지분유', '버터밀크', '생크림', '치즈분말',
        '해산물', '멸치', '새우', '굴', '건미역', '다시마',
        '육가공품', '돈육', '우육', '닭육',
        '첨가물', '글루타민산나트륨', '이산화황', '소르빈산칼륨',
        '향료', '색소', '보존료',
        '카카오', '카카오분말', '초콜릿',
        '커피', '커피빈', '인스턴트커피'
    ],
    정책: [
        '할당관세', '세율', '수입관세', '부가세', '관세철폐',
        '운임', '해상운임', 'SCFI', 'WCI', '선박료',
        '원자재비', '원가인상', '비용상승',
        '환율', '달러환율', '엔화환율', '위안화환율', '유로환율',
        'BDI', '건화물지수', '해운지수', '유가', 'WTI',
        'FTA', '통관', '통관지연', '검역',
        '최저임금', '근로기준법', '휴일', '초과근무료',
        '운송비', '택배비', '배송료',
        'ESG', '친환경', '탄소중립', 'RE100'
    ]
};

// ==========================================
// 초기화 및 데이터 로드
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    // 로컬스토리지에서 키워드 불러오기
    loadKeywordsFromStorage();
    
    // 데이터 로드
    await loadData();
    
    // UI 이벤트 바인딩
    setupEventListeners();
    
    // 초기 렌더링
    renderActionCards();
    renderNewsFeed();
    updateLastUpdated();
});

// 키워드 로컬스토리지 관리
function loadKeywordsFromStorage() {
    const stored = localStorage.getItem('keywords');
    if (stored) {
        appState.keywords = JSON.parse(stored);
    } else {
        appState.keywords = JSON.parse(JSON.stringify(DEFAULT_KEYWORDS));
        saveKeywordsToStorage();
    }
}

function saveKeywordsToStorage() {
    localStorage.setItem('keywords', JSON.stringify(appState.keywords));
}

// 데이터 로드 (GitHub Pages에서 JSON 불러오기)
async function loadData() {
    try {
        // 샘플 데이터 URL (추후 GitHub Actions로 갱신되는 URL로 변경)
        const response = await fetch('data/latest.json');
        if (!response.ok) throw new Error('Failed to load data');
        
        const data = await response.json();
        appState.allNews = data.news || [];
        appState.lastUpdated = data.lastUpdated || new Date().toISOString();
        
        // 뉴스에 키워드 매칭
        matchKeywords();
    } catch (error) {
        console.error('데이터 로드 실패:', error);
        // 오프라인 모드: 샘플 데이터 사용
        loadSampleData();
    }
}

// 샘플 데이터 (개발/테스트용)
function loadSampleData() {
    appState.allNews = [
        {
            id: 1,
            title: 'SPC, 분당 공장 생산량 30% 감소...제과류 공급 차질 우려',
            source: '식품음료신문',
            date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            url: '#',
            content: '제과업체 SPC가 분당 공장 설비 노후화로 일일 생산량 30%를 감소하기로 결정했습니다. 앞으로 3개월간 영향이 있을 것으로 예상됩니다.',
            relatedKeywords: ['SPC', '제과', '비스킷', '공급'],
            riskLevel: 'high'
        },
        {
            id: 2,
            title: '팜유 선물가격 6개월 만에 최고치...유지류 원가 인상 예정',
            source: '한경BWINDEX',
            date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            url: '#',
            content: '국제유가 급등에 따라 팜유 선물이 6개월 만에 최고치를 기록했습니다. 국내 유지류 제조사들이 앞다퉈 원가 인상을 예고하고 있습니다.',
            relatedKeywords: ['팜유', '유지류', '원자재비', '환율'],
            riskLevel: 'high'
        },
        {
            id: 3,
            title: '해상운임 지수(SCFI) 상승세 계속...물류비 인상 가시화',
            source: 'KBS뉴스',
            date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            url: '#',
            content: '상하이 해운지수(SCFI)가 연일 상승하면서 해상 물류비 인상이 현실화될 전망입니다. 협력사들의 추가 단가 인상 요청이 들어올 것으로 예상됩니다.',
            relatedKeywords: ['SCFI', '운임', '원자재비'],
            riskLevel: 'medium'
        },
        {
            id: 4,
            title: '농심, 신제품 라면 출시...밀 가격 변동에 촉각',
            source: '뉴스1',
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            url: '#',
            content: '농심이 새로운 프리미엄 라면을 출시하면서 밀 원료의 안정적 공급에 집중하고 있습니다.',
            relatedKeywords: ['농심', '라면', '밀', '원료'],
            riskLevel: 'low'
        },
        {
            id: 5,
            title: '원달러 환율, 1300원대 진입...수입 원가 인상 압박',
            source: '연합뉴스',
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            url: '#',
            content: '원달러 환율이 1300원대를 돌파하면서 수입 의존도가 높은 식품 업체들의 원가 인상 압박이 심화되고 있습니다.',
            relatedKeywords: ['환율', '달러환율', '원자재비'],
            riskLevel: 'high'
        }
    ];
    appState.lastUpdated = new Date().toISOString();
    matchKeywords();
}

// 뉴스와 키워드 매칭
function matchKeywords() {
    appState.allNews.forEach(news => {
        news.matchedKeywords = {
            협력사: [],
            품목: [],
            원료: [],
            정책: []
        };
        
        const newsText = (news.title + ' ' + (news.content || '')).toLowerCase();
        
        // 각 카테고리별로 매칭
        Object.entries(appState.keywords).forEach(([category, keywords]) => {
            keywords.forEach(keyword => {
                if (newsText.includes(keyword.toLowerCase())) {
                    news.matchedKeywords[category].push(keyword);
                }
            });
        });
    });
    
    // 내 키워드만 필터링
    filterByMyKeywords();
}

// 내 키워드 필터링
function filterByMyKeywords() {
    appState.filteredNews = appState.allNews.filter(news => {
        const hasMatch = Object.values(news.matchedKeywords).some(arr => arr.length > 0);
        return hasMatch;
    });
    
    // 리스크 레벨로 정렬 (높음 > 중간 > 낮음)
    const riskOrder = { high: 0, medium: 1, low: 2 };
    appState.filteredNews.sort((a, b) => {
        return (riskOrder[a.riskLevel] || 3) - (riskOrder[b.riskLevel] || 3);
    });
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 설정 버튼
    document.getElementById('settingsBtn').addEventListener('click', () => {
        openKeywordModal();
    });
    
    // 필터 컨트롤
    document.getElementById('filterType').addEventListener('change', filterNews);
    document.getElementById('filterKeyword').addEventListener('change', filterNews);
}

// ==========================================
// 액션 카드 렌더링
// ==========================================

function renderActionCards() {
    const container = document.getElementById('actionCardsContainer');
    container.innerHTML = '';
    
    // 상위 3개 뉴스를 액션 카드로 표시
    const topNews = appState.filteredNews.slice(0, 3);
    
    if (topNews.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #6b7280;">관련 뉴스가 없습니다.</p>';
        return;
    }
    
    topNews.forEach(news => {
        const card = createActionCard(news);
        container.appendChild(card);
    });
}

function createActionCard(news) {
    const card = document.createElement('div');
    card.className = `action-card risk-${news.riskLevel}`;
    
    const riskBadges = {
        high: '위험',
        medium: '주의',
        low: '안정'
    };
    
    const riskClasses = {
        high: 'high',
        medium: 'medium',
        low: 'low'
    };
    
    // 주요 키워드 추출
    const allMatched = [
        ...news.matchedKeywords.협력사,
        ...news.matchedKeywords.품목,
        ...news.matchedKeywords.원료
    ];
    
    const mainKeyword = allMatched[0] || '기타';
    
    // 올바른 인덱스 찾기
    const correctIndex = appState.allNews.findIndex(n => n.id === news.id);
    
    card.innerHTML = `
        <div class="card-header">
            <h3 class="card-title">${mainKeyword}</h3>
            <span class="risk-badge ${riskClasses[news.riskLevel]}">${riskBadges[news.riskLevel]}</span>
        </div>
        <div class="card-content">
            <div class="content-row">
                <span class="content-label">이슈</span>
                <span class="content-value">${truncateText(news.title, 30)}</span>
            </div>
            <div class="content-row">
                <span class="content-label">출처</span>
                <span class="content-value">${news.source}</span>
            </div>
            <div class="content-row">
                <span class="content-label">발생시간</span>
                <span class="content-value">${formatTime(news.date)}</span>
            </div>
        </div>
        <div class="card-action">
            <button class="btn-action" onclick="openNewsDetail(${correctIndex})">자세히 보기</button>
        </div>
    `;
    
    return card;
}

// ==========================================
// 뉴스 피드 렌더링
// ==========================================

function renderNewsFeed() {
    const feed = document.getElementById('newsFeed');
    feed.innerHTML = '';
    
    // 필터 키워드 옵션 갱신
    updateFilterKeywords();
    
    // 필터 적용
    let newsToShow = appState.filteredNews;
    const filterType = document.getElementById('filterType')?.value || 'all';
    const filterKeyword = document.getElementById('filterKeyword')?.value || '';
    
    if (filterType !== 'all' && filterKeyword) {
        newsToShow = newsToShow.filter(news => {
            const categoryMap = {
                협력사: '협력사',
                품목: '품목',
                원료: '원료',
                정책: '정책'
            };
            const category = categoryMap[filterType];
            return news.matchedKeywords[category]?.includes(filterKeyword);
        });
    }
    
    if (newsToShow.length === 0) {
        feed.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 32px;">필터에 맞는 뉴스가 없습니다.</p>';
        return;
    }
    
    newsToShow.forEach((news, index) => {
        const item = createNewsItem(news, index);
        feed.appendChild(item);
    });
}

function createNewsItem(news, index) {
    const item = document.createElement('div');
    item.className = 'news-item';
    
    const indicatorClass = news.riskLevel === 'high' ? 'alert' : (news.riskLevel === 'medium' ? 'warning' : '');
    
    // 매칭된 키워드들을 카테고리별로 표시
    let keywordsHtml = '';
    Object.entries(news.matchedKeywords).forEach(([category, keywords]) => {
        keywords.forEach(kw => {
            const tagClass = category === '협력사' ? 'supplier' : 
                            category === '품목' ? 'category' : 
                            category === '원료' ? 'raw-material' : 'policy';
            keywordsHtml += `<span class="keyword-tag ${tagClass}">${kw}</span>`;
        });
    });
    
    // 올바른 인덱스 찾기
    const correctIndex = appState.allNews.findIndex(n => n.id === news.id);
    
    item.innerHTML = `
        <div class="news-indicator ${indicatorClass}"></div>
        <div class="news-content">
            <div class="news-title">${news.title}</div>
            <div class="news-meta">
                <span class="news-source">${news.source}</span>
                <span class="news-time">${formatTime(news.date)}</span>
            </div>
            <div class="news-keywords">
                ${keywordsHtml}
            </div>
        </div>
    `;
    
    item.addEventListener('click', () => openNewsDetail(correctIndex));
    
    return item;
}

function updateFilterKeywords() {
    const filterType = document.getElementById('filterType').value;
    const filterKeywordSelect = document.getElementById('filterKeyword');
    
    filterKeywordSelect.innerHTML = '<option value="">모든 키워드</option>';
    
    if (filterType !== 'all' && appState.keywords[filterType]) {
        appState.keywords[filterType].forEach(keyword => {
            const option = document.createElement('option');
            option.value = keyword;
            option.textContent = keyword;
            filterKeywordSelect.appendChild(option);
        });
    }
}

function filterNews() {
    renderNewsFeed();
}

// ==========================================
// 키워드 모달 관리
// ==========================================

function openKeywordModal() {
    const modal = document.getElementById('keywordModal');
    modal.classList.add('active');
    
    // 키워드 리스트 렌더링
    renderKeywordLists();
}

function renderKeywordLists() {
    renderKeywordChips('협력사', 'supplierKeywords');
    renderKeywordChips('품목', 'categoryKeywords');
    renderKeywordChips('원료', 'rawMaterialKeywords');
    renderKeywordChips('정책', 'policyKeywords');
}

function renderKeywordChips(category, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    appState.keywords[category].forEach(keyword => {
        const chip = document.createElement('div');
        chip.className = 'keyword-chip';
        chip.innerHTML = `
            ${keyword}
            <button type="button" onclick="removeKeyword('${category}', '${keyword}')">✕</button>
        `;
        container.appendChild(chip);
    });
}

function addKeyword(category) {
    const inputMap = {
        '협력사': 'newSupplier',
        '품목': 'newCategory',
        '원료': 'newRawMaterial',
        '정책': 'newPolicy'
    };
    
    const input = document.getElementById(inputMap[category]);
    const keyword = input.value.trim();
    
    if (!keyword) return;
    if (appState.keywords[category].includes(keyword)) {
        alert('이미 추가된 키워드입니다.');
        return;
    }
    
    appState.keywords[category].push(keyword);
    input.value = '';
    renderKeywordChips(category, {
        '협력사': 'supplierKeywords',
        '품목': 'categoryKeywords',
        '원료': 'rawMaterialKeywords',
        '정책': 'policyKeywords'
    }[category]);
}

function removeKeyword(category, keyword) {
    appState.keywords[category] = appState.keywords[category].filter(k => k !== keyword);
    const containerMap = {
        '협력사': 'supplierKeywords',
        '품목': 'categoryKeywords',
        '원료': 'rawMaterialKeywords',
        '정책': 'policyKeywords'
    };
    renderKeywordChips(category, containerMap[category]);
}

function saveKeywords() {
    saveKeywordsToStorage();
    matchKeywords();
    renderActionCards();
    renderNewsFeed();
    document.getElementById('keywordModal').classList.remove('active');
    alert('키워드가 저장되었습니다.');
}

function resetToDefault() {
    if (confirm('기본값으로 복원하시겠습니까?')) {
        appState.keywords = JSON.parse(JSON.stringify(DEFAULT_KEYWORDS));
        renderKeywordLists();
    }
}

// 모달 닫기
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('closeModalBtn')?.addEventListener('click', () => {
        document.getElementById('keywordModal').classList.remove('active');
    });
    
    document.getElementById('keywordModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'keywordModal') {
            document.getElementById('keywordModal').classList.remove('active');
        }
    });
});

// ==========================================
// 뉴스 상세 보기
// ==========================================

function openNewsDetail(index) {
    const news = appState.allNews[index];
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${news.title}</h2>
                <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
            </div>
            <div style="margin-bottom: 16px;">
                <p style="color: #6b7280; margin-bottom: 8px;">
                    <strong>${news.source}</strong> | ${formatTime(news.date)}
                </p>
                <p style="line-height: 1.8; color: #1f2937;">${news.content || '상세 내용이 없습니다.'}</p>
            </div>
            <div style="margin-bottom: 16px;">
                <h3 style="font-weight: 600; margin-bottom: 8px;">관련 키워드</h3>
                <div class="news-keywords">
                    ${Object.entries(news.matchedKeywords).map(([category, keywords]) => 
                        keywords.map(kw => {
                            const tagClass = category === '협력사' ? 'supplier' : 
                                            category === '품목' ? 'category' : 
                                            category === '원료' ? 'raw-material' : 'policy';
                            return `<span class="keyword-tag ${tagClass}">${kw}</span>`;
                        }).join('')
                    ).join('')}
                </div>
            </div>
            <div class="modal-actions">
                <a href="${news.url}" target="_blank" class="btn-primary" style="text-align: center; display: flex; align-items: center; justify-content: center;">원문 읽기</a>
                <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">닫기</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// ==========================================
// 유틸리티 함수
// ==========================================

function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

function truncateText(text, length) {
    return text.length > length ? text.substring(0, length) + '...' : text;
}

function updateLastUpdated() {
    const element = document.getElementById('lastUpdated');
    if (appState.lastUpdated) {
        element.textContent = formatTime(appState.lastUpdated);
    }
}

function showAbout() {
    alert(`Action Priority Board v1.0\n\n현대그린푸드 공산품구매팀\nNews-driven action monitoring system\n\n데이터 갱신: 매일 자동 (GitHub Actions)`);
}

// ==========================================
// 탭 전환 기능
// ==========================================

function switchTab(tabName) {
    // 모든 탭 콘텐츠 숨기기
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // 모든 탭 버튼 비활성화
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // 선택한 탭 표시
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // 선택한 버튼 활성화
    event.target.classList.add('active');
}
