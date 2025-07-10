import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
  ListBucketsCommand
} from '@aws-sdk/client-s3';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

export class S3Manager {
  constructor(config = {}) {
    this.config = {
      region: config.region || process.env.AWS_REGION || 'kr-standard',
      endpoint: config.endpoint || process.env.AWS_ENDPOINT || 'https://kr.object.ncloudstorage.com',
      credentials: config.credentials || {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      },
      forcePathStyle: config.forcePathStyle !== undefined ? config.forcePathStyle : true,
      s3ForcePathStyle: true,
      signatureVersion: 'v4'
    };
    
    this.client = new S3Client(this.config);
  }

  /**
   * 전체 버킷 목록 조회
   */
  async listBuckets() {
    try {
      const command = new ListBucketsCommand({});
      const response = await this.client.send(command);
      
      return {
        success: true,
        buckets: response.Buckets || [],
        count: response.Buckets?.length || 0,
        owner: response.Owner
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 버킷의 객체 목록 조회
   */
  async listObjects(bucketName, prefix = '', maxKeys = 1000) {
    try {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys
      });
      
      const response = await this.client.send(command);
      return {
        success: true,
        objects: response.Contents || [],
        count: response.KeyCount || 0,
        isTruncated: response.IsTruncated
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 객체 다운로드
   */
  async downloadObject(bucketName, key, localPath) {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key
      });
      
      const response = await this.client.send(command);
      
      if (localPath) {
        const writeStream = createWriteStream(localPath);
        await pipeline(response.Body, writeStream);
        return {
          success: true,
          message: `Downloaded ${key} to ${localPath}`
        };
      } else {
        const chunks = [];
        for await (const chunk of response.Body) {
          chunks.push(chunk);
        }
        return {
          success: true,
          data: Buffer.concat(chunks)
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 객체 업로드
   */
  async uploadObject(bucketName, key, filePath, options = {}) {
    try {
      let body;
      
      if (typeof filePath === 'string') {
        body = createReadStream(filePath);
      } else {
        body = filePath; // Buffer 또는 stream
      }

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: body,
        ContentType: options.contentType,
        Metadata: options.metadata
      });
      
      const response = await this.client.send(command);
      return {
        success: true,
        etag: response.ETag,
        location: `s3://${bucketName}/${key}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 객체 삭제
   */
  async deleteObject(bucketName, key) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key
      });
      
      await this.client.send(command);
      return {
        success: true,
        message: `Deleted ${key} from ${bucketName}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 객체 정보 조회
   */
  async getObjectInfo(bucketName, key) {
    try {
      const command = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key
      });
      
      const response = await this.client.send(command);
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
   * 객체 복사
   */
  async copyObject(sourceBucket, sourceKey, destBucket, destKey) {
    try {
      const command = new CopyObjectCommand({
        CopySource: `${sourceBucket}/${sourceKey}`,
        Bucket: destBucket,
        Key: destKey
      });
      
      const response = await this.client.send(command);
      return {
        success: true,
        etag: response.CopyObjectResult.ETag,
        message: `Copied ${sourceBucket}/${sourceKey} to ${destBucket}/${destKey}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 객체 존재 여부 확인
   */
  async objectExists(bucketName, key) {
    try {
      await this.client.send(new HeadObjectCommand({
        Bucket: bucketName,
        Key: key
      }));
      return { success: true, exists: true };
    } catch (error) {
      if (error.name === 'NotFound') {
        return { success: true, exists: false };
      }
      return {
        success: false,
        error: error.message
      };
    }
  }
} 