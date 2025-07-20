import * as tls from 'tls';
import * as CryptoJS from 'crypto-js';
import axios from 'axios';
import { config } from './config';
import { 
  loadDomains, 
  loadPhoneNumbers, 
  maskSensitiveInfo, 
  readJsonFile, 
  writeJsonFile, 
  formatDate, 
  validateFiles 
} from './utils';

interface SSLInfo {
  domain: string;
  port: number;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  daysUntilExpiry: number;
}

interface NotificationRecord {
  domain: string;
  lastSentDate: string;
  lastExpiryDate: string;
  sentCount: number;
}

const LAST_SENT_FILE = 'last_sent.json';
const RESEND_COOLDOWN_HOURS = 24; // 24시간 내 중복 발송 방지

// SSL 인증서 정보 가져오기
function getSSLInfo(domain: string, port: number = 443): Promise<SSLInfo> {
  return new Promise((resolve, reject) => {
    const timeoutMs = 10000; // 10초 타임아웃
    
    const socket = tls.connect(port, domain, { 
      rejectUnauthorized: false,
      timeout: timeoutMs
    }, () => {
      try {
        const cert = socket.getPeerCertificate();
        
        if (!cert || !cert.valid_to) {
          socket.end();
          reject(new Error('유효한 인증서를 찾을 수 없습니다'));
          return;
        }

        const validTo = new Date(cert.valid_to);
        const validFrom = new Date(cert.valid_from);
        const now = new Date();
        const daysUntilExpiry = Math.ceil((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        const sslInfo: SSLInfo = {
          domain,
          port,
          issuer: cert.issuer?.CN || cert.issuer?.O || 'Unknown',
          validFrom,
          validTo,
          daysUntilExpiry
        };

        socket.end();
        resolve(sslInfo);
      } catch (error) {
        socket.end();
        reject(error);
      }
    });

    socket.on('error', (error) => {
      reject(new Error(`연결 실패: ${error.message}`));
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('연결 시간 초과'));
    });

    socket.setTimeout(timeoutMs);
  });
}

// 문자 메시지 발송 (보안 강화)
async function sendSMS(phone: string, content: string): Promise<boolean> {
  try {
    const date = Date.now().toString();
    const method = "POST";
    const space = " ";
    const newLine = "\n";
    const url = `https://sens.apigw.ntruss.com/sms/v2/services/${config.sms.uri}/messages`;
    const url2 = `/sms/v2/services/${config.sms.uri}/messages`;
    
    const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, config.sms.secretKey);
    hmac.update(method);
    hmac.update(space);
    hmac.update(url2);
    hmac.update(newLine);
    hmac.update(date);
    hmac.update(newLine);
    hmac.update(config.sms.accessKey);
    const hash = hmac.finalize();
    const signature = hash.toString(CryptoJS.enc.Base64);

    const maskedPhone = maskSensitiveInfo(phone);
    console.log(`📱 SMS 발송 시도: ${maskedPhone}`);

    const response = await axios({
      method: 'POST',
      url: url,
      timeout: 15000, // 15초 타임아웃
      headers: {
        "Content-type": "application/json; charset=utf-8",
        "x-ncp-iam-access-key": config.sms.accessKey,
        "x-ncp-apigw-timestamp": date,
        "x-ncp-apigw-signature-v2": signature,
      },
      data: {
        type: "SMS",
        countryCode: "82",
        from: config.sms.fromNumber,
        content,
        messages: [{ to: phone }],
      },
    });

    console.log(`✅ SMS 발송 성공: ${maskedPhone}`);
    return true;
  } catch (error: any) {
    const maskedPhone = maskSensitiveInfo(phone);
    console.error(`❌ SMS 발송 실패 (${maskedPhone}):`, error.response?.data || error.message);
    return false;
  }
}

