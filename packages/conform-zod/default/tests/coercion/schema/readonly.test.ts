import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../coercion';
import { z } from 'zod';
import { getResult } from '../../../../tests/helpers/zod';

describe('coercion', () => {
	describe('z.readonly', () => {
		test('should coerce values wrapped with readonly', () => {
			const schema = z
				.object({
					a: z.string().readonly(),
					b: z.number().readonly(),
					c: z.boolean().readonly(),
					d: z.date().readonly(),
					e: z.bigint().readonly(),
					f: z.instanceof(File).readonly(),
					g: z.string().optional().readonly(),
					h: z.string().readonly().optional(),
					i: z.object({ value: z.number() }).readonly(),
				})
				.readonly();
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
					f: ['Input not instance of File'],
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
		});
	});
});
