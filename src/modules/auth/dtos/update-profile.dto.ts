import { OmitType } from '@nestjs/swagger';
import { UpdateUserDto } from '@/modules/user/dtos';

export class UpdateProfileDto extends OmitType(UpdateUserDto, ['roleId']) {}
