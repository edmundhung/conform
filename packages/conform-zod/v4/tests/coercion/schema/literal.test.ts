import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../coercion';
import { z } from 'zod-v4';
import { object, literal, union, string, _default } from 'zod-v4/mini';
import { getResult } from '../../../../tests/helpers/zod';

describe('coercion', () => {
	describe('z.array', () => {
		test('should pass literal', () => {
			const schema = z.object({
				a: z.literal('a', 'invalid: literal a'),
				b: z.literal(0, 'invalid: literal 0'),
				c: z.literal(true, 'invalid: literal true'),
				d: z.literal(false, 'invalid: literal false').default(false),
				e: z.literal(9007199254740991n, 'invalid: literal 9007199254740991n'),
				f: z.union(
					[
						z.literal('on', 'invalid: literal on'),
						z.literal(true, 'invalid: literal true'),
					],
					'invalid: union',
				),
				g: z.union(
					[
						z.literal(true, 'invalid: literal true'),
						z.literal('on', 'invalid: literal on'),
					],
					'invalid: union',
				),
				h: z.union(
					[z.string('invalid: string'), z.literal(0, 'invalid: literal 0')],
					'invalid: union',
				),
				i: z.union(
					[z.literal(0, 'invalid: literal 0'), z.string('invalid: string')],
					'invalid: union',
				),
			});
			const miniSchema = object({
				a: literal('a', 'invalid: literal a'),
				b: literal(0, 'invalid: literal 0'),
				c: literal(true, 'invalid: literal true'),
				d: _default(literal(false, 'invalid: literal false'), false),
				e: literal(9007199254740991n, 'invalid: literal 9007199254740991n'),
				f: union(
					[
						literal('on', 'invalid: literal on'),
						literal(true, 'invalid: literal true'),
					],
					'invalid: union',
				),
				g: union(
					[
						literal(true, 'invalid: literal true'),
						literal('on', 'invalid: literal on'),
					],
					'invalid: union',
				),
				h: union(
					[string('invalid: string'), literal(0, 'invalid: literal 0')],
					'invalid: union',
				),
				i: union(
					[literal(0, 'invalid: literal 0'), string('invalid: string')],
					'invalid: union',
				),
			});

			expect(getResult(coerceFormValue(schema).safeParse({}))).toEqual({
				success: false,
				error: {
					a: ['invalid: literal a'],
					b: ['invalid: literal 0'],
					c: ['invalid: literal true'],
					e: ['invalid: literal 9007199254740991n'],
					f: ['invalid: union'],
					g: ['invalid: union'],
					h: ['invalid: union'],
					i: ['invalid: union'],
				},
			});
			expect(getResult(coerceFormValue(miniSchema).safeParse({}))).toEqual({
				success: false,
				error: {
					a: ['invalid: literal a'],
					b: ['invalid: literal 0'],
					c: ['invalid: literal true'],
					e: ['invalid: literal 9007199254740991n'],
					f: ['invalid: union'],
					g: ['invalid: union'],
					h: ['invalid: union'],
					i: ['invalid: union'],
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
					a: ['invalid: literal a'],
					b: ['invalid: literal 0'],
					c: ['invalid: literal true'],
					d: ['invalid: literal false'],
					e: ['invalid: literal 9007199254740991n'],
					f: ['invalid: union'],
					g: ['invalid: union'],
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
					a: ['invalid: literal a'],
					b: ['invalid: literal 0'],
					c: ['invalid: literal true'],
					d: ['invalid: literal false'],
					e: ['invalid: literal 9007199254740991n'],
					f: ['invalid: union'],
					g: ['invalid: union'],
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
