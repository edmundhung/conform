import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../coercion';
import * as z from 'zod-v4';
import * as zMini from 'zod-v4/mini';
import { getResult } from '../../../../tests/helpers/zod';

describe('coercion', () => {
	describe('z.prefault', () => {
		test('should pass default', () => {
			const defaultFile = new File(['hello', 'world'], 'example.txt');
			const defaultDate = new Date(0);
			const schema = z.object({
				a: z.string().prefault('text'),
				b: z.number().prefault(123),
				c: z.boolean().prefault(true),
				d: z.date().prefault(defaultDate),
				e: z.instanceof(File).prefault(defaultFile),
				f: z.array(z.string()).prefault(['foo', 'bar']),
				g: z.string().nullable().prefault(null),
				h: z.string().prefault(''),
			});
			const schemaWithMini = zMini.object({
				a: zMini.prefault(zMini.string(), 'text'),
				b: zMini.prefault(zMini.number(), 123),
				c: zMini.prefault(zMini.boolean(), true),
				d: zMini.prefault(zMini.date(), defaultDate),
				e: zMini.prefault(zMini.file(), defaultFile),
				f: zMini.prefault(zMini.array(zMini.string()), ['foo', 'bar']),
				g: zMini.prefault(zMini.nullable(zMini.string()), null),
				h: zMini.prefault(zMini.string(), ''),
			});
			const emptyFile = new File([], '');

			expect(
				getResult(
					coerceFormValue(schema).safeParse({
						a: '',
						b: '',
						c: '',
						d: '',
						e: emptyFile,
						f: '',
					}),
				),
			).toEqual({
				success: true,
				data: {
					a: 'text',
					b: 123,
					c: true,
					d: defaultDate,
					e: defaultFile,
					f: ['foo', 'bar'],
					g: null,
					h: '',
				},
			});
			expect(
				getResult(
					coerceFormValue(schemaWithMini).safeParse({
						a: '',
						b: '',
						c: '',
						d: '',
						e: emptyFile,
						f: '',
					}),
				),
			).toEqual({
				success: true,
				data: {
					a: 'text',
					b: 123,
					c: true,
					d: defaultDate,
					e: defaultFile,
					f: ['foo', 'bar'],
					g: null,
					h: '',
				},
			});

			const today = new Date();
			const schema2 = z.object({
				a: z.string().prefault(''),
				b: z.number().prefault(0),
				c: z.boolean().prefault(false),
				d: z.date().prefault(defaultDate),
				e: z.instanceof(File).prefault(defaultFile),
			});
			const schemaWithMini2 = zMini.object({
				a: zMini.prefault(zMini.string(), ''),
				b: zMini.prefault(zMini.number(), 0),
				c: zMini.prefault(zMini.boolean(), false),
				d: zMini.prefault(zMini.date(), defaultDate),
				e: zMini.prefault(zMini.file(), defaultFile),
			});

			expect(getResult(coerceFormValue(schema2).safeParse({}))).toEqual({
				success: true,
				data: {
					a: '',
					b: 0,
					c: false,
					d: defaultDate,
					e: defaultFile,
				},
			});
			expect(getResult(coerceFormValue(schemaWithMini2).safeParse({}))).toEqual(
				{
					success: true,
					data: {
						a: '',
						b: 0,
						c: false,
						d: defaultDate,
						e: defaultFile,
					},
				},
			);

			const schema3 = z
				.object({
					a: z.email('invalid').prefault(''),
					b: z.number().gt(10, 'invalid').prefault(0),
					c: z
						.boolean()
						.refine((value) => !!value, 'invalid')
						.prefault(false),
					d: z.date().min(today, 'invalid').prefault(defaultDate),
					e: z
						.instanceof(File)
						.refine((file) => file.size > 100, 'invalid')
						.prefault(defaultFile),
				})
				.prefault({});
			const schemaWithMini3 = zMini.prefault(
				zMini.object({
					a: zMini.prefault(zMini.email('invalid'), ''),
					b: zMini.prefault(zMini.number().check(zMini.gt(10, 'invalid')), 0),
					c: zMini.prefault(
						zMini.boolean().check(zMini.refine((value) => !!value, 'invalid')),
						false,
					),
					d: zMini.prefault(
						zMini.date().check(zMini.minimum(today, 'invalid')),
						defaultDate,
					),
					e: zMini.prefault(
						zMini
							.file()
							.check(zMini.refine((file) => file.size > 100, 'invalid')),
						defaultFile,
					),
				}),
				{},
			);

			expect(getResult(coerceFormValue(schema3).safeParse({}))).toEqual({
				success: false,
				error: {
					a: ['invalid'],
					b: ['invalid'],
					c: ['invalid'],
					d: ['invalid'],
					e: ['invalid'],
				},
			});
			expect(getResult(coerceFormValue(schemaWithMini3).safeParse({}))).toEqual(
				{
					success: false,
					error: {
						a: ['invalid'],
						b: ['invalid'],
						c: ['invalid'],
						d: ['invalid'],
						e: ['invalid'],
					},
				},
			);
		});
	});
});
