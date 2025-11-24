import type { FastifyRequest } from 'fastify';
import { UserEntity } from '@/modules/user/user.entity';

export type TRequest = FastifyRequest & { authUser: UserEntity };
