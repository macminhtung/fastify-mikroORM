import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroORMService } from '@/modules/mikro-orm/mikro-orm.service';
import { config } from '@/modules/mikro-orm/mikro-orm.config';

@Module({
  imports: [MikroOrmModule.forRoot(config)],
  providers: [MikroORMService],
})
export class MikroORMModule {}
