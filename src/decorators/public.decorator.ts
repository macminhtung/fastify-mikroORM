import { SetMetadata } from '@nestjs/common';
import { EMetadataKey } from '@/common/enums';

export const Public = () => SetMetadata(EMetadataKey.PUBLIC, true);
