# NCP Global Edge CDN Purge CLI

NAVER Cloud Platform Global Edge CDN의 캐시 퍼지 기능을 명령줄에서 쉽게 사용할 수 있는 CLI 도구입니다.

## 🌟 개요

이 도구는 NCP Global Edge CDN의 다양한 퍼지 유형을 지원하며, 직관적인 CLI 인터페이스를 제공합니다.

### 지원하는 퍼지 유형

| 퍼지 유형 | 설명 | 예상 소요 시간 |
|-----------|------|----------------|
| **ALL** | 모든 콘텐츠 퍼지 | 약 40분 |
| **DIRECTORY** | 디렉토리 단위 퍼지 | 약 40분 |
| **PATTERN** | 확장자 단위 퍼지 | 약 40분 |
| **URL** | URL 단위 퍼지 | 빠른 퍼지 지원 |

## 📦 설치

```bash
npm install
```

## 🔧 환경 설정

`.env` 파일을 생성하고 NCP 자격 증명을 설정하세요:

```bash
cp env.example .env
# .env 파일을 편집하여 실제 값 입력
```

### 환경 변수 설정
```bash
# 필수 설정
NCP_ACCESS_KEY=your_ncp_access_key
NCP_SECRET_KEY=your_ncp_secret_key

# 선택사항 (기본값 사용 가능)
NCP_API_URL=https://edge.apigw.ntruss.com
NCP_REGION=KR
```

