# 🔒 보안 가이드

SSL 인증서 모니터링 시스템의 보안 설정 및 모범 사례입니다.

## 🛡️ 구현된 보안 기능

### 1. 입력 검증 및 Sanitization
- **도메인 검증**: SSRF 공격 방지를 위한 private IP 차단
- **전화번호 검증**: 한국 휴대폰 번호 형식 강제
- **파일 경로 검증**: Path Traversal 공격 방지
- **환경변수 검증**: 각 환경변수별 특화된 유효성 검사

### 2. SSL/TLS 보안
- **SSL 인증서 검증**: `rejectUnauthorized: true`로 설정
- **도메인 일치 검증**: 인증서와 요청 도메인 일치 확인
- **타임아웃 설정**: 연결 시간 초과 방지

### 3. 민감정보 보호
- **환경변수 필수화**: 모든 API 키는 환경변수로만 관리
- **민감정보 마스킹**: 로그에서 API 키, 전화번호 자동 마스킹
- **에러 정보 제한**: 시스템 정보 노출 방지

### 4. 파일 시스템 보안
- **경로 검증**: 절대 경로 및 상위 디렉토리 접근 차단
- **권한 검증**: 파일 읽기/쓰기 권한 확인
- **gitignore**: 민감정보 파일 제외

## ⚠️ 보안 주의사항

### 1. 환경변수 관리
```bash
# ✅ 올바른 권한 설정
chmod 600 .env
chown $USER:$USER .env

# ❌ 절대 하지 말 것
git add .env  # 환경변수 파일을 git에 추가하지 마세요
```

### 2. 파일 권한 설정
```bash
# SSL 체크 디렉토리
chmod 755 /path/to/ssl-checker

# 설정 파일들
chmod 644 domain.txt notification.txt
chmod 600 .env

# 로그 파일
chmod 640 /var/log/ssl-check*.log
```

### 3. 네트워크 보안
- 방화벽에서 필요한 포트만 개방 (443, NCP SENS API)
- 내부 네트워크에서만 접근 가능하도록 설정
- VPN 또는 보안 터널 사용 권장

### 4. 로그 보안
```bash
# 로그 파일 정기 삭제 (cron)
0 2 * * 0 find /var/log -name "ssl-check*.log" -mtime +30 -delete

# 로그 압축 보관
0 3 * * * gzip /var/log/ssl-check-$(date -d "7 days ago" +%Y%m%d).log
```

## 🔧 보안 설정 체크리스트

### 설치 후 필수 확인사항

- [ ] `.env` 파일 권한 600으로 설정
- [ ] 환경변수 값 유효성 확인
- [ ] `domain.txt`, `notification.txt` gitignore 확인
- [ ] 로그 파일 권한 및 위치 확인
- [ ] 방화벽 설정 확인

### 주기적 보안 점검

**매주:**
- [ ] 의존성 취약점 검사 (`npm audit`)
- [ ] 로그 파일에서 이상 활동 확인
- [ ] 환경변수 파일 권한 확인

**매월:**
- [ ] 의존성 업데이트
- [ ] 보안 패치 적용
- [ ] 접근 로그 분석

## 🚨 보안 사고 대응

### 1. API 키 유출 의심시
```bash
# 1. 즉시 NCP 콘솔에서 해당 API 키 비활성화
# 2. 새 API 키 발급
# 3. .env 파일 업데이트
# 4. 시스템 재시작
# 5. 로그에서 이상 활동 확인
```

### 2. 시스템 침입 의심시
```bash
# 1. 시스템 중지
sudo systemctl stop ssl-checker

# 2. 로그 백업
cp /var/log/ssl-check*.log /backup/incident-$(date +%Y%m%d)/

# 3. 파일 무결성 확인
find /path/to/ssl-checker -type f -exec md5sum {} \; > checksums.txt

# 4. 권한 확인
ls -la /path/to/ssl-checker/
```

## 🔍 보안 감사

### 자동 보안 검사 스크립트
```bash
#!/bin/bash
# security_check.sh

echo "🔍 SSL 모니터링 시스템 보안 검사"

# 1. 파일 권한 확인
echo "1. 파일 권한 확인"
ls -la .env domain.txt notification.txt

# 2. 의존성 취약점 확인
echo "2. 의존성 취약점 확인"
npm audit

# 3. 환경변수 확인 (값은 숨김)
echo "3. 환경변수 설정 확인"
env | grep "NCP_" | sed 's/=.*/=***HIDDEN***/'

# 4. 로그 파일 권한 확인
echo "4. 로그 파일 권한 확인"
ls -la /var/log/ssl-check*.log 2>/dev/null || echo "로그 파일 없음"

echo "보안 검사 완료"
```

### 수동 보안 점검

**코드 검토:**
```bash
# 하드코딩된 시크릿 검색
grep -r -i "password\|secret\|key\|token" --exclude-dir=node_modules .

# 위험한 함수 사용 검색
grep -r "eval\|exec\|system" --exclude-dir=node_modules .

# SQL 인젝션 패턴 검색 (해당시)
grep -r "query.*+\|query.*concat" --exclude-dir=node_modules .
```

## 📋 보안 업데이트 절차

### 1. 정기 업데이트
```bash
# 1. 백업 생성
cp -r /path/to/ssl-checker /backup/ssl-checker-$(date +%Y%m%d)

# 2. 의존성 업데이트
npm update

# 3. 보안 패치 확인
npm audit fix

# 4. 테스트 실행
npm run single google.com

# 5. 운영 환경 배포
```

### 2. 긴급 보안 패치
```bash
# 1. 즉시 시스템 중지
sudo systemctl stop ssl-checker

# 2. 패치 적용
npm install package@latest

# 3. 즉시 테스트
npm run single google.com

# 4. 운영 재시작
sudo systemctl start ssl-checker
```

## 🛠️ 보안 도구 추천

### 정적 분석 도구
```bash
# ESLint 보안 플러그인
npm install --save-dev eslint-plugin-security

# Snyk 취약점 스캔
npm install -g snyk
snyk test
```

### 런타임 보안
```bash
# 프로세스 모니터링
ps aux | grep ssl-checker

# 네트워크 연결 모니터링
netstat -an | grep :443
```

## 📞 보안 문의

보안 취약점 발견시:
1. GitHub Security Advisory를 통해 비공개 보고
2. 패치 개발 후 공개
3. 사용자들에게 업데이트 안내

---

**⚠️ 중요**: 이 시스템은 중요한 인프라를 모니터링합니다. 보안 설정을 소홀히 하지 마세요. 