export const loadENVsFunc = () => ({
  protocol: process.env.PROTOCOL!,
  domain: process.env.DOMAIN!,
  port: process.env.PORT!,
  socketPort: process.env.SOCKET_PORT!,
  jwtSecretKey: process.env.JWT_SECRET_KEY!,
  appUri: process.env.APP_URI!,
  redis: {
    host: process.env.REDIS_HOST!,
    port: +process.env.REDIS_PORT!,
    username: process.env.REDIS_USERNAME!,
    password: process.env.REDIS_PASSWORD!,
    ttl: +process.env.REDIS_TTL!,
  },
  elastic: {
    node: process.env.ELASTIC_NODE!,
    username: process.env.ELASTIC_USER!,
    password: process.env.ELASTIC_PASSWORD!,
  },
  aws: {
    region: process.env.AWS_REGION!,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    s3BucketName: process.env.AWS_S3_BUCKET_NAME!,
  },
});

export type TEnvConfiguration = ReturnType<typeof loadENVsFunc>;
