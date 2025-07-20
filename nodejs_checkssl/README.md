# 🔒 SSL 인증서 만료 모니터링 시스템

SSL 인증서 만료일을 자동으로 체크하고, 만료 임박시 NCP SENS를 통해 문자 알림을 발송하는 보안 강화 시스템입니다.

## ✨ 주요 기능

- 🔍 **대량 SSL 인증서 체크**: 파일 기반으로 여러 도메인 관리
- 📱 **다중 알림 발송**: 여러 담당자에게 동시 알림
- 🚨 **에러 자동 알림**: SSL 체크 실패시 즉시 문자 발송
- 🚫 **중복 발송 방지**: 24시간 쿨다운으로 스팸 방지
- 🔒 **보안 강화**: 민감정보 마스킹 및 환경변수 필수화
- ⚡ **스마트 알림**: 긴급도별 차등 메시지
- 📊 **발송 이력 관리**: 발송 기록 추적 및 관리

## 🚀 설치 및 설정

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정 (필수)
```bash
# 예시 파일을 .env로 복사
cp env-example.txt .env

# .env 파일에서 실제 NCP 정보로 변경
vi .env
```

**⚠️ 필수 환경변수**
```bash
# NCP SENS 설정 (모두 필수)
NCP_SMS_URI=ncp:sms:kr:YOUR_PROJECT_ID:YOUR_SERVICE_ID
NCP_SECRET_KEY=YOUR_SECRET_KEY_HERE
NCP_ACCESS_KEY=YOUR_ACCESS_KEY_HERE
NCP_FROM_NUMBER=YOUR_PHONE_NUMBER

# 선택 설정
DEFAULT_PHONE=01012345678    # 기본 수신 번호
ALERT_DAYS_BEFORE=20        # 알림 기준일 (기본: 20일)
USE_EMOJI=false            # 이모지 사용 여부 (NCP SENS 호환성으로 false 권장)
LOG_LEVEL=info             # 로그 레벨
```

### 3. 도메인 목록 설정
```bash
# 예시 파일을 복사하여 실제 도메인으로 수정
cp domain-example.txt domain.txt
vi domain.txt
```

`domain.txt` 파일에 체크할 도메인을 입력하세요:
```
# SSL 인증서를 체크할 도메인 리스트
your-domain.com
api.your-domain.com
admin.your-domain.com

# 포트가 443이 아닌 경우
example.com:8443
```

### 4. 알림 대상 설정
```bash
# 예시 파일을 복사하여 실제 전화번호로 수정
cp notification-example.txt notification.txt
vi notification.txt
```

`notification.txt` 파일에 알림받을 전화번호를 입력하세요:
```
# 알림을 받을 전화번호 리스트
01012345678  # 담당자1
01087654321  # 담당자2
```

## 📱 사용법

### 기본 사용법
```bash
# 전체 도메인 일괄 체크
npm start
# 또는
npm run check

# 단일 도메인 체크
npm run single google.com
npm run single example.com:8443 01012345678

# 발송 기록 확인
npm run status

# 발송 기록 초기화
npm run reset
```

### 고급 사용법
```bash
# 특정 도메인만 체크 (notification.txt의 모든 번호로 발송)
npm run single github.com

# 특정 도메인을 특정 번호로만 체크
npm run single naver.com 01012345678

# 개발 모드 (파일 변경시 자동 재시작)
npm run dev
```

## 🔐 보안 기능

### 1. 환경변수 필수화
- 모든 민감 정보는 환경변수로만 관리
- 환경변수 누락시 프로그램 실행 불가
- 코드에 하드코딩된 민감정보 없음

### 2. 민감정보 마스킹
```
✅ SMS 발송 성공: 010****5678
❌ SMS 발송 실패 (010****1234): API 키가 유효하지 않습니다
```

### 3. 중복 발송 방지
- 24시간 쿨다운 타이머
- 도메인별 발송 기록 추적
- 긴급 상황시 제한적 재발송 (7일 이하시 최대 3회)

### 4. 파일 접근 권한 검증
- 필수 파일 존재 여부 확인
- 파일 읽기 권한 검증
- 안전한 파일 처리

### 5. SSL 체크 실패 알림
- 도메인 연결 실패시 자동 알림
- 에러 타입별 맞춤 메시지
- 4시간 쿨다운 (정상 알림보다 짧음)
- 하루 최대 6회 발송 제한

### 6. 고급 보안 기능 ✨
- **입력 검증**: 도메인/전화번호/파일경로 엄격한 검증
- **SSRF 방지**: Private IP 대역 접근 차단
- **Path Traversal 방지**: 파일 경로 보안 검증
- **SSL 인증서 검증**: 자체 서명 인증서 차단
- **에러 정보 제한**: 시스템 정보 노출 방지

