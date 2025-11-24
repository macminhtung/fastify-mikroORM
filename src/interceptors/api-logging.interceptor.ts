import { LOGGER_CONTEXT } from '@/common/constants';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from '@nestjs/common';

@Injectable()
export class ApiLoggingInterceptor implements NestInterceptor {
  constructor(private logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const { ip, method, originalUrl } = request;
    this.logger.log(`REQUEST: ${ip} ${method} ${originalUrl}`, LOGGER_CONTEXT.HTTP);

    return next.handle();
  }
}
