import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../coercion';
import { z } from 'zod';
import { getResult } from '../../../../tests/helpers/zod';

describe('coercion', () => {
	describe('z.boolean', () => {
		test('should pass boolean', () => {
			const schema = z.boolean({
				required_error: 'required',
				invalid_type_error: 'invalid',
			});
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
			expect(getResult(coerceFormValue(schema).safeParse('true'))).toEqual({
				success: false,
				error: {
					'': ['invalid'],
				},
			});
			expect(getResult(coerceFormValue(schema).safeParse('on'))).toEqual({
				success: true,
				data: true,
			});
		});
	});
});
