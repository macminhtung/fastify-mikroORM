import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';

export class HandleTreeError {
  constructor(validationErrors: ValidationError[]) {
    this.validationErrors = validationErrors;
  }

  private validationErrors: ValidationError[];
  private listError: string[] = [];

  processErrorTree(validationError: ValidationError) {
    const { property, constraints, children = [] } = validationError;
    if (constraints) {
      const formatItemError = Object.values(constraints);
      this.listError.push(`${property} - (${formatItemError})`);
    }

    children.forEach((childValidationError) => this.processErrorTree(childValidationError));
  }

  processValidationErrors() {
    this.validationErrors.forEach((validationError) => {
      this.processErrorTree(validationError);
    });
    return this.listError.join(' | ');
  }
}

export class ApiValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    });
  }

  exceptionFactory = (validationErrors: ValidationError[]) => {
    return new BadRequestException(new HandleTreeError(validationErrors).processValidationErrors());
  };
}
