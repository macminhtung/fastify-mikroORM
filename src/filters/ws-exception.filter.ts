import { ArgumentsHost, Catch, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { TSocket } from '@/modules/gateway/socket.gateway';
import { ESocketEventName } from '@/common/enums';
import { LOGGER_CONTEXT } from '@/common/constants';
import { formatLoggerMessage } from '@/filters/api-exception.filter';

@Catch()
export class WsExceptionsFilter extends BaseWsExceptionFilter {
  private logger = new Logger(LOGGER_CONTEXT.WEBSOCKET);

  catch(exception: WsException, host: ArgumentsHost) {
    // Format logger message
    const { message, stack = '' } = exception;
    const client: TSocket = host.switchToWs().getClient();
    const { id, auth } = client;
    const loggerMessage = formatLoggerMessage(stack, message);

    // Display WS error message
    this.logger.error(`[${auth?.email}] | CLIENT ID: ${id} - ${loggerMessage}`);

    // Emit error message
    client.emit(ESocketEventName.ERROR, { message });
  }
}
