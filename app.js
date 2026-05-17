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
        '할당관세', 'HS코드', '환율', '금리', 'SCFI', 'WCI', 'BDI',
        '유가', 'CPI', 'PPI', '최저임금', '운임', 'FTA', '통관',
        '식품안전', '기준', '규정', '인증', '라벨링'
    ]
};

// ==========================================
// 초기화
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting initialization...');
    
    // 키워드 로드
    loadKeywords();
    
    // 뉴스 데이터 로드
    loadNews();
    
    // 필터 리스너 등록
    setupFilterListeners();
    
    // 키워드 설정 모달 버튼
    const settingsBtn = document.getElementById('settingsBtn');
    const keywordModal = document.getElementById('keywordModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            keywordModal.style.display = 'flex';
            renderKeywordModal();
        });
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            keywordModal.style.display = 'none';
        });
    }
    
    if (keywordModal) {
        keywordModal.addEventListener('click', (e) => {
            if (e.target === keywordModal) {
                keywordModal.style.display = 'none';
            }
        });
    }
});

// ==========================================
// 데이터 로드 함수
// ==========================================

async function loadNews() {
    console.log('Loading news data...');
    
    try {
        // data/latest.json 파일에서 뉴스 데이터 로드
        const response = await fetch('./data/latest.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('News data loaded:', data.news.length, 'articles');
        
        // 전역 상태 업데이트
        appState.allNews = data.news || [];
        appState.lastUpdated = data.lastUpdated;
        
        // UI 렌더링
        updateLastUpdated();
        renderActionCards();
        renderNewsFeed();
        updateFilterOptions();
        
    } catch (error) {
        console.error('뉴스 로드 실패:', error);
        
        // 에러 표시
        const newsFeed = document.getElementById('newsFeed');
        if (newsFeed) {
            newsFeed.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #999;">
                    <p>⚠️ 뉴스 데이터를 불러올 수 없습니다.</p>
                    <p style="font-size: 12px; margin-top: 10px;">오류: ${error.message}</p>
                    <p style="font-size: 12px;">data/latest.json 파일을 확인해주세요.</p>
                </div>
            `;
        }
    }
}

// ==========================================
// 화면 업데이트 함수
// ==========================================

function updateLastUpdated() {
    const lastUpdatedEl = document.getElementById('lastUpdated');
    if (lastUpdatedEl && appState.lastUpdated) {
        lastUpdatedEl.textContent = formatTime(appState.lastUpdated);
    }
}

function renderActionCards() {
    const container = document.getElementById('actionCardsContainer');
    if (!container) return;
    
    // 위험도가 높은 뉴스 3개 선택
    const actionNews = appState.allNews
        .filter(news => news.riskLevel === 'high' || news.riskLevel === 'medium')
        .slice(0, 3);
    
    if (actionNews.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">현재 우선 액션이 없습니다.</p>';
        return;
    }
    
    container.innerHTML = actionNews.map(news => createActionCard(news)).join('');
}

function renderNewsFeed() {
    const container = document.getElementById('newsFeed');
    if (!container) return;
    
    const newsToShow = appState.filteredNews.length > 0 ? appState.filteredNews : appState.allNews;
    
    if (newsToShow.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">뉴스가 없습니다.</p>';
        return;
    }
    
    container.innerHTML = newsToShow.map((news, index) => createNewsItem(news, index)).join('');
}

function updateFilterOptions() {
    const filterKeyword = document.getElementById('filterKeyword');
    if (!filterKeyword) return;
    
    // 모든 키워드 수집
    const allKeywords = new Set();
    appState.allNews.forEach(news => {
        Object.values(news.matchedKeywords).forEach(keywords => {
            keywords.forEach(kw => allKeywords.add(kw));
        });
    });
    
    const currentValue = filterKeyword.value;
    filterKeyword.innerHTML = '<option value="">모든 키워드</option>';
    
    Array.from(allKeywords).sort().forEach(keyword => {
        const option = document.createElement('option');
        option.value = keyword;
        option.textContent = keyword;
        filterKeyword.appendChild(option);
    });
    
    filterKeyword.value = currentValue;
}

// ==========================================
// 뉴스 아이템 생성
// ==========================================

function createActionCard(news) {
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
    
    return `
        <div class="action-card risk-${news.riskLevel}">
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
        </div>
    `;
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

// ==========================================
// 뉴스 상세 보기 모달
// ==========================================

function openNewsDetail(index) {
    const news = appState.allNews[index];
    if (!news) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'newsDetailModal';
    
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
    
    modal.innerHTML = `
        <div class="modal-content news-modal">
            <div class="modal-header">
                <h2>${news.title}</h2>
                <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
            </div>
            
            <div class="modal-meta">
                <span class="source-badge">${news.source}</span>
                <span class="time-badge">${formatTime(news.date)}</span>
                <span class="risk-badge ${riskClasses[news.riskLevel]}">${riskBadges[news.riskLevel]}</span>
            </div>
            
            <div class="modal-body">
                <p>${news.content}</p>
                
                ${news.matchedKeywords.협력사.length > 0 ? `
                    <div class="keywords-section">
                        <h4>협력사</h4>
                        <div class="keywords-list">
                            ${news.matchedKeywords.협력사.map(kw => `<span class="keyword-tag supplier">${kw}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${news.matchedKeywords.품목.length > 0 ? `
                    <div class="keywords-section">
                        <h4>품목</h4>
                        <div class="keywords-list">
                            ${news.matchedKeywords.품목.map(kw => `<span class="keyword-tag category">${kw}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${news.matchedKeywords.원료.length > 0 ? `
                    <div class="keywords-section">
                        <h4>원료</h4>
                        <div class="keywords-list">
                            ${news.matchedKeywords.원료.map(kw => `<span class="keyword-tag raw-material">${kw}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${news.matchedKeywords.정책.length > 0 ? `
                    <div class="keywords-section">
                        <h4>정책/물류</h4>
                        <div class="keywords-list">
                            ${news.matchedKeywords.정책.map(kw => `<span class="keyword-tag policy">${kw}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <div class="modal-actions">
                <a href="${news.url}" target="_blank" class="btn-primary">원문 읽기</a>
                <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">닫기</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// ==========================================
// 필터링
// ==========================================

function applyFilters() {
    const filterType = document.getElementById('filterType')?.value || 'all';
    const filterKeyword = document.getElementById('filterKeyword')?.value || '';
    
    appState.filteredNews = appState.allNews.filter(news => {
        if (filterType === 'all' && !filterKeyword) {
            return true;
        }
        
        if (filterKeyword) {
            return Object.values(news.matchedKeywords).some(keywords => 
                keywords.includes(filterKeyword)
            );
        }
        
        if (filterType !== 'all') {
            return news.matchedKeywords[filterType]?.length > 0;
        }
        
        return true;
    });
    
    renderNewsFeed();
}

// 필터 이벤트 리스너 등록
function setupFilterListeners() {
    const filterType = document.getElementById('filterType');
    const filterKeyword = document.getElementById('filterKeyword');
    
    if (filterType) {
        filterType.addEventListener('change', applyFilters);
    }
    
    if (filterKeyword) {
        filterKeyword.addEventListener('change', applyFilters);
    }
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
    
    // 클릭된 버튼 찾아서 활성화
    const clickedBtn = event.target.closest('.tab-btn');
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }
}

// ==========================================
// 키워드 관리
// ==========================================

function loadKeywords() {
    const saved = localStorage.getItem('customKeywords');
    if (saved) {
        appState.keywords = JSON.parse(saved);
    } else {
        appState.keywords = JSON.parse(JSON.stringify(DEFAULT_KEYWORDS));
    }
}

function renderKeywordModal() {
    const categories = ['협력사', '품목', '원료', '정책'];
    
    categories.forEach(category => {
        const listId = category === '협력사' ? 'supplierKeywords' :
                      category === '품목' ? 'categoryKeywords' :
                      category === '원료' ? 'rawMaterialKeywords' : 'policyKeywords';
        
        const list = document.getElementById(listId);
        if (!list) return;
        
        list.innerHTML = (appState.keywords[category] || [])
            .map(keyword => `
                <span class="keyword-chip">
                    ${keyword}
                    <button onclick="removeKeyword('${category}', '${keyword}')" class="btn-remove">✕</button>
                </span>
            `)
            .join('');
    });
}

function addKeyword(category) {
    const inputId = category === '협력사' ? 'newSupplier' :
                   category === '품목' ? 'newCategory' :
                   category === '원료' ? 'newRawMaterial' : 'newPolicy';
    
    const input = document.getElementById(inputId);
    if (!input || !input.value.trim()) return;
    
    const keyword = input.value.trim();
    
    if (!appState.keywords[category]) {
        appState.keywords[category] = [];
    }
    
    if (!appState.keywords[category].includes(keyword)) {
        appState.keywords[category].push(keyword);
        renderKeywordModal();
        input.value = '';
    }
}

function removeKeyword(category, keyword) {
    appState.keywords[category] = appState.keywords[category].filter(k => k !== keyword);
    renderKeywordModal();
}

function saveKeywords() {
    localStorage.setItem('customKeywords', JSON.stringify(appState.keywords));
    alert('키워드가 저장되었습니다!');
    document.getElementById('keywordModal').style.display = 'none';
}

function resetToDefault() {
    if (confirm('기본값으로 초기화하시겠습니까?')) {
        appState.keywords = JSON.parse(JSON.stringify(DEFAULT_KEYWORDS));
        localStorage.removeItem('customKeywords');
        renderKeywordModal();
    }
}

// ==========================================
// 유틸 함수
// ==========================================

function formatTime(dateString) {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return '방금 전';
        if (diffMins < 60) return `${diffMins}분 전`;
        if (diffHours < 24) return `${diffHours}시간 전`;
        if (diffDays < 7) return `${diffDays}일 전`;
        
        return date.toLocaleDateString('ko-KR');
    } catch (e) {
        return dateString;
    }
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function showAbout() {
    alert(`Action Priority Board v1.0\n\n현대그린푸드 공산품구매팀\nNews-driven action monitoring system\n\n데이터 갱신: 매일 자동 (GitHub Actions)`);
}
