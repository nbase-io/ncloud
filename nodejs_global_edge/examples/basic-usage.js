import { GlobalEdgePurge } from '../lib/GlobalEdgePurge.js';
import { config } from 'dotenv';

// .env 파일 로드
config();

async function basicUsageExample() {
  console.log('🚀 NCP Global Edge CDN Purge 기본 사용법 예제\n');
  
  try {
    // GlobalEdgePurge 인스턴스 생성
    const purgeClient = new GlobalEdgePurge();
    
    const edgeId = 123; // 실제 Edge ID로 변경 필요
    
    console.log('📋 사용 가능한 퍼지 유형별 예시:\n');
    
    // 1. 모든 콘텐츠 퍼지 (예시만 출력)
    console.log('1️⃣ 모든 콘텐츠 퍼지');
    console.log('   - 모든 캐시된 콘텐츠를 삭제합니다.');
    console.log('   - 예상 소요 시간: 약 40분');
    console.log('   - 사용법: await purgeClient.purgeAll(edgeId)');
    console.log('');
    
    // 2. 디렉토리 단위 퍼지 (예시만 출력)
    console.log('2️⃣ 디렉토리 단위 퍼지');
    console.log('   - 특정 디렉토리의 모든 콘텐츠를 삭제합니다.');
    console.log('   - 예상 소요 시간: 약 40분');
    console.log('   - 규칙: "/"로 시작하고 "/*"로 끝나야 함');
    console.log('   - 사용법: await purgeClient.purgeDirectory(edgeId, ["/src/*", "/images/*"])');
    console.log('');
    
    // 3. 확장자 단위 퍼지 (예시만 출력)
    console.log('3️⃣ 확장자 단위 퍼지');
    console.log('   - 특정 확장자의 모든 파일을 삭제합니다.');
    console.log('   - 예상 소요 시간: 약 40분');
    console.log('   - 규칙: "/"로 시작하고 "*.확장자" 형식');
    console.log('   - 사용법: await purgeClient.purgePattern(edgeId, ["/*.jpg", "/static/*.png"])');
    console.log('');
    
    // 4. URL 단위 퍼지 (예시만 출력)
    console.log('4️⃣ URL 단위 퍼지');
    console.log('   - 특정 URL의 콘텐츠를 삭제합니다.');
    console.log('   - 예상 소요 시간: 빠른 퍼지 지원');
    console.log('   - 규칙: "/"로 시작, "*" 와일드카드 사용 불가');
    console.log('   - 사용법: await purgeClient.purgeUrl(edgeId, ["/index.html", "/css/main.css"])');
    console.log('');
    
    // 실제 API 호출 예시 (주석 처리됨)
    console.log('⚠️  실제 API 호출 예시 (주석 해제하여 사용):');
    console.log('');
    
    /*
    // 실제 사용 예시 - 환경 변수 설정 후 주석 해제
    console.log('🔄 실제 퍼지 요청 실행...');
    
    // URL 단위 퍼지 (빠른 퍼지)
    const urlResult = await purgeClient.purgeUrl(edgeId, ['/test.html']);
    if (urlResult.success) {
      console.log('✅ URL 퍼지 성공:', urlResult.message);
      console.log('📋 퍼지 요청 번호:', urlResult.purgeIds);
    } else {
      console.log('❌ URL 퍼지 실패:', urlResult.error);
    }
    */
    
    console.log('🔧 환경 변수 설정 방법:');
    console.log('   1. .env 파일 생성');
    console.log('   2. NCP_ACCESS_KEY=your_access_key');
    console.log('   3. NCP_SECRET_KEY=your_secret_key');
    console.log('');
    
    console.log('📖 CLI 사용법:');
    console.log('   node cli/index.js examples    # 사용 예시 출력');
    console.log('   node cli/index.js url -e 123 -t "/index.html"');
    console.log('   node cli/index.js directory -e 123 -t "/src/*"');
    console.log('   node cli/index.js pattern -e 123 -t "/*.jpg"');
    console.log('   node cli/index.js all -e 123');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.log('');
    console.log('💡 해결 방법:');
    console.log('   1. NCP_ACCESS_KEY와 NCP_SECRET_KEY 환경 변수 설정 확인');
    console.log('   2. NCP 콘솔에서 API 키 권한 확인');
    console.log('   3. Edge ID가 올바른지 확인');
  }
  
  console.log('\n✨ 예제 완료!');
}

// 예제 실행
basicUsageExample().catch(console.error); 