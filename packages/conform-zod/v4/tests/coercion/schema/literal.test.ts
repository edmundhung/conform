import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../coercion';
import { z } from 'zod-v4';
import { object, literal, union, string, _default } from 'zod-v4/mini';
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
			const miniSchema = object({
				a: literal('a'),
				b: literal(0),
				c: literal(true),
				d: _default(literal(false), false),
				e: literal(9007199254740991n),
				f: union([literal('on'), literal(true)]),
				g: union([literal(true), literal('on')]),
				h: union([string(), literal(0)]),
				i: union([literal(0), string()]),
			});

			expect(getResult(coerceFormValue(schema).safeParse({}))).toEqual({
				success: false,
				error: {
					a: ['Invalid input'], // MEMO: Detailed error messages are not displayed because zod v4 is being used with an alias. error message: ['Invalid input: expected "a"']
					b: ['Invalid input'], // MEMO: Detailed error messages are not displayed because zod v4 is being used with an alias. error message: ['Invalid input: expected 0']
					c: ['Invalid input'], // MEMO: Detailed error messages are not displayed because zod v4 is being used with an alias. error message: ['Invalid input: expected true']
					e: ['Invalid input'], // MEMO: Detailed error messages are not displayed because zod v4 is being used with an alias. error message: ['Invalid input: expected 9007199254740991n']
					f: ['Invalid input'],
					g: ['Invalid input'],
					h: ['Invalid input'],
					i: ['Invalid input'],
				},
			});
			expect(getResult(coerceFormValue(miniSchema).safeParse({}))).toEqual({
				success: false,
				error: {
					a: ['Invalid input'], // MEMO: Detailed error messages are not displayed because zod v4 is being used with an alias. error message: ['Invalid input: expected "a"']
					b: ['Invalid input'], // MEMO: Detailed error messages are not displayed because zod v4 is being used with an alias. error message: ['Invalid input: expected 0']
					c: ['Invalid input'], // MEMO: Detailed error messages are not displayed because zod v4 is being used with an alias. error message: ['Invalid input: expected true']
					e: ['Invalid input'], // MEMO: Detailed error messages are not displayed because zod v4 is being used with an alias. error message: ['Invalid input: expected 9007199254740991n']
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
					a: ['Invalid input'], // MEMO: Detailed error messages are not displayed because zod v4 is being used with an alias. error message: ['Invalid input: expected "a"']
					b: ['Invalid input'], // MEMO: Detailed error messages are not displayed because zod v4 is being used with an alias. error message: ['Invalid input: expected 0']
					c: ['Invalid input'], // MEMO: Detailed error messages are not displayed because zod v4 is being used with an alias. error message: ['Invalid input: expected true']
					d: ['Invalid input'], // MEMO: Detailed error messages are not displayed because zod v4 is being used with an alias. error message: ['Invalid input: expected false']
					e: ['Invalid input'], // MEMO: Detailed error messages are not displayed because zod v4 is being used with an alias. error message: ['Invalid input: expected 9007199254740991n']
					f: ['Invalid input'],
					g: ['Invalid input'],
				},
			});
			expect(
				getResult(
					coerceFormValue(miniSchema).safeParse({
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
					a: ['Invalid input'], // MEMO: Detailed error messages are not displayed because zod v4 is being used with an alias. error message: ['Invalid input: expected "a"']
					b: ['Invalid input'], // MEMO: Detailed error messages are not displayed because zod v4 is being used with an alias. error message: ['Invalid input: expected 0']
					c: ['Invalid input'], // MEMO: Detailed error messages are not displayed because zod v4 is being used with an alias. error message: ['Invalid input: expected true']
					d: ['Invalid input'], // MEMO: Detailed error messages are not displayed because zod v4 is being used with an alias. error message: ['Invalid input: expected false']
					e: ['Invalid input'], // MEMO: Detailed error messages are not displayed because zod v4 is being used with an alias. error message: ['Invalid input: expected 9007199254740991n']
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
			expect(
				getResult(
					coerceFormValue(miniSchema).safeParse({
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
