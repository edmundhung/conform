import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../../coercion';
import { pipe, transform, number } from '@zod/mini';
import { getResult } from '../../../helpers/zod';

describe('coercion', () => {
	describe('mini', () => {
		describe('transform(preprocess)', () => {
			test('should pass preprocess', () => {
				const schemaWithNoPreprocess = number({
					message: 'invalid',
				});
				const schemaWithCustomPreprocess = pipe(
					transform((value) => {
						if (typeof value !== 'string') {
							return value;
						} else if (value === '') {
							return undefined;
						} else {
							return value.replace(/,/g, '');
						}
					}),
					number({ message: 'invalid' }),
				);

				expect(
					getResult(
						coerceFormValue(schemaWithNoPreprocess).safeParse('1,234.5'),
					),
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
});