## 📊 알림 시스템

### 긴급도별 분류
| 남은 일수 | 긴급도 | 표시 (이모지 OFF) | 표시 (이모지 ON) | 메시지 |
|---------|--------|----------------|----------------|--------|
| 3일 이하 | 매우 긴급 | [매우 긴급] | 🚨 매우 긴급 | 즉시 갱신하세요! |
| 7일 이하 | 긴급 | [긴급] | 🔥 긴급 | 즉시 갱신이 필요합니다! |
| 14일 이하 | 주의 | [주의] | ⚠️ 주의 | 갱신 준비를 시작하세요. |
| 20일 이하 | 알림 | [알림] | 📋 알림 | 인증서 갱신을 준비해주세요. |

### 문자 메시지 예시

**SSL 만료 알림 (이모지 미사용):**
```
[매우 긴급] SSL 인증서 만료 알림

도메인: example.com
만료일: 2024.01.15 (3일 후)
발급기관: Let's Encrypt

즉시 갱신하세요!
```

**SSL 체크 실패 알림 (이모지 미사용):**
```
[긴급] SSL 체크 실패 알림

도메인: example.com
오류: 도메인 연결 실패
조치필요: 도메인명과 DNS 설정을 확인하세요.

즉시 확인이 필요합니다.
```

**이모지 사용 (USE_EMOJI=true 설정시):**
```
🚨 매우 긴급 SSL 인증서 만료 알림

🌐 도메인: example.com
📅 만료일: 2024.01.15 (3일 후)
🏢 발급기관: Let's Encrypt

즉시 갱신하세요!
```

⚠️ **주의**: NCP SENS는 멀티바이트 이모지를 지원하지 않으므로 `USE_EMOJI=false` 사용을 권장합니다.

## 🛠️ 고급 설정

### 📅 Crontab 자동화 설정

#### 1. Crontab 기본 설정
```bash
# crontab 편집기 열기
crontab -e

# 현재 설정된 cron 작업 확인
crontab -l

# 특정 사용자의 crontab 확인 (root 권한 필요)
sudo crontab -u username -l
```

#### 빠른 테스트 (매분 실행)
```bash
# 테스트용: 매분마다 실행 (테스트 후 꼭 삭제하세요!)
* * * * * cd /path/to/ssl-checker && npm start >> /tmp/ssl-test.log 2>&1

# 5분 후 테스트 로그 확인
tail -f /tmp/ssl-test.log

# 테스트 완료 후 cron 작업 제거
crontab -e  # 위 라인 삭제
```

#### 2. 기본 스케줄 예제

**매일 오전 9시 SSL 체크:**
```bash
0 9 * * * cd /path/to/ssl-checker && npm start >> /var/log/ssl-check.log 2>&1
```

**매일 오전 6시와 오후 6시 (하루 2번):**
```bash
0 6,18 * * * cd /path/to/ssl-checker && npm start >> /var/log/ssl-check.log 2>&1
```

**평일 오전 9시만 체크:**
```bash
0 9 * * 1-5 cd /path/to/ssl-checker && npm start >> /var/log/ssl-check.log 2>&1
```

**매주 월요일 오전 8시:**
```bash
0 8 * * 1 cd /path/to/ssl-checker && npm start >> /var/log/ssl-check.log 2>&1
```

**매월 1일 오전 9시:**
```bash
0 9 1 * * cd /path/to/ssl-checker && npm start >> /var/log/ssl-check.log 2>&1
```

#### 3. 고급 스케줄링

**4시간마다 체크 (24/7 모니터링):**
```bash
0 */4 * * * cd /path/to/ssl-checker && npm start >> /var/log/ssl-check.log 2>&1
```

**업무시간 중 2시간마다 (평일 9시-18시):**
```bash
0 9-18/2 * * 1-5 cd /path/to/ssl-checker && npm start >> /var/log/ssl-check.log 2>&1
```

#### 4. 환경변수 설정이 포함된 완전한 예제
```bash
# .env 파일이 있는 경로로 이동 후 실행
0 9 * * * cd /path/to/ssl-checker && npm start >> /var/log/ssl-check-$(date +\%Y\%m\%d).log 2>&1

# 특정 사용자로 실행 (root 권한 필요시)
0 9 * * * /usr/bin/sudo -u username bash -c "cd /path/to/ssl-checker && npm start" >> /var/log/ssl-check.log 2>&1

# Node.js 경로를 명시적으로 지정
0 9 * * * cd /path/to/ssl-checker && /usr/local/bin/node /usr/local/bin/npm start >> /var/log/ssl-check.log 2>&1
```

