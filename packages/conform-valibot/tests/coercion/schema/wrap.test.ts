import {
	check,
	isoDate,
	literal,
	nullable,
	number,
	object,
	optional,
	pipe,
	string,
	union,
} from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('wrap', () => {
	test('should pass also undefined', () => {
		const schema = object({ name: optional(nullable(string()), null) });
		const output = parseWithValibot(createFormData('name', ''), { schema });
		expect(output).toMatchObject({ status: 'success', value: { name: null } });
	});

	test('should pass with nested pipe object', () => {
		const schema = object({
			key1: string(),
			key2: optional(
				pipe(
					object({
						date: optional(pipe(string(), isoDate())),
					}),
					check((input) => input?.date !== '2000-01-01', 'Bad date'),
				),
			),
		});

		const input = createFormData('key1', 'valid');
		input.append('key2.date', '');

		const output = parseWithValibot(input, {
			schema,
		});

		expect(output).toMatchObject({
			status: 'success',
			value: { key1: 'valid', key2: {} },
		});
	});

	test('should pass with directly nested pipe object', () => {
		const schema = pipe(
			pipe(
				object({
					key: number(),
				}),
				check(({ key }) => key > 0, 'key is not positive'),
			),
			check(({ key }) => key % 2 === 0, 'key is not even'),
		);

		const output = parseWithValibot(createFormData('key', '2'), {
			schema,
		});
		expect(output).toMatchObject({
			status: 'success',
			value: { key: 2 },
		});

		const errorOutput1 = parseWithValibot(createFormData('key', '-2'), {
			schema,
		});
		expect(errorOutput1).toMatchObject({
			error: {
				'': ['key is not positive'],
			},
		});

		const errorOutput2 = parseWithValibot(createFormData('key', '1'), {
			schema,
		});
		expect(errorOutput2).toMatchObject({
			error: {
				'': ['key is not even'],
			},
		});
	});

	test('should coerce fields inside optional object', () => {
		const schema = object({
			nested: optional(object({ num: number() })),
		});

		const output = parseWithValibot(createFormData('nested.num', '42'), {
			schema,
		});
		expect(output).toMatchObject({
			status: 'success',
			value: { nested: { num: 42 } },
		});
	});

	test('should pass wrapped union', () => {
		const schema = object({
			union: optional(union([number(), literal('test')])),
		});

		const output1 = parseWithValibot(createFormData('union', '30'), { schema });
		expect(output1).toMatchObject({ status: 'success', value: { union: 30 } });

		const output2 = parseWithValibot(createFormData('union', 'test'), {
			schema,
		});
		expect(output2).toMatchObject({
			status: 'success',
			value: { union: 'test' },
		});

		const output3 = parseWithValibot(createFormData('union', ''), { schema });
		expect(output3).toMatchObject({
			status: 'success',
			value: { union: undefined },
		});

		const errorOutput = parseWithValibot(
			createFormData('union', 'non number'),
			{ schema },
		);
		expect(errorOutput).toMatchObject({
			error: {
				union: expect.anything(),
			},
		});
	});
});
