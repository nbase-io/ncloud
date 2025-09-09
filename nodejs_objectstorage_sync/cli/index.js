#!/usr/bin/env node

import { Command } from 'commander';
import { S3Sync } from '../lib/S3Sync.js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';

// .env 파일 로드
config();

const program = new Command();

program
  .name('s3-sync')
  .description('S3 to S3 file synchronization CLI tool')
  .version('1.0.0');

// 전체 동기화
program
  .command('sync')
  .description('Sync files from source S3 to destination S3')
  .requiredOption('-s, --source <bucket>', 'Source S3 bucket name')
  .requiredOption('-d, --dest <bucket>', 'Destination S3 bucket name')
  .option('-p, --prefix <prefix>', 'Object key prefix to sync', '')
  .option('--dry-run', 'Show what would be synced without actually syncing')
  .option('--force', 'Force sync even if files are identical')
  .option('--resume', 'Resume from previous interrupted sync')
  .option('--verify-checksum', 'Verify file integrity after sync')
  .option('--exclude <patterns...>', 'Exclude patterns (glob patterns)', [])
  .option('--include <patterns...>', 'Include patterns (glob patterns)', [])
  .option('--max-concurrency <number>', 'Maximum concurrent operations', '5')
  .option('--max-retries <number>', 'Maximum retry attempts for failed files', '3')
  .option('--log-level <level>', 'Log level (debug, info, warn, error)', 'info')
  .action(async (options) => {
    try {
      const s3Sync = new S3Sync();
      
      // 재시도 설정 업데이트
      if (options.maxRetries) {
        s3Sync.retryConfig.maxRetries = parseInt(options.maxRetries);
      }
      
      // 연결 테스트
      const connectionTest = await s3Sync.testConnections(options.source, options.dest);
      if (!connectionTest) {
        console.error(chalk.red('❌ Connection test failed. Please check your credentials and bucket names.'));
        process.exit(1);
      }

      // 동기화 실행
      const stats = await s3Sync.syncAll(options.source, options.dest, {
        prefix: options.prefix,
        dryRun: options.dryRun,
        force: options.force,
        resume: options.resume,
        verifyChecksum: options.verifyChecksum,
        exclude: options.exclude,
        include: options.include,
        maxConcurrency: parseInt(options.maxConcurrency),
        logLevel: options.logLevel
      });

      if (stats.failedFiles > 0) {
        console.log(chalk.red(`\n❌ Sync completed with ${stats.failedFiles} failures. Check logs for details.`));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`❌ Sync failed: ${error.message}`));
      process.exit(1);
    }
  });

// 대화형 동기화
program
  .command('interactive')
  .description('Interactive sync setup')
  .action(async () => {
    try {
      console.log(chalk.blue('🚀 S3 Sync Interactive Setup\n'));

      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'sourceBucket',
          message: 'Source S3 bucket name:',
          validate: (input) => input.length > 0 || 'Bucket name is required'
        },
        {
          type: 'input',
          name: 'destBucket',
          message: 'Destination S3 bucket name:',
          validate: (input) => input.length > 0 || 'Bucket name is required'
        },
        {
          type: 'input',
          name: 'prefix',
          message: 'Object key prefix (optional):',
          default: ''
        },
        {
          type: 'confirm',
          name: 'dryRun',
          message: 'Dry run (show what would be synced)?',
          default: true
        },
        {
          type: 'confirm',
          name: 'force',
          message: 'Force sync even if files are identical?',
          default: false
        },
        {
          type: 'input',
          name: 'exclude',
          message: 'Exclude patterns (comma-separated, optional):',
          default: ''
        },
        {
          type: 'input',
          name: 'maxConcurrency',
          message: 'Maximum concurrent operations:',
          default: '5',
          validate: (input) => {
            const num = parseInt(input);
            return (!isNaN(num) && num > 0) || 'Must be a positive number';
          }
        }
      ]);

      const s3Sync = new S3Sync();
      
      // 연결 테스트
      const spinner = ora('Testing connections...').start();
      const connectionTest = await s3Sync.testConnections(answers.sourceBucket, answers.destBucket);
      spinner.stop();

      if (!connectionTest) {
        console.error(chalk.red('❌ Connection test failed. Please check your credentials and bucket names.'));
        process.exit(1);
      }

      // 동기화 실행
      const stats = await s3Sync.syncAll(answers.sourceBucket, answers.destBucket, {
        prefix: answers.prefix,
        dryRun: answers.dryRun,
        force: answers.force,
        exclude: answers.exclude ? answers.exclude.split(',').map(s => s.trim()) : [],
        maxConcurrency: parseInt(answers.maxConcurrency)
      });

      if (stats.failedFiles > 0) {
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`❌ Interactive sync failed: ${error.message}`));
      process.exit(1);
    }
  });

