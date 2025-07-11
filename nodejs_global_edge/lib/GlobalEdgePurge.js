import axios from 'axios';
import crypto from 'crypto';

export class GlobalEdgePurge {
  constructor(config = {}) {
    this.config = {
      accessKey: config.accessKey || process.env.NCP_ACCESS_KEY,
      secretKey: config.secretKey || process.env.NCP_SECRET_KEY,
      apiUrl: config.apiUrl || process.env.NCP_API_URL || 'https://edge.apigw.ntruss.com',
      region: config.region || process.env.NCP_REGION || 'KR'
    };

    if (!this.config.accessKey || !this.config.secretKey) {
      throw new Error('NCP Access Key와 Secret Key가 필요합니다.');
    }
  }

  /**
   * NCP API 인증 헤더 생성
   */
  _generateAuthHeaders(method, url, timestamp) {
    const space = ' ';
    const newLine = '\n';
    
    // 서명 생성을 위한 문자열 구성
    const hmac = crypto.createHmac('sha256', this.config.secretKey);
    const message = [
      method,
      space,
      url,
      newLine,
      timestamp,
      newLine,
      this.config.accessKey
    ].join('');
    
    hmac.update(message);
    const signature = hmac.digest('base64');
    
    return {
      'x-ncp-apigw-timestamp': timestamp,
      'x-ncp-iam-access-key': this.config.accessKey,
      'x-ncp-apigw-signature-v2': signature,
      'Content-Type': 'application/json'
    };
  }

  /**
   * 모든 콘텐츠 퍼지
   */
  async purgeAll(edgeId) {
    try {
      const timestamp = Date.now().toString();
      const url = '/api/v1/purge';
      const headers = this._generateAuthHeaders('POST', url, timestamp);
      
      const requestBody = {
        edgeId: parseInt(edgeId),
        purgeType: 'ALL'
      };

      const response = await axios.post(
        `${this.config.apiUrl}${url}`,
        requestBody,
        { headers }
      );

      return {
        success: true,
        message: '모든 콘텐츠 퍼지 요청이 성공적으로 전송되었습니다.',
        purgeIds: response.data.result,
        estimatedTime: '약 40분'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        errorCode: error.response?.data?.code
      };
    }
  }

  /**
   * 디렉토리 단위 퍼지
   */
  async purgeDirectory(edgeId, directories) {
    try {
      // 디렉토리 경로 유효성 검사
      const validDirectories = directories.filter(dir => {
        if (!dir.startsWith('/')) {
          console.warn(`경고: ${dir}는 '/'로 시작해야 합니다. 무시됩니다.`);
          return false;
        }
        if (!dir.endsWith('/*')) {
          console.warn(`경고: ${dir}는 '/*'로 끝나야 합니다. 무시됩니다.`);
          return false;
        }
        return true;
      });

      if (validDirectories.length === 0) {
        return {
          success: false,
          error: '유효한 디렉토리 경로가 없습니다. 디렉토리는 "/"로 시작하고 "/*"로 끝나야 합니다.'
        };
      }

      const timestamp = Date.now().toString();
      const url = '/api/v1/purge';
      const headers = this._generateAuthHeaders('POST', url, timestamp);
      
      const requestBody = {
        edgeId: parseInt(edgeId),
        purgeType: 'DIRECTORY',
        purgeTarget: validDirectories
      };

      const response = await axios.post(
        `${this.config.apiUrl}${url}`,
        requestBody,
        { headers }
      );

      return {
        success: true,
        message: `${validDirectories.length}개 디렉토리 퍼지 요청이 성공적으로 전송되었습니다.`,
        directories: validDirectories,
        purgeIds: response.data.result,
        estimatedTime: '약 40분'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        errorCode: error.response?.data?.code
      };
    }
  }

