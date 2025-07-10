import { S3Manager } from '../lib/S3Manager.js';
import { config } from 'dotenv';

// .env 파일 로드
config();

async function basicUsageExample() {
  // S3Manager 인스턴스 생성
  const s3Manager = new S3Manager();
  
  const bucketName = 'your-test-bucket'; // 실제 버킷 이름으로 변경
  const testKey = 'test-file.txt';
  
  console.log('🚀 S3Manager 기본 사용법 예제\n');
  
  // 0. 전체 버킷 목록 조회
  console.log('0️⃣ 전체 버킷 목록 조회');
  const bucketsResult = await s3Manager.listBuckets();
  if (bucketsResult.success) {
    console.log(`   📊 총 ${bucketsResult.count}개 버킷 발견`);
    bucketsResult.buckets.forEach(bucket => {
      console.log(`   🪣 ${bucket.Name} (생성일: ${bucket.CreationDate})`);
    });
  } else {
    console.log(`   ❌ 오류: ${bucketsResult.error}`);
  }
  
  console.log('\n');
  
  // 1. 객체 목록 조회
  console.log('1️⃣ 객체 목록 조회');
  const listResult = await s3Manager.listObjects(bucketName, '', 10);
  if (listResult.success) {
    console.log(`   📊 총 ${listResult.count}개 객체 발견`);
    listResult.objects.forEach(obj => {
      console.log(`   📄 ${obj.Key} (${obj.Size} bytes)`);
    });
  } else {
    console.log(`   ❌ 오류: ${listResult.error}`);
  }
  
  console.log('\n');
  
  // 2. 텍스트 데이터 업로드
  console.log('2️⃣ 텍스트 데이터 업로드');
  const textData = Buffer.from('Hello, S3! 안녕하세요!');
  const uploadResult = await s3Manager.uploadObject(
    bucketName,
    testKey,
    textData,
    { contentType: 'text/plain' }
  );
  
  if (uploadResult.success) {
    console.log(`   ✅ 업로드 성공: ${uploadResult.location}`);
  } else {
    console.log(`   ❌ 업로드 오류: ${uploadResult.error}`);
  }
  
  console.log('\n');
  
  // 3. 객체 존재 확인
  console.log('3️⃣ 객체 존재 확인');
  const existsResult = await s3Manager.objectExists(bucketName, testKey);
  if (existsResult.success) {
    console.log(`   ${existsResult.exists ? '✅ 객체 존재함' : '❌ 객체 존재하지 않음'}`);
  } else {
    console.log(`   ❌ 확인 오류: ${existsResult.error}`);
  }
  
  console.log('\n');
  
  // 4. 객체 정보 조회
  console.log('4️⃣ 객체 정보 조회');
  const infoResult = await s3Manager.getObjectInfo(bucketName, testKey);
  if (infoResult.success) {
    const info = infoResult.info;
    console.log(`   📋 크기: ${info.size} bytes`);
    console.log(`   📅 수정일: ${info.lastModified}`);
    console.log(`   🏷️  Content-Type: ${info.contentType}`);
  } else {
    console.log(`   ❌ 정보 조회 오류: ${infoResult.error}`);
  }
  
  console.log('\n');
  
  // 5. 객체 다운로드 (메모리로)
  console.log('5️⃣ 객체 다운로드');
  const downloadResult = await s3Manager.downloadObject(bucketName, testKey);
  if (downloadResult.success) {
    const content = downloadResult.data.toString();
    console.log(`   📥 다운로드 성공: "${content}"`);
  } else {
    console.log(`   ❌ 다운로드 오류: ${downloadResult.error}`);
  }
  
  console.log('\n');
  
  // 6. 객체 삭제 (선택사항)
  console.log('6️⃣ 객체 삭제 (주석 해제하여 실행)');
  console.log('   // const deleteResult = await s3Manager.deleteObject(bucketName, testKey);');
  
  /*
  const deleteResult = await s3Manager.deleteObject(bucketName, testKey);
  if (deleteResult.success) {
    console.log(`   ✅ ${deleteResult.message}`);
  } else {
    console.log(`   ❌ 삭제 오류: ${deleteResult.error}`);
  }
  */
  
  console.log('\n✨ 예제 완료!');
}

// 예제 실행
basicUsageExample().catch(console.error); 