// 연결 테스트
program
  .command('test')
  .description('Test S3 connections')
  .requiredOption('-s, --source <bucket>', 'Source S3 bucket name')
  .requiredOption('-d, --dest <bucket>', 'Destination S3 bucket name')
  .action(async (options) => {
    try {
      const s3Sync = new S3Sync();
      const result = await s3Sync.testConnections(options.source, options.dest);
      
      if (result) {
        console.log(chalk.green('✅ All connections successful!'));
        process.exit(0);
      } else {
        console.log(chalk.red('❌ Connection test failed!'));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`❌ Test failed: ${error.message}`));
      process.exit(1);
    }
  });

// 설정 확인
program
  .command('config')
  .description('Show current configuration')
  .action(() => {
    console.log(chalk.blue('🔧 Current Configuration:\n'));
    
    console.log(chalk.yellow('Source S3:'));
    console.log(`  Region: ${process.env.SRC_AWS_REGION || 'not set'}`);
    console.log(`  Endpoint: ${process.env.SRC_AWS_ENDPOINT || 'not set'}`);
    console.log(`  Access Key: ${process.env.SRC_AWS_ACCESS_KEY_ID ? process.env.SRC_AWS_ACCESS_KEY_ID.substring(0, 8) + '...' : 'not set'}`);
    
    console.log(chalk.yellow('\nDestination S3:'));
    console.log(`  Region: ${process.env.DEST_AWS_REGION || 'not set'}`);
    console.log(`  Endpoint: ${process.env.DEST_AWS_ENDPOINT || 'not set'}`);
    console.log(`  Access Key: ${process.env.DEST_AWS_ACCESS_KEY_ID ? process.env.DEST_AWS_ACCESS_KEY_ID.substring(0, 8) + '...' : 'not set'}`);
    
    console.log(chalk.blue('\n💡 Create a .env file with your credentials (see env.example)'));
  });

// 버킷 목록 조회
program
  .command('list-buckets')
  .description('List available buckets for source and destination')
  .action(async () => {
    try {
      const s3Sync = new S3Sync();
      
      console.log(chalk.blue('📋 Source S3 Buckets:'));
      try {
        const srcBuckets = await s3Sync.srcClient.send(new (await import('@aws-sdk/client-s3')).ListBucketsCommand({}));
        srcBuckets.Buckets?.forEach(bucket => {
          console.log(`  🪣 ${bucket.Name} (Created: ${bucket.CreationDate})`);
        });
      } catch (error) {
        console.log(chalk.red(`  ❌ Error: ${error.message}`));
      }
      
      console.log(chalk.blue('\n📋 Destination S3 Buckets:'));
      try {
        const destBuckets = await s3Sync.destClient.send(new (await import('@aws-sdk/client-s3')).ListBucketsCommand({}));
        destBuckets.Buckets?.forEach(bucket => {
          console.log(`  🪣 ${bucket.Name} (Created: ${bucket.CreationDate})`);
        });
      } catch (error) {
        console.log(chalk.red(`  ❌ Error: ${error.message}`));
      }
    } catch (error) {
      console.error(chalk.red(`❌ Failed to list buckets: ${error.message}`));
      process.exit(1);
    }
  });

