import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../coercion';
import { z } from 'zod-v4';
import { string, minLength, maxLength, regex, refine, lazy } from 'zod-v4/mini';
import { getResult } from '../../../../tests/helpers/zod';

describe('coercion', () => {
	describe('z.lazy', () => {
		test('should pass lazy', () => {
			const schema = z.lazy(() =>
				z
					.string({
						error: (ctx) => {
							if (ctx.input === undefined) {
								return 'required';
							}

							return 'invalid';
						},
					})
					.min(10, 'min')
					.max(100, 'max')
					.regex(/^[A-Z]{1,100}$/, { message: 'regex' })
					.refine((value) => value !== 'error', 'refine'),
			);
			const schemaWithMini = lazy(() =>
				string({
					error: (ctx) => {
						if (ctx.input === undefined) {
							return 'required';
						}

						return 'invalid';
					},
				}).check(
					minLength(10, 'min'),
					maxLength(100, 'max'),
					regex(/^[A-Z]{1,100}$/, { message: 'regex' }),
					refine((value) => value !== 'error', 'refine'),
				),
			);
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

			expect(getResult(coerceFormValue(schema).safeParse('error'))).toEqual({
				success: false,
				error: {
					'': ['min', 'regex', 'refine'],
				},
			});
			expect(
				getResult(coerceFormValue(schemaWithMini).safeParse('error')),
			).toEqual({
				success: false,
				error: {
					'': ['min', 'regex', 'refine'],
				},
			});

			expect(
				getResult(coerceFormValue(schema).safeParse('ABCDEFGHIJ')),
			).toEqual({
				success: true,
				data: 'ABCDEFGHIJ',
			});
			expect(
				getResult(coerceFormValue(schemaWithMini).safeParse('ABCDEFGHIJ')),
			).toEqual({
				success: true,
				data: 'ABCDEFGHIJ',
			});
		});
	});
});
