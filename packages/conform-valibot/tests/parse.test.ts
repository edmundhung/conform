import {
	check,
	number,
	object,
	optional,
	pipe,
	string,
	transform,
	unknown,
} from 'valibot';
import { describe, expect, test } from 'vitest';
import { conformValibotMessage, parseWithValibot } from '../parse';
import { createFormData } from './helpers/FormData';

describe('parseWithValibot', () => {
	describe('config', () => {
		describe('disableAutoCoercion', () => {
			test('should validate without automatic schema conversion when disableAutoCoercion is true', () => {
				const schema1 = object({
					name: string(),
					age: number(),
				});
				const input = createFormData('age', '26');
				input.append('name', '');
				const output1 = parseWithValibot(input, {
					schema: schema1,
					disableAutoCoercion: true,
				});
				expect(output1).toMatchObject({
					error: {
						age: expect.anything(),
					},
				});

				const schema2 = object({
					name: string(),
					age: pipe(
						unknown(),
						transform((v) => Number(v)),
						number(),
					),
				});
				const output2 = parseWithValibot(input, {
					schema: schema2,
					disableAutoCoercion: true,
				});
				expect(output2).toMatchObject({
					status: 'success',
					value: { name: '', age: 26 },
				});
			});
		});

		test('should validate with automatic schema conversion when disableAutoCoercion is false', () => {
			const schema = object({
				name: optional(string()),
				age: number(),
			});
			const input = createFormData('age', '26');
			input.append('name', '');
			const output = parseWithValibot(input, {
				schema,
			});
			expect(output).toMatchObject({
				status: 'success',
				value: { name: undefined, age: 26 },
			});
		});
	});

	test('should return null for an error field when its error message is skipped', () => {
		const schema = object({
			key: pipe(
				string(),
				check(
					(input) => input === 'valid',
					conformValibotMessage.VALIDATION_SKIPPED,
				),
			),
		});
		const output = parseWithValibot(createFormData('key', 'invalid'), {
			schema,
		});
		expect(output).toMatchObject({ error: { key: null } });
	});

	test('should return null for the error when any error message is undefined', () => {
		const schema = object({
			key: pipe(
				string(),
				check(
					(input) => input === 'valid',
					conformValibotMessage.VALIDATION_UNDEFINED,
				),
			),
		});
		const output = parseWithValibot(createFormData('key', 'invalid'), {
			schema,
		});
		expect(output).toMatchObject({ error: null });
	});
});
