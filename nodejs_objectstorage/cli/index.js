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

program.parse(); 