#### 5. 로그 관리 및 정리
```bash
# 매일 오전 9시 SSL 체크 + 주간 로그 정리
0 9 * * * cd /path/to/ssl-checker && npm start >> /var/log/ssl-check.log 2>&1
0 2 * * 0 find /var/log -name "ssl-check*.log" -mtime +7 -delete

# 로그 로테이션 (날짜별 파일 생성)
0 9 * * * cd /path/to/ssl-checker && npm start >> /var/log/ssl-check-$(date +\%Y\%m\%d).log 2>&1

# 로그 압축 및 보관 (30일 후 압축, 90일 후 삭제)
0 3 * * * gzip /var/log/ssl-check-$(date -d "30 days ago" +\%Y\%m\%d).log 2>/dev/null
0 4 * * * rm -f /var/log/ssl-check-$(date -d "90 days ago" +\%Y\%m\%d).log.gz 2>/dev/null
```

#### 6. 실제 운영 환경 설정 예제

**프로덕션 환경 (매일 오전 6시, 에러 알림 포함):**
```bash
# SSL 체크 실행
0 6 * * * cd /opt/ssl-checker && npm start >> /var/log/ssl-check.log 2>&1

# 로그 에러 체크 및 관리자 알림
5 6 * * * if grep -q "❌" /var/log/ssl-check.log; then echo "SSL 체크 에러 발생" | mail -s "SSL Monitor Alert" admin@company.com; fi
```

**개발 환경 (평일만, 간단한 로그):**
```bash
0 10 * * 1-5 cd /home/user/ssl-checker && npm start >> /tmp/ssl-check.log 2>&1
```

**스테이징 환경 (주 2회):**
```bash
0 9 * * 1,4 cd /staging/ssl-checker && npm start >> /var/log/staging-ssl.log 2>&1
```

#### 7. 문제 해결

**Cron이 실행되지 않을 때:**
```bash
# cron 서비스 상태 확인
sudo systemctl status cron    # Ubuntu/Debian
sudo systemctl status crond   # CentOS/RHEL

# cron 로그 확인
sudo tail -f /var/log/cron
sudo tail -f /var/log/syslog | grep cron

# 환경변수 테스트
0 9 * * * env > /tmp/cron-env.log && cd /path/to/ssl-checker && npm start >> /var/log/ssl-check.log 2>&1
```

**권한 문제 해결:**
```bash
# SSL 체크 디렉토리 권한 설정
chmod 755 /path/to/ssl-checker
chmod 644 /path/to/ssl-checker/.env

# 로그 디렉토리 권한 설정
sudo mkdir -p /var/log
sudo chown $USER:$USER /var/log/ssl-check*.log
```

#### 8. Cron 표현식 참고

```
# 분 시 일 월 요일
# *  *  *  *  *
# │  │  │  │  │
# │  │  │  │  └── 요일 (0-7, 0과 7은 일요일)
# │  │  │  └───── 월 (1-12)
# │  │  └──────── 일 (1-31)
# │  └─────────── 시 (0-23)
# └────────────── 분 (0-59)

# 특수 표현
@yearly   = 0 0 1 1 *    (매년 1월 1일 0시 0분)
@monthly  = 0 0 1 * *    (매월 1일 0시 0분)
@weekly   = 0 0 * * 0    (매주 일요일 0시 0분)
@daily    = 0 0 * * *    (매일 0시 0분)
@hourly   = 0 * * * *    (매시 0분)
@reboot                  (시스템 재시작시)
```

#### 9. 권장 설정

**소규모 사이트 (1-10개 도메인):**
```bash
# 매일 오전 9시
0 9 * * * cd /path/to/ssl-checker && npm start >> /var/log/ssl-check.log 2>&1
```

**중간 규모 사이트 (10-50개 도메인):**
```bash
# 매일 오전 6시, 오후 6시
0 6,18 * * * cd /path/to/ssl-checker && npm start >> /var/log/ssl-check.log 2>&1
```

**대규모 사이트 (50개+ 도메인):**
```bash
# 6시간마다
0 */6 * * * cd /path/to/ssl-checker && npm start >> /var/log/ssl-check.log 2>&1
```

**미션 크리티컬 환경:**
```bash
# 4시간마다 + 에러 즉시 알림
0 */4 * * * cd /path/to/ssl-checker && npm start >> /var/log/ssl-check.log 2>&1
10 */4 * * * if grep -q "❌\|에러" /var/log/ssl-check.log; then /usr/local/bin/alert-script.sh; fi
```

### 대용량 도메인 관리
도메인이 많은 경우 그룹별로 분리:
```bash
# 그룹별 domain 파일 생성
cp domain.txt domain-production.txt
cp domain.txt domain-development.txt

# 그룹별 체크 스크립트 작성
#!/bin/bash
cp domain-production.txt domain.txt
npm start
cp domain-development.txt domain.txt  
npm start
```

