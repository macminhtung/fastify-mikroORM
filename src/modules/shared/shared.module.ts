import { Global, Module, Logger } from '@nestjs/common';
import { AwsS3Service } from '@/modules/shared/services/awsS3.service';
import { JwtService } from '@/modules/shared/services/jwt.service';

const SHARED_SERVICES = [JwtService, AwsS3Service, Logger];

@Global()
@Module({
  providers: SHARED_SERVICES,
  exports: SHARED_SERVICES,
})
export class SharedModule {}
