import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { RolesGuard } from '@/guards/roles.guard';
import { EMetadataKey } from '@/common/enums';

export const Roles = (roleIds: number[]) =>
  applyDecorators(UseGuards(RolesGuard), SetMetadata(EMetadataKey.ROLES, roleIds));
