import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../../coercion';
import {
	object,
	string,
	number,
	boolean,
	date,
	file,
	array,
	optional,
} from '@zod/mini';
import { getResult } from '../../../../../tests/helpers/zod';

describe('coercion', () => {
	describe('mini', () => {
		describe('optional', () => {
			test('should pass optional', () => {
				const schema = object({
					a: optional(string()),
					b: optional(number()),
					c: optional(boolean()),
					d: optional(date()),
					e: optional(file()),
					f: array(optional(string())),
					g: optional(array(string())),
				});
				const emptyFile = new File([], '');

				expect(getResult(coerceFormValue(schema).safeParse({}))).toEqual({
					success: true,
					data: {
						a: undefined,
						b: undefined,
						c: undefined,
						d: undefined,
						e: undefined,
						f: [],
						g: undefined,
					},
				});
				expect(
					getResult(
						coerceFormValue(schema).safeParse({
							a: '',
							b: '',
							c: '',
							d: '',
							e: emptyFile,
							f: '',
							g: '',
						}),
					),
				).toEqual({
					success: true,
					data: {
						a: undefined,
						b: undefined,
						c: undefined,
						d: undefined,
						e: undefined,
						f: [],
						g: undefined,
					},
				});

				expect(() =>
					getResult(coerceFormValue(schema).safeParse({})),
				).not.toThrow();
			});
		});
	});
});
