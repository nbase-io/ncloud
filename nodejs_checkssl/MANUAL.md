# 🔧 SSL 모니터링 시스템 운영 메뉴얼

이 문서는 SSL 인증서 모니터링 시스템의 관리자를 위한 상세한 운영 가이드입니다.

## 📋 일일 운영 체크리스트

### 매일 해야 할 일
- [ ] 시스템 정상 동작 확인 (`npm run status`)
- [ ] 에러 로그 확인
- [ ] 알림 발송 기록 확인
- [ ] NCP SENS 잔액 확인

### 주간 점검
- [ ] 도메인 목록 업데이트 (`domain.txt`)
- [ ] 담당자 연락처 업데이트 (`notification.txt`)
- [ ] 발송 기록 정리 (필요시 `npm run reset`)
- [ ] 로그 파일 아카이브

### 월간 점검
- [ ] 시스템 업데이트 확인
- [ ] 의존성 패키지 업데이트
- [ ] 보안 취약점 점검
- [ ] 백업 데이터 검증

## 🚨 긴급상황 대응

### 시스템이 동작하지 않을 때

**1. 환경변수 문제**
```bash
# 에러 예시
Error: ❌ 필수 환경변수 NCP_SECRET_KEY가 설정되지 않았습니다.

# 해결 방법
vi .env
# 모든 필수 환경변수 확인 후 저장
```

**2. 파일 권한 문제**
```bash
# 에러 예시
❌ 파일 읽기 권한이 없습니다: domain.txt

# 해결 방법
chmod 644 domain.txt notification.txt
chmod 600 .env  # 보안을 위해 .env는 owner만 읽기 가능
```

**3. 네트워크 연결 문제**
```bash
# 연결 테스트
npm run single google.com 01012345678

# 특정 포트 테스트
npm run single example.com:8443 01012345678
```

### SSL 체크 실패시

**1. 에러 알림 자동 발송**
시스템은 SSL 체크 실패시 자동으로 에러 알림을 발송합니다:
- 4시간 쿨다운 (정상 알림보다 짧음)
- 하루 최대 6회 발송 제한
- 에러 타입별 맞춤 메시지

**2. 주요 에러 유형:**
- `연결 시간 초과`: 서버 응답 없음
- `연결 실패 ENOTFOUND`: 도메인명 오류 또는 DNS 문제
- `연결 거부 ECONNREFUSED`: 서버가 연결을 거부

### 문자 발송 실패시

**1. NCP SENS 설정 확인**
```bash
# API 키 유효성 확인
curl -X POST "https://sens.apigw.ntruss.com/sms/v2/services/${NCP_SMS_URI}/messages" \
  -H "Content-Type: application/json" \
  -H "x-ncp-iam-access-key: ${NCP_ACCESS_KEY}" \
  -H "x-ncp-apigw-timestamp: $(date +%s000)" \
  -H "x-ncp-apigw-signature-v2: SIGNATURE"
```

**2. 발신번호 등록 확인**
- NCP 콘솔 > Simple & Easy Notification Service > 발신번호 등록 확인
- 발신번호 승인 상태 확인

**3. 잔액 확인**
- NCP 콘솔 > 마이페이지 > 요금/결제 > 잔액 확인

## 📊 모니터링 및 로그 분석

### 발송 기록 확인
```bash
# 현재 발송 상태 확인
npm run status

# 출력 예시
📊 SSL 체크 상태

🌐 google.com:443
   📅 마지막 발송: 2024.01.10 09:00
   📊 발송 횟수: 1회

🌐 github.com:443
   📅 마지막 발송: 2024.01.09 09:00
   📊 발송 횟수: 2회
```

### 로그 레벨 설정
```bash
# 상세 디버그 로그
LOG_LEVEL=debug npm start

# 에러만 표시
LOG_LEVEL=error npm start

# 정보성 로그 (기본값)
LOG_LEVEL=info npm start
```

### 시스템 성능 모니터링
```bash
# 메모리 사용량 확인
ps aux | grep "node.*ssl"

# 디스크 사용량 확인
du -sh /path/to/ssl-checker

# 네트워크 상태 확인
netstat -an | grep :443
```

## 🔐 보안 관리

### 환경변수 보안
```bash
# .env 파일 권한 설정 (필수)
chmod 600 .env
chown $USER:$USER .env

# 환경변수 히스토리 제거
history -c
export HISTFILE=/dev/null
```

### API 키 로테이션
1. NCP 콘솔에서 새 API 키 생성
2. `.env` 파일 업데이트
3. 기존 API 키 비활성화
4. 시스템 재시작 및 테스트

### 액세스 로그 모니터링
```bash
# 로그 파일에서 의심스러운 활동 검색
grep -i "fail\|error\|unauthorized" /var/log/ssl-check.log

# 발송 패턴 분석
grep "SMS 발송" /var/log/ssl-check.log | awk '{print $1}' | sort | uniq -c
```

## 📈 스케일링 및 최적화

### 대용량 도메인 관리
```bash
# 도메인 수가 100개 이상인 경우
# 배치 크기 제한 (10개씩 처리)
split -l 10 domain.txt domain_batch_
for batch in domain_batch_*; do
  cp $batch domain.txt
  npm start
  sleep 60  # API 제한을 위한 대기
done
```

