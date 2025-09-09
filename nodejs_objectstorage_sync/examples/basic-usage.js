import { S3Sync } from '../lib/S3Sync.js';
import { config } from 'dotenv';

// .env 파일 로드
config();

async function basicSync() {
  console.log('🚀 Basic S3 Sync Example\n');

  // S3Sync 인스턴스 생성
  const s3Sync = new S3Sync();

  try {
    // 연결 테스트
    console.log('🔍 Testing connections...');
    const connectionTest = await s3Sync.testConnections('my-source-bucket', 'my-dest-bucket');
    
    if (!connectionTest) {
      console.error('❌ Connection test failed');
      return;
    }

    // 전체 동기화
    console.log('\n🔄 Starting sync...');
    const stats = await s3Sync.syncAll('my-source-bucket', 'my-dest-bucket', {
      prefix: 'uploads/',  // 특정 prefix만 동기화
      dryRun: true,        // 실제 동기화하지 않고 미리보기
      force: false,        // 동일한 파일은 건너뛰기
      exclude: ['*.tmp', '*.log'],  // 임시 파일과 로그 파일 제외
      maxConcurrency: 3,   // 동시 처리 수 제한
      verifyChecksum: true, // 체크섬 검증
      resume: false        // 재개 모드 비활성화
    });

    console.log('\n📊 Sync completed!');
    console.log(`   Synced: ${stats.syncedFiles} files`);
    console.log(`   Skipped: ${stats.skippedFiles} files`);
    console.log(`   Failed: ${stats.failedFiles} files`);

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
  }
}

async function customConfigSync() {
  console.log('\n🔧 Custom Configuration Sync Example\n');

  // 커스텀 설정으로 S3Sync 생성
  const s3Sync = new S3Sync(
    // Source S3 설정
    {
      region: 'kr-standard',
      endpoint: 'https://kr.object.ncloudstorage.com',
      accessKeyId: 'your-ncp-access-key',
      secretAccessKey: 'your-ncp-secret-key'
    },
    // Destination S3 설정
    {
      region: 'us-east-1',
      endpoint: 'https://s3.amazonaws.com',
      accessKeyId: 'your-aws-access-key',
      secretAccessKey: 'your-aws-secret-key'
    }
  );

  try {
    // 단일 파일 동기화
    const object = {
      Key: 'important-file.txt',
      Size: 1024,
      LastModified: new Date()
    };

    const result = await s3Sync.syncObject(
      object,
      'my-source-bucket',
      'my-dest-bucket',
      { dryRun: true }
    );

    if (result.success) {
      console.log('✅ File sync result:', result);
    } else {
      console.error('❌ File sync failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Custom sync failed:', error.message);
  }
}

async function progressCallbackExample() {
  console.log('\n📊 Progress Callback Example\n');

  const s3Sync = new S3Sync();

  try {
    const stats = await s3Sync.syncAll('my-source-bucket', 'my-dest-bucket', {
      prefix: 'images/',
      dryRun: true,
      progressCallback: (currentStats) => {
        console.log(`Progress: ${currentStats.syncedFiles}/${currentStats.totalFiles} files synced`);
      }
    });

  } catch (error) {
    console.error('❌ Progress callback example failed:', error.message);
  }
}

async function advancedSyncExample() {
  console.log('\n🚀 Advanced Sync Example\n');

  const s3Sync = new S3Sync();

  try {
    // 고급 동기화 옵션
    const stats = await s3Sync.syncAll('my-source-bucket', 'my-dest-bucket', {
      prefix: 'data/',
      dryRun: false,
      force: false,
      resume: false,           // 중단된 동기화 재개
      verifyChecksum: true,    // 체크섬 검증
      exclude: ['*.tmp', '*.log', 'temp/*'],
      include: ['*.jpg', '*.png', '*.pdf'],
      maxConcurrency: 10,      // 높은 동시성
      logLevel: 'debug'        // 상세 로깅
    });

    console.log('\n📊 Advanced sync completed!');
    console.log(`   Synced: ${stats.syncedFiles} files`);
    console.log(`   Skipped: ${stats.skippedFiles} files`);
    console.log(`   Failed: ${stats.failedFiles} files`);
    console.log(`   Retries: ${stats.retryCount} files`);
    console.log(`   Checksum mismatches: ${stats.checksumMismatches} files`);

  } catch (error) {
    console.error('❌ Advanced sync failed:', error.message);
  }
}

async function verificationExample() {
  console.log('\n🔍 File Verification Example\n');

  const s3Sync = new S3Sync();

  try {
    // 파일 무결성 검증
    const isValid = await s3Sync.verifyChecksum(
      'my-source-bucket',
      'important-file.txt',
      'my-dest-bucket',
      'important-file.txt'
    );

    if (isValid) {
      console.log('✅ File integrity verified');
    } else {
      console.log('❌ File integrity check failed');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

// 예제 실행
async function runExamples() {
  await basicSync();
  await customConfigSync();
  await progressCallbackExample();
  await advancedSyncExample();
  await verificationExample();
}

runExamples().catch(console.error);
