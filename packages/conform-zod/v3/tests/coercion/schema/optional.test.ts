import { vi, describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../coercion';
import { z } from 'zod/v3';
import { getResult } from '../../../../tests/helpers/zod';

describe('coercion', () => {
	describe('z.optional', () => {
		test('should pass optional', () => {
			const schema = z.object({
				a: z.string().optional(),
				b: z.number().optional(),
				c: z.boolean().optional(),
				d: z.date().optional(),
				e: z.instanceof(File).optional(),
				f: z.array(z.string().optional()),
				g: z.array(z.string()).optional(),
			});
			const emptyFile = new File([], '');

			expect(getResult(coerceFormValue(schema).safeParse({}))).toEqual({
				success: true,
				data: {
					a: undefined,
					b: undefined,
					c: undefined,
					d: undefined,
					e: undefined,
					f: [],
					g: undefined,
				},
			});
			expect(
				getResult(
					coerceFormValue(schema).safeParse({
						a: '',
						b: '',
						c: '',
						d: '',
						e: emptyFile,
						f: '',
						g: '',
					}),
				),
			).toEqual({
				success: true,
				data: {
					a: undefined,
					b: undefined,
					c: undefined,
					d: undefined,
					e: undefined,
					f: [],
					g: undefined,
				},
			});

			// To test if File is not defined in certain environment
			vi.stubGlobal('File', undefined);

			expect(() =>
				getResult(coerceFormValue(schema).safeParse({})),
			).not.toThrow();
		});
	});
});