// 세련된 SMS 메시지 생성
function createSSLExpiryMessage(sslInfo: SSLInfo): string {
  const { domain, port, daysUntilExpiry, validTo, issuer } = sslInfo;
  const useEmoji = config.alert.useEmoji;
  
  let urgencyLevel = '';
  let action = '';
  
  if (daysUntilExpiry <= 3) {
    urgencyLevel = useEmoji ? '🚨 매우 긴급' : '[매우 긴급]';
    action = '즉시 갱신하세요!';
  } else if (daysUntilExpiry <= 7) {
    urgencyLevel = useEmoji ? '🔥 긴급' : '[긴급]';
    action = '즉시 갱신이 필요합니다!';
  } else if (daysUntilExpiry <= 14) {
    urgencyLevel = useEmoji ? '⚠️ 주의' : '[주의]';
    action = '갱신 준비를 시작하세요.';
  } else {
    urgencyLevel = useEmoji ? '📋 알림' : '[알림]';
    action = '인증서 갱신을 준비해주세요.';
  }

  const portInfo = port !== 443 ? `:${port}` : '';
  
  // 이모지 사용 여부에 따른 메시지 포맷
  const domainLabel = useEmoji ? '🌐 도메인' : '도메인';
  const dateLabel = useEmoji ? '📅 만료일' : '만료일';
  const issuerLabel = useEmoji ? '🏢 발급기관' : '발급기관';
  
  const message = `${urgencyLevel} SSL 인증서 만료 알림

${domainLabel}: ${domain}${portInfo}
${dateLabel}: ${validTo.toLocaleDateString('ko-KR')} (${daysUntilExpiry}일 후)
${issuerLabel}: ${issuer}

${action}`;

  return message;
}

// 중복 발송 확인
function shouldSendNotification(domain: string, sslInfo: SSLInfo): boolean {
  const records = readJsonFile(LAST_SENT_FILE);
  const key = `${domain}:${sslInfo.port}`;
  const record: NotificationRecord = records[key];

  if (!record) {
    return true; // 첫 발송
  }

  const lastSentDate = new Date(record.lastSentDate);
  const hoursSinceLastSent = (Date.now() - lastSentDate.getTime()) / (1000 * 60 * 60);

  // 쿨다운 시간 체크
  if (hoursSinceLastSent < RESEND_COOLDOWN_HOURS) {
    console.log(`⏰ ${domain} 쿨다운 중 (마지막 발송: ${formatDate(lastSentDate)})`);
    return false;
  }

  // 만료일이 변경되었거나 더 긴급해진 경우 재발송
  const lastExpiryDate = new Date(record.lastExpiryDate);
  const isMoreUrgent = sslInfo.daysUntilExpiry < 7 && record.sentCount < 3; // 일주일 미만은 최대 3번까지
  
  if (sslInfo.validTo.getTime() !== lastExpiryDate.getTime() || isMoreUrgent) {
    return true;
  }

  return false;
}

// 발송 기록 저장
function recordSentNotification(domain: string, sslInfo: SSLInfo): void {
  const records = readJsonFile(LAST_SENT_FILE);
  const key = `${domain}:${sslInfo.port}`;
  const existing = records[key] || { sentCount: 0 };

  records[key] = {
    domain,
    lastSentDate: new Date().toISOString(),
    lastExpiryDate: sslInfo.validTo.toISOString(),
    sentCount: existing.sentCount + 1
  };

  writeJsonFile(LAST_SENT_FILE, records);
}

