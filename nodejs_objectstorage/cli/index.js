#!/usr/bin/env node

import { Command } from 'commander';
import { S3Manager } from '../lib/S3Manager.js';
import { config } from 'dotenv';
import { resolve } from 'path';

// .env 파일 로드
config();

const program = new Command();
const s3Manager = new S3Manager();

program
  .name('s3-cli')
  .description('AWS S3 Object Management CLI')
  .version('1.0.0');

// 버킷 목록 조회
program
  .command('buckets')
  .description('List all S3 buckets')
  .action(async () => {
    console.log(`🪣 Listing all S3 buckets`);
    
    const result = await s3Manager.listBuckets();
    
    if (result.success) {
      console.log(`📊 Found ${result.count} buckets:`);
      result.buckets.forEach(bucket => {
        console.log(`  🪣 ${bucket.Name} (Created: ${bucket.CreationDate})`);
      });
      if (result.owner) {
        console.log(`👤 Owner: ${result.owner.DisplayName} (${result.owner.ID})`);
      }
    } else {
      console.error(`❌ Error: ${result.error}`);
    }
  });

// 객체 목록 조회
program
  .command('list')
  .description('List objects in S3 bucket')
  .requiredOption('-b, --bucket <bucket>', 'S3 bucket name')
  .option('-p, --prefix <prefix>', 'Object key prefix', '')
  .option('-m, --max <max>', 'Maximum number of objects', '100')
  .action(async (options) => {
    console.log(`🔍 Listing objects in bucket: ${options.bucket}`);
    
    const result = await s3Manager.listObjects(
      options.bucket,
      options.prefix,
      parseInt(options.max)
    );
    
    if (result.success) {
      console.log(`📊 Found ${result.count} objects:`);
      result.objects.forEach(obj => {
        console.log(`  📄 ${obj.Key} (${obj.Size} bytes, ${obj.LastModified})`);
      });
    } else {
      console.error(`❌ Error: ${result.error}`);
    }
  });

// 객체 다운로드
program
  .command('download')
  .description('Download object from S3')
  .requiredOption('-b, --bucket <bucket>', 'S3 bucket name')
  .requiredOption('-k, --key <key>', 'Object key')
  .requiredOption('-o, --output <output>', 'Output file path')
  .action(async (options) => {
    console.log(`⬇️  Downloading ${options.key} from ${options.bucket}`);
    
    const result = await s3Manager.downloadObject(
      options.bucket,
      options.key,
      options.output
    );
    
    if (result.success) {
      console.log(`✅ ${result.message}`);
    } else {
      console.error(`❌ Error: ${result.error}`);
    }
  });

// 객체 업로드
program
  .command('upload')
  .description('Upload file to S3')
  .requiredOption('-b, --bucket <bucket>', 'S3 bucket name')
  .requiredOption('-k, --key <key>', 'Object key')
  .requiredOption('-f, --file <file>', 'Local file path')
  .option('-t, --content-type <type>', 'Content type')
  .action(async (options) => {
    console.log(`⬆️  Uploading ${options.file} to ${options.bucket}/${options.key}`);
    
    const uploadOptions = {};
    if (options.contentType) {
      uploadOptions.contentType = options.contentType;
    }
    
    const result = await s3Manager.uploadObject(
      options.bucket,
      options.key,
      resolve(options.file),
      uploadOptions
    );
    
    if (result.success) {
      console.log(`✅ Uploaded successfully`);
      console.log(`   Location: ${result.location}`);
      console.log(`   ETag: ${result.etag}`);
    } else {
      console.error(`❌ Error: ${result.error}`);
    }
  });

// 객체 삭제
program
  .command('delete')
  .description('Delete object from S3')
  .requiredOption('-b, --bucket <bucket>', 'S3 bucket name')
  .requiredOption('-k, --key <key>', 'Object key')
  .action(async (options) => {
    console.log(`🗑️  Deleting ${options.key} from ${options.bucket}`);
    
    const result = await s3Manager.deleteObject(options.bucket, options.key);
    
    if (result.success) {
      console.log(`✅ ${result.message}`);
    } else {
      console.error(`❌ Error: ${result.error}`);
    }
  });

