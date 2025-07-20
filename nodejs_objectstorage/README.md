# S3 Object Manager

AWS SDK v3를 사용한 S3 호환 객체 스토리지 관리 라이브러리와 CLI 도구입니다.

## 개요

이 라이브러리는 다음과 같은 클라우드 객체 스토리지 서비스를 지원합니다:
- **AWS S3** - Amazon Simple Storage Service
- **NCP Object Storage** - 네이버 클라우드 플랫폼 오브젝트 스토리지
- **기타 S3 호환 스토리지** - MinIO, DigitalOcean Spaces 등

주요 특징:
- 🚀 ES6 모듈 기반의 현대적인 JavaScript 코드
- 📦 재사용 가능한 라이브러리 구조
- 🖥️ 직관적인 CLI 인터페이스
- 🔄 스트림 기반 대용량 파일 처리
- ⚡ 비동기 처리 및 에러 핸들링
- 🌏 다중 리전 지원

## 설치

```bash
npm install
```

## 환경 설정

`.env` 파일을 생성하고 자격 증명을 설정하세요:

```bash
cp env.example .env
# .env 파일을 편집하여 실제 값 입력
```

### NCP Object Storage 설정

#### 리전별 엔드포인트
| 리전 | 리전 코드 | 엔드포인트 |
|------|----------|------------|
| 한국 | `kr-standard` | `https://kr.object.ncloudstorage.com` |
| 미국 | `us-standard` | `https://us.object.ncloudstorage.com` |
| 일본 | `jp-standard` | `https://jp.object.ncloudstorage.com` |
| 싱가포르 | `sg-standard` | `https://sg.object.ncloudstorage.com` |
| 독일 | `de-standard` | `https://de.object.ncloudstorage.com` |

#### 설정 예제 (한국 리전)
```bash
AWS_ACCESS_KEY_ID=your_ncp_access_key
AWS_SECRET_ACCESS_KEY=your_ncp_secret_key
AWS_REGION=kr-standard
AWS_ENDPOINT=https://kr.object.ncloudstorage.com
```

#### 설정 예제 (싱가포르 리전)
```bash
AWS_ACCESS_KEY_ID=your_ncp_access_key
AWS_SECRET_ACCESS_KEY=your_ncp_secret_key
AWS_REGION=sg-standard
AWS_ENDPOINT=https://sg.object.ncloudstorage.com
```

### AWS S3 설정

#### 주요 리전별 엔드포인트
| 리전 | 리전 코드 | 엔드포인트 |
|------|----------|------------|
| 미국 동부 (버지니아) | `us-east-1` | `https://s3.amazonaws.com` |
| 미국 서부 (오레곤) | `us-west-2` | `https://s3.us-west-2.amazonaws.com` |
| 아시아 태평양 (서울) | `ap-northeast-2` | `https://s3.ap-northeast-2.amazonaws.com` |
| 아시아 태평양 (도쿄) | `ap-northeast-1` | `https://s3.ap-northeast-1.amazonaws.com` |
| 아시아 태평양 (싱가포르) | `ap-southeast-1` | `https://s3.ap-southeast-1.amazonaws.com` |
| 유럽 (프랑크푸르트) | `eu-central-1` | `https://s3.eu-central-1.amazonaws.com` |

#### 설정 예제 (서울 리전)
```bash
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-northeast-2
AWS_ENDPOINT=https://s3.ap-northeast-2.amazonaws.com
```

### 기타 S3 호환 스토리지 설정

#### MinIO 설정 예제
```bash
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_REGION=us-east-1
AWS_ENDPOINT=http://localhost:9000
```

#### DigitalOcean Spaces 설정 예제
```bash
AWS_ACCESS_KEY_ID=your_spaces_key
AWS_SECRET_ACCESS_KEY=your_spaces_secret
AWS_REGION=nyc3
AWS_ENDPOINT=https://nyc3.digitaloceanspaces.com
```

## 라이브러리 사용법

### 기본 사용법

```javascript
import { S3Manager } from './lib/S3Manager.js';

// 기본 설정으로 초기화 (환경 변수 사용)
const s3Manager = new S3Manager();

// 또는 직접 설정
const s3Manager = new S3Manager({
  region: 'kr-standard',
  endpoint: 'https://kr.object.ncloudstorage.com',
  credentials: {
    accessKeyId: 'your_access_key',
    secretAccessKey: 'your_secret_key'
  }
});
```

