import * as fs from 'fs';
import * as path from 'path';

// 파일에서 라인별로 데이터 읽기 (주석과 빈 줄 제거)
export function readLinesFromFile(filePath: string): string[] {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`파일을 찾을 수 없습니다: ${filePath}`);
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
  } catch (error) {
    console.error(`❌ 파일 읽기 실패 (${filePath}):`, error);
    throw error;
  }
}

// 도메인 리스트 읽기
export function loadDomains(): Array<{domain: string, port: number}> {
  const lines = readLinesFromFile('domain.txt');
  return lines.map(line => {
    const [domain, portStr] = line.split(':');
    return {
      domain: domain.trim(),
      port: portStr ? parseInt(portStr.trim()) : 443
    };
  });
}

// 전화번호 리스트 읽기
export function loadPhoneNumbers(): string[] {
  const lines = readLinesFromFile('notification.txt');
  
  // 전화번호 유효성 검증
  return lines.filter(phone => {
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.length !== 11 || !cleaned.startsWith('010')) {
      console.warn(`⚠️ 잘못된 전화번호 형식: ${phone} (무시됨)`);
      return false;
    }
    return true;
  }).map(phone => phone.replace(/[^0-9]/g, ''));
}

// 민감한 정보 마스킹
export function maskSensitiveInfo(text: string): string {
  return text
    .replace(/([A-Z0-9]{10,})/g, (match) => {
      // API 키 같은 긴 문자열 마스킹
      return match.substring(0, 4) + '*'.repeat(match.length - 8) + match.substring(match.length - 4);
    })
    .replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3') // 전화번호 마스킹
    .replace(/(secret|key|token|password)[\s=:]["']?([^"'\s,}]+)/gi, '$1=****');
}

// JSON 파일 안전하게 읽기/쓰기
export function readJsonFile(filePath: string): any {
  try {
    if (!fs.existsSync(filePath)) {
      return {};
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`⚠️ JSON 파일 읽기 실패 (${filePath}), 빈 객체로 초기화`);
    return {};
  }
}

export function writeJsonFile(filePath: string, data: any): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`❌ JSON 파일 쓰기 실패 (${filePath}):`, error);
    throw error;
  }
}

// 날짜를 문자열로 포맷팅
export function formatDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 파일 존재 여부 및 접근 권한 확인
export function validateFiles(): void {
  const requiredFiles = ['domain.txt', 'notification.txt'];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`❌ 필수 파일이 없습니다: ${file}\n사용법은 README.md를 참고하세요.`);
    }
    
    try {
      fs.accessSync(file, fs.constants.R_OK);
    } catch (error) {
      throw new Error(`❌ 파일 읽기 권한이 없습니다: ${file}`);
    }
  }
} 