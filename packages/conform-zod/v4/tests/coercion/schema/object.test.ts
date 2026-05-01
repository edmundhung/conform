import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../coercion';
import { z } from 'zod-v4';
import { object, string, boolean, optional } from 'zod-v4/mini';
import { getResult } from '../../../../tests/helpers/zod';

describe('coercion', () => {
	describe('z.object', () => {
		test('should pass object', () => {
			const schema = z.object({
				a: z.object({
					text: z.string({
						message: 'required',
					}),
					flag: z
						.boolean({
							message: 'required',
						})
						.optional(),
				}),
				b: z
					.object({
						text: z.string({
							message: 'required',
						}),
						flag: z.boolean({
							message: 'required',
						}),
					})
					.optional(),
			});
			const schemaWithMini = object({
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
			expect(getResult(coerceFormValue(schemaWithMini).safeParse({}))).toEqual({
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
					coerceFormValue(schemaWithMini).safeParse({
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
			expect(
				getResult(
					coerceFormValue(schemaWithMini).safeParse({
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

		test('should not leak missing-field optionality to reused schemas', () => {
			const items = z.array(z.string());
			const schema = z.object({
				items,
				union: z.union([z.literal('other'), items]),
			});
			const coerced = coerceFormValue(schema);
			const shape = (
				coerced as unknown as {
					_zod: {
						def: {
							out: {
								_zod: {
									def: {
										shape: {
											items: {
												_zod: {
													optin?: 'optional';
												};
											};
											union: {
												_zod: {
													def: {
														options: [
															{ _zod: { optin?: 'optional' } },
															{ _zod: { optin?: 'optional' } },
														];
													};
												};
											};
										};
									};
								};
							};
						};
					};
				}
			)._zod.def.out._zod.def.shape;

			expect(shape.items._zod.optin).toBe('optional');
			expect(shape.union._zod.def.options[1]._zod.optin).toBeUndefined();
		});
	});
});
