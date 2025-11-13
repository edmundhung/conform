import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../coercion';
import { z } from 'zod/v3';
import { getResult } from '../../../../tests/helpers/zod';

describe('coercion', () => {
	describe('required', () => {
		test('should pass required', () => {
			const schema = z
				.object({
					a: z.string().optional(),
				})
				.required();

			expect(getResult(coerceFormValue(schema).safeParse({ a: '' }))).toEqual({
				success: false,
				error: {
					a: ['Required'],
				},
			});

			expect(
				getResult(coerceFormValue(schema).safeParse({ a: 'string' })),
			).toEqual({
				success: true,
				data: {
					a: 'string',
				},
			});
		});
	});
});
