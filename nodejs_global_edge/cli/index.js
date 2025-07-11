#!/usr/bin/env node

import { Command } from 'commander';
import { GlobalEdgePurge } from '../lib/GlobalEdgePurge.js';
import { config } from 'dotenv';

// .env 파일 로드
config();

const program = new Command();

program
  .name('ncp-purge')
  .description('NAVER Cloud Platform Global Edge CDN Purge CLI')
  .version('1.0.0');

// 모든 콘텐츠 퍼지
program
  .command('all')
  .description('모든 콘텐츠 퍼지 (약 40분 소요)')
  .requiredOption('-e, --edge-id <edgeId>', 'Edge ID (숫자)')
  .action(async (options) => {
    try {
      console.log(`🚀 모든 콘텐츠 퍼지 요청 - Edge ID: ${options.edgeId}`);
      
      const purgeClient = new GlobalEdgePurge();
      const result = await purgeClient.purgeAll(options.edgeId);
      
      if (result.success) {
        console.log(`✅ ${result.message}`);
        console.log(`📋 퍼지 요청 번호: ${result.purgeIds.join(', ')}`);
        console.log(`⏱️  예상 소요 시간: ${result.estimatedTime}`);
      } else {
        console.error(`❌ 오류: ${result.error}`);
        if (result.errorCode) {
          console.error(`📋 오류 코드: ${result.errorCode}`);
        }
      }
    } catch (error) {
      console.error(`❌ 초기화 오류: ${error.message}`);
    }
  });

// 디렉토리 단위 퍼지
program
  .command('directory')
  .description('디렉토리 단위 퍼지 (약 40분 소요)')
  .requiredOption('-e, --edge-id <edgeId>', 'Edge ID (숫자)')
  .requiredOption('-t, --target <directories...>', '퍼지할 디렉토리 목록 (예: /src/*, /images/*)')
  .action(async (options) => {
    try {
      console.log(`🗂️  디렉토리 퍼지 요청 - Edge ID: ${options.edgeId}`);
      console.log(`📁 대상 디렉토리: ${options.target.join(', ')}`);
      
      const purgeClient = new GlobalEdgePurge();
      const result = await purgeClient.purgeDirectory(options.edgeId, options.target);
      
      if (result.success) {
        console.log(`✅ ${result.message}`);
        console.log(`📋 퍼지 요청 번호: ${result.purgeIds.join(', ')}`);
        console.log(`📁 처리된 디렉토리: ${result.directories.join(', ')}`);
        console.log(`⏱️  예상 소요 시간: ${result.estimatedTime}`);
      } else {
        console.error(`❌ 오류: ${result.error}`);
        if (result.errorCode) {
          console.error(`📋 오류 코드: ${result.errorCode}`);
        }
      }
    } catch (error) {
      console.error(`❌ 초기화 오류: ${error.message}`);
    }
  });

// 확장자 단위 퍼지
program
  .command('pattern')
  .description('확장자 단위 퍼지 (약 40분 소요)')
  .requiredOption('-e, --edge-id <edgeId>', 'Edge ID (숫자)')
  .requiredOption('-t, --target <patterns...>', '퍼지할 패턴 목록 (예: /*.jpg, /static/*.png)')
  .action(async (options) => {
    try {
      console.log(`🎨 패턴 퍼지 요청 - Edge ID: ${options.edgeId}`);
      console.log(`🔍 대상 패턴: ${options.target.join(', ')}`);
      
      const purgeClient = new GlobalEdgePurge();
      const result = await purgeClient.purgePattern(options.edgeId, options.target);
      
      if (result.success) {
        console.log(`✅ ${result.message}`);
        console.log(`📋 퍼지 요청 번호: ${result.purgeIds.join(', ')}`);
        console.log(`🔍 처리된 패턴: ${result.patterns.join(', ')}`);
        console.log(`⏱️  예상 소요 시간: ${result.estimatedTime}`);
      } else {
        console.error(`❌ 오류: ${result.error}`);
        if (result.errorCode) {
          console.error(`📋 오류 코드: ${result.errorCode}`);
        }
      }
    } catch (error) {
      console.error(`❌ 초기화 오류: ${error.message}`);
    }
  });

// URL 단위 퍼지
program
  .command('url')
  .description('URL 단위 퍼지 (빠른 퍼지 지원)')
  .requiredOption('-e, --edge-id <edgeId>', 'Edge ID (숫자)')
  .requiredOption('-t, --target <urls...>', '퍼지할 URL 목록 (예: /index.html, /css/main.css)')
  .action(async (options) => {
    try {
      console.log(`🌐 URL 퍼지 요청 - Edge ID: ${options.edgeId}`);
      console.log(`🔗 대상 URL: ${options.target.join(', ')}`);
      
      const purgeClient = new GlobalEdgePurge();
      const result = await purgeClient.purgeUrl(options.edgeId, options.target);
      
      if (result.success) {
        console.log(`✅ ${result.message}`);
        console.log(`📋 퍼지 요청 번호: ${result.purgeIds.join(', ')}`);
        console.log(`🔗 처리된 URL: ${result.urls.join(', ')}`);
        console.log(`⏱️  예상 소요 시간: ${result.estimatedTime}`);
      } else {
        console.error(`❌ 오류: ${result.error}`);
        if (result.errorCode) {
          console.error(`📋 오류 코드: ${result.errorCode}`);
        }
      }
    } catch (error) {
      console.error(`❌ 초기화 오류: ${error.message}`);
    }
  });

// 사용 예시 출력
program
  .command('examples')
  .description('퍼지 유형별 사용 예시 출력')
  .action(() => {
    const examples = GlobalEdgePurge.getExamples();
    
    console.log('🎯 NCP Global Edge CDN Purge 사용 예시\n');
    
    Object.entries(examples).forEach(([type, info]) => {
      console.log(`📌 ${type} - ${info.description}`);
      console.log(`⏱️  예상 소요 시간: ${info.estimatedTime}`);
      
      if (info.rules) {
        console.log(`📋 규칙:`);
        info.rules.forEach(rule => console.log(`   - ${rule}`));
      }
      
      if (info.example) {
        console.log(`💡 예시: ${info.example}`);
      } else if (info.examples) {
        console.log(`💡 예시:`);
        info.examples.forEach(example => console.log(`   ${example}`));
      }
      
      console.log('');
    });
    
    console.log('🔧 환경 변수 설정:');
    console.log('   NCP_ACCESS_KEY=your_access_key');
    console.log('   NCP_SECRET_KEY=your_secret_key');
    console.log('');
    console.log('📖 자세한 사용법: ncp-purge --help');
  });

program.parse(); 