import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../coercion';
import { z } from 'zod';
import { getResult } from '../../../../tests/helpers/zod';

describe('coercion', () => {
	describe('z.array', () => {
		test('should pass literal', () => {
			const schema = z.object({
				a: z.literal('a'),
				b: z.literal(0),
				c: z.literal(true),
				d: z.literal(false).default(false),
				e: z.literal(9007199254740991n),
				f: z.union([z.literal('on'), z.literal(true)]),
				g: z.union([z.literal(true), z.literal('on')]),
				h: z.union([z.string(), z.literal(0)]),
				i: z.union([z.literal(0), z.string()]),
			});

			expect(getResult(coerceFormValue(schema).safeParse({}))).toEqual({
				success: false,
				error: {
					a: [`Invalid literal value, expected "a"`],
					b: ['Invalid literal value, expected 0'],
					c: ['Invalid literal value, expected true'],
					e: [`Invalid literal value, expected "9007199254740991"`],
					f: ['Invalid input'],
					g: ['Invalid input'],
					h: ['Invalid input'],
					i: ['Invalid input'],
				},
			});

			expect(
				getResult(
					coerceFormValue(schema).safeParse({
						a: 'not a',
						b: '1',
						c: '',
						d: 'on',
						e: '0x1ffffffffffff0',
						f: '',
						g: '',
						h: '1',
						i: '1',
					}),
				),
			).toEqual({
				success: false,
				error: {
					a: [`Invalid literal value, expected "a"`],
					b: ['Invalid literal value, expected 0'],
					c: ['Invalid literal value, expected true'],
					d: ['Invalid literal value, expected false'],
					e: [`Invalid literal value, expected "9007199254740991"`],
					f: ['Invalid input'],
					g: ['Invalid input'],
				},
			});

			expect(
				getResult(
					coerceFormValue(schema).safeParse({
						a: 'a',
						b: '0',
						c: 'on',
						d: undefined,
						e: '9007199254740991',
						f: 'on',
						g: 'on',
						h: '0',
						i: '0',
					}),
				),
			).toEqual({
				success: true,
				data: {
					a: 'a',
					b: 0,
					c: true,
					d: false,
					e: 9007199254740991n,
					f: 'on',
					g: true,
					h: '0',
					i: 0,
				},
			});
		});
	});
});
