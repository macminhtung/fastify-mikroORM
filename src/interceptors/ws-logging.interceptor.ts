import { LOGGER_CONTEXT } from '@/common/constants';
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';

@Injectable()
export class LoggingWsInterceptor implements NestInterceptor {
  private logger = new Logger(LOGGER_CONTEXT.WEBSOCKET);

  intercept(context: ExecutionContext, next: CallHandler) {
    if (context.getType() === 'ws') {
      const wsCtx = context.switchToWs();
      const client = wsCtx.getClient();
      const eventName = wsCtx.getPattern();

      this.logger.log(`Event: ${eventName} | Client: ${client.id}`);
    }

    return next.handle();
  }
}
