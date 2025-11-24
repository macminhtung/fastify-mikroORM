import { Logger, UseFilters, UsePipes, Injectable, UseInterceptors } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
  // WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsValidationPipe } from '@/pipes';
import { WsExceptionsFilter } from '@/filters';
import { LoggingWsInterceptor } from '@/interceptors';
import { loadENVsFunc } from '@/config';
import { LOGGER_CONTEXT } from '@/common/constants';
import { ESocketEventName, ETokenType } from '@/common/enums';
import { UserEntity } from '@/modules/user/user.entity';
import { AuthService } from '@/modules/auth/auth.service';
import { LeaveRoomBodyDto } from '@/modules/gateway/dtos';

export type TSocket = Socket & { auth: UserEntity | null };

@Injectable()
@UseInterceptors(new LoggingWsInterceptor())
@UseFilters(new WsExceptionsFilter())
@UsePipes(new WsValidationPipe())
@WebSocketGateway(+loadENVsFunc().socketPort, { cors: true })
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(private authService: AuthService) {}

  private logger = new Logger(LOGGER_CONTEXT.WEBSOCKET);

  @WebSocketServer()
  public wss: Server;

  // #=====================#
  // # ==> INITIALIZED <== #
  // #=====================#
  afterInit() {
    setTimeout(
      () =>
        this.logger.debug(`==> INITIALIZED [wss://localhost:${+loadENVsFunc().socketPort}] <==\n`),
      150,
    );
  }

  // #====================#
  // # ==> CONNECTION <== #
  // #====================#
  async handleConnection(client: TSocket) {
    const accessToken = `${client.handshake.auth?.token}`.replace('Bearer ', '');

    try {
      // Check the accessToken
      const existedUser = await this.authService.checkToken({
        type: ETokenType.ACCESS_TOKEN,
        token: accessToken,
      });

      // Update the authInfo value to the socket client
      client.auth = existedUser;
      this.logger.verbose(`==> CLIENT ID: ${client.id} CONNECTED <==`);

      client.emit(ESocketEventName.AUTHENTICATED, true);
    } catch (error) {
      client.emit(ESocketEventName.ERROR, error.message);
      this.handleDisconnect(client);
    }
  }

  // #=======================#
  // # ==> DISCONNECTION <== #
  // #=======================#
  handleDisconnect(client: TSocket) {
    client.auth = null;
    client.removeAllListeners();
    client.disconnect(true);
    this.logger.verbose(`==> CLIENT DISCONNECTED [${client.id}] <==`);
  }

  // #=========================#
  // # ==> JOIN_ADMIN_ROOM <== #
  // #=========================#
  @SubscribeMessage(ESocketEventName.JOIN_ADMIN_ROOM)
  async joinPersonalRoom(@ConnectedSocket() client: TSocket) {
    await client.join('ADMIN_ROOM');
    return true;
  }

  // #====================#
  // # ==> LEAVE ROOM <== #
  // #====================#
  @SubscribeMessage(ESocketEventName.LEAVE_ROOM)
  async leaveRoom(@ConnectedSocket() client: TSocket, @MessageBody() body: LeaveRoomBodyDto) {
    await client.leave(body.roomName);
    return true;
  }
}
