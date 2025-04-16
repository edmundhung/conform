import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../coercion';
import { z } from 'zod';
import { getResult } from '../../helpers/zod';

describe('coercion', () => {
	describe('z.object', () => {
		test('should pass object', () => {
			const schema = z.object({
				a: z.object({
					text: z.string({
						message: 'required',
					}),
					flag: z
						.boolean({
							message: 'required',
						})
						.optional(),
				}),
				b: z
					.object({
						text: z.string({
							message: 'required',
						}),
						flag: z.boolean({
							message: 'required',
						}),
					})
					.optional(),
			});

			expect(getResult(coerceFormValue(schema).safeParse({}))).toEqual({
				success: false,
				error: {
					'a.text': ['required'],
				},
			});
			expect(
				getResult(
					coerceFormValue(schema).safeParse({
						b: {
							text: '',
						},
					}),
				),
			).toEqual({
				success: false,
				error: {
					'a.text': ['required'],
					'b.text': ['required'],
					'b.flag': ['required'],
				},
			});
			expect(
				getResult(
					coerceFormValue(schema).safeParse({
						a: {
							text: 'foo',
						},
						b: {
							text: 'bar',
							flag: 'on',
						},
					}),
				),
			).toEqual({
				success: true,
				data: {
					a: {
						text: 'foo',
					},
					b: {
						text: 'bar',
						flag: true,
					},
				},
			});
		});
	});
});
