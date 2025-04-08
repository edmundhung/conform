import {
	checkAsync,
	isoDate,
	literal,
	nullableAsync,
	number,
	object,
	objectAsync,
	optionalAsync,
	pipeAsync,
	string,
	unionAsync,
} from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('wrapAsync', () => {
	test('should pass also undefined', async () => {
		const schema = objectAsync({
			name: optionalAsync(nullableAsync(string()), null),
		});
		const output = await parseWithValibot(createFormData('name', ''), {
			schema,
		});
		expect(output).toMatchObject({ status: 'success', value: { name: null } });
	});

	test('should pass with nested pipe object', async () => {
		const schema = objectAsync({
			key1: string(),
			key2: optionalAsync(
				pipeAsync(
					objectAsync({
						date: optionalAsync(pipeAsync(string(), isoDate())),
					}),
					checkAsync((input) => input?.date !== '2000-01-01', 'Bad date'),
				),
			),
		});

		const input = createFormData('key1', 'valid');
		input.append('key2.date', '');

		const output = await parseWithValibot(input, {
			schema,
		});

		expect(output).toMatchObject({
			status: 'success',
			value: { key1: 'valid', key2: {} },
		});
	});

	test('should pass with directly nested pipe object', async () => {
		const schema = pipeAsync(
			pipeAsync(
				objectAsync({
					key: number(),
				}),
				checkAsync(({ key }) => key > 0, 'key is not positive'),
			),
			checkAsync(({ key }) => key % 2 === 0, 'key is not even'),
		);

		const output = await parseWithValibot(createFormData('key', '2'), {
			schema,
		});
		expect(output).toMatchObject({
			status: 'success',
			value: { key: 2 },
		});

		const errorOutput1 = await parseWithValibot(createFormData('key', '-2'), {
			schema,
		});
		expect(errorOutput1).toMatchObject({
			error: {
				'': ['key is not positive'],
			},
		});

		const errorOutput2 = await parseWithValibot(createFormData('key', '1'), {
			schema,
		});
		expect(errorOutput2).toMatchObject({
			error: {
				'': ['key is not even'],
			},
		});
	});

	test('should pass sync object with async pipe', async () => {
		const schema = pipeAsync(
			object({
				key: string(),
			}),
			checkAsync(async ({ key }) => key !== 'error name', 'key is error'),
		);

		const output = await parseWithValibot(createFormData('key', 'valid'), {
			schema,
		});
		expect(output).toMatchObject({
			status: 'success',
			value: { key: 'valid' },
		});
	});

	test('should pass wrapped async union', async () => {
		const schema = objectAsync({
			union: optionalAsync(unionAsync([number(), literal('test')])),
		});

		const output1 = await parseWithValibot(createFormData('union', '30'), {
			schema,
		});
		expect(output1).toMatchObject({ status: 'success', value: { union: 30 } });

		const output2 = await parseWithValibot(createFormData('union', 'test'), {
			schema,
		});
		expect(output2).toMatchObject({
			status: 'success',
			value: { union: 'test' },
		});

		const output3 = await parseWithValibot(createFormData('union', ''), {
			schema,
		});
		expect(output3).toMatchObject({
			status: 'success',
			value: { union: undefined },
		});

		const errorOutput = await parseWithValibot(
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
