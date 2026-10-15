import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .default('postgresql://postgres:soc_secure_password_2026@localhost:5432/soc_platform_db?schema=public'),
  NEXT_PUBLIC_DATA_MODE: z.enum(['live', 'mock']).default('live'),
  NEXT_PUBLIC_API_URL: z.string().default('/api'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters').default('soc_enterprise_platform_jwt_secret_key_2026_super_secure'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_DATA_MODE: process.env.NEXT_PUBLIC_DATA_MODE,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  NODE_ENV: process.env.NODE_ENV,
});
