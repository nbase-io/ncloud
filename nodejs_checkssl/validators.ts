import * as path from 'path';

// 도메인명 검증
export function validateDomain(domain: string): boolean {
  // 기본적인 도메인 정규식
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?)*$/;
  
  if (!domain || typeof domain !== 'string') {
    return false;
  }
  
  // 길이 검증
  if (domain.length > 255) {
    return false;
  }
  
  // Private IP 범위 차단 (SSRF 방지)
  const privateIPs = [
    /^127\./,           // 127.0.0.0/8
    /^10\./,            // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[01])\./,  // 172.16.0.0/12
    /^192\.168\./,      // 192.168.0.0/16
    /^169\.254\./,      // 169.254.0.0/16 (Link-local)
    /^::1$/,            // IPv6 localhost
    /^fc00:/,           // IPv6 private
    /^fe80:/            // IPv6 link-local
  ];
  
  for (const privateIP of privateIPs) {
    if (privateIP.test(domain)) {
      return false;
    }
  }
  
  // localhost 차단
  if (domain.toLowerCase() === 'localhost') {
    return false;
  }
  
  return domainRegex.test(domain);
}

// 전화번호 검증 강화
export function validatePhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  // 숫자만 추출
  const cleanedPhone = phone.replace(/[^0-9]/g, '');
  
  // 한국 휴대폰 번호 형식 (010, 011, 016, 017, 018, 019)
  const phoneRegex = /^01[0-9]\d{7,8}$/;
  
  return phoneRegex.test(cleanedPhone);
}

// 포트번호 검증
export function validatePort(port: number): boolean {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

// 파일 경로 검증 (Path Traversal 방지)
export function validateFilePath(filePath: string): boolean {
  if (!filePath || typeof filePath !== 'string') {
    return false;
  }
  
  // Path traversal 패턴 차단
  const dangerousPatterns = [
    /\.\./,           // ../ 패턴
    /\/\//,           // 이중 슬래시
    /\0/,             // NULL 바이트
    /[<>:"|?*]/       // 윈도우 금지 문자
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(filePath)) {
      return false;
    }
  }
  
  // 절대 경로 차단 (상대 경로만 허용)
  if (path.isAbsolute(filePath)) {
    return false;
  }
  
  // 현재 디렉토리 밖으로 나가는 것 차단
  const resolved = path.resolve(filePath);
  const currentDir = process.cwd();
  
  return resolved.startsWith(currentDir);
}

// 로그 레벨 검증
export function validateLogLevel(level: string): boolean {
  const validLevels = ['debug', 'info', 'warn', 'error'];
  return validLevels.includes(level.toLowerCase());
}

// 일반적인 문자열 검증 (XSS 방지)
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // 위험한 문자들 제거
  return input
    .replace(/[<>'"&]/g, '') // HTML 특수문자 제거
    .replace(/[\x00-\x1f\x7f]/g, '') // 제어 문자 제거
    .trim();
}

// 환경변수 값 검증
export function validateEnvValue(key: string, value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }
  
  // 각 환경변수별 특별 검증
  switch (key) {
    case 'NCP_SMS_URI':
      return /^ncp:sms:[a-z]{2}:[0-9]+:[a-zA-Z0-9_-]+$/.test(value);
    
    case 'NCP_SECRET_KEY':
    case 'NCP_ACCESS_KEY':
      return /^[A-Z0-9]{20,}$/.test(value);
    
    case 'NCP_FROM_NUMBER':
      return validatePhoneNumber(value);
    
    case 'ALERT_DAYS_BEFORE':
      const days = parseInt(value);
      return Number.isInteger(days) && days >= 1 && days <= 365;
    
    case 'USE_EMOJI':
      return ['true', 'false'].includes(value.toLowerCase());
    
    case 'LOG_LEVEL':
      return validateLogLevel(value);
    
    default:
      return true; // 알 수 없는 키는 기본적으로 허용
  }
} 