// 단일 파일 동기화
program
  .command('sync-file')
  .description('Sync a single file')
  .requiredOption('-s, --source <bucket>', 'Source S3 bucket name')
  .requiredOption('-d, --dest <bucket>', 'Destination S3 bucket name')
  .requiredOption('-k, --key <key>', 'Object key to sync')
  .option('--dry-run', 'Show what would be synced without actually syncing')
  .option('--force', 'Force sync even if files are identical')
  .action(async (options) => {
    try {
      const s3Sync = new S3Sync();
      
      // 연결 테스트
      const connectionTest = await s3Sync.testConnections(options.source, options.dest);
      if (!connectionTest) {
        console.error(chalk.red('❌ Connection test failed. Please check your credentials and bucket names.'));
        process.exit(1);
      }

      // 객체 정보 조회
      const objectInfo = await s3Sync.getObjectInfo(options.source, options.key);
      if (!objectInfo.success) {
        console.error(chalk.red(`❌ Source object not found: ${options.key}`));
        process.exit(1);
      }

      const object = {
        Key: options.key,
        Size: objectInfo.info.size,
        LastModified: objectInfo.info.lastModified
      };

      // 동기화 실행
      const result = await s3Sync.syncObject(object, options.source, options.dest, {
        dryRun: options.dryRun,
        force: options.force
      });

      if (result.success) {
        if (result.skipped) {
          console.log(chalk.yellow(`⏭️  Skipped: ${options.key} (unchanged)`));
        } else if (result.dryRun) {
          console.log(chalk.blue(`[DRY RUN] Would sync: ${options.key}`));
        } else {
          console.log(chalk.green(`✅ Synced: ${options.key}`));
        }
      } else {
        console.error(chalk.red(`❌ Failed to sync: ${options.key} - ${result.error}`));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`❌ Sync failed: ${error.message}`));
      process.exit(1);
    }
  });

// 설정 파일 지원
program
  .command('init')
  .description('Initialize configuration file')
  .option('-f, --file <file>', 'Configuration file name', 's3sync.config.json')
  .action(async (options) => {
    try {
      const config = {
        source: {
          bucket: 'your-source-bucket',
          region: process.env.SRC_AWS_REGION || 'kr-standard',
          endpoint: process.env.SRC_AWS_ENDPOINT || 'https://kr.object.ncloudstorage.com',
          accessKeyId: process.env.SRC_AWS_ACCESS_KEY_ID || 'your-source-access-key',
          secretAccessKey: process.env.SRC_AWS_SECRET_ACCESS_KEY || 'your-source-secret-key'
        },
        destination: {
          bucket: 'your-dest-bucket',
          region: process.env.DEST_AWS_REGION || 'us-east-1',
          endpoint: process.env.DEST_AWS_ENDPOINT || 'https://s3.amazonaws.com',
          accessKeyId: process.env.DEST_AWS_ACCESS_KEY_ID || 'your-dest-access-key',
          secretAccessKey: process.env.DEST_AWS_SECRET_ACCESS_KEY || 'your-dest-secret-key'
        },
        sync: {
          prefix: '',
          exclude: ['*.tmp', '*.log'],
          include: [],
          maxConcurrency: 5,
          maxRetries: 3,
          verifyChecksum: false,
          force: false
        },
        logging: {
          level: 'info',
          file: '.s3sync.log'
        }
      };

      const fs = await import('fs');
      fs.writeFileSync(options.file, JSON.stringify(config, null, 2));
      
      console.log(chalk.green(`✅ Configuration file created: ${options.file}`));
      console.log(chalk.blue('📝 Edit the configuration file with your settings and use:'));
      console.log(chalk.gray(`   npx s3-sync sync --config ${options.file}`));
    } catch (error) {
      console.error(chalk.red(`❌ Failed to create config file: ${error.message}`));
      process.exit(1);
    }
  });

