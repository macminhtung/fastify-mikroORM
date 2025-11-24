import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticHealthService } from '@/modules/elastic/elastic-health.service';
import { SearchProductService } from '@/modules/elastic/search-services';
import type { TEnvConfiguration } from '@/config';

@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<TEnvConfiguration>) => {
        const { node, username, password } =
          configService.get<TEnvConfiguration['elastic']>('elastic')!;
        return { node, auth: { username, password } };
      },
    }),
  ],
  providers: [ElasticHealthService, SearchProductService],
  exports: [SearchProductService],
})
export class ElasticModule {}
