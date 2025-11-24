import { Module, Global } from '@nestjs/common';
import { SocketGateway } from '@/modules/gateway/socket.gateway';
import { AuthModule } from '@/modules/auth/auth.module';

@Global()
@Module({
  imports: [AuthModule],
  providers: [SocketGateway],
  exports: [SocketGateway],
})
export class GatewayModule {}
