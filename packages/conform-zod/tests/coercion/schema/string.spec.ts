import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../coercion';
import { z } from 'zod';
import { getResult } from '../../helpers/zod';

describe('coercion', () => {
	describe('z.string', () => {
		test('should pass strings', () => {
			const schema = z
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
				.refine((value) => value !== 'error', 'refine');
			const file = new File([], '');

			expect(getResult(coerceFormValue(schema).safeParse(''))).toEqual({
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
			expect(getResult(coerceFormValue(schema).safeParse('error'))).toEqual({
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
		});
	});
});