// 단일 도메인 SSL 체크 및 알림
async function checkDomainSSL(domain: string, port: number, phoneNumbers: string[]): Promise<void> {
  try {
    console.log(`\n📡 ${domain}:${port} 체크 중...`);
    
    const sslInfo = await getSSLInfo(domain, port);
    const daysLeft = sslInfo.daysUntilExpiry;
    
    // 상태 표시
    let status = '';
    if (daysLeft <= 3) status = '🚨 매우 위험';
    else if (daysLeft <= 7) status = '🔥 위험';
    else if (daysLeft <= 14) status = '⚠️ 주의';
    else if (daysLeft <= config.alert.daysBeforeExpiry) status = '📋 알림';
    else status = '✅ 정상';
    
    console.log(`${status} ${domain}:${port} - ${daysLeft}일 남음`);
    
    // 알림 발송 여부 결정
    if (daysLeft <= config.alert.daysBeforeExpiry) {
      if (!shouldSendNotification(domain, sslInfo)) {
        console.log(`🔇 ${domain} 중복 발송 방지로 건너뜀`);
        return;
      }

      console.log(`📱 ${domain} 만료 알림 발송 중... (${phoneNumbers.length}명)`);
      
      const message = createSSLExpiryMessage(sslInfo);
      let successCount = 0;
      
      // 배치 발송 (속도 제한)
      for (const phone of phoneNumbers) {
        const success = await sendSMS(phone, message);
        if (success) successCount++;
        
        // API 호출 제한을 위한 딜레이 (1초)
        if (phoneNumbers.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (successCount > 0) {
        recordSentNotification(domain, sslInfo);
        console.log(`✅ ${domain} 알림 완료 (${successCount}/${phoneNumbers.length}명)`);
      } else {
        console.log(`❌ ${domain} 알림 발송 실패`);
      }
    }
    
  } catch (error: any) {
    console.error(`❌ ${domain}:${port} SSL 체크 실패: ${error.message}`);
  }
}

// 메인 SSL 체크 함수
export async function checkAllSSLCertificates(): Promise<void> {
  try {
    console.log('🔍 SSL 인증서 일괄 체크를 시작합니다...\n');
    
    // 파일 유효성 검증
    validateFiles();
    
    // 도메인과 전화번호 로드
    const domains = loadDomains();
    const phoneNumbers = loadPhoneNumbers();
    
    console.log(`📋 체크 대상: ${domains.length}개 도메인`);
    console.log(`📱 알림 대상: ${phoneNumbers.length}개 번호`);
    
    if (domains.length === 0) {
      console.warn('⚠️ domain.txt에 체크할 도메인이 없습니다.');
      return;
    }
    
    if (phoneNumbers.length === 0) {
      console.warn('⚠️ notification.txt에 알림받을 번호가 없습니다.');
      return;
    }
    
    // 각 도메인 체크
    for (const { domain, port } of domains) {
      await checkDomainSSL(domain, port, phoneNumbers);
    }
    
    console.log('\n🎯 SSL 체크 완료!');
    
  } catch (error: any) {
    console.error('\n❌ SSL 체크 실패:', error.message);
    process.exit(1);
  }
}

// 단일 도메인 체크 (CLI용)
export async function checkSingleSSL(domain: string, phone?: string): Promise<void> {
  try {
    const phoneNumbers = phone ? [phone] : loadPhoneNumbers();
    const [domainName, portStr] = domain.split(':');
    const port = portStr ? parseInt(portStr) : 443;
    
    await checkDomainSSL(domainName, port, phoneNumbers);
  } catch (error: any) {
    console.error('❌ 단일 도메인 체크 실패:', error.message);
    process.exit(1);
  }
}

// 상태 확인 (중복 발송 기록 조회)
export function showStatus(): void {
  console.log('📊 SSL 체크 상태\n');
  
  const records = readJsonFile(LAST_SENT_FILE);
  
  if (Object.keys(records).length === 0) {
    console.log('📭 발송 기록이 없습니다.');
    return;
  }
  
  for (const [key, record] of Object.entries(records)) {
    const r = record as NotificationRecord;
    const lastSent = formatDate(new Date(r.lastSentDate));
    console.log(`🌐 ${key}`);
    console.log(`   📅 마지막 발송: ${lastSent}`);
    console.log(`   📊 발송 횟수: ${r.sentCount}회\n`);
  }
}

// 발송 기록 초기화
export function resetSentRecords(): void {
  writeJsonFile(LAST_SENT_FILE, {});
  console.log('🗑️ 발송 기록을 초기화했습니다.');
}

// CLI에서 직접 실행시
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'status':
      showStatus();
      break;
      
    case 'reset':
      resetSentRecords();
      break;
      
    case 'single':
      const domain = process.argv[3];
      const phone = process.argv[4];
      if (!domain) {
        console.error('❌ 사용법: npm start single <도메인> [전화번호]');
        process.exit(1);
      }
      checkSingleSSL(domain, phone).catch(console.error);
      break;
      
    default:
      checkAllSSLCertificates().catch(console.error);
      break;
  }
}
