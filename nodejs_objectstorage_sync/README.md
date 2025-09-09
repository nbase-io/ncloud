# S3 Sync CLI

S3 간 파일 동기화를 위한 CLI 도구입니다. 서로 다른 S3 서비스 간의 파일을 효율적으로 동기화할 수 있습니다.

## 주요 기능

### 핵심 기능
- 🔄 **전체 동기화**: 버킷 전체 또는 특정 prefix의 파일들을 동기화
- 📁 **단일 파일 동기화**: 특정 파일만 선택적으로 동기화
- 🎯 **고급 필터링**: include/exclude 패턴으로 동기화할 파일 필터링
- ⚡ **병렬 처리**: 동시 처리 수를 조절하여 성능 최적화
- 🔍 **변경 감지**: ETag 비교로 변경된 파일만 동기화

### 고급 기능
- 🧪 **Dry Run**: 실제 동기화 없이 미리보기
- 🎨 **실시간 진행률**: ETA 계산과 함께 상세한 진행률 표시
- 🔧 **대화형 모드**: 설정을 대화형으로 입력
- 📂 **재개 기능**: 중단된 동기화를 이어서 진행
- 🔐 **체크섬 검증**: 파일 무결성 검증으로 데이터 정확성 보장
- 🔄 **자동 재시도**: 지수 백오프를 사용한 실패 시 자동 재시도
- 📝 **로깅 시스템**: 상세한 로그 기록 및 실시간 모니터링
- ⚙️ **설정 파일**: JSON 설정 파일로 복잡한 동기화 작업 관리
- 📊 **성능 메트릭**: 처리 속도, 처리량 등 상세한 통계 제공
- 🔍 **검증 모드**: 동기화 후 파일 무결성 검증

## 설치

```bash
# 의존성 설치
npm install

# 전역 설치 (선택사항)
npm install -g .
```

## 설정

### 1. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 입력하세요:

```bash
# Source S3 Configuration
SRC_AWS_ACCESS_KEY_ID=your_source_access_key_here
SRC_AWS_SECRET_ACCESS_KEY=your_source_secret_key_here
SRC_AWS_REGION=kr-standard
SRC_AWS_ENDPOINT=https://kr.object.ncloudstorage.com

# Destination S3 Configuration
DEST_AWS_ACCESS_KEY_ID=your_dest_access_key_here
DEST_AWS_SECRET_ACCESS_KEY=your_dest_secret_key_here
DEST_AWS_REGION=us-east-1
DEST_AWS_ENDPOINT=https://s3.amazonaws.com
```

### 2. 지원하는 S3 서비스

- **Naver Cloud Platform (NCP) Object Storage**
- **Amazon S3**
- **Google Cloud Storage** (S3 호환 API)
- **기타 S3 호환 스토리지**

## 사용법

### CLI 명령어

#### 1. 전체 동기화

```bash
# 기본 동기화
npx s3-sync sync -s source-bucket -d dest-bucket

# 특정 prefix만 동기화
npx s3-sync sync -s source-bucket -d dest-bucket -p "uploads/"

# Dry run (미리보기)
npx s3-sync sync -s source-bucket -d dest-bucket --dry-run

# 강제 동기화 (변경되지 않은 파일도 동기화)
npx s3-sync sync -s source-bucket -d dest-bucket --force

# 재개 모드 (중단된 동기화 이어서 진행)
npx s3-sync sync -s source-bucket -d dest-bucket --resume

# 체크섬 검증 활성화
npx s3-sync sync -s source-bucket -d dest-bucket --verify-checksum

# 파일 필터링
npx s3-sync sync -s source-bucket -d dest-bucket \
  --exclude "*.tmp" "*.log" \
  --include "*.jpg" "*.png"

# 고급 옵션
npx s3-sync sync -s source-bucket -d dest-bucket \
  --max-concurrency 10 \
  --max-retries 5 \
  --log-level debug
```