### NCP 자격 증명 생성 방법
1. [NCP 콘솔](https://console.ncloud.com/) 로그인
2. 마이페이지 → 계정 관리 → 인증키 관리
3. 신규 API 인증키 생성
4. Access Key ID와 Secret Key 복사

## 🚀 CLI 사용법

### 기본 명령어 구조
```bash
node cli/index.js <command> [options]
```

### 1. 모든 콘텐츠 퍼지
```bash
# 모든 캐시된 콘텐츠 삭제 (약 40분 소요)
node cli/index.js all -e <EDGE_ID>

# 예시
node cli/index.js all -e 123
```

### 2. 디렉토리 단위 퍼지
```bash
# 특정 디렉토리의 모든 콘텐츠 삭제 (약 40분 소요)
node cli/index.js directory -e <EDGE_ID> -t <DIRECTORIES>

# 예시
node cli/index.js directory -e 123 -t "/*"
node cli/index.js directory -e 123 -t "/src/*" "/images/*"
node cli/index.js directory -e 123 -t "/static/css/*"
```

**디렉토리 규칙:**
- `'/'` 문자로 시작해야 함
- `'/*'` 문자열로 끝나야 함

### 3. 확장자 단위 퍼지
```bash
# 특정 확장자의 모든 파일 삭제 (약 40분 소요)
node cli/index.js pattern -e <EDGE_ID> -t <PATTERNS>

# 예시
node cli/index.js pattern -e 123 -t "/*.jpg"
node cli/index.js pattern -e 123 -t "/static/*.png" "/images/*.css"
node cli/index.js pattern -e 123 -t "/*.js" "/*.css"
```

**패턴 규칙:**
- `'/'` 문자로 시작해야 함
- `'*.확장자'` 형식으로 끝나야 함

### 4. URL 단위 퍼지
```bash
# 특정 URL의 콘텐츠 삭제 (빠른 퍼지 지원)
node cli/index.js url -e <EDGE_ID> -t <URLS>

# 예시
node cli/index.js url -e 123 -t "/index.html"
node cli/index.js url -e 123 -t "/css/main.css" "/js/app.js"
node cli/index.js url -e 123 -t "/api/data.json?version=1.0"
```

**URL 규칙:**
- `'/'` 문자로 시작해야 함
- `'*'` 와일드카드 사용 불가

### 5. 사용 예시 출력
```bash
# 모든 퍼지 유형의 사용 예시 출력
node cli/index.js examples
```

### 6. 도움말
```bash
# 전체 도움말
node cli/index.js --help

# 특정 명령어 도움말
node cli/index.js all --help
node cli/index.js directory --help
node cli/index.js pattern --help
node cli/index.js url --help
```

## 📚 라이브러리 사용법

### 기본 사용법
```javascript
import { GlobalEdgePurge } from './lib/GlobalEdgePurge.js';

// 인스턴스 생성
const purgeClient = new GlobalEdgePurge();

// 또는 직접 설정
const purgeClient = new GlobalEdgePurge({
  accessKey: 'your_access_key',
  secretKey: 'your_secret_key'
});
```

### API 메서드

#### 1. 모든 콘텐츠 퍼지
```javascript
const result = await purgeClient.purgeAll(edgeId);
if (result.success) {
  console.log('퍼지 요청 번호:', result.purgeIds);
} else {
  console.error('오류:', result.error);
}
```

#### 2. 디렉토리 단위 퍼지
```javascript
const result = await purgeClient.purgeDirectory(edgeId, ['/src/*', '/images/*']);
if (result.success) {
  console.log('처리된 디렉토리:', result.directories);
  console.log('퍼지 요청 번호:', result.purgeIds);
}
```

#### 3. 확장자 단위 퍼지
```javascript
const result = await purgeClient.purgePattern(edgeId, ['/*.jpg', '/static/*.png']);
if (result.success) {
  console.log('처리된 패턴:', result.patterns);
  console.log('퍼지 요청 번호:', result.purgeIds);
}
```

#### 4. URL 단위 퍼지
```javascript
const result = await purgeClient.purgeUrl(edgeId, ['/index.html', '/css/main.css']);
if (result.success) {
  console.log('처리된 URL:', result.urls);
  console.log('퍼지 요청 번호:', result.purgeIds);
}
```

## 🎯 예제 실행

### 기본 예제
```bash
npm run example
```

### 단계별 테스트

#### 1. 환경 변수 설정
```bash
cp env.example .env
# .env 파일을 편집하여 실제 자격 증명 입력
```

#### 2. 연결 테스트
```bash
# 사용 예시 출력으로 설정 확인
node cli/index.js examples
```

#### 3. 실제 퍼지 테스트
```bash
# URL 퍼지 (빠른 퍼지)
node cli/index.js url -e YOUR_EDGE_ID -t "/test.html"

# 디렉토리 퍼지
node cli/index.js directory -e YOUR_EDGE_ID -t "/test/*"
```

## ⚠️ 주의사항

### 퍼지 소요 시간
- **ALL, DIRECTORY, PATTERN**: 약 40분 소요
- **URL**: 빠른 퍼지 지원

### 사용 제한
- Edge ID는 NCP 콘솔에서 확인 가능
- API 호출 횟수 제한이 있을 수 있음
- 잘못된 퍼지 요청은 복구할 수 없음

### 권장사항
- 프로덕션 환경에서는 신중하게 사용
- 먼저 URL 단위 퍼지로 테스트
- 대량 퍼지 전에 백업 확인

## 🔍 문제 해결

### 일반적인 오류

#### 1. 인증 실패 (401 Unauthorized)
```bash
# 해결책
1. NCP_ACCESS_KEY와 NCP_SECRET_KEY 확인
2. NCP 콘솔에서 API 키 권한 확인
3. API 키 만료 여부 확인
```

#### 2. 잘못된 요청 (0400 요청 데이터 형식 불일치)
```bash
# 해결책
1. Edge ID가 숫자인지 확인
2. 퍼지 대상 경로 형식 확인
3. 각 퍼지 유형별 규칙 준수
```

#### 3. 서버 오류 (500 Internal Server Error)
```bash
# 해결책
1. 잠시 후 다시 시도
2. NCP 서비스 상태 확인
3. Edge ID 유효성 확인
```

## 📋 오류 코드

| 오류 코드 | 설명 |
|-----------|------|
| 0032 | 허용되지 않은 요청 |
| 0400 | 요청 데이터 형식 불일치 |
| 9999 | 서버 오류 발생 |

## 🔗 관련 링크

- [NCP Global Edge 공식 문서](https://guide.ncloud-docs.com/docs/globaledge-globaledge-1-1)
- [NCP API 문서](https://ncloud.apigw.ntruss.com/ncloud/v1/apiGateway/swagger-ui.html)
- [NCP 콘솔](https://console.ncloud.com/)

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🤝 기여하기

버그 리포트, 기능 요청, 코드 기여를 환영합니다!

1. 이슈 등록
2. Fork 및 브랜치 생성
3. 변경사항 커밋
4. Pull Request 생성 