import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../coercion';
import { z } from 'zod-4';
import { getResult } from '../../../../tests/helpers/zod';

describe('coercion', () => {
	describe('z.brand', () => {
		test('should pass brand', () => {
			const schema = z
				.object({
					a: z.string('Required').brand(),
					b: z.number('Required').brand(),
					c: z.boolean('Required').brand(),
					d: z.date('Required').brand(),
					e: z.bigint('Required').brand(),
					f: z.file().brand(),
					g: z.string().optional().brand(),
					h: z.string().brand().optional(),
				})
				.brand();
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
					f: ['Invalid input: expected file, received string'],
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
				},
			});
		});
	});
});