// 설정 파일로 동기화
program
  .command('sync-config')
  .description('Sync using configuration file')
  .requiredOption('-c, --config <file>', 'Configuration file path')
  .option('--dry-run', 'Show what would be synced without actually syncing')
  .action(async (options) => {
    try {
      const fs = await import('fs');
      const config = JSON.parse(fs.readFileSync(options.config, 'utf8'));
      
      const s3Sync = new S3Sync(config.source, config.destination);
      
      // 재시도 설정 업데이트
      if (config.sync.maxRetries) {
        s3Sync.retryConfig.maxRetries = config.sync.maxRetries;
      }
      
      // 연결 테스트
      const connectionTest = await s3Sync.testConnections(config.source.bucket, config.destination.bucket);
      if (!connectionTest) {
        console.error(chalk.red('❌ Connection test failed. Please check your configuration.'));
        process.exit(1);
      }

      // 동기화 실행
      const stats = await s3Sync.syncAll(config.source.bucket, config.destination.bucket, {
        ...config.sync,
        dryRun: options.dryRun || config.sync.dryRun
      });

      if (stats.failedFiles > 0) {
        console.log(chalk.red(`\n❌ Sync completed with ${stats.failedFiles} failures. Check logs for details.`));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`❌ Config sync failed: ${error.message}`));
      process.exit(1);
    }
  });

// 검증 모드
program
  .command('verify')
  .description('Verify file integrity between source and destination')
  .requiredOption('-s, --source <bucket>', 'Source S3 bucket name')
  .requiredOption('-d, --dest <bucket>', 'Destination S3 bucket name')
  .option('-p, --prefix <prefix>', 'Object key prefix to verify', '')
  .option('--max-concurrency <number>', 'Maximum concurrent operations', '5')
  .action(async (options) => {
    try {
      const s3Sync = new S3Sync();
      
      console.log(chalk.blue(`🔍 Verifying file integrity: ${options.source} → ${options.dest}`));
      
      // 연결 테스트
      const connectionTest = await s3Sync.testConnections(options.source, options.dest);
      if (!connectionTest) {
        console.error(chalk.red('❌ Connection test failed. Please check your credentials and bucket names.'));
        process.exit(1);
      }

      // 객체 목록 조회
      const objects = await s3Sync.listAllObjects(options.source, options.prefix);
      console.log(chalk.green(`📊 Found ${objects.length} files to verify`));

      if (objects.length === 0) {
        console.log(chalk.yellow('⚠️  No files to verify'));
        return;
      }

      // 검증 실행
      const spinner = ora('Verifying files...').start();
      let verified = 0;
      let mismatched = 0;
      let errors = 0;

      for (let i = 0; i < objects.length; i += parseInt(options.maxConcurrency)) {
        const batch = objects.slice(i, i + parseInt(options.maxConcurrency));
        const batchPromises = batch.map(async (obj) => {
          try {
            const isValid = await s3Sync.verifyChecksum(
              options.source, 
              obj.Key, 
              options.dest, 
              obj.Key
            );
            
            if (isValid) {
              verified++;
            } else {
              mismatched++;
              console.log(chalk.red(`❌ Checksum mismatch: ${obj.Key}`));
            }
          } catch (error) {
            errors++;
            console.log(chalk.red(`❌ Verification error for ${obj.Key}: ${error.message}`));
          }
        });
        
        await Promise.all(batchPromises);
        spinner.text = `Verified ${verified + mismatched + errors}/${objects.length} files`;
      }

      spinner.succeed('Verification completed!');
      
      console.log(chalk.blue('\n📊 Verification Results:'));
      console.log(chalk.green(`   ✅ Valid: ${verified} files`));
      console.log(chalk.red(`   ❌ Mismatched: ${mismatched} files`));
      console.log(chalk.red(`   ⚠️  Errors: ${errors} files`));
      
      if (mismatched > 0 || errors > 0) {
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`❌ Verification failed: ${error.message}`));
      process.exit(1);
    }
  });

