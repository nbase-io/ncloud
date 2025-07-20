import { config as dotenvConfig } from 'dotenv';
import { validateEnvValue } from './validators';

// .env 파일 로드
dotenvConfig();

// 필수 환경 변수 검증
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`❌ 필수 환경변수 ${key}가 설정되지 않았습니다. .env 파일을 확인해주세요.`);
  }
  
  // 환경변수 값 유효성 검증
  if (!validateEnvValue(key, value)) {
    throw new Error(`❌ 환경변수 ${key}의 값이 유효하지 않습니다: ${value.substring(0, 10)}...`);
  }
  
  return value;
}

// 환경 변수에서 설정을 읽기 (보안 정보는 필수)
export const config = {
  // NCP SENS SMS 설정 (모두 필수)
  sms: {
    uri: getRequiredEnv('NCP_SMS_URI'),
    secretKey: getRequiredEnv('NCP_SECRET_KEY'),
    accessKey: getRequiredEnv('NCP_ACCESS_KEY'),
    fromNumber: getRequiredEnv('NCP_FROM_NUMBER')
  },
  
  // 알림 설정 (기본값 제공)
  alert: {
    daysBeforeExpiry: parseInt(process.env.ALERT_DAYS_BEFORE || "20"),
    defaultPhone: process.env.DEFAULT_PHONE || "01012345678",
    useEmoji: process.env.USE_EMOJI === 'true' // 기본적으로 이모지 사용 안함
  },
  
  // 로그 설정 (기본값 제공)
  log: {
    level: process.env.LOG_LEVEL || "info"
  }
};

// 환경 변수 예시 (README에서 참조)
export const envExample = `
# .env 파일 생성 후 실제 값으로 설정하세요

# NCP SENS SMS 설정 (필수 - NCP 콘솔에서 발급)
NCP_SMS_URI=ncp:sms:kr:YOUR_PROJECT_ID:YOUR_SERVICE_ID
NCP_SECRET_KEY=YOUR_SECRET_KEY_HERE
NCP_ACCESS_KEY=YOUR_ACCESS_KEY_HERE  
NCP_FROM_NUMBER=YOUR_PHONE_NUMBER

# 기본 알림 설정 (선택사항)
DEFAULT_PHONE=01012345678
ALERT_DAYS_BEFORE=20
USE_EMOJI=false

# 로그 레벨 (선택사항)
LOG_LEVEL=info
`;

export default config; 