### 병렬 처리 스크립트
```bash
#!/bin/bash
# parallel_check.sh

# 도메인을 그룹별로 분할
split -l 20 domain.txt domain_group_

# 백그라운드에서 병렬 실행
for group in domain_group_*; do
  (
    cp $group domain.txt
    npm start > "log_$(basename $group).log" 2>&1
  ) &
done

# 모든 작업 완료 대기
wait
echo "모든 그룹 처리 완료"
```

### 성능 최적화
```bash
# Node.js 메모리 최적화
export NODE_OPTIONS="--max-old-space-size=1024"

# 동시 연결 수 제한
export UV_THREADPOOL_SIZE=4
```

## 🔄 백업 및 복구

### 정기 백업 스크립트
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backup/ssl-checker/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# 설정 파일 백업
cp domain.txt "$BACKUP_DIR/"
cp notification.txt "$BACKUP_DIR/"
cp .env "$BACKUP_DIR/"  # 주의: 보안 파일

# 발송 기록 백업
cp last_sent.json "$BACKUP_DIR/" 2>/dev/null || true

# 로그 백업
cp *.log "$BACKUP_DIR/" 2>/dev/null || true

echo "백업 완료: $BACKUP_DIR"
```

### 복구 절차
```bash
# 1. 서비스 중지
pkill -f "node.*ssl"

# 2. 백업에서 복구
RESTORE_DATE="20240110"
cp "/backup/ssl-checker/$RESTORE_DATE/"* .

# 3. 권한 복구
chmod 600 .env
chmod 644 domain.txt notification.txt

# 4. 서비스 재시작
npm start
```

## 📞 담당자 연락처 관리

### notification.txt 관리 지침
```txt
# 담당자별 그룹 구성 예시
# 시스템 관리자 (우선순위 높음)
01012345678  # 홍길동 (팀장)
01087654321  # 김철수 (시니어)

# 개발팀
01011112222  # 이영희 (백엔드)
01033334444  # 박민수 (인프라)

# 비상 연락망
01099998888  # 24시간 상황실
```

### 연락처 유효성 검증
```bash
# 잘못된 번호 형식 체크
grep -v "^#\|^$" notification.txt | grep -v "^010[0-9]\{8\}$"

# 중복 번호 체크
sort notification.txt | uniq -d
```

## 🎯 성능 메트릭 및 KPI

### 주요 지표
- **가용성**: 시스템 업타임 > 99.5%
- **응답시간**: 도메인당 평균 체크 시간 < 10초
- **알림 지연**: SSL 만료 감지 후 30분 이내 알림
- **성공률**: 문자 발송 성공률 > 95%

### 모니터링 대시보드 (예시)
```bash
#!/bin/bash
# monitoring_dashboard.sh

echo "=== SSL 모니터링 대시보드 ==="
echo "현재 시간: $(date)"
echo ""

# 시스템 상태
echo "📊 시스템 상태"
echo "- 체크 대상 도메인: $(grep -c "^[^#]" domain.txt)개"
echo "- 알림 대상: $(grep -c "^[^#]" notification.txt)명"
echo "- 마지막 체크: $(stat -c %y last_sent.json 2>/dev/null || echo '없음')"
echo ""

# 최근 알림 현황
echo "📱 최근 24시간 알림 현황"
find . -name "*.log" -mtime -1 -exec grep -l "SMS 발송 성공" {} \; | wc -l
echo ""

# 임박한 만료 도메인 (수동 확인용)
echo "⚠️ 주의 필요 도메인 (수동 확인 권장)"
npm run single google.com 2>/dev/null | grep -E "(위험|주의|알림)"
```

## 🧰 문제 해결 도구

### 자동 복구 스크립트
```bash
#!/bin/bash
# auto_recovery.sh

# 1. 권한 복구
chmod 600 .env
chmod 644 domain.txt notification.txt

# 2. 의존성 재설치
npm install

# 3. 캐시 정리
npm cache clean --force

# 4. 테스트 실행
npm run single google.com 01012345678

if [ $? -eq 0 ]; then
  echo "✅ 복구 완료"
else
  echo "❌ 복구 실패 - 수동 확인 필요"
fi
```

### 진단 스크립트
```bash
#!/bin/bash
# diagnosis.sh

echo "🔍 시스템 진단 시작"

# 환경변수 체크
echo "1. 환경변수 확인"
if [ -f .env ]; then
  echo "✅ .env 파일 존재"
  if grep -q "NCP_SECRET_KEY" .env; then
    echo "✅ 필수 환경변수 존재"
  else
    echo "❌ 필수 환경변수 누락"
  fi
else
  echo "❌ .env 파일 없음"
fi

# 파일 권한 체크
echo "2. 파일 권한 확인"
ls -la domain.txt notification.txt .env

# 네트워크 연결 체크
echo "3. 네트워크 연결 확인"
curl -s --connect-timeout 5 https://google.com > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ 인터넷 연결 정상"
else
  echo "❌ 인터넷 연결 문제"
fi

# Node.js 버전 확인
echo "4. Node.js 환경 확인"
node --version
npm --version

echo "진단 완료"
```

---

**📞 긴급 연락처**
- 시스템 관리자: [담당자 연락처]
- NCP 기술지원: 1588-3820
- 사내 IT 헬프데스크: [내부 연락처]

**📚 참고 문서**
- NCP SENS API 문서: https://api.ncloud-docs.com/docs/ai-application-service-sens
- Node.js 공식 문서: https://nodejs.org/docs/
- TypeScript 문서: https://www.typescriptlang.org/docs/ 