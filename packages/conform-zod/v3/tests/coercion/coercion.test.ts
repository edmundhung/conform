import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../coercion';
import { z } from 'zod/v3';
import { getResult } from '../../../tests/helpers/zod';

describe('coercion', () => {
	describe('coerceFormValue', () => {
		test('customize default coercion', () => {
			const exampleFile = new File(['hello', 'world'], 'example.txt');
			const schema = z.object({
				title: z.string({ required_error: 'required' }),
				count: z.number({
					required_error: 'required',
					invalid_type_error: 'invalid',
				}),
				amount: z.bigint({
					required_error: 'required',
					invalid_type_error: 'invalid',
				}),
				date: z.date({
					required_error: 'required',
					invalid_type_error: 'invalid',
				}),
				confirmed: z.boolean({
					required_error: 'required',
					invalid_type_error: 'invalid',
				}),
				file: z.instanceof(File, { message: 'message' }),
			});

			expect(
				getResult(
					coerceFormValue(schema, {
						defaultCoercion: {
							string: false,
							number: false,
							bigint: false,
							date: false,
							boolean: false,
							file: false,
						},
					}).safeParse({
						title: '',
						count: '123456',
						amount: '9876543210',
						date: '1970-01-01',
						confirmed: 'on',
						file: '',
					}),
				),
			).toEqual({
				success: false,
				error: {
					title: ['required'],
					amount: ['invalid'],
					count: ['invalid'],
					date: ['invalid'],
					confirmed: ['invalid'],
					file: ['message'],
				},
			});

			expect(
				getResult(
					coerceFormValue(schema, {
						defaultCoercion: {
							string(value) {
								if (typeof value !== 'string') {
									return value;
								}
								// Trim the text
								const text = value.trim();

								if (text === '') {
									return undefined;
								}

								return text;
							},
						},
					}).safeParse({
						title: ' ',
						count: ' ',
						amount: ' ',
						date: ' ',
						confirmed: ' ',
						file: exampleFile,
					}),
				),
			).toEqual({
				success: false,
				error: {
					title: ['required'],
					amount: ['required'],
					count: ['required'],
					date: ['required'],
					confirmed: ['required'],
				},
			});

			expect(
				getResult(
					coerceFormValue(schema, {
						defaultCoercion: {
							number(value) {
								if (typeof value !== 'string') {
									return value;
								}

								// Remove commas and space
								return Number(value.trim().replace(/,/g, ''));
							},
							boolean(value) {
								if (typeof value !== 'string') {
									return value;
								}

								// Convert "true" to boolean instead of "on"
								return value === 'true';
							},
						},
					}).safeParse({
						title: ' example ',
						count: ' 123,456 ',
						amount: '9876543210',
						date: '1970-01-01',
						confirmed: 'true',
						file: exampleFile,
					}),
				),
			).toEqual({
				success: true,
				data: {
					title: ' example ',
					count: 123456,
					amount: 9876543210n,
					date: new Date('1970-01-01'),
					confirmed: true,
					file: exampleFile,
				},
			});
		});

		test('customize coercion', () => {
			const Payment = z.object({
				count: z.number({
					required_error: 'required',
					invalid_type_error: 'invalid',
				}),
				amount: z.bigint({
					required_error: 'required',
					invalid_type_error: 'invalid',
				}),
				date: z.date({
					required_error: 'required',
					invalid_type_error: 'invalid',
				}),
				confirmed: z.boolean({ invalid_type_error: 'invalid' }),
			});
			const schema = z.object({
				title: z.string({ required_error: 'required' }),
				payment: Payment,
			});

			expect(
				getResult(
					coerceFormValue(schema, {
						customize(type) {
							if (type === Payment) {
								return (value) => {
									if (typeof value !== 'string') {
										return value;
									}

									return JSON.parse(value);
								};
							}

							return null;
						},
					}).safeParse({
						title: 'Test',
						payment: JSON.stringify({
							count: 123,
							confirmed: true,
							amount: '123456',
						}),
					}),
				),
			).toEqual({
				success: false,
				error: {
					'payment.amount': ['invalid'],
					'payment.date': ['required'],
				},
			});
		});
	});
});
