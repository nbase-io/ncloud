# NAVER Cloud Platform 유틸리티 모음

NAVER Cloud Platform(NCP)을 효율적으로 사용하기 위한 다양한 프로그램 소스코드와 도구들을 공유하는 오픈소스 프로젝트입니다.

## 🌟 프로젝트 소개

이 저장소는 NAVER Cloud Platform의 다양한 서비스를 쉽고 효율적으로 활용할 수 있도록 도와주는 라이브러리, CLI 도구, 예제 코드들을 제공합니다. 개발자들이 NCP 서비스를 빠르게 시작하고 생산성을 높일 수 있도록 실용적인 도구들을 모아놓았습니다.

### 🎯 목표
- NCP 서비스 사용의 진입 장벽 낮추기
- 반복적인 작업 자동화
- 모범 사례 및 패턴 공유
- 개발자 커뮤니티 기여

## 📁 프로젝트 구조

### 현재 제공되는 도구들

#### 🗂️ `nodejs_objectstorage/`
**NCP Object Storage 관리 도구**
- AWS SDK v3 기반 S3 호환 라이브러리
- 직관적인 CLI 인터페이스
- 버킷 관리, 파일 업로드/다운로드, 객체 조작 등
- 스트림 기반 대용량 파일 처리 지원

**주요 기능:**
- ✅ 전체 버킷 목록 조회
- ✅ 객체 목록 조회 및 검색
- ✅ 파일 업로드/다운로드
- ✅ 객체 정보 조회 및 메타데이터 관리
- ✅ 객체 복사 및 삭제
- ✅ 다중 리전 지원

**사용 예제:**
```bash
cd nodejs_objectstorage
npm install
node cli/index.js buckets
```

#### 🌐 `nodejs_global_edge/`
**NCP Global Edge CDN Purge 관리 도구**
- NCP Global Edge CDN 캐시 퍼지 CLI 도구
- 4가지 퍼지 유형 지원 (ALL, DIRECTORY, PATTERN, URL)
- NCP API v2 서명 방식 구현
- 직관적인 명령줄 인터페이스

**주요 기능:**
- ✅ 모든 콘텐츠 퍼지 (약 40분 소요)
- ✅ 디렉토리 단위 퍼지 (약 40분 소요)
- ✅ 확장자 패턴 퍼지 (약 40분 소요)
- ✅ URL 단위 퍼지 (빠른 퍼지 지원)
- ✅ 입력 유효성 검사 및 오류 처리
- ✅ 상세한 사용 가이드 및 예시

**사용 예제:**
```bash
cd nodejs_global_edge
npm install
node cli/index.js examples
node cli/index.js url -e 123 -t "/index.html"
```

#### 🔒 `nodejs_checkssl/`
**SSL 인증서 만료 모니터링 시스템**
- SSL 인증서 만료일 자동 체크 및 NCP SENS 문자 알림
- 파일 기반 도메인/전화번호 관리 시스템
- 중복 발송 방지 및 보안 강화 기능
- 긴급도별 차등 알림 및 상세한 운영 메뉴얼

**주요 기능:**
- ✅ 대량 SSL 인증서 일괄 체크
- ✅ 파일 기반 도메인 목록 관리 (domain.txt)
- ✅ 다중 담당자 SMS 알림 (notification.txt)
- ✅ SSL 체크 실패시 자동 에러 알림
- ✅ 24시간 쿨다운으로 중복 발송 방지
- ✅ 민감정보 마스킹 및 환경변수 보안
- ✅ 긴급도별 스마트 알림 (3일/7일/14일/20일)
- ✅ 발송 이력 추적 및 관리
- ✅ 상세한 관리자 운영 매뉴얼

**사용 예제:**
```bash
cd nodejs_checkssl
npm install
cp env-example.txt .env
# .env 파일 편집하여 NCP SENS 설정
npm start                    # 전체 도메인 체크
npm run single google.com    # 단일 도메인 체크
npm run status              # 발송 기록 확인
```

### 🚀 향후 계획

다음과 같은 도구들을 추가로 개발할 예정입니다:

## 🛠️ 기술 스택

