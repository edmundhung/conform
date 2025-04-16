import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../../coercion';
import { bigint, minimum, maximum, multipleOf } from '@zod/mini';
import { getResult } from '../../../helpers/zod';

describe('coercion', () => {
	describe('mini', () => {
		describe('bigint', () => {
			test('should pass bigint', () => {
				const schema = bigint({
					error: (ctx) => {
						if (ctx.input === undefined) {
							return 'required';
						}
						return 'invalid';
					},
				}).check(
					minimum(1n, 'min'),
					maximum(10n, 'max'),
					multipleOf(2n, 'step'),
				);
				const file = new File([], '');

				expect(getResult(coerceFormValue(schema).safeParse(''))).toEqual({
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
				expect(getResult(coerceFormValue(schema).safeParse(file))).toEqual({
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
				expect(getResult(coerceFormValue(schema).safeParse('5'))).toEqual({
					success: false,
					error: {
						'': ['step'],
					},
				});
				expect(getResult(coerceFormValue(schema).safeParse('4'))).toEqual({
					success: true,
					data: 4n,
				});
			});
		});
	});
});
