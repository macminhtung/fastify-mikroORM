import * as Joi from 'joi';

export const ENV_VALIDATION = Joi.object({
  PROTOCOL: Joi.string().required(),
  PORT: Joi.number().default(3001),
  SOCKET_PORT: Joi.number().default(3002),
  DOMAIN: Joi.string().required(),
  JWT_SECRET_KEY: Joi.string().required(),
  APP_URI: Joi.string().required(),

  POSTGRES_HOST: Joi.string().required(),
  POSTGRES_PORT: Joi.number().default(5432),
  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().required(),
  POSTGRES_DATABASE: Joi.string().required(),

  ELASTIC_NODE: Joi.string().required(),
  ELASTIC_USER: Joi.string().required(),
  ELASTIC_PASSWORD: Joi.string().required(),

  AWS_REGION: Joi.string().required(),
  AWS_ACCESS_KEY_ID: Joi.string().required(),
  AWS_SECRET_ACCESS_KEY: Joi.string().required(),
  AWS_S3_BUCKET_NAME: Joi.string().required(),
});