// 객체 정보 조회
program
  .command('info')
  .description('Get object information')
  .requiredOption('-b, --bucket <bucket>', 'S3 bucket name')
  .requiredOption('-k, --key <key>', 'Object key')
  .action(async (options) => {
    console.log(`ℹ️  Getting info for ${options.key} in ${options.bucket}`);
    
    const result = await s3Manager.getObjectInfo(options.bucket, options.key);
    
    if (result.success) {
      const info = result.info;
      console.log(`📋 Object Information:`);
      console.log(`   Size: ${info.size} bytes`);
      console.log(`   Last Modified: ${info.lastModified}`);
      console.log(`   ETag: ${info.etag}`);
      console.log(`   Content Type: ${info.contentType}`);
      if (info.metadata && Object.keys(info.metadata).length > 0) {
        console.log(`   Metadata:`, info.metadata);
      }
    } else {
      console.error(`❌ Error: ${result.error}`);
    }
  });

// 객체 복사
program
  .command('copy')
  .description('Copy object within S3')
  .requiredOption('-sb, --source-bucket <bucket>', 'Source bucket name')
  .requiredOption('-sk, --source-key <key>', 'Source object key')
  .requiredOption('-db, --dest-bucket <bucket>', 'Destination bucket name')
  .requiredOption('-dk, --dest-key <key>', 'Destination object key')
  .action(async (options) => {
    console.log(`📋 Copying ${options.sourceBucket}/${options.sourceKey} to ${options.destBucket}/${options.destKey}`);
    
    const result = await s3Manager.copyObject(
      options.sourceBucket,
      options.sourceKey,
      options.destBucket,
      options.destKey
    );
    
    if (result.success) {
      console.log(`✅ ${result.message}`);
      console.log(`   ETag: ${result.etag}`);
    } else {
      console.error(`❌ Error: ${result.error}`);
    }
  });

// 객체 존재 확인
program
  .command('exists')
  .description('Check if object exists')
  .requiredOption('-b, --bucket <bucket>', 'S3 bucket name')
  .requiredOption('-k, --key <key>', 'Object key')
  .action(async (options) => {
    console.log(`🔍 Checking if ${options.key} exists in ${options.bucket}`);
    
    const result = await s3Manager.objectExists(options.bucket, options.key);
    
    if (result.success) {
      if (result.exists) {
        console.log(`✅ Object exists`);
      } else {
        console.log(`❌ Object does not exist`);
      }
    } else {
      console.error(`❌ Error: ${result.error}`);
    }
  });

