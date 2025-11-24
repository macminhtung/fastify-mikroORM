import { IsString } from 'class-validator';

export class LeaveRoomBodyDto {
  @IsString()
  roomName: string;
}
