import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class ElasticHealthService implements OnModuleInit {
  constructor(
    private readonly service: ElasticsearchService,
    private readonly logger: Logger,
  ) {}

  async onModuleInit() {
    await this.service
      .ping()
      .then(() => this.logger.log('✅ Available', ElasticsearchService.name))
      .catch(() => this.logger.error('❌ NOT available', ElasticsearchService.name));
  }
}
