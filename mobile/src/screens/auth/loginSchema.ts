import { z } from 'zod';

import { fieldRules } from '@/utils/validation';

/** Mirrors LoginRequest in OpenAPI v0.1.0: email 1–255 chars, password 1–128 chars. */
export const loginSchema = z.object({
  email: fieldRules.email(255),
  password: z.string().min(1, 'validation.required').max(128, 'validation.tooLong'),
});

export type LoginForm = z.infer<typeof loginSchema>;