// CLI 테스트 (무한 접속 테스트)
program
  .command('test')
  .description('Test S3 connection continuously')
  .option('-i, --interval <seconds>', 'Test interval in seconds', '5')
  .option('-b, --bucket <bucket>', 'Test bucket name (if not provided, uses bucket list)')
  .option('-c, --count <count>', 'Number of tests to run (0 for infinite)', '0')
  .option('--fail-fast', 'Exit on first failure')
  .action(async (options) => {
    const interval = parseInt(options.interval) * 1000;
    const maxCount = parseInt(options.count);
    const failFast = options.failFast;
    
    console.log(`🧪 Starting S3 connection test`);
    console.log(`   Interval: ${options.interval} seconds`);
    console.log(`   Max count: ${maxCount === 0 ? 'infinite' : maxCount}`);
    console.log(`   Fail fast: ${failFast ? 'enabled' : 'disabled'}`);
    console.log(`   Test bucket: ${options.bucket || 'auto-detect'}`);
    console.log(`\n⏰ Starting tests... (Press Ctrl+C to stop)\n`);
    
    let testCount = 0;
    let successCount = 0;
    let failCount = 0;
    let consecutiveFailures = 0;
    
    const runTest = async () => {
      testCount++;
      const timestamp = new Date().toISOString();
      
      try {
        console.log(`[${timestamp}] 🔄 Test #${testCount} - Testing connection...`);
        
        let result;
        if (options.bucket) {
          // 특정 버킷 테스트
          result = await s3Manager.listObjects(options.bucket, '', 1);
        } else {
          // 버킷 목록 조회 테스트
          result = await s3Manager.listBuckets();
        }
        
        if (result.success) {
          successCount++;
          consecutiveFailures = 0;
          console.log(`[${timestamp}] ✅ Test #${testCount} - SUCCESS (${successCount}/${testCount})`);
        } else {
          throw new Error(result.error);
        }
        
      } catch (error) {
        failCount++;
        consecutiveFailures++;
        console.error(`[${timestamp}] ❌ Test #${testCount} - FAILED: ${error.message}`);
        console.error(`[${timestamp}] 📊 Stats: ${successCount} success, ${failCount} failed, ${consecutiveFailures} consecutive failures`);
        
        if (failFast) {
          console.error(`\n💥 Fail-fast enabled. Exiting on first failure.`);
          process.exit(1);
        }
        
        // 연속 실패가 10번 이상이면 경고
        if (consecutiveFailures >= 10) {
          console.warn(`\n⚠️  WARNING: ${consecutiveFailures} consecutive failures detected!`);
        }
      }
      
      // 통계 출력 (매 10번째 테스트마다)
      if (testCount % 10 === 0) {
        const successRate = ((successCount / testCount) * 100).toFixed(2);
        console.log(`\n📊 Test Statistics (${testCount} tests):`);
        console.log(`   Success: ${successCount} (${successRate}%)`);
        console.log(`   Failed: ${failCount} (${(100 - successRate).toFixed(2)}%)`);
        console.log(`   Consecutive failures: ${consecutiveFailures}\n`);
      }
    };
    
    // 첫 번째 테스트 즉시 실행
    await runTest();
    
    // 무한 루프 또는 지정된 횟수만큼 테스트
    const testInterval = setInterval(async () => {
      if (maxCount > 0 && testCount >= maxCount) {
        clearInterval(testInterval);
        console.log(`\n🏁 Test completed. Total: ${testCount}, Success: ${successCount}, Failed: ${failCount}`);
        
        if (failCount > 0) {
          console.error(`\n💥 Tests failed. Exiting with error code.`);
          process.exit(1);
        } else {
          console.log(`\n✅ All tests passed!`);
          process.exit(0);
        }
        return;
      }
      
      await runTest();
    }, interval);
    
    // Ctrl+C 처리
    process.on('SIGINT', () => {
      clearInterval(testInterval);
      console.log(`\n\n🛑 Test interrupted by user`);
      console.log(`📊 Final Statistics:`);
      console.log(`   Total tests: ${testCount}`);
      console.log(`   Success: ${successCount}`);
      console.log(`   Failed: ${failCount}`);
      console.log(`   Success rate: ${testCount > 0 ? ((successCount / testCount) * 100).toFixed(2) : 0}%`);
      
      if (failCount > 0) {
        console.error(`\n💥 Tests had failures. Exiting with error code.`);
        process.exit(1);
      } else {
        console.log(`\n✅ No failures detected.`);
        process.exit(0);
      }
    });
  });

