import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../coercion';
import { z } from 'zod-v4';
import {
	object,
	string,
	number,
	boolean,
	date,
	bigint,
	file,
	array,
	optional,
	readonly,
} from 'zod-v4/mini';
import { getResult } from '../../../../tests/helpers/zod';

describe('coercion', () => {
	describe('z.readonly', () => {
		test('should coerce values wrapped with readonly', () => {
			const schema = z
				.object({
					a: z.string('Required').readonly(),
					b: z.number('Required').readonly(),
					c: z.boolean('Required').readonly(),
					d: z.date('Required').readonly(),
					e: z.bigint('Required').readonly(),
					f: z.file('Required').readonly(),
					g: z.string().optional().readonly(),
					h: z.string().readonly().optional(),
					i: z.object({ value: z.number('Required') }).readonly(),
				})
				.readonly();
			const schemaWithMini = object({
				a: readonly(string('Required')),
				b: readonly(number('Required')),
				c: readonly(boolean('Required')),
				d: readonly(date('Required')),
				e: readonly(bigint('Required')),
				f: readonly(file('Required')),
				g: readonly(optional(string())),
				h: optional(readonly(string())),
				i: readonly(object({ value: number('Required') })),
			});
			const defaultFile = new File(['hello', 'world'], 'example.txt');

			expect(
				getResult(
					coerceFormValue(schema).safeParse({
						a: '',
						b: '',
						c: '',
						d: '',
						e: '',
						f: '',
						g: '',
						h: '',
						i: { value: '' },
					}),
				),
			).toEqual({
				success: false,
				error: {
					a: ['Required'],
					b: ['Required'],
					c: ['Required'],
					d: ['Required'],
					e: ['Required'],
					f: ['Required'],
					'i.value': ['Required'],
				},
			});
			expect(
				getResult(
					coerceFormValue(schemaWithMini).safeParse({
						a: '',
						b: '',
						c: '',
						d: '',
						e: '',
						f: '',
						g: '',
						h: '',
						i: { value: '' },
					}),
				),
			).toEqual({
				success: false,
				error: {
					a: ['Required'],
					b: ['Required'],
					c: ['Required'],
					d: ['Required'],
					e: ['Required'],
					f: ['Required'],
					'i.value': ['Required'],
				},
			});

			expect(
				getResult(
					coerceFormValue(schema).safeParse({
						a: 'hello world',
						b: '42',
						c: 'on',
						d: '1970-01-01',
						e: '0x1fffffffffffff',
						f: defaultFile,
						g: '',
						h: '',
						i: { value: '7' },
					}),
				),
			).toEqual({
				success: true,
				data: {
					a: 'hello world',
					b: 42,
					c: true,
					d: new Date('1970-01-01'),
					e: BigInt('0x1fffffffffffff'),
					f: defaultFile,
					g: undefined,
					h: undefined,
					i: { value: 7 },
				},
			});
			expect(
				getResult(
					coerceFormValue(schemaWithMini).safeParse({
						a: 'hello world',
						b: '42',
						c: 'on',
						d: '1970-01-01',
						e: '0x1fffffffffffff',
						f: defaultFile,
						g: '',
						h: '',
						i: { value: '7' },
					}),
				),
			).toEqual({
				success: true,
				data: {
					a: 'hello world',
					b: 42,
					c: true,
					d: new Date('1970-01-01'),
					e: BigInt('0x1fffffffffffff'),
					f: defaultFile,
					g: undefined,
					h: undefined,
					i: { value: 7 },
				},
			});
		});

		test('should materialize missing collections wrapped with readonly', () => {
			const schema = z.object({
				list: z.array(z.string()).readonly(),
				nested: z.object({ value: z.string().optional() }).readonly(),
			});
			const schemaWithMini = object({
				list: readonly(array(string())),
				nested: readonly(object({ value: optional(string()) })),
			});

			expect(getResult(coerceFormValue(schema).safeParse({}))).toEqual({
				success: true,
				data: {
					list: [],
					nested: {},
				},
			});
			expect(getResult(coerceFormValue(schemaWithMini).safeParse({}))).toEqual({
				success: true,
				data: {
					list: [],
					nested: {},
				},
			});
		});
	});
});
