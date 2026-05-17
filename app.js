// ==========================================
// Action Priority Board - 메인 로직 (간단 버전)
// ==========================================

let appState = {
    allNews: [],
    filteredNews: [],
    keywords: {},
    lastUpdated: null
};

const DEFAULT_KEYWORDS = {
    협력사: ['SPC', 'CJ', '오뚜기', '동원F&B', '해태', '롯데칠성', '농심', '풀무원'],
    품목: ['제과', '비스킷', '스낵', '음료', '라면', '면류', '장류', '유지류'],
    원료: ['밀', '쌀', '옥수수', '팜유', '카놀라유', '설탕', '소금', '계란'],
    정책: ['환율', '금리', '운임', 'SCFI', 'WCI', 'BDI', '유가', 'CPI']
};

// ==========================================
// 초기화
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('초기화 시작...');
    
    // 키워드 로드
    loadKeywords();
    
    // 뉴스 로드
    await loadNews();
    
    // 필터 이벤트
    const filterType = document.getElementById('filterType');
    const filterKeyword = document.getElementById('filterKeyword');
    
    if (filterType) filterType.addEventListener('change', applyFilters);
    if (filterKeyword) filterKeyword.addEventListener('change', applyFilters);
    
    // 모달 버튼
    const settingsBtn = document.getElementById('settingsBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const keywordModal = document.getElementById('keywordModal');
    
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            if (keywordModal) keywordModal.style.display = 'flex';
            renderKeywordModal();
        });
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            if (keywordModal) keywordModal.style.display = 'none';
        });
    }
});

// ==========================================
// 뉴스 로드
// ==========================================

async function loadNews() {
    try {
        const response = await fetch('./data/latest.json');
        const data = await response.json();
        
        appState.allNews = data.news || [];
        appState.lastUpdated = data.lastUpdated;
        
        console.log('뉴스 로드됨:', appState.allNews.length, '개');
        
        // UI 업데이트
        updateLastUpdated();
        renderActionCards();
        renderNewsFeed();
        updateFilterOptions();
        
    } catch (error) {
        console.error('뉴스 로드 실패:', error);
        document.getElementById('newsFeed').innerHTML = `
            <div style="padding: 20px; text-align: center; color: #999;">
                <p>⚠️ 뉴스를 불러올 수 없습니다.</p>
                <p style="font-size: 12px;">${error.message}</p>
            </div>
        `;
    }
}

// ==========================================
// UI 렌더링
// ==========================================

function updateLastUpdated() {
    const el = document.getElementById('lastUpdated');
    if (el && appState.lastUpdated) {
        el.textContent = formatTime(appState.lastUpdated);
    }
}

function renderActionCards() {
    const container = document.getElementById('actionCardsContainer');
    if (!container) return;
    
    const actionNews = appState.allNews
        .filter(n => n.riskLevel === 'high' || n.riskLevel === 'medium')
        .slice(0, 3);
    
    if (actionNews.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">우선 액션이 없습니다.</p>';
        return;
    }
    
    container.innerHTML = actionNews.map(news => {
        const idx = appState.allNews.findIndex(n => n.id === news.id);
        const badges = { high: '위험', medium: '주의', low: '안정' };
        const classes = { high: 'high', medium: 'medium', low: 'low' };
        
        return `
            <div class="action-card risk-${news.riskLevel}">
                <div class="card-header">
                    <h3 class="card-title">${news.matchedKeywords.협력사[0] || '기타'}</h3>
                    <span class="risk-badge ${classes[news.riskLevel]}">${badges[news.riskLevel]}</span>
                </div>
                <div class="card-content">
                    <div class="content-row">
                        <span class="content-label">이슈</span>
                        <span class="content-value">${news.title.substring(0, 30)}...</span>
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
                    <button class="btn-action" onclick="openNewsDetail(${idx})">자세히 보기</button>
                </div>
            </div>
        `;
    }).join('');
}

function renderNewsFeed() {
    const container = document.getElementById('newsFeed');
    if (!container) return;
    
    const newsToShow = appState.filteredNews.length > 0 ? appState.filteredNews : appState.allNews;
    
    if (newsToShow.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">뉴스가 없습니다.</p>';
        return;
    }
    
    container.innerHTML = newsToShow.map(news => {
        const idx = appState.allNews.findIndex(n => n.id === news.id);
        const indicatorClass = news.riskLevel === 'high' ? 'alert' : 
                              news.riskLevel === 'medium' ? 'warning' : '';
        
        let keywordsHtml = '';
        Object.entries(news.matchedKeywords).forEach(([cat, kws]) => {
            kws.forEach(kw => {
                const cls = cat === '협력사' ? 'supplier' : 
                           cat === '품목' ? 'category' : 
                           cat === '원료' ? 'raw-material' : 'policy';
                keywordsHtml += `<span class="keyword-tag ${cls}">${kw}</span>`;
            });
        });
        
        return `
            <div class="news-item" onclick="openNewsDetail(${idx})" style="cursor: pointer;">
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
            </div>
        `;
    }).join('');
}

