import { ValidationError, ValidationPipe } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { HandleTreeError } from '@/pipes/api-validation.pipe';

export class WsValidationPipe extends ValidationPipe {
  exceptionFactory = (validationErrors: ValidationError[]) => {
    return new WsException(new HandleTreeError(validationErrors).processValidationErrors());
  };
}
