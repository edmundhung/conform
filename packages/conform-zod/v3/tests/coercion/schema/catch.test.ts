import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../coercion';
import { z } from 'zod/v3';
import { getResult } from '../../../../tests/helpers/zod';

describe('coercion', () => {
	describe('z.catch', () => {
		test('should pass catch', () => {
			const defaultFile = new File(['hello', 'world'], 'example.txt');
			const userFile = new File(['foo', 'bar'], 'foobar.txt');
			const defaultDate = new Date(0);
			const userDate = new Date(1);
			const schema = z.object({
				a: z.string().catch('text'),
				b: z.number().catch(123),
				c: z.boolean().catch(true),
				d: z.date().catch(defaultDate),
				e: z.instanceof(File).catch(defaultFile),
				f: z.array(z.string()).min(1).catch(['foo', 'bar']),
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
				},
			});

			expect(
				getResult(
					coerceFormValue(schema).safeParse({
						a: 'othertext',
						b: '456',
						c: 'on',
						d: userDate.toISOString(),
						e: userFile,
						f: ['hello', 'world'],
					}),
				),
			).toEqual({
				success: true,
				data: {
					a: 'othertext',
					b: 456,
					c: true,
					d: userDate,
					e: userFile,
					f: ['hello', 'world'],
				},
			});
		});
	});
});