function updateFilterOptions() {
    const select = document.getElementById('filterKeyword');
    if (!select) return;
    
    const keywords = new Set();
    appState.allNews.forEach(news => {
        Object.values(news.matchedKeywords).forEach(kws => {
            kws.forEach(kw => keywords.add(kw));
        });
    });
    
    const val = select.value;
    select.innerHTML = '<option value="">모든 키워드</option>';
    Array.from(keywords).sort().forEach(kw => {
        select.innerHTML += `<option value="${kw}">${kw}</option>`;
    });
    select.value = val;
}

// ==========================================
// 뉴스 상세 보기
// ==========================================

function openNewsDetail(idx) {
    const news = appState.allNews[idx];
    if (!news) return;
    
    const badges = { high: '위험', medium: '주의', low: '안정' };
    const classes = { high: 'high', medium: 'medium', low: 'low' };
    
    let keywordsSections = '';
    ['협력사', '품목', '원료', '정책'].forEach(cat => {
        const kws = news.matchedKeywords[cat];
        if (kws && kws.length > 0) {
            const cls = cat === '협력사' ? 'supplier' : 
                       cat === '품목' ? 'category' : 
                       cat === '원료' ? 'raw-material' : 'policy';
            keywordsSections += `
                <div class="keywords-section">
                    <h4>${cat}</h4>
                    <div class="keywords-list">
                        ${kws.map(kw => `<span class="keyword-tag ${cls}">${kw}</span>`).join('')}
                    </div>
                </div>
            `;
        }
    });
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content news-modal">
            <div class="modal-header">
                <h2>${news.title}</h2>
                <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
            </div>
            
            <div class="modal-meta">
                <span class="source-badge">${news.source}</span>
                <span class="time-badge">${formatTime(news.date)}</span>
                <span class="risk-badge ${classes[news.riskLevel]}">${badges[news.riskLevel]}</span>
            </div>
            
            <div class="modal-body">
                <p>${news.content}</p>
                ${keywordsSections}
            </div>
            
            <div class="modal-actions">
                <a href="${news.url}" target="_blank" class="btn-primary">원문 읽기</a>
                <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">닫기</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// ==========================================
// 필터링
// ==========================================

function applyFilters() {
    const type = document.getElementById('filterType')?.value || 'all';
    const keyword = document.getElementById('filterKeyword')?.value || '';
    
    appState.filteredNews = appState.allNews.filter(news => {
        if (type === 'all' && !keyword) return true;
        
        if (keyword) {
            return Object.values(news.matchedKeywords).some(kws => kws.includes(keyword));
        }
        
        if (type !== 'all') {
            return news.matchedKeywords[type]?.length > 0;
        }
        
        return true;
    });
    
    renderNewsFeed();
}

// ==========================================
// 탭 전환
// ==========================================

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    const tab = document.getElementById(tabName);
    if (tab) tab.classList.add('active');
    
    const btn = event.target.closest('.tab-btn');
    if (btn) btn.classList.add('active');
}

// ==========================================
// 키워드 관리
// ==========================================

function loadKeywords() {
    const saved = localStorage.getItem('customKeywords');
    appState.keywords = saved ? JSON.parse(saved) : { ...DEFAULT_KEYWORDS };
}

function renderKeywordModal() {
    ['협력사', '품목', '원료', '정책'].forEach(cat => {
        const id = cat === '협력사' ? 'supplierKeywords' :
                   cat === '품목' ? 'categoryKeywords' :
                   cat === '원료' ? 'rawMaterialKeywords' : 'policyKeywords';
        
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = (appState.keywords[cat] || [])
                .map(kw => `
                    <span class="keyword-chip">
                        ${kw}
                        <button onclick="removeKeyword('${cat}', '${kw}')" class="btn-remove">✕</button>
                    </span>
                `).join('');
        }
    });
}

function addKeyword(cat) {
    const id = cat === '협력사' ? 'newSupplier' :
               cat === '품목' ? 'newCategory' :
               cat === '원료' ? 'newRawMaterial' : 'newPolicy';
    
    const input = document.getElementById(id);
    if (!input || !input.value.trim()) return;
    
    const kw = input.value.trim();
    if (!appState.keywords[cat]) appState.keywords[cat] = [];
    
    if (!appState.keywords[cat].includes(kw)) {
        appState.keywords[cat].push(kw);
        renderKeywordModal();
        input.value = '';
    }
}

function removeKeyword(cat, kw) {
    appState.keywords[cat] = appState.keywords[cat].filter(k => k !== kw);
    renderKeywordModal();
}

function saveKeywords() {
    localStorage.setItem('customKeywords', JSON.stringify(appState.keywords));
    alert('저장되었습니다!');
    document.getElementById('keywordModal').style.display = 'none';
}

function resetToDefault() {
    if (confirm('기본값으로 초기화하시겠습니까?')) {
        appState.keywords = { ...DEFAULT_KEYWORDS };
        localStorage.removeItem('customKeywords');
        renderKeywordModal();
    }
}

// ==========================================
// 유틸
// ==========================================

function formatTime(dateString) {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);
        
        if (diff < 60) return '방금 전';
        if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
        
        return date.toLocaleDateString('ko-KR');
    } catch {
        return dateString;
    }
}

function showAbout() {
    alert('Action Priority Board v1.0\n\n현대그린푸드 공산품구매팀');
}
