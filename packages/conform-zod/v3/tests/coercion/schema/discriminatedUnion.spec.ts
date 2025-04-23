import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../coercion';
import { z } from 'zod';
import { getResult } from '../../../../tests/helpers/zod';

describe('coercion', () => {
	describe('z.discriminatedUnion', () => {
		test('should pass discriminatedUnion', () => {
			const schema = z.discriminatedUnion('type', [
				z.object({
					type: z.literal('a'),
					number: z.number(),
				}),
				z.object({
					type: z.literal('b'),
					boolean: z.boolean(),
				}),
			]);

			expect(
				getResult(
					coerceFormValue(schema).safeParse({
						type: 'a',
						number: '1',
					}),
				),
			).toEqual({
				success: true,
				data: {
					type: 'a',
					number: 1,
				},
			});
			expect(
				getResult(
					coerceFormValue(schema).safeParse({
						type: 'b',
						boolean: 'on',
					}),
				),
			).toEqual({
				success: true,
				data: {
					type: 'b',
					boolean: true,
				},
			});

			expect(getResult(coerceFormValue(schema).safeParse({}))).toEqual({
				success: false,
				error: {
					type: ["Invalid discriminator value. Expected 'a' | 'b'"],
				},
			});

			const nestedSchema = z.object({
				nest: schema,
			});
			expect(getResult(coerceFormValue(nestedSchema).safeParse({}))).toEqual({
				success: false,
				error: {
					'nest.type': ["Invalid discriminator value. Expected 'a' | 'b'"],
				},
			});
		});
	});
});
