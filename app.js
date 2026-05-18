// ==========================================
// Action Priority Board - 메인 로직
// ==========================================

let appState = {
    allNews: [],
    keywords: {},
    filteredNews: [],
    lastUpdated: null,
};

const DEFAULT_KEYWORDS = {
    협력사: [
        'SPC', 'CJ', '오뚜기', '동원F&B', '해태', '롯데칠성', '농심', '풀무원',
        '샘표', '코자', '오상', '대상', '멕시카나', '이조', '미원', '우양',
        'LG생활건강', '매일유업', '남양유업', '서울우유'
    ],
    품목: [
        '제과', '비스킷', '스낵', '초콜릿', '음료', '라면', '면류', '장류', '유지류', '소스류'
    ],
    원료: [
        '밀', '쌀', '옥수수', '팜유', '카놀라유', '설탕', '소금', '계란', '참깨', '카카오'
    ],
    정책: [
        '환율', '금리', '운임', 'SCFI', 'WCI', 'BDI', '유가', 'CPI'
    ]
};

// ==========================================
// 초기화
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting initialization...');
    
    loadKeywords();
    loadNews();
    
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
    
    const filterType = document.getElementById('filterType');
    const filterKeyword = document.getElementById('filterKeyword');
    
    if (filterType) {
        filterType.addEventListener('change', applyFilters);
    }
    
    if (filterKeyword) {
        filterKeyword.addEventListener('change', applyFilters);
    }
});

// ==========================================
// 데이터 로드
// ==========================================

function loadNews() {
    console.log('Loading news data...');
    
    fetch('data/latest.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('News data loaded:', data.news.length, 'articles');
            
            appState.allNews = data.news || [];
            appState.lastUpdated = data.lastUpdated;
            
            updateLastUpdated();
            renderActionCards();
            renderNewsFeed();
            updateFilterOptions();
            
        })
        .catch(error => {
            console.error('뉴스 로드 실패:', error);
            
            const newsFeed = document.getElementById('newsFeed');
            if (newsFeed) {
                newsFeed.innerHTML = `
                    <div style="padding: 20px; text-align: center; color: #999;">
                        <p>⚠️ 뉴스 데이터를 불러올 수 없습니다.</p>
                        <p style="font-size: 12px; margin-top: 10px;">오류: ${error.message}</p>
                    </div>
                `;
            }
        });
}

// ==========================================
// UI 렌더링
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
    
    const actionNews = appState.allNews
        .filter(news => news.riskLevel === 'high' || news.riskLevel === 'medium')
        .slice(0, 3);
    
    if (actionNews.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">현재 우선 액션이 없습니다.</p>';
        return;
    }
    
    container.innerHTML = actionNews.map((news, idx) => {
        const index = appState.allNews.findIndex(n => n.id === news.id);
        return createActionCard(news, index);
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
    
    container.innerHTML = newsToShow.map((news, index) => createNewsItem(news, index)).join('');
}

function updateFilterOptions() {
    const filterKeyword = document.getElementById('filterKeyword');
    if (!filterKeyword) return;
    
    const allKeywords = new Set();
    appState.allNews.forEach(news => {
        const kw = news.matchedKeywords || {};
        Object.values(kw).forEach(keywords => {
            if (Array.isArray(keywords)) {
                keywords.forEach(k => allKeywords.add(k));
            }
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

function createActionCard(news, idx) {
    const riskBadges = { high: '위험', medium: '주의', low: '안정' };
    const riskClasses = { high: 'high', medium: 'medium', low: 'low' };
    
    const kw = news.matchedKeywords || {};
    const allMatched = [
        ...(kw.협력사 || []),
        ...(kw.품목 || []),
        ...(kw.원료 || [])
    ];
    
    const mainKeyword = allMatched[0] || '기타';
    
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
                <button class="btn-action" onclick="openNewsDetail(${idx})">자세히 보기</button>
            </div>
        </div>
    `;
}

function createNewsItem(news, index) {
    const indicatorClass = news.riskLevel === 'high' ? 'alert' : (news.riskLevel === 'medium' ? 'warning' : '');
    
    let keywordsHtml = '';
    const kw = news.matchedKeywords || {};
    Object.entries(kw).forEach(([category, keywords]) => {
        if (Array.isArray(keywords)) {
            keywords.forEach(k => {
                const tagClass = category === '협력사' ? 'supplier' : 
                                category === '품목' ? 'category' : 
                                category === '원료' ? 'raw-material' : 'policy';
                keywordsHtml += `<span class="keyword-tag ${tagClass}">${k}</span>`;
            });
        }
    });
    
    const correctIndex = appState.allNews.findIndex(n => n.id === news.id);
    
    return `
        <div class="news-item" onclick="openNewsDetail(${correctIndex})" style="cursor: pointer;">
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
}

// ==========================================
// 뉴스 상세 보기
// ==========================================

function openNewsDetail(index) {
    const news = appState.allNews[index];
    if (!news) {
        console.error('뉴스를 찾을 수 없습니다:', index);
        return;
    }
    
    console.log('상세 페이지 열기:', news.title);
    
    const riskBadges = { high: '위험', medium: '주의', low: '안정' };
    const riskClasses = { high: 'high', medium: 'medium', low: 'low' };
    
    const kw = news.matchedKeywords || {};
    let keywordsSections = '';
    
    ['협력사', '품목', '원료', '정책'].forEach(cat => {
        const keywords = kw[cat];
        if (keywords && Array.isArray(keywords) && keywords.length > 0) {
            const cls = cat === '협력사' ? 'supplier' : 
                       cat === '품목' ? 'category' : 
                       cat === '원료' ? 'raw-material' : 'policy';
            keywordsSections += `
                <div class="keywords-section">
                    <h4>${cat}</h4>
                    <div class="keywords-list">
                        ${keywords.map(k => `<span class="keyword-tag ${cls}">${k}</span>`).join('')}
                    </div>
                </div>
            `;
        }
    });
    
    const html = `
        <div class="modal-content news-modal" onclick="event.stopPropagation()">
            <div class="modal-header">
                <h2>${news.title}</h2>
                <button class="btn-close" onclick="document.getElementById('newsModal').remove()">✕</button>
            </div>
            
            <div class="modal-meta">
                <span class="source-badge">${news.source}</span>
                <span class="time-badge">${formatTime(news.date)}</span>
                <span class="risk-badge ${riskClasses[news.riskLevel]}">${riskBadges[news.riskLevel]}</span>
            </div>
            
            <div class="modal-body">
                <p>${news.content}</p>
                ${keywordsSections}
            </div>
            
            <div class="modal-actions">
                <a href="${news.url}" target="_blank" class="btn-primary">원문 읽기</a>
                <button class="btn-secondary" onclick="document.getElementById('newsModal').remove()">닫기</button>
            </div>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.id = 'newsModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = html;
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    document.body.appendChild(modal);
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
            const kw = news.matchedKeywords || {};
            return Object.values(kw).some(keywords => {
                return Array.isArray(keywords) && keywords.includes(keyword);
            });
        }
        
        if (type !== 'all') {
            const kw = news.matchedKeywords || {};
            return kw[type] && Array.isArray(kw[type]) && kw[type].length > 0;
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
// 유틸
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
    alert(`Action Priority Board v1.0\n\n현대그린푸드 공산품구매팀\nNews-driven action monitoring system`);
}
