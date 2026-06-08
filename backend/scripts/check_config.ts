import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import nodemailer from 'nodemailer';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import { env } from '../src/config/env.js';
import pino from 'pino';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true },
  },
});

async function checkDatabase() {
  logger.info('Checking Database Connection...');
  const prisma = new PrismaClient();
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error({ err: error }, '❌ Database connection failed');
  } finally {
    await prisma.$disconnect();
  }
}

async function checkRedis() {
  logger.info('Checking Redis Connection...');
  return new Promise((resolve) => {
    const redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
    });

    redis.on('connect', () => {
      logger.info('✅ Redis connected successfully');
      redis.quit();
      resolve(true);
    });

    redis.on('error', (err) => {
      logger.error({ err }, '❌ Redis connection failed');
      redis.quit();
      resolve(false);
    });
  });
}

async function checkSMTP() {
  if (!env.MAIL_ENABLED) {
    logger.info('⏭️  SMTP checking skipped (MAIL_ENABLED is false)');
    return;
  }
  
  logger.info('Checking SMTP Connection...');
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER && env.SMTP_PASS ? {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    } : undefined,
  });

  try {
    const success = await transporter.verify();
    if (success) {
      logger.info('✅ SMTP connected successfully');
    }
  } catch (error) {
    logger.error({ err: error }, '❌ SMTP connection failed');
  }
}

async function checkS3() {
  if (env.STORAGE_PROVIDER !== 's3') {
    logger.info(`⏭️  S3 checking skipped (STORAGE_PROVIDER is ${env.STORAGE_PROVIDER})`);
    return;
  }

  logger.info('Checking S3 Connection...');
  try {
    const s3 = new S3Client({
      region: env.S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY || '',
        secretAccessKey: env.S3_SECRET_KEY || '',
      },
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: true,
    });

    await s3.send(new ListBucketsCommand({}));
    logger.info('✅ S3 connected successfully');
  } catch (error) {
    logger.error({ err: error }, '❌ S3 connection failed');
  }
}

async function runAllChecks() {
  logger.info('====================================');
  logger.info('Starting Configuration Checks');
  logger.info('====================================\n');

  await checkDatabase();
  await checkRedis();
  await checkSMTP();
  await checkS3();

  logger.info('\n====================================');
  logger.info('Configuration Checks Completed');
  logger.info('====================================');
  process.exit(0);
}

runAllChecks().catch((err) => {
  logger.fatal({ err }, 'Fatal error running config checks');
  process.exit(1);
});
