import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand
} from '@aws-sdk/client-s3';
import { pipeline } from 'stream/promises';
import chalk from 'chalk';
import ora from 'ora';
import { createHash } from 'crypto';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

export class S3Sync {
  constructor(srcConfig = {}, destConfig = {}) {
    // Source S3 Configuration
    this.srcClient = new S3Client({
      region: srcConfig.region || process.env.SRC_AWS_REGION || 'kr-standard',
      endpoint: srcConfig.endpoint || process.env.SRC_AWS_ENDPOINT || 'https://kr.object.ncloudstorage.com',
      credentials: {
        accessKeyId: srcConfig.accessKeyId || process.env.SRC_AWS_ACCESS_KEY_ID,
        secretAccessKey: srcConfig.secretAccessKey || process.env.SRC_AWS_SECRET_ACCESS_KEY
      },
      forcePathStyle: true,
      s3ForcePathStyle: true,
      signatureVersion: 'v4'
    });

    // Destination S3 Configuration
    this.destClient = new S3Client({
      region: destConfig.region || process.env.DEST_AWS_REGION || 'us-east-1',
      endpoint: destConfig.endpoint || process.env.DEST_AWS_ENDPOINT || 'https://s3.amazonaws.com',
      credentials: {
        accessKeyId: destConfig.accessKeyId || process.env.DEST_AWS_ACCESS_KEY_ID,
        secretAccessKey: destConfig.secretAccessKey || process.env.DEST_AWS_SECRET_ACCESS_KEY
      },
      forcePathStyle: destConfig.forcePathStyle !== undefined ? destConfig.forcePathStyle : false,
      s3ForcePathStyle: destConfig.forcePathStyle !== undefined ? destConfig.forcePathStyle : false,
      signatureVersion: 'v4'
    });

    this.stats = {
      totalFiles: 0,
      syncedFiles: 0,
      skippedFiles: 0,
      failedFiles: 0,
      totalSize: 0,
      syncedSize: 0,
      startTime: null,
      endTime: null,
      retryCount: 0,
      checksumMismatches: 0
    };

    this.stateFile = '.s3sync-state.json';
    this.logFile = '.s3sync.log';
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2
    };
  }

  /**
   * 전체 동기화 실행
   */
  async syncAll(srcBucket, destBucket, options = {}) {
    const {
      prefix = '',
      dryRun = false,
      force = false,
      exclude = [],
      include = [],
      maxConcurrency = 5,
      progressCallback = null,
      resume = false,
      verifyChecksum = false,
      logLevel = 'info'
    } = options;

    this.stats.startTime = new Date();
    this.log(`Starting S3 sync: ${srcBucket} → ${destBucket}`, 'info');
    console.log(chalk.blue(`🔄 Starting S3 sync: ${srcBucket} → ${destBucket}`));
    console.log(chalk.gray(`   Prefix: ${prefix || '(all)'}`));
    console.log(chalk.gray(`   Dry run: ${dryRun ? 'Yes' : 'No'}`));
    console.log(chalk.gray(`   Force: ${force ? 'Yes' : 'No'}`));
    console.log(chalk.gray(`   Resume: ${resume ? 'Yes' : 'No'}`));
    console.log(chalk.gray(`   Verify checksum: ${verifyChecksum ? 'Yes' : 'No'}`));

    try {
      let objects = [];
      let filteredObjects = [];

      // 재개 모드인 경우 상태 파일에서 복원
      if (resume && existsSync(this.stateFile)) {
        const state = this.loadState();
        if (state && state.srcBucket === srcBucket && state.destBucket === destBucket) {
          objects = state.objects || [];
          filteredObjects = state.filteredObjects || [];
          this.stats = { ...this.stats, ...state.stats };
          console.log(chalk.yellow(`📂 Resuming from previous state: ${this.stats.syncedFiles} files already synced`));
        }
      }

      // 상태 파일이 없거나 재개 모드가 아닌 경우 새로 조회
      if (objects.length === 0) {
        objects = await this.listAllObjects(srcBucket, prefix);
        this.stats.totalFiles = objects.length;
        this.stats.totalSize = objects.reduce((sum, obj) => sum + (obj.Size || 0), 0);

        console.log(chalk.green(`📊 Found ${this.stats.totalFiles} files (${this.formatBytes(this.stats.totalSize)})`));

        if (objects.length === 0) {
          console.log(chalk.yellow('⚠️  No files to sync'));
          return this.stats;
        }

        // 필터링 적용
        filteredObjects = this.filterObjects(objects, { exclude, include });
        console.log(chalk.blue(`🔍 After filtering: ${filteredObjects.length} files`));

        // 상태 저장
        this.saveState({
          srcBucket,
          destBucket,
          objects,
          filteredObjects,
          stats: this.stats,
          options
        });
      }

      // 동기화 실행
      const spinner = ora('Syncing files...').start();
      const startTime = Date.now();
      
      for (let i = 0; i < filteredObjects.length; i += maxConcurrency) {
        const batch = filteredObjects.slice(i, i + maxConcurrency);
        const batchPromises = batch.map(obj => 
          this.syncObjectWithRetry(obj, srcBucket, destBucket, { 
            dryRun, 
            force, 
            verifyChecksum 
          })
        );
        
        await Promise.all(batchPromises);
        
        if (progressCallback) {
          progressCallback(this.stats);
        }
        
        // 진행률 및 ETA 계산
        const elapsed = Date.now() - startTime;
        const rate = this.stats.syncedFiles / (elapsed / 1000);
        const remaining = filteredObjects.length - this.stats.syncedFiles - this.stats.skippedFiles;
        const eta = remaining > 0 ? Math.round(remaining / rate) : 0;
        
        spinner.text = `Synced ${this.stats.syncedFiles}/${filteredObjects.length} files (${this.formatBytes(this.stats.syncedSize)}) - ETA: ${this.formatTime(eta)}`;
        
        // 상태 업데이트 (매 10개 파일마다)
        if (i % (maxConcurrency * 2) === 0) {
          this.saveState({
            srcBucket,
            destBucket,
            objects,
            filteredObjects,
            stats: this.stats,
            options
          });
        }
      }

      this.stats.endTime = new Date();
      spinner.succeed('Sync completed!');
      this.printStats();
      
      // 상태 파일 정리
      if (existsSync(this.stateFile)) {
        this.deleteState();
      }
      
      return this.stats;
    } catch (error) {
      this.log(`Sync failed: ${error.message}`, 'error');
      console.error(chalk.red(`❌ Sync failed: ${error.message}`));
      throw error;
    }
  }

  /**
   * 재시도 로직이 포함된 단일 객체 동기화
   */
  async syncObjectWithRetry(object, srcBucket, destBucket, options = {}) {
    const { dryRun = false, force = false, verifyChecksum = false } = options;
    const key = object.Key;
    let lastError = null;

    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const result = await this.syncObject(object, srcBucket, destBucket, { 
          dryRun, 
          force, 
          verifyChecksum 
        });
        
        if (result.success) {
          if (attempt > 1) {
            this.log(`Retry successful for ${key} (attempt ${attempt})`, 'info');
          }
          return result;
        }
        
        lastError = result.error;
        
        if (attempt < this.retryConfig.maxRetries) {
          const delay = Math.min(
            this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
            this.retryConfig.maxDelay
          );
          
          this.log(`Retrying ${key} in ${delay}ms (attempt ${attempt + 1}/${this.retryConfig.maxRetries})`, 'warn');
          await this.sleep(delay);
        }
      } catch (error) {
        lastError = error.message;
        
        if (attempt < this.retryConfig.maxRetries) {
          const delay = Math.min(
            this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
            this.retryConfig.maxDelay
          );
          
          this.log(`Retrying ${key} in ${delay}ms (attempt ${attempt + 1}/${this.retryConfig.maxRetries}) - Error: ${error.message}`, 'warn');
          await this.sleep(delay);
        }
      }
    }

    this.stats.retryCount++;
    this.stats.failedFiles++;
    this.log(`Failed to sync ${key} after ${this.retryConfig.maxRetries} attempts: ${lastError}`, 'error');
    return { success: false, error: lastError };
  }

  /**
   * 단일 객체 동기화
   */
  async syncObject(object, srcBucket, destBucket, options = {}) {
    const { dryRun = false, force = false, verifyChecksum = false } = options;
    const key = object.Key;

    try {
      // 대상 객체 존재 여부 확인
      const destExists = await this.objectExists(destBucket, key);
      
      if (destExists && !force) {
        // ETag 비교로 변경 여부 확인
        const srcInfo = await this.getObjectInfo(srcBucket, key);
        const destInfo = await this.getObjectInfo(destBucket, key);
        
        if (srcInfo.success && destInfo.success && srcInfo.info.etag === destInfo.info.etag) {
          this.stats.skippedFiles++;
          return { success: true, skipped: true, reason: 'unchanged' };
        }
      }

      if (dryRun) {
        this.log(`[DRY RUN] Would sync: ${key}`, 'info');
        console.log(chalk.yellow(`[DRY RUN] Would sync: ${key}`));
        this.stats.syncedFiles++;
        return { success: true, dryRun: true };
      }

      let result;
      
      // 객체 복사 (같은 S3 서비스인 경우)
      if (this.isSameService()) {
        result = await this.copyObject(srcBucket, key, destBucket, key);
      } else {
        // 다른 S3 서비스인 경우 다운로드 후 업로드
        result = await this.downloadAndUpload(srcBucket, key, destBucket, key);
      }

      if (result.success) {
        // 체크섬 검증
        if (verifyChecksum) {
          const checksumValid = await this.verifyChecksum(srcBucket, key, destBucket, key);
          if (!checksumValid) {
            this.stats.checksumMismatches++;
            this.log(`Checksum mismatch for ${key}`, 'error');
            return { success: false, error: 'Checksum verification failed' };
          }
        }

        this.stats.syncedFiles++;
        this.stats.syncedSize += object.Size || 0;
        this.log(`Synced: ${key}`, 'info');
        return result;
      }

      this.stats.failedFiles++;
      return { success: false, error: 'Sync failed' };
    } catch (error) {
      this.stats.failedFiles++;
      this.log(`Failed to sync ${key}: ${error.message}`, 'error');
      console.error(chalk.red(`❌ Failed to sync ${key}: ${error.message}`));
      return { success: false, error: error.message };
    }
  }

  /**
   * 모든 객체 목록 조회 (페이지네이션 처리)
   */
  async listAllObjects(bucket, prefix = '') {
    const objects = [];
    let continuationToken;

    do {
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
        MaxKeys: 1000
      });

      const response = await this.srcClient.send(command);
      objects.push(...(response.Contents || []));
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return objects;
  }

  /**
   * 객체 존재 여부 확인
   */
  async objectExists(bucket, key) {
    try {
      await this.destClient.send(new HeadObjectCommand({
        Bucket: bucket,
        Key: key
      }));
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * 객체 정보 조회
   */
  async getObjectInfo(bucket, key, client = null) {
    try {
      const s3Client = client || this.srcClient;
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key
      });
      
      const response = await s3Client.send(command);
      return {
        success: true,
        info: {
          size: response.ContentLength,
          lastModified: response.LastModified,
          etag: response.ETag,
          contentType: response.ContentType,
          metadata: response.Metadata
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 객체 복사 (같은 S3 서비스)
   */
  async copyObject(srcBucket, srcKey, destBucket, destKey) {
    try {
      const command = new CopyObjectCommand({
        CopySource: `${srcBucket}/${srcKey}`,
        Bucket: destBucket,
        Key: destKey
      });
      
      await this.destClient.send(command);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 다운로드 후 업로드 (다른 S3 서비스)
   */
  async downloadAndUpload(srcBucket, srcKey, destBucket, destKey) {
    try {
      // 소스에서 다운로드
      const getCommand = new GetObjectCommand({
        Bucket: srcBucket,
        Key: srcKey
      });
      
      const response = await this.srcClient.send(getCommand);
      const chunks = [];
      
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      
      const body = Buffer.concat(chunks);
      
      // 대상에 업로드
      const putCommand = new PutObjectCommand({
        Bucket: destBucket,
        Key: destKey,
        Body: body,
        ContentType: response.ContentType,
        Metadata: response.Metadata
      });
      
      await this.destClient.send(putCommand);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 객체 필터링
   */
  filterObjects(objects, { exclude = [], include = [] }) {
    return objects.filter(obj => {
      const key = obj.Key;
      
      // 제외 패턴 확인
      if (exclude.some(pattern => this.matchesPattern(key, pattern))) {
        return false;
      }
      
      // 포함 패턴 확인 (포함 패턴이 있는 경우)
      if (include.length > 0 && !include.some(pattern => this.matchesPattern(key, pattern))) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * 패턴 매칭 (간단한 glob 패턴)
   */
  matchesPattern(str, pattern) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
    return regex.test(str);
  }

  /**
   * 같은 S3 서비스인지 확인
   */
  isSameService() {
    const srcEndpoint = this.srcClient.config.endpoint?.toString() || '';
    const destEndpoint = this.destClient.config.endpoint?.toString() || '';
    return srcEndpoint === destEndpoint;
  }

  /**
   * 체크섬 검증
   */
  async verifyChecksum(srcBucket, srcKey, destBucket, destKey) {
    try {
      // 소스 객체의 체크섬 계산
      const srcCommand = new GetObjectCommand({
        Bucket: srcBucket,
        Key: srcKey
      });
      
      const srcResponse = await this.srcClient.send(srcCommand);
      const srcChunks = [];
      for await (const chunk of srcResponse.Body) {
        srcChunks.push(chunk);
      }
      const srcData = Buffer.concat(srcChunks);
      const srcChecksum = createHash('md5').update(srcData).digest('hex');
      
      // 대상 객체의 체크섬 계산
      const destCommand = new GetObjectCommand({
        Bucket: destBucket,
        Key: destKey
      });
      
      const destResponse = await this.destClient.send(destCommand);
      const destChunks = [];
      for await (const chunk of destResponse.Body) {
        destChunks.push(chunk);
      }
      const destData = Buffer.concat(destChunks);
      const destChecksum = createHash('md5').update(destData).digest('hex');
      
      return srcChecksum === destChecksum;
    } catch (error) {
      this.log(`Checksum verification failed for ${srcKey}: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * 로깅 시스템
   */
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    
    // 콘솔 출력
    if (level === 'error') {
      console.error(chalk.red(logEntry.trim()));
    } else if (level === 'warn') {
      console.warn(chalk.yellow(logEntry.trim()));
    } else {
      console.log(chalk.gray(logEntry.trim()));
    }
    
    // 로그 파일에 기록
    try {
      writeFileSync(this.logFile, logEntry, { flag: 'a' });
    } catch (error) {
      // 로그 파일 쓰기 실패는 무시
    }
  }

  /**
   * 상태 저장
   */
  saveState(state) {
    try {
      writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
    } catch (error) {
      this.log(`Failed to save state: ${error.message}`, 'error');
    }
  }

  /**
   * 상태 로드
   */
  loadState() {
    try {
      if (existsSync(this.stateFile)) {
        const data = readFileSync(this.stateFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      this.log(`Failed to load state: ${error.message}`, 'error');
    }
    return null;
  }

  /**
   * 상태 삭제
   */
  deleteState() {
    try {
      if (existsSync(this.stateFile)) {
        const fs = await import('fs');
        fs.unlinkSync(this.stateFile);
      }
    } catch (error) {
      this.log(`Failed to delete state: ${error.message}`, 'error');
    }
  }

  /**
   * 대기 함수
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 시간 포맷팅
   */
  formatTime(seconds) {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }

  /**
   * 통계 출력
   */
  printStats() {
    const duration = this.stats.endTime ? 
      (this.stats.endTime - this.stats.startTime) / 1000 : 0;
    const rate = this.stats.syncedFiles > 0 ? 
      this.stats.syncedFiles / duration : 0;
    const throughput = this.stats.syncedSize > 0 ? 
      this.stats.syncedSize / duration : 0;

    console.log(chalk.blue('\n📊 Sync Statistics:'));
    console.log(chalk.green(`   ✅ Synced: ${this.stats.syncedFiles} files (${this.formatBytes(this.stats.syncedSize)})`));
    console.log(chalk.yellow(`   ⏭️  Skipped: ${this.stats.skippedFiles} files`));
    console.log(chalk.red(`   ❌ Failed: ${this.stats.failedFiles} files`));
    console.log(chalk.blue(`   📁 Total: ${this.stats.totalFiles} files (${this.formatBytes(this.stats.totalSize)})`));
    
    if (this.stats.retryCount > 0) {
      console.log(chalk.orange(`   🔄 Retries: ${this.stats.retryCount} files`));
    }
    
    if (this.stats.checksumMismatches > 0) {
      console.log(chalk.red(`   🔍 Checksum mismatches: ${this.stats.checksumMismatches} files`));
    }
    
    if (duration > 0) {
      console.log(chalk.cyan(`   ⏱️  Duration: ${this.formatTime(duration)}`));
      console.log(chalk.cyan(`   📈 Rate: ${rate.toFixed(2)} files/sec`));
      console.log(chalk.cyan(`   🚀 Throughput: ${this.formatBytes(throughput)}/sec`));
    }
  }

  /**
   * 바이트를 읽기 쉬운 형태로 변환
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 연결 테스트
   */
  async testConnections(srcBucket, destBucket) {
    console.log(chalk.blue('🔍 Testing connections...'));
    
    try {
      // 소스 버킷 테스트
      const srcTest = await this.srcClient.send(new ListObjectsV2Command({
        Bucket: srcBucket,
        MaxKeys: 1
      }));
      console.log(chalk.green(`✅ Source bucket '${srcBucket}' accessible`));
    } catch (error) {
      console.log(chalk.red(`❌ Source bucket '${srcBucket}' error: ${error.message}`));
      return false;
    }

    try {
      // 대상 버킷 테스트
      const destTest = await this.destClient.send(new ListObjectsV2Command({
        Bucket: destBucket,
        MaxKeys: 1
      }));
      console.log(chalk.green(`✅ Destination bucket '${destBucket}' accessible`));
    } catch (error) {
      console.log(chalk.red(`❌ Destination bucket '${destBucket}' error: ${error.message}`));
      return false;
    }

    return true;
  }
}
