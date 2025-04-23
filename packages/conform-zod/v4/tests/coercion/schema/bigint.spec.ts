import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../coercion';
import { z } from 'zod-4';
import { bigint, minimum, maximum, multipleOf } from '@zod/mini';
import { getResult } from '../../../../tests/helpers/zod';

describe('coercion', () => {
	describe('z.bigint', () => {
		test('should pass bigint', () => {
			const schema = z
				.bigint({
					error: (ctx) => {
						if (ctx.input === undefined) {
							return 'required';
						}
						return 'invalid';
					},
				})
				.min(1n, 'min')
				.max(10n, 'max')
				.multipleOf(2n, 'step');
			const schemaWithMini = bigint({
				error: (ctx) => {
					if (ctx.input === undefined) {
						return 'required';
					}
					return 'invalid';
				},
			}).check(minimum(1n, 'min'), maximum(10n, 'max'), multipleOf(2n, 'step'));
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

			expect(getResult(coerceFormValue(schema).safeParse('4'))).toEqual({
				success: true,
				data: 4n,
			});
			expect(getResult(coerceFormValue(schemaWithMini).safeParse('4'))).toEqual(
				{
					success: true,
					data: 4n,
				},
			);
		});
	});
});
