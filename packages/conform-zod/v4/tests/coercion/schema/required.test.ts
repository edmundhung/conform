import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../coercion';
import { z } from 'zod-v4';
import { object, string, optional, required } from 'zod-v4/mini';
import { getResult } from '../../../../tests/helpers/zod';

describe('coercion', () => {
	describe('required', () => {
		test('should pass required', () => {
			const schema = z
				.object({
					a: z.string().optional(),
				})
				.required();
			const schemaWithMini = required(
				object({
					a: optional(string()),
				}),
			);

			expect(getResult(coerceFormValue(schema).safeParse({ a: '' }))).toEqual({
				success: false,
				error: {
					a: ['Invalid input: expected nonoptional, received undefined'],
				},
			});
			expect(
				getResult(coerceFormValue(schemaWithMini).safeParse({ a: '' })),
			).toEqual({
				success: false,
				error: {
					a: ['Invalid input: expected nonoptional, received undefined'],
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
			expect(
				getResult(coerceFormValue(schemaWithMini).safeParse({ a: 'string' })),
			).toEqual({
				success: true,
				data: {
					a: 'string',
				},
			});
		});
	});
});
