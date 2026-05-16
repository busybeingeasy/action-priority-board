#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Action Priority Board - 데이터 검증 스크립트
수집된 뉴스 데이터의 품질 및 신선도 확인
"""

import json
import os
from datetime import datetime, timedelta, timezone
import logging

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

def validate_data():
    """데이터 유효성 검증"""
    
    try:
        # 파일 존재 확인
        if not os.path.exists('data/latest.json'):
            logger.error("❌ data/latest.json 파일이 없습니다.")
            return False
        
        # JSON 파일 로드
        with open('data/latest.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 필수 필드 확인
        if 'lastUpdated' not in data or 'news' not in data:
            logger.error("❌ 필수 필드 누락: lastUpdated 또는 news")
            return False
        
        # 데이터 신선도 확인
        try:
            last_updated_str = data['lastUpdated']
            # ISO 형식 파싱 (시간대 정보 포함 또는 미포함)
            if last_updated_str.endswith('Z'):
                last_updated = datetime.fromisoformat(last_updated_str.replace('Z', '+00:00'))
            elif '+' in last_updated_str or last_updated_str.count('-') > 2:
                last_updated = datetime.fromisoformat(last_updated_str)
            else:
                # 시간대 정보 없으면 UTC로 처리
                last_updated = datetime.fromisoformat(last_updated_str).replace(tzinfo=timezone.utc)
            
            # 현재 시간 (UTC)
            now = datetime.now(timezone.utc)
            age = now - last_updated
            
            if age > timedelta(days=1):
                logger.warning(f"⚠️ 데이터가 오래되었습니다: {age.days}일 전")
            else:
                logger.info(f"✅ 데이터 신선도 양호: {age.total_seconds() / 3600:.1f}시간 전")
        
        except Exception as e:
            logger.warning(f"⚠️ 날짜 파싱 실패: {str(e)}")
        
        # 뉴스 개수 확인
        news_count = len(data.get('news', []))
        if news_count == 0:
            logger.error("❌ 뉴스 데이터가 비어있습니다.")
            return False
        
        logger.info(f"✅ 뉴스 개수: {news_count}개")
        
        # 각 뉴스 항목 검증
        for i, news in enumerate(data['news']):
            required_fields = ['id', 'title', 'source', 'date', 'url', 'content', 'riskLevel']
            for field in required_fields:
                if field not in news:
                    logger.warning(f"⚠️ 뉴스 #{i+1}: 필드 누락 '{field}'")
        
        # 리스크 레벨 분포
        risk_dist = {
            'high': len([n for n in data['news'] if n.get('riskLevel') == 'high']),
            'medium': len([n for n in data['news'] if n.get('riskLevel') == 'medium']),
            'low': len([n for n in data['news'] if n.get('riskLevel') == 'low'])
        }
        
        logger.info(f"📊 리스크 분포 - 높음: {risk_dist['high']}, 중간: {risk_dist['medium']}, 낮음: {risk_dist['low']}")
        
        # 소스 다양성 확인
        sources = set(n.get('source', '') for n in data['news'])
        logger.info(f"📰 뉴스 소스: {len(sources)}개 ({', '.join(list(sources)[:5])}...)")
        
        logger.info("✅ 데이터 검증 완료!")
        return True
    
    except json.JSONDecodeError:
        logger.error("❌ JSON 파일이 손상되었습니다.")
        return False
    except Exception as e:
        logger.error(f"❌ 검증 중 오류 발생: {str(e)}")
        return False

if __name__ == '__main__':
    success = validate_data()
    exit(0 if success else 1)