### 주요 메서드

#### 1. 버킷 목록 조회
```javascript
const result = await s3Manager.listBuckets();
if (result.success) {
  console.log(`총 ${result.count}개 버킷`);
  result.buckets.forEach(bucket => {
    console.log(`${bucket.Name} (생성일: ${bucket.CreationDate})`);
  });
}
```

#### 2. 객체 목록 조회
```javascript
const result = await s3Manager.listObjects('my-bucket', 'folder/', 100);
if (result.success) {
  result.objects.forEach(obj => {
    console.log(`${obj.Key} (${obj.Size} bytes)`);
  });
}
```

#### 3. 파일 업로드
```javascript
// 로컬 파일 업로드
await s3Manager.uploadObject('my-bucket', 'file.txt', './local-file.txt');

// Buffer 업로드
const buffer = Buffer.from('Hello World');
await s3Manager.uploadObject('my-bucket', 'hello.txt', buffer, {
  contentType: 'text/plain'
});
```

#### 4. 파일 다운로드
```javascript
// 로컬 파일로 다운로드
await s3Manager.downloadObject('my-bucket', 'file.txt', './downloaded-file.txt');

// 메모리로 다운로드
const result = await s3Manager.downloadObject('my-bucket', 'file.txt');
if (result.success) {
  const content = result.data.toString();
  console.log(content);
}
```

#### 5. 기타 유용한 메서드
```javascript
// 객체 정보 조회
const info = await s3Manager.getObjectInfo('my-bucket', 'file.txt');

// 객체 존재 확인
const exists = await s3Manager.objectExists('my-bucket', 'file.txt');

// 객체 복사
await s3Manager.copyObject('source-bucket', 'file.txt', 'dest-bucket', 'copied-file.txt');

// 객체 삭제
await s3Manager.deleteObject('my-bucket', 'file.txt');
```

## CLI 사용법

### 버킷 목록 조회
```bash
node cli/index.js buckets
```

### 객체 목록 조회
```bash
node cli/index.js list -b my-bucket
node cli/index.js list -b my-bucket -p folder/ -m 50
```

### 파일 업로드
```bash
node cli/index.js upload -b my-bucket -k file.txt -f ./local-file.txt
```

### 파일 다운로드
```bash
node cli/index.js download -b my-bucket -k file.txt -o ./downloaded-file.txt
```

### 객체 정보 조회
```bash
node cli/index.js info -b my-bucket -k file.txt
```

### 객체 삭제
```bash
node cli/index.js delete -b my-bucket -k file.txt
```

### 객체 복사
```bash
node cli/index.js copy -sb source-bucket -sk source-file.txt -db dest-bucket -dk dest-file.txt
```

### 객체 존재 확인
```bash
node cli/index.js exists -b my-bucket -k file.txt
```

## 예제 실행

### 기본 예제 실행
```bash
npm run example
```

### 단계별 테스트

#### 1. 의존성 설치
```bash
npm install
```

#### 2. 환경 변수 설정
```bash
cp env.example .env
# .env 파일을 편집하여 실제 자격 증명 입력
```

#### 3. 연결 테스트
```bash
# 버킷 목록 조회로 연결 확인
node cli/index.js buckets
```

#### 4. 기본 작업 테스트
```bash
# 특정 버킷의 객체 목록 조회
node cli/index.js list -b your-bucket-name

# 테스트 파일 생성 및 업로드
echo "Hello World" > test.txt

# 파일 다운로드
node cli/index.js download -b your-bucket-name -k test.txt -o downloaded.txt

# 파일 업로드
node cli/index.js upload -b your-bucket-name -k test.txt

# 객체 정보 조회
node cli/index.js info -b your-bucket-name -k test.txt
```

## 주요 기능

- ✅ 전체 버킷 목록 조회
- ✅ 객체 목록 조회
- ✅ 파일 업로드/다운로드
- ✅ 객체 정보 조회
- ✅ 객체 삭제
- ✅ 객체 복사
- ✅ 객체 존재 확인
- ✅ 스트림 기반 처리 (대용량 파일 지원)
- ✅ 에러 처리 및 결과 반환 