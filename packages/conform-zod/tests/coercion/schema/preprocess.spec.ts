import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../coercion';
import { z } from 'zod';
import { getResult } from '../../helpers/zod';

describe('coercion', () => {
	describe('z.preprocess', () => {
		test('should pass preprocess', () => {
			const schemaWithNoPreprocess = z.number({
				message: 'invalid',
			});
			const schemaWithCustomPreprocess = z.preprocess(
				(value) => {
					if (typeof value !== 'string') {
						return value;
					} else if (value === '') {
						return undefined;
					} else {
						return value.replace(/,/g, '');
					}
				},
				z.number({ message: 'invalid' }),
			);

			expect(
				getResult(coerceFormValue(schemaWithNoPreprocess).safeParse('1,234.5')),
			).toEqual({
				success: false,
				error: {
					'': ['invalid'],
				},
			});
			expect(
				getResult(
					coerceFormValue(schemaWithCustomPreprocess).safeParse('1,234.5'),
				),
			).toEqual({
				success: true,
				data: 1234.5,
			});
		});
	});
});
