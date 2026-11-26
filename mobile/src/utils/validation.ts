import { z } from 'zod';

/**
 * Reusable field rules. Server-side limits come from the OpenAPI spec (v0.1.0);
 * the API's 422 response doesn't say which field failed, so the app must check first.
 */
export const fieldRules = {
  email: (max = 255) =>
    z.string().trim().min(1, 'validation.required').max(max, 'validation.tooLong').email('validation.email'),
  requiredText: (max: number) => z.string().trim().min(1, 'validation.required').max(max, 'validation.tooLong'),
  /** 10-digit Indian mobile starting 6–9, entered without +91. */
  indianMobile: () =>
    z
      .string()
      .trim()
      .transform((v) => v.replace(/\s/g, ''))
      .pipe(z.string().regex(/^[6-9]\d{9}$/, 'validation.mobile')),
  /** Indian PIN code: 6 digits, can't start with 0. */
  pincode: () => z.string().trim().regex(/^[1-9]\d{5}$/, 'validation.pincode'),
};
