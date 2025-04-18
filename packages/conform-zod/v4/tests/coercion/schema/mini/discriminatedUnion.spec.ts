import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../../coercion';
import {
	discriminatedUnion,
	object,
	literal,
	number,
	boolean,
} from '@zod/mini';
import { getResult } from '../../../../../tests/helpers/zod';

describe('coercion', () => {
	describe('mini', () => {
		describe('discriminatedUnion', () => {
			test('should pass discriminatedUnion', () => {
				const schema = discriminatedUnion([
					object({
						type: literal('a'),
						number: number(),
					}),
					object({
						type: literal('b'),
						boolean: boolean(),
					}),
				]);

				expect(
					getResult(
						coerceFormValue(schema).safeParse({
							type: 'a',
							number: '1',
						}),
					),
				).toEqual({
					success: true,
					data: {
						type: 'a',
						number: 1,
					},
				});
				expect(
					getResult(
						coerceFormValue(schema).safeParse({
							type: 'b',
							boolean: 'on',
						}),
					),
				).toEqual({
					success: true,
					data: {
						type: 'b',
						boolean: true,
					},
				});
			});
		});
	});
});
