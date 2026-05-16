#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Action Priority Board - 뉴스 데이터 수집 스크립트 (Naver API 버전)
Naver News Search API를 통해 식품/유통/물류 관련 뉴스 실시간 수집
"""

import requests
import os
import json
from datetime import datetime, timedelta
from urllib.parse import quote
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# 환경변수에서 API 키 가져오기 (GitHub Secrets에서 제공)
NAVER_CLIENT_ID = os.environ.get('NAVER_CLIENT_ID', '')
NAVER_CLIENT_SECRET = os.environ.get('NAVER_CLIENT_SECRET', '')

# 뉴스 검색 쿼리
NEWS_QUERIES = {
    '협력사': ['SPC', 'CJ', '오뚜기', '동원', '해태', '롯데칠성', '농심', '풀무원'],
    '품목_이슈': ['제과 공급', '음료 문제', '라면 뉴스', '장류 인상', '유지류 가격'],
    '원료_이슈': ['팜유 가격', '밀 수급', '설탕 상승', '계란 시세', '참기름'],
    '정책_이슈': ['할당관세', '해상운임', '환율', '식품안전', '수입 관세'],
    '물류': ['해상운임 SCFI', '배송료', '운송비', '통관'],
    '일반': ['식품업계', '음식료', '식품가격', '유통']
}

def fetch_naver_news():
    """Naver News Search API를 통한 뉴스 수집"""
    
    if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET:
        logger.error("❌ Naver API 인증 정보 없음!")
        logger.info("GitHub Secrets에 NAVER_CLIENT_ID, NAVER_CLIENT_SECRET 등록하세요")
        return []
    
    news_list = []
    headers = {
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
    }
    
    # 모든 쿼리를 하나의 리스트로 통합
    all_queries = []
    for queries in NEWS_QUERIES.values():
        all_queries.extend(queries)
    
    # 중복 제거 후 상위 20개만 사용 (API 호출 수 제한)
    all_queries = list(set(all_queries))[:20]
    
    for query in all_queries:
        try:
            url = f"https://openapi.naver.com/v1/search/news.json?query={quote(query)}&sort=date&display=15"
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code != 200:
                logger.warning(f"⚠️ Naver API 응답 오류: {response.status_code}")
                continue
            
            data = response.json()
            
            for item in data.get('items', []):
                # HTML 태그 제거
                title = item.get('title', '').replace('<b>', '').replace('</b>', '')
                description = item.get('description', '').replace('<b>', '').replace('</b>', '')
                
                news_item = {
                    'title': title,
                    'source': item.get('source', '네이버뉴스'),
                    'date': item.get('pubDate', ''),  # RFC 822 형식
                    'url': item.get('link', ''),  # 정확한 기사 링크
                    'content': description[:300],
                }
                
                # 중복 제거 (제목 기준)
                if not any(n['title'] == news_item['title'] for n in news_list):
                    news_list.append(news_item)
            
            logger.info(f"✅ '{query}': {len(data.get('items', []))} 개 기사 수집")
        
        except requests.exceptions.Timeout:
            logger.warning(f"⚠️ '{query}' 요청 타임아웃")
        except Exception as e:
            logger.error(f"❌ '{query}' 수집 실패: {str(e)}")
    
    return news_list

def classify_news_risk(title, content):
    """뉴스의 리스크 레벨 분류"""
    text = (title + ' ' + content).lower()
    
    high_risk_keywords = ['화재', '생산중단', '공급차질', '긴급', '대량', '소비자피해', '리콜', 
                         '손실', '파산', '문제', '위기', '위험']
    medium_risk_keywords = ['인상', '상승', '협상', '갈등', '지연', '부족', '차질', '변동']
    
    if any(word in text for word in high_risk_keywords):
        return 'high'
    elif any(word in text for word in medium_risk_keywords):
        return 'medium'
    else:
        return 'low'

def parse_rfc822_date(date_str):
    """RFC 822 형식의 날짜를 ISO 8601로 변환"""
    try:
        # Naver API는 RFC 822 형식 반환
        # 예: "Fri, 16 May 2026 05:30:00 +0900"
        from email.utils import parsedate_to_datetime
        dt = parsedate_to_datetime(date_str)
        return dt.isoformat()
    except Exception as e:
        logger.warning(f"날짜 파싱 실패: {date_str} - {str(e)}")
        return datetime.now().isoformat()

def enrich_news(news_list):
    """뉴스에 추가 정보 추가"""
    for i, news in enumerate(news_list):
        news['id'] = i + 1
        news['riskLevel'] = classify_news_risk(
            news.get('title', ''),
            news.get('content', '')
        )
        
        # 날짜 형식 표준화
        if news.get('date'):
            news['date'] = parse_rfc822_date(news['date'])
        else:
            news['date'] = datetime.now().isoformat()
        
        # matchedKeywords 초기화 (app.js에서 매칭함)
        news['matchedKeywords'] = {
            '협력사': [],
            '품목': [],
            '원료': [],
            '정책': []
        }
    
    return news_list

def save_news_data(news_list):
    """뉴스 데이터를 JSON으로 저장"""
    data = {
        'lastUpdated': datetime.now().isoformat(),
        'news': news_list
    }
    
    # 디렉토리 생성
    os.makedirs('data', exist_ok=True)
    
    with open('data/latest.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    logger.info(f"✅ 데이터 저장 완료: data/latest.json ({len(news_list)} 개 기사)")

def main():
    """메인 함수"""
    logger.info("🚀 뉴스 데이터 수집 시작...")
    
    try:
        # Naver API에서 뉴스 수집
        news_list = fetch_naver_news()
        
        if len(news_list) == 0:
            logger.warning("⚠️ 수집된 뉴스가 없습니다. API 키를 확인하세요.")
            # 오류 시에도 파일은 생성 (빈 데이터로)
            save_news_data([])
            return
        
        # 최신순 정렬 (날짜 기준)
        news_list.sort(key=lambda x: x.get('date', ''), reverse=True)
        
        # 상위 50개만 유지
        news_list = news_list[:50]
        
        # 추가 정보 추가
        enriched_news = enrich_news(news_list)
        
        # 저장
        save_news_data(enriched_news)
        
        logger.info(f"✅ 뉴스 수집 완료: 총 {len(enriched_news)} 개")
    
    except Exception as e:
        logger.error(f"❌ 뉴스 수집 중 오류 발생: {str(e)}")
        # 오류 시에도 파일은 생성
        save_news_data([])

if __name__ == '__main__':
    main()
