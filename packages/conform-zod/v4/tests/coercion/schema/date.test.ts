import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../coercion';
import { z } from 'zod-v4';
import { date, minimum, maximum } from 'zod-v4/mini';
import { getResult } from '../../../../tests/helpers/zod';

describe('coercion', () => {
	describe('z.date', () => {
		test('should pass date', () => {
			const schema = z
				.date({
					error: (ctx) => {
						if (ctx.input === undefined) {
							return 'required';
						}
						return 'invalid';
					},
				})
				.min(new Date(1), 'min')
				.max(new Date(10), 'max');
			const schemaWithMini = date({
				error: (ctx) => {
					if (ctx.input === undefined) {
						return 'required';
					}
					return 'invalid';
				},
			}).check(minimum(new Date(1), 'min'), maximum(new Date(10), 'max'));
			const file = new File([], '');

			expect(getResult(coerceFormValue(schema).safeParse(''))).toEqual({
				success: false,
				error: {
					'': ['required'],
				},
			});
			expect(getResult(coerceFormValue(schemaWithMini).safeParse(''))).toEqual({
				success: false,
				error: {
					'': ['required'],
				},
			});

			expect(getResult(coerceFormValue(schema).safeParse('abc'))).toEqual({
				success: false,
				error: {
					'': ['invalid'],
				},
			});
			expect(
				getResult(coerceFormValue(schemaWithMini).safeParse('abc')),
			).toEqual({
				success: false,
				error: {
					'': ['invalid'],
				},
			});

			expect(getResult(coerceFormValue(schema).safeParse(file))).toEqual({
				success: false,
				error: {
					'': ['invalid'],
				},
			});
			expect(
				getResult(coerceFormValue(schemaWithMini).safeParse(file)),
			).toEqual({
				success: false,
				error: {
					'': ['invalid'],
				},
			});

			expect(getResult(coerceFormValue(schema).safeParse(' '))).toEqual({
				success: false,
				error: {
					'': ['invalid'],
				},
			});
			expect(getResult(coerceFormValue(schemaWithMini).safeParse(' '))).toEqual(
				{
					success: false,
					error: {
						'': ['invalid'],
					},
				},
			);

			expect(
				getResult(coerceFormValue(schema).safeParse(new Date(0).toISOString())),
			).toEqual({
				success: false,
				error: {
					'': ['min'],
				},
			});
			expect(
				getResult(
					coerceFormValue(schemaWithMini).safeParse(new Date(0).toISOString()),
				),
			).toEqual({
				success: false,
				error: {
					'': ['min'],
				},
			});

			expect(
				getResult(coerceFormValue(schema).safeParse(new Date(5).toISOString())),
			).toEqual({
				success: true,
				data: new Date(5),
			});
			expect(
				getResult(
					coerceFormValue(schemaWithMini).safeParse(new Date(5).toISOString()),
				),
			).toEqual({
				success: true,
				data: new Date(5),
			});
		});
	});
});
