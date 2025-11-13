import { describe, test, expect } from 'vitest';
import { parseWithZod, conformZodMessage } from '../parse';
import { z } from 'zod/v3';
import { createFormData } from '../../tests/helpers/FromData';

describe('parse', () => {
	describe('parseWithZod', () => {
		test('parseWithZod with errorMap', () => {
			const schema = z.object({
				text: z.string().min(5),
			});
			const formData = createFormData([['text', 'abc']]);

			expect(
				parseWithZod(formData, {
					schema,
					errorMap(error, ctx) {
						if (error.code === 'too_small' && error.minimum === 5) {
							return { message: 'The field is too short' };
						}

						// fall back to default message!
						return { message: ctx.defaultError };
					},
				}),
			).toEqual({
				status: 'error',
				payload: {
					text: 'abc',
				},
				error: {
					text: ['The field is too short'],
				},
				reply: expect.any(Function),
			});
		});

		test('parseWithZod with custom message', async () => {
			const createSchema = (
				validate?: (email: string) => Promise<boolean>,
				when = true,
			) =>
				z.object({
					email: z
						.string()
						.email()
						.superRefine((email, ctx) => {
							if (!when) {
								ctx.addIssue({
									code: 'custom',
									message: conformZodMessage.VALIDATION_SKIPPED,
								});
								return;
							}

							if (typeof validate === 'undefined') {
								ctx.addIssue({
									code: 'custom',
									message: conformZodMessage.VALIDATION_UNDEFINED,
								});
								return;
							}

							return validate(email).then((valid) => {
								if (!valid) {
									ctx.addIssue({
										code: 'custom',
										message: 'Email is invalid',
									});
								}
							});
						}),
				});
			const formData = createFormData([['email', 'test@example.com']]);
			const submission = {
				payload: {
					email: 'test@example.com',
				},
				reply: expect.any(Function),
			};

			expect(parseWithZod(formData, { schema: createSchema() })).toEqual({
				...submission,
				status: 'error',
				error: null,
			});
			expect(
				await parseWithZod(formData, {
					schema: createSchema(() => Promise.resolve(false)),
					async: true,
				}),
			).toEqual({
				...submission,
				status: 'error',
				error: {
					email: ['Email is invalid'],
				},
			});
			expect(
				await parseWithZod(formData, {
					schema: createSchema(() => Promise.resolve(true)),
					async: true,
				}),
			).toEqual({
				...submission,
				status: 'success',
				value: submission.payload,
			});
			expect(
				await parseWithZod(formData, {
					schema: createSchema(() => Promise.resolve(true), false),
					async: true,
				}),
			).toEqual({
				...submission,
				status: 'error',
				error: {
					email: null,
				},
			});
			expect(
				await parseWithZod(formData, {
					schema: createSchema(() => Promise.resolve(false), false),
					async: true,
				}),
			).toEqual({
				...submission,
				status: 'error',
				error: {
					email: null,
				},
			});
			expect(
				await parseWithZod(formData, {
					schema: createSchema(() => Promise.resolve(false), true),
					async: true,
				}),
			).toEqual({
				...submission,
				status: 'error',
				error: {
					email: ['Email is invalid'],
				},
			});
			expect(
				await parseWithZod(formData, {
					schema: createSchema(() => Promise.resolve(true), true),
					async: true,
				}),
			).toEqual({
				...submission,
				status: 'success',
				value: submission.payload,
			});
		});

		test('parseWithZod with disableAutoCoercion', async () => {
			const schema = z.object({
				text: z.string(),
				number: z.number({ invalid_type_error: 'invalid' }),
				boolean: z.boolean({ invalid_type_error: 'invalid' }),
				bigint: z.bigint({ invalid_type_error: 'invalid' }),
				date: z.date({ invalid_type_error: 'invalid' }),
				file: z.instanceof(File, { message: 'invalid' }),
			});
			const formData = createFormData([
				['text', 'abc'],
				['number', '1'],
				['boolean', 'on'],
				['bigint', '1'],
				['date', '1970-01-01'],
				['file', new File([], '')],
			]);

			expect(
				parseWithZod(formData, {
					schema,
					disableAutoCoercion: true,
				}),
			).toEqual({
				status: 'error',
				payload: {
					text: 'abc',
					number: '1',
					boolean: 'on',
					bigint: '1',
					date: '1970-01-01',
					file: new File([], ''),
				},
				error: {
					number: ['invalid'],
					boolean: ['invalid'],
					bigint: ['invalid'],
					date: ['invalid'],
				},
				reply: expect.any(Function),
			});
		});
	});
});