#### 2. 대화형 동기화

```bash
npx s3-sync interactive
```

#### 3. 단일 파일 동기화

```bash
npx s3-sync sync-file -s source-bucket -d dest-bucket -k "path/to/file.txt"
```

#### 4. 연결 테스트

```bash
npx s3-sync test -s source-bucket -d dest-bucket
```

#### 5. 설정 확인

```bash
npx s3-sync config
```

#### 6. 버킷 목록 조회

```bash
npx s3-sync list-buckets
```

#### 7. 설정 파일 관리

```bash
# 설정 파일 생성
npx s3-sync init -f my-config.json

# 설정 파일로 동기화
npx s3-sync sync-config -c my-config.json

# 설정 파일로 Dry run
npx s3-sync sync-config -c my-config.json --dry-run
```

#### 8. 파일 무결성 검증

```bash
# 전체 파일 검증
npx s3-sync verify -s source-bucket -d dest-bucket

# 특정 prefix 검증
npx s3-sync verify -s source-bucket -d dest-bucket -p "uploads/"

# 고동시성 검증
npx s3-sync verify -s source-bucket -d dest-bucket --max-concurrency 10
```

#### 9. 로그 관리

```bash
# 최근 로그 보기
npx s3-sync logs

# 실시간 로그 모니터링
npx s3-sync logs --follow

# 특정 라인 수만 보기
npx s3-sync logs --lines 100
```

#### 10. 상태 관리

```bash
# 현재 동기화 상태 확인
npx s3-sync status

# 임시 파일 정리
npx s3-sync cleanup

# 모든 임시 파일 및 로그 정리
npx s3-sync cleanup --all
```

### 프로그래밍 방식 사용

```javascript
import { S3Sync } from './lib/S3Sync.js';

// 기본 사용법
const s3Sync = new S3Sync();

// 전체 동기화
const stats = await s3Sync.syncAll('source-bucket', 'dest-bucket', {
  prefix: 'uploads/',
  dryRun: false,
  force: false,
  exclude: ['*.tmp', '*.log'],
  include: ['*.jpg', '*.png'],
  maxConcurrency: 5
});

// 커스텀 설정
const s3Sync = new S3Sync(
  // Source S3 설정
  {
    region: 'kr-standard',
    endpoint: 'https://kr.object.ncloudstorage.com',
    accessKeyId: 'your-ncp-key',
    secretAccessKey: 'your-ncp-secret'
  },
  // Destination S3 설정
  {
    region: 'us-east-1',
    endpoint: 'https://s3.amazonaws.com',
    accessKeyId: 'your-aws-key',
    secretAccessKey: 'your-aws-secret'
  }
);
```

## 옵션 설명

### 동기화 옵션

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `--source`, `-s` | 소스 S3 버킷 이름 | 필수 |
| `--dest`, `-d` | 대상 S3 버킷 이름 | 필수 |
| `--prefix`, `-p` | 동기화할 객체 키 prefix | `''` (전체) |
| `--dry-run` | 실제 동기화 없이 미리보기 | `false` |
| `--force` | 변경되지 않은 파일도 동기화 | `false` |
| `--resume` | 중단된 동기화 재개 | `false` |
| `--verify-checksum` | 파일 무결성 검증 | `false` |
| `--exclude` | 제외할 파일 패턴 (glob) | `[]` |
| `--include` | 포함할 파일 패턴 (glob) | `[]` |
| `--max-concurrency` | 최대 동시 처리 수 | `5` |
| `--max-retries` | 최대 재시도 횟수 | `3` |
| `--log-level` | 로그 레벨 (debug, info, warn, error) | `info` |

### 필터링 패턴

- `*.jpg` - .jpg 확장자 파일
- `images/*` - images/ 폴더의 모든 파일
- `**/temp/*` - 모든 temp 폴더의 파일
- `*.{tmp,log}` - .tmp 또는 .log 확장자 파일