- **Node.js** - 주요 런타임 환경
- **TypeScript** - 타입 안전성과 개발 생산성
- **AWS SDK v3** - 클라우드 서비스 연동
- **NCP SENS API** - SMS 문자 발송 서비스
- **ES6 Modules** - 현대적인 JavaScript
- **Commander.js** - CLI 인터페이스
- **Axios** - HTTP 클라이언트
- **crypto-js** - 암호화 및 인증
- **기타** - 각 도구별 특화된 라이브러리들

## 📖 사용 가이드

### 1. 저장소 클론
```bash
git clone https://github.com/your-username/ncloud.git
cd ncloud
```

### 2. 원하는 도구 선택
```bash
# Object Storage 도구 사용
cd nodejs_objectstorage
npm install
cp env.example .env
# .env 파일 편집하여 NCP 자격 증명 입력
node cli/index.js --help

# Global Edge CDN Purge 도구 사용
cd ../nodejs_global_edge
npm install
cp env.example .env
# .env 파일 편집하여 NCP 자격 증명 입력
node cli/index.js examples

# SSL 인증서 모니터링 시스템 사용
cd ../nodejs_checkssl
npm install
cp env-example.txt .env
# .env 파일 편집하여 NCP SENS 설정 입력
# domain.txt에 체크할 도메인 목록 입력
# notification.txt에 알림받을 전화번호 입력
npm start
```

### 3. 자격 증명 설정
각 도구는 NCP 콘솔에서 발급받은 API 키가 필요합니다:
- Sub Account에서 API 키 생성
- 적절한 권한 부여
- 환경 변수 또는 설정 파일에 저장

## 🤝 기여하기

이 프로젝트는 오픈소스이며 누구나 기여할 수 있습니다!

### 기여 방법
1. 이슈 등록 - 버그 리포트, 기능 요청
2. Pull Request - 코드 개선, 새로운 기능 추가
3. 문서화 - 사용법, 예제 코드 개선
4. 테스트 - 다양한 환경에서의 테스트

### 개발 가이드라인
- 코드 스타일: ES6+ 모던 JavaScript
- 문서화: README.md 및 코드 주석 필수
- 테스트: 주요 기능에 대한 예제 코드 제공
- 에러 처리: 명확한 에러 메시지 및 복구 방법 제시

## 📋 로드맵

### 2025년 계획
- [ ] CDN 관리 도구 개발
- [ ] 보안 도구 모음 개발
- [ ] 웹 기반 관리 인터페이스 개발
- [ ] 모니터링 및 알림 시스템 개발

## 🔗 관련 링크

- [NAVER Cloud Platform 공식 사이트](https://www.ncloud.com/)
- [NCP 개발자 가이드](https://guide.ncloud-docs.com/)
- [NCP 콘솔](https://console.ncloud.com/)

## 📞 지원 및 문의

- **이슈 트래커**: GitHub Issues를 통한 버그 리포트 및 기능 요청
- **토론**: GitHub Discussions를 통한 질문 및 아이디어 공유
- **위키**: 상세한 사용법 및 팁 공유

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

### MIT License

```
Copyright (c) 2025 NBASE Utilities Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### 🆓 자유로운 사용

이 프로젝트는 완전히 **무료**이며 다음과 같은 자유를 제공합니다:

- ✅ **사용 자유**: 상업적/비상업적 목적 모두 자유롭게 사용
- ✅ **수정 자유**: 소스코드를 자유롭게 수정하여 사용
- ✅ **배포 자유**: 원본 또는 수정된 버전을 자유롭게 배포
- ✅ **기여 환영**: 누구나 프로젝트에 기여 가능
- ✅ **제한 없음**: 특별한 제한이나 조건 없이 사용 가능

### 🙏 기여자 인정

이 프로젝트에 기여해주신 모든 분들께 감사드립니다. 여러분의 기여가 NCP 생태계를 더욱 풍부하게 만들어가고 있습니다.

---

**⭐ 이 프로젝트가 도움이 되었다면 스타를 눌러주세요!**

**🔔 새로운 도구 출시 소식을 받고 싶다면 Watch를 눌러주세요!** 