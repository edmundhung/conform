import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../coercion';
import { z } from 'zod';
import { getResult } from '../../helpers/zod';

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
		});
	});
});
