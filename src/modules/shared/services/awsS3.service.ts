import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { TEnvConfiguration } from '@/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class AwsS3Service {
  private s3Client: S3Client;

  constructor(private configService: ConfigService<TEnvConfiguration>) {
    // Update awsConfig
    this.awsConfig = this.configService.get('aws')!;

    // Create S3Client instance
    const { region, accessKeyId, secretAccessKey } = this.awsConfig;
    this.s3Client = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
  }

  private awsConfig: TEnvConfiguration['aws'];

  async generatePreSignedUrl(payload: { key: string; contentType?: string }): Promise<string> {
    const { key, contentType = 'application/octet-stream' } = payload;
    const signedUrl = await getSignedUrl(
      this.s3Client,
      new PutObjectCommand({
        Bucket: this.awsConfig.s3BucketName,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 5 * 60 },
    );

    return signedUrl;
  }
}