  /**
   * 확장자 단위 퍼지
   */
  async purgePattern(edgeId, patterns) {
    try {
      // 패턴 유효성 검사
      const validPatterns = patterns.filter(pattern => {
        if (!pattern.startsWith('/')) {
          console.warn(`경고: ${pattern}는 '/'로 시작해야 합니다. 무시됩니다.`);
          return false;
        }
        if (!pattern.includes('*.')) {
          console.warn(`경고: ${pattern}는 '*.확장자' 형식이어야 합니다. 무시됩니다.`);
          return false;
        }
        return true;
      });

      if (validPatterns.length === 0) {
        return {
          success: false,
          error: '유효한 패턴이 없습니다. 패턴은 "/"로 시작하고 "*.확장자" 형식이어야 합니다.'
        };
      }

      const timestamp = Date.now().toString();
      const url = '/api/v1/purge';
      const headers = this._generateAuthHeaders('POST', url, timestamp);
      
      const requestBody = {
        edgeId: parseInt(edgeId),
        purgeType: 'PATTERN',
        purgeTarget: validPatterns
      };

      const response = await axios.post(
        `${this.config.apiUrl}${url}`,
        requestBody,
        { headers }
      );

      return {
        success: true,
        message: `${validPatterns.length}개 패턴 퍼지 요청이 성공적으로 전송되었습니다.`,
        patterns: validPatterns,
        purgeIds: response.data.result,
        estimatedTime: '약 40분'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        errorCode: error.response?.data?.code
      };
    }
  }

  /**
   * URL 단위 퍼지
   */
  async purgeUrl(edgeId, urls) {
    try {
      // URL 유효성 검사
      const validUrls = urls.filter(url => {
        if (!url.startsWith('/')) {
          console.warn(`경고: ${url}는 '/'로 시작해야 합니다. 무시됩니다.`);
          return false;
        }
        if (url.includes('*')) {
          console.warn(`경고: ${url}에는 '*' 와일드카드를 사용할 수 없습니다. 무시됩니다.`);
          return false;
        }
        return true;
      });

      if (validUrls.length === 0) {
        return {
          success: false,
          error: '유효한 URL이 없습니다. URL은 "/"로 시작해야 하며 "*" 와일드카드를 사용할 수 없습니다.'
        };
      }

      const timestamp = Date.now().toString();
      const url = '/api/v1/purge';
      const headers = this._generateAuthHeaders('POST', url, timestamp);
      
      const requestBody = {
        edgeId: parseInt(edgeId),
        purgeType: 'URL',
        purgeTarget: validUrls
      };

      const response = await axios.post(
        `${this.config.apiUrl}${url}`,
        requestBody,
        { headers }
      );

      return {
        success: true,
        message: `${validUrls.length}개 URL 퍼지 요청이 성공적으로 전송되었습니다.`,
        urls: validUrls,
        purgeIds: response.data.result,
        estimatedTime: '빠른 퍼지 지원'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        errorCode: error.response?.data?.code
      };
    }
  }

  /**
   * 퍼지 유형별 예시 출력
   */
  static getExamples() {
    return {
      ALL: {
        description: '모든 콘텐츠 퍼지',
        example: 'ncp-purge all -e 123',
        estimatedTime: '약 40분'
      },
      DIRECTORY: {
        description: '디렉토리 단위 퍼지',
        examples: [
          'ncp-purge directory -e 123 -t "/*"',
          'ncp-purge directory -e 123 -t "/src/*" "/images/*"',
          'ncp-purge directory -e 123 -t "/static/css/*"'
        ],
        rules: [
          "'/' 문자로 시작",
          "'/*' 문자열로 마침"
        ],
        estimatedTime: '약 40분'
      },
      PATTERN: {
        description: '확장자 단위 콘텐츠 퍼지',
        examples: [
          'ncp-purge pattern -e 123 -t "/*.jpg"',
          'ncp-purge pattern -e 123 -t "/static/*.png" "/images/*.css"',
          'ncp-purge pattern -e 123 -t "/*.js" "/*.css"'
        ],
        rules: [
          "'/' 문자로 시작",
          "'*.확장자' 형식으로 마침"
        ],
        estimatedTime: '약 40분'
      },
      URL: {
        description: 'URL로 지정한 콘텐츠 퍼지',
        examples: [
          'ncp-purge url -e 123 -t "/index.html"',
          'ncp-purge url -e 123 -t "/css/main.css" "/js/app.js"',
          'ncp-purge url -e 123 -t "/api/data.json?version=1.0"'
        ],
        rules: [
          "'/' 문자로 시작",
          "'*' 와일드카드 사용 불가"
        ],
        estimatedTime: '빠른 퍼지 지원'
      }
    };
  }
} 