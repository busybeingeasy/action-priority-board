#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Action Priority Board - 뉴스 데이터 수집 스크립트
Naver News RSS 및 Google News RSS를 통해 식품/유통/물류 관련 뉴스 수집
"""

import feedparser
import requests
import os
import json
from datetime import datetime, timedelta
from urllib.parse import quote
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# 뉴스 키워드 (검색 쿼리)
NEWS_KEYWORDS = {
    '협력사': ['SPC', 'CJ', '오뚜기', '동원', '해태', '롯데칠성', '농심', '풀무원'],
    '품목_이슈': ['제과 공급', '음료 문제', '라면 뉴스', '장류 인상', '유지류 가격'],
    '원료_이슈': ['팜유 가격', '밀 수급', '설탕 상승', '계란 시세', '참기름'],
    '정책_이슈': ['할당관세', '해상운임', '환율', '식품안전', '수입 관세'],
    '물류': ['해상운임', 'SCFI', '배송료', '운송비', '통관'],
    '일반': ['식품업계', '음식료', '식품', '유통', '급식']
}

NAVER_NEWS_RSS_BASE = "https://news.naver.com/rss/section/{section_id}"
GOOGLE_NEWS_RSS = "https://news.google.com/rss?q={query}&ceid=KR%3Ako&gl=KR&hl=ko"

# 뉴스 섹션 ID (네이버)
NAVER_SECTIONS = {
    '경제': '100',
    '비즈니스': '101'
}

def fetch_naver_news():
    """네이버 뉴스 RSS 수집"""
    news_list = []
    
    for section_name, section_id in NAVER_SECTIONS.items():
        try:
            url = NAVER_NEWS_RSS_BASE.format(section_id=section_id)
            response = requests.get(url, timeout=10)
            feed = feedparser.parse(response.content)
            
            for entry in feed.entries[:20]:  # 최근 20개만
                news_item = {
                    'title': entry.get('title', ''),
                    'source': '네이버뉴스',
                    'date': entry.get('published', ''),
                    'url': entry.get('link', ''),
                    'content': entry.get('summary', '')[:300],  # 요약만 추출
                    'section': section_name
                }
                
                # 중복 제거
                if not any(n['title'] == news_item['title'] for n in news_list):
                    news_list.append(news_item)
            
            logger.info(f"✅ 네이버 {section_name} 섹션: {len(feed.entries)} 개 기사 수집")
        
        except Exception as e:
            logger.error(f"❌ 네이버 {section_name} 수집 실패: {str(e)}")
    
    return news_list

def fetch_google_news():
    """Google News RSS 수집 - 키워드별"""
    news_list = []
    all_keywords = []
    
    # 모든 키워드 합치기
    for keywords in NEWS_KEYWORDS.values():
        all_keywords.extend(keywords)
    
    for keyword in all_keywords[:15]:  # 너무 많으면 API 호출 제한, 15개까지만
        try:
            url = GOOGLE_NEWS_RSS.format(query=quote(keyword))
            response = requests.get(url, timeout=10)
            feed = feedparser.parse(response.content)
            
            for entry in feed.entries[:5]:  # 키워드별 최근 5개
                news_item = {
                    'title': entry.get('title', ''),
                    'source': entry.get('source', {}).get('title', 'Google News'),
                    'date': entry.get('published', ''),
                    'url': entry.get('link', ''),
                    'content': entry.get('summary', '')[:300],
                    'keyword': keyword
                }
                
                # 중복 제거
                if not any(n['title'] == news_item['title'] for n in news_list):
                    news_list.append(news_item)
            
            logger.info(f"✅ Google News '{keyword}': {len(feed.entries)} 개 기사 수집")
        
        except Exception as e:
            logger.error(f"❌ Google News '{keyword}' 수집 실패: {str(e)}")
    
    return news_list

def fetch_naver_api_news():
    """
    Naver News Search API를 통한 뉴스 수집 (선택사항)
    GitHub Secrets에서 NAVER_CLIENT_ID, NAVER_CLIENT_SECRET 필요
    """
    client_id = os.environ.get('NAVER_CLIENT_ID', '')
    client_secret = os.environ.get('NAVER_CLIENT_SECRET', '')
    
    if not client_id or not client_secret:
        logger.warning("⚠️ Naver API 인증 정보 없음 (선택 사항)")
        return []
    
    news_list = []
    headers = {
        'X-Naver-Client-Id': client_id,
        'X-Naver-Client-Secret': client_secret
    }
    
    queries = [
        '식품업계 뉴스',
        '음료 제조사',
        '해상운임',
        '환율',
        '할당관세'
    ]
    
    for query in queries:
        try:
            url = f"https://openapi.naver.com/v1/search/news.json?query={quote(query)}&sort=date&display=10"
            response = requests.get(url, headers=headers, timeout=10)
            data = response.json()
            
            for item in data.get('items', []):
                # HTML 태그 제거
                title = item.get('title', '').replace('<b>', '').replace('</b>', '')
                description = item.get('description', '').replace('<b>', '').replace('</b>', '')
                
                news_item = {
                    'title': title,
                    'source': item.get('source', ''),
                    'date': item.get('pubDate', ''),
                    'url': item.get('link', ''),
                    'content': description[:300],
                    'api': 'naver'
                }
                
                if not any(n['title'] == news_item['title'] for n in news_list):
                    news_list.append(news_item)
            
            logger.info(f"✅ Naver API '{query}': {len(data.get('items', []))} 개 기사")
        
        except Exception as e:
            logger.error(f"❌ Naver API '{query}' 수집 실패: {str(e)}")
    
    return news_list

def classify_news_risk(title, content):
    """뉴스의 리스크 레벨 분류"""
    text = (title + ' ' + content).lower()
    
    high_risk_keywords = ['공장화재', '생산중단', '공급차질', '긴급', '대량', '소비자피해', '리콜']
    medium_risk_keywords = ['인상', '상승', '협상', '갈등', '문제', '지연']
    
    if any(word in text for word in high_risk_keywords):
        return 'high'
    elif any(word in text for word in medium_risk_keywords):
        return 'medium'
    else:
        return 'low'

def merge_and_deduplicate(news_sources):
    """여러 소스의 뉴스를 병합하고 중복 제거"""
    merged = []
    seen_titles = set()
    
    for news_list in news_sources:
        for news in news_list:
            # 제목 중복 제거 (유사도 기반으로는 추후 개선 가능)
            if news['title'] not in seen_titles:
                merged.append(news)
                seen_titles.add(news['title'])
    
    # 날짜 역순 정렬 (최신순)
    merged.sort(key=lambda x: x.get('date', ''), reverse=True)
    
    return merged[:100]  # 최대 100개만 유지

def enrich_news(news_list):
    """뉴스에 추가 정보 추가 (리스크 레벨 등)"""
    for i, news in enumerate(news_list):
        news['id'] = i + 1
        news['riskLevel'] = classify_news_risk(
            news.get('title', ''),
            news.get('content', '')
        )
        
        # 날짜 포맷 표준화 (ISO 8601)
        try:
            if isinstance(news.get('date'), str):
                # 여러 형식 시도
                for fmt in ['%a, %d %b %Y %H:%M:%S %Z', '%Y-%m-%dT%H:%M:%S%z']:
                    try:
                        dt = datetime.strptime(news['date'], fmt)
                        news['date'] = dt.isoformat()
                        break
                    except ValueError:
                        continue
                else:
                    # 파싱 실패 시 현재 시간 사용
                    news['date'] = datetime.now().isoformat()
        except Exception as e:
            logger.warning(f"날짜 파싱 실패: {news.get('title')} - {str(e)}")
            news['date'] = datetime.now().isoformat()
    
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
        # 여러 소스에서 뉴스 수집
        naver_news = fetch_naver_news()
        google_news = fetch_google_news()
        naver_api_news = fetch_naver_api_news()
        
        # 병합 및 중복 제거
        all_news = merge_and_deduplicate([naver_news, google_news, naver_api_news])
        
        # 추가 정보 추가
        enriched_news = enrich_news(all_news)
        
        # 저장
        save_news_data(enriched_news)
        
        logger.info(f"✅ 뉴스 수집 완료: 총 {len(enriched_news)} 개")
    
    except Exception as e:
        logger.error(f"❌ 뉴스 수집 중 오류 발생: {str(e)}")
        raise

if __name__ == '__main__':
    main()
