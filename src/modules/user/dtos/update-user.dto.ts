import { OmitType } from '@nestjs/swagger';
import { CreateUserDto } from '@/modules/user/dtos';

export class UpdateUserDto extends OmitType(CreateUserDto, ['email']) {}