## 성능 최적화

### 1. 동시 처리 수 조절

```bash
# CPU 코어 수에 맞게 조절
npx s3-sync sync -s source -d dest --max-concurrency 8
```

### 2. 필터링으로 불필요한 파일 제외

```bash
# 임시 파일과 로그 파일 제외
npx s3-sync sync -s source -d dest --exclude "*.tmp" "*.log" "temp/*"
```

### 3. 특정 파일 타입만 동기화

```bash
# 이미지 파일만 동기화
npx s3-sync sync -s source -d dest --include "*.jpg" "*.png" "*.gif"
```

## 에러 처리

### 일반적인 에러

1. **인증 실패**
   ```
   ❌ Source bucket 'bucket-name' error: The security token included in the request is invalid
   ```
   - 해결: `.env` 파일의 자격 증명을 확인하세요

2. **버킷 접근 권한 없음**
   ```
   ❌ Source bucket 'bucket-name' error: Access Denied
   ```
   - 해결: IAM 정책에서 해당 버킷에 대한 권한을 확인하세요

3. **네트워크 오류**
   ```
   ❌ Sync failed: Network Error
   ```
   - 해결: 네트워크 연결을 확인하고 재시도하세요

### 디버깅

```bash
# 연결 테스트로 문제 진단
npx s3-sync test -s source-bucket -d dest-bucket

# 설정 확인
npx s3-sync config

# Dry run으로 미리 확인
npx s3-sync sync -s source -d dest --dry-run
```

## 예제 시나리오

### 1. NCP에서 AWS S3로 백업

```bash
# NCP Object Storage에서 AWS S3로 전체 백업
npx s3-sync sync -s ncp-backup-bucket -d aws-backup-bucket

# 체크섬 검증과 함께 백업
npx s3-sync sync -s ncp-backup-bucket -d aws-backup-bucket --verify-checksum

# 백업 후 무결성 검증
npx s3-sync verify -s ncp-backup-bucket -d aws-backup-bucket
```

### 2. 특정 폴더만 동기화

```bash
# uploads/ 폴더의 이미지만 동기화
npx s3-sync sync -s source -d dest -p "uploads/" --include "*.jpg" "*.png"

# 고성능 동기화 (높은 동시성)
npx s3-sync sync -s source -d dest -p "uploads/" --max-concurrency 20
```

### 3. 증분 동기화

```bash
# 변경된 파일만 동기화 (기본 동작)
npx s3-sync sync -s source -d dest

# 재개 모드로 중단된 동기화 이어서 진행
npx s3-sync sync -s source -d dest --resume
```

### 4. 전체 재동기화

```bash
# 모든 파일을 강제로 동기화
npx s3-sync sync -s source -d dest --force

# 체크섬 검증과 함께 강제 동기화
npx s3-sync sync -s source -d dest --force --verify-checksum
```

### 5. 설정 파일을 사용한 복잡한 동기화

```bash
# 설정 파일 생성
npx s3-sync init -f production-sync.json

# 설정 파일 편집 후 동기화
npx s3-sync sync-config -c production-sync.json
```

### 6. 모니터링 및 로그 관리

```bash
# 실시간 로그 모니터링
npx s3-sync logs --follow

# 동기화 상태 확인
npx s3-sync status

# 작업 완료 후 정리
npx s3-sync cleanup --all
```

### 7. 대용량 데이터 동기화

```bash
# 대용량 데이터를 위한 최적화된 설정
npx s3-sync sync -s source -d dest \
  --max-concurrency 50 \
  --max-retries 5 \
  --log-level debug \
  --verify-checksum
```

## 라이선스

MIT License

## 기여

버그 리포트나 기능 요청은 GitHub Issues를 통해 제출해주세요.

## 변경 이력

### v1.0.0
- 초기 릴리스
- S3 간 파일 동기화 기능
- CLI 인터페이스
- 필터링 및 병렬 처리 지원