### 로그 관리
```bash
# 로그 파일로 출력 리다이렉션
npm start > ssl-check-$(date +%Y%m%d).log 2>&1

# 로그 로테이션
find /var/log/ssl-check* -mtime +30 -delete
```

## 📁 파일 구조

```
nodejs_checkssl/
├── index.ts                 # 메인 로직
├── config.ts                # 환경변수 설정
├── utils.ts                 # 유틸리티 함수
├── domain-example.txt       # 도메인 목록 예시
├── domain.txt              # 체크 대상 도메인 목록 (gitignore)
├── notification-example.txt # 전화번호 목록 예시
├── notification.txt        # 알림 대상 전화번호 목록 (gitignore)
├── env-example.txt         # 환경변수 예시
├── .env                    # 환경변수 (gitignore)
├── last_sent.json         # 발송 기록 (gitignore)
├── package.json           # 의존성 및 스크립트
├── tsconfig.json          # TypeScript 설정
├── README.md             # 사용자 가이드
└── MANUAL.md             # 관리자 운영 매뉴얼
```

## 🔧 문제 해결

### 일반적인 문제들

**Q: 환경변수 에러가 발생해요**
```
Error: ❌ 필수 환경변수 NCP_SECRET_KEY가 설정되지 않았습니다.
```
A: `.env` 파일을 생성하고 모든 필수 환경변수를 설정하세요.

**Q: domain.txt 파일이 없다고 나와요**
```
❌ 필수 파일이 없습니다: domain.txt
```
A: `domain.txt` 파일을 생성하고 체크할 도메인을 입력하세요.

**Q: SSL 연결이 실패해요**
```
❌ example.com:443 SSL 체크 실패: 연결 시간 초과
```
A: 
- 도메인명이 올바른지 확인
- 방화벽/네트워크 설정 확인  
- 포트 번호가 맞는지 확인
- SSL 체크 실패시에도 자동으로 에러 알림이 발송됩니다

**Q: 문자가 발송되지 않아요**
A:
- NCP SENS 설정값 확인
- 발신번호 등록 상태 확인
- 잔액 확인
- `npm run status`로 발송 기록 확인

**Q: 같은 알림이 계속 와요**
A: 중복 발송 방지 기능이 있습니다. `npm run reset`으로 기록 초기화 가능.

**Q: SMS 발송시 이모지 에러가 발생해요**
```
'content' cannot contain multibyte emoji characters.
```
A: NCP SENS는 이모지를 지원하지 않습니다. `.env`에서 `USE_EMOJI=false` 설정하세요.

### 디버깅

**상세 로그 확인:**
```bash
LOG_LEVEL=debug npm start
```

**단일 도메인 테스트:**
```bash
npm run single google.com 01012345678
```

**발송 기록 확인:**
```bash
npm run status
```

## 📝 개발 노트

### 코드에서 사용
```typescript
import { checkAllSSLCertificates, checkSingleSSL } from './index';

// 전체 체크
await checkAllSSLCertificates();

// 단일 체크  
await checkSingleSSL('example.com:8443', '01012345678');
```

### 확장 가능한 구조
- `utils.ts`: 공통 기능 모듈화
- `config.ts`: 설정 중앙 관리
- 파일 기반: 대용량 도메인 관리 용이
- 타입스크립트: 타입 안전성 보장

## 📄 라이센스

MIT License

## 🤝 기여하기

1. Fork the project
2. Create your feature branch
3. Commit your changes  
4. Push to the branch
5. Open a Pull Request

## 🚀 Quick Start (빠른 시작)

```bash
# 1. 프로젝트 클론 및 설치
git clone <repository-url>
cd nodejs_checkssl
npm install

# 2. 환경변수 설정
cp env-example.txt .env
vi .env  # NCP SENS 정보 입력

# 3. 도메인 및 알림 대상 설정
cp domain-example.txt domain.txt
cp notification-example.txt notification.txt
vi domain.txt      # 체크할 도메인 입력
vi notification.txt # 알림받을 전화번호 입력

# 4. 테스트 실행
npm start

# 5. Crontab 자동화 설정 (매일 오전 9시)
echo "0 9 * * * cd $(pwd) && npm start >> /var/log/ssl-check.log 2>&1" | crontab -
```

---

**⚠️ 주의사항**
- 환경변수는 절대 커밋하지 마세요
- 운영 환경에서는 적절한 권한 설정을 하세요
- 대량 발송시 NCP SENS 요금에 주의하세요
- Cron 테스트 후 불필요한 작업은 반드시 삭제하세요 