// 권한 확인
program
  .command('check-permissions')
  .description('Check S3 permissions for current credentials')
  .requiredOption('-b, --bucket <bucket>', 'S3 bucket name')
  .action(async (options) => {
    console.log(`🔐 Checking permissions for bucket: ${options.bucket}`);
    
    const permissions = {
      read: false,
      write: false,
      delete: false,
      list: false
    };
    
    try {
      // 읽기 권한 테스트 (객체 존재 확인)
      console.log(`📖 Testing read permission...`);
      const readResult = await s3Manager.objectExists(options.bucket, 'test-permission-check');
      if (readResult.success) {
        permissions.read = true;
        console.log(`✅ Read permission: OK`);
      } else {
        console.log(`❌ Read permission: ${readResult.error}`);
      }
    } catch (error) {
      console.log(`❌ Read permission: ${error.message}`);
    }
    
    try {
      // 리스트 권한 테스트
      console.log(`📋 Testing list permission...`);
      const listResult = await s3Manager.listObjects(options.bucket, '', 1);
      if (listResult.success) {
        permissions.list = true;
        console.log(`✅ List permission: OK`);
      } else {
        console.log(`❌ List permission: ${listResult.error}`);
      }
    } catch (error) {
      console.log(`❌ List permission: ${error.message}`);
    }
    
    try {
      // 쓰기 권한 테스트 (임시 파일 업로드)
      console.log(`✏️  Testing write permission...`);
      const fs = await import('fs');
      const tempFile = '/tmp/s3-permission-test.txt';
      fs.writeFileSync(tempFile, 'permission test');
      
      console.log(options.bucket,
        'permission-test.txt',
        tempFile);
        
      const writeResult = await s3Manager.uploadObject(
        options.bucket,
        'permission-test.txt',
        tempFile
      );
      
      if (writeResult.success) {
        permissions.write = true;
        console.log(`✅ Write permission: OK`);
        
        // 임시 파일 삭제
        try {
          const deleteResult = await s3Manager.deleteObject(options.bucket, 'permission-test.txt');
          if (deleteResult.success) {
            permissions.delete = true;
            console.log(`✅ Delete permission: OK`);
          } else {
            console.log(`❌ Delete permission: ${deleteResult.error}`);
          }
        } catch (deleteError) {
          console.log(`❌ Delete permission: ${deleteError.message}`);
        }
      } else {
        console.log(`❌ Write permission: ${writeResult.error}`);
        
        // 대안 방법 시도 (Stream 방식)
        console.log(`\n🔄 Trying stream upload method...`);
        const altResult = await s3Manager.uploadObjectWithStream(
          options.bucket,
          'permission-test.txt',
          tempFile
        );
        
        if (altResult.success) {
          permissions.write = true;
          console.log(`✅ Stream write method: OK`);
          
          // 임시 파일 삭제
          try {
            const deleteResult = await s3Manager.deleteObject(options.bucket, 'permission-test.txt');
            if (deleteResult.success) {
              permissions.delete = true;
              console.log(`✅ Delete permission: OK`);
            } else {
              console.log(`❌ Delete permission: ${deleteResult.error}`);
            }
          } catch (deleteError) {
            console.log(`❌ Delete permission: ${deleteError.message}`);
          }
        } else {
          console.log(`❌ Stream write method: ${altResult.error}`);
        }
      }
      
      // 임시 파일 정리
      try {
        fs.unlinkSync(tempFile);
      } catch (e) {
        // 무시
      }
      
    } catch (error) {
      console.log(`❌ Write permission: ${error.message}`);
    }
    
    console.log(`\n📊 Permission Summary:`);
    console.log(`   Read: ${permissions.read ? '✅' : '❌'}`);
    console.log(`   List: ${permissions.list ? '✅' : '❌'}`);
    console.log(`   Write: ${permissions.write ? '✅' : '❌'}`);
    console.log(`   Delete: ${permissions.delete ? '✅' : '❌'}`);
    
    if (!permissions.write) {
      console.log(`\n💡 To enable upload, you need s3:PutObject permission for this bucket.`);
    }
  });

// 대안 업로드 테스트
program
  .command('test-upload')
  .description('Test different upload methods for NCloud compatibility')
  .requiredOption('-b, --bucket <bucket>', 'S3 bucket name')
  .requiredOption('-k, --key <key>', 'Object key')
  .requiredOption('-f, --file <file>', 'Local file path')
  .action(async (options) => {
    console.log(`🧪 Testing different upload methods for NCloud compatibility`);
    
    const methods = [
      { name: 'Buffer Upload (Default)', method: 'uploadObject' },
      { name: 'Stream Upload (Alternative)', method: 'uploadObjectWithStream' }
    ];
    
    for (const method of methods) {
      console.log(`\n🔄 Testing: ${method.name}`);
      
      try {
        const result = await s3Manager[method.method](
          options.bucket,
          options.key,
          resolve(options.file)
        );
        
        if (result.success) {
          console.log(`✅ ${method.name}: SUCCESS`);
          console.log(`   Location: ${result.location}`);
          console.log(`   ETag: ${result.etag}`);
          break; // 성공하면 중단
        } else {
          console.log(`❌ ${method.name}: FAILED - ${result.error}`);
        }
      } catch (error) {
        console.log(`❌ ${method.name}: ERROR - ${error.message}`);
      }
    }
  });

program.parse(); 