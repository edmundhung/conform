import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../../coercion';
import { object, string, boolean, optional } from '@zod/mini';
import { getResult } from '../../../../../tests/helpers/zod';

describe('coercion', () => {
	describe('mini', () => {
		describe('object', () => {
			test('should pass object', () => {
				const schema = object({
					a: object({
						text: string({
							message: 'required',
						}),
						flag: optional(
							boolean({
								message: 'required',
							}),
						),
					}),
					b: optional(
						object({
							text: string({
								message: 'required',
							}),
							flag: boolean({
								message: 'required',
							}),
						}),
					),
				});

				expect(getResult(coerceFormValue(schema).safeParse({}))).toEqual({
					success: false,
					error: {
						'a.text': ['required'],
					},
				});
				expect(
					getResult(
						coerceFormValue(schema).safeParse({
							b: {
								text: '',
							},
						}),
					),
				).toEqual({
					success: false,
					error: {
						'a.text': ['required'],
						'b.text': ['required'],
						'b.flag': ['required'],
					},
				});
				expect(
					getResult(
						coerceFormValue(schema).safeParse({
							a: {
								text: 'foo',
							},
							b: {
								text: 'bar',
								flag: 'on',
							},
						}),
					),
				).toEqual({
					success: true,
					data: {
						a: {
							text: 'foo',
						},
						b: {
							text: 'bar',
							flag: true,
						},
					},
				});
			});
		});
	});
});