// 로그 보기
program
  .command('logs')
  .description('View sync logs')
  .option('-f, --follow', 'Follow log output in real-time')
  .option('-n, --lines <number>', 'Number of lines to show', '50')
  .action(async (options) => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const logFile = '.s3sync.log';
      if (!fs.existsSync(logFile)) {
        console.log(chalk.yellow('⚠️  No log file found'));
        return;
      }

      const logContent = fs.readFileSync(logFile, 'utf8');
      const lines = logContent.split('\n').filter(line => line.trim());
      const lastLines = lines.slice(-parseInt(options.lines));
      
      console.log(chalk.blue('📋 Recent sync logs:'));
      lastLines.forEach(line => {
        if (line.includes('[ERROR]')) {
          console.log(chalk.red(line));
        } else if (line.includes('[WARN]')) {
          console.log(chalk.yellow(line));
        } else {
          console.log(chalk.gray(line));
        }
      });

      if (options.follow) {
        console.log(chalk.blue('\n🔄 Following logs... (Press Ctrl+C to stop)'));
        const watcher = fs.watchFile(logFile, { interval: 1000 }, () => {
          const newContent = fs.readFileSync(logFile, 'utf8');
          const newLines = newContent.split('\n').filter(line => line.trim());
          const latestLine = newLines[newLines.length - 1];
          if (latestLine) {
            if (latestLine.includes('[ERROR]')) {
              console.log(chalk.red(latestLine));
            } else if (latestLine.includes('[WARN]')) {
              console.log(chalk.yellow(latestLine));
            } else {
              console.log(chalk.gray(latestLine));
            }
          }
        });
        
        process.on('SIGINT', () => {
          fs.unwatchFile(logFile);
          process.exit(0);
        });
      }
    } catch (error) {
      console.error(chalk.red(`❌ Failed to read logs: ${error.message}`));
      process.exit(1);
    }
  });

// 상태 관리
program
  .command('status')
  .description('Show sync status and statistics')
  .action(async () => {
    try {
      const fs = await import('fs');
      
      if (fs.existsSync('.s3sync-state.json')) {
        const state = JSON.parse(fs.readFileSync('.s3sync-state.json', 'utf8'));
        
        console.log(chalk.blue('📊 Sync Status:'));
        console.log(chalk.gray(`   Source: ${state.srcBucket}`));
        console.log(chalk.gray(`   Destination: ${state.destBucket}`));
        console.log(chalk.green(`   Synced: ${state.stats.syncedFiles} files`));
        console.log(chalk.yellow(`   Skipped: ${state.stats.skippedFiles} files`));
        console.log(chalk.red(`   Failed: ${state.stats.failedFiles} files`));
        console.log(chalk.blue(`   Total: ${state.stats.totalFiles} files`));
        
        if (state.stats.startTime) {
          const startTime = new Date(state.stats.startTime);
          console.log(chalk.cyan(`   Started: ${startTime.toLocaleString()}`));
        }
        
        console.log(chalk.blue('\n💡 To resume: npx s3-sync sync --resume'));
      } else {
        console.log(chalk.yellow('⚠️  No active sync session found'));
      }
    } catch (error) {
      console.error(chalk.red(`❌ Failed to read status: ${error.message}`));
      process.exit(1);
    }
  });

// 정리 명령어
program
  .command('cleanup')
  .description('Clean up temporary files and state')
  .option('--all', 'Remove all temporary files including logs')
  .action(async (options) => {
    try {
      const fs = await import('fs');
      
      const filesToRemove = ['.s3sync-state.json'];
      if (options.all) {
        filesToRemove.push('.s3sync.log');
      }
      
      let removed = 0;
      filesToRemove.forEach(file => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
          console.log(chalk.green(`✅ Removed: ${file}`));
          removed++;
        }
      });
      
      if (removed === 0) {
        console.log(chalk.yellow('⚠️  No files to clean up'));
      } else {
        console.log(chalk.blue(`🧹 Cleaned up ${removed} files`));
      }
    } catch (error) {
      console.error(chalk.red(`❌ Cleanup failed: ${error.message}`));
      process.exit(1);
    }
  });

program.parse();
