import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../coercion';
import { z } from 'zod/v4';
import { number, minimum, maximum, multipleOf } from 'zod/v4-mini';
import { getResult } from '../../../../tests/helpers/zod';

describe('coercion', () => {
	describe('z.number', () => {
		test('should pass numbers', () => {
			const schema = z
				.number({
					error: (ctx) => {
						if (ctx.input === undefined) {
							return 'required';
						}
						return 'invalid';
					},
				})
				.min(1, 'min')
				.max(10, 'max')
				.multipleOf(2, 'step');
			const schemaWithMini = number({
				error: (ctx) => {
					if (ctx.input === undefined) {
						return 'required';
					}
					return 'invalid';
				},
			}).check(minimum(1, 'min'), maximum(10, 'max'), multipleOf(2, 'step'));
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

			expect(getResult(coerceFormValue(schema).safeParse('5'))).toEqual({
				success: false,
				error: {
					'': ['step'],
				},
			});
			expect(getResult(coerceFormValue(schemaWithMini).safeParse('5'))).toEqual(
				{
					success: false,
					error: {
						'': ['step'],
					},
				},
			);

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

			expect(getResult(coerceFormValue(schema).safeParse('6'))).toEqual({
				success: true,
				data: 6,
			});
			expect(getResult(coerceFormValue(schemaWithMini).safeParse('6'))).toEqual(
				{
					success: true,
					data: 6,
				},
			);
		});
	});
});
