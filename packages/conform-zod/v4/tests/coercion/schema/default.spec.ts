import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../coercion';
import { z } from 'zod-4';
import { getResult } from '../../../../tests/helpers/zod';

describe('coercion', () => {
	describe('z.default', () => {
		test('should pass default', () => {
			const defaultFile = new File(['hello', 'world'], 'example.txt');
			const defaultDate = new Date(0);
			const schema = z.object({
				a: z.string().default('text'),
				b: z.number().default(123),
				c: z.boolean().default(true),
				d: z.date().default(defaultDate),
				e: z.file().default(defaultFile),
				f: z.array(z.string()).default(['foo', 'bar']),
				g: z.string().nullable().default(null),
				h: z.string().default(''),
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

			const today = new Date();
			const schema2 = z.object({
				a: z.string().email('invalid').default(''),
				b: z.number().gt(10, 'invalid').default(0),
				c: z
					.boolean()
					.refine((value) => !!value, 'invalid')
					.default(false),
				d: z.date().min(today, 'invalid').default(defaultDate),
				e: z
					.file()
					.refine((file) => file.size > 100, 'invalid')
					.default(defaultFile),
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
		});
	});
});
