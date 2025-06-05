import {
	checkAsync,
	forwardAsync,
	number,
	objectAsync,
	pipeAsync,
	string,
} from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('objectAsync', () => {
	test('should pass only objects', async () => {
		const schema1 = objectAsync({ key1: string(), key2: number() });
		const input1 = createFormData('key1', 'test');
		input1.append('key2', '123');
		const output1 = await parseWithValibot(input1, { schema: schema1 });
		expect(output1).toMatchObject({
			status: 'success',
			value: { key1: 'test', key2: 123 },
		});

		input1.append('key3', '');
		const output2 = await parseWithValibot(input1, { schema: schema1 });
		expect(output2.status).toBe('success');
		expect(output2.value).toStrictEqual({
			key1: 'test',
			key2: 123,
		});

		const input2 = createFormData('key1', '');
		input2.append('key2', '123');
		const output3 = await parseWithValibot(input2, { schema: schema1 });
		expect(output3).toMatchObject({
			error: {
				key1: expect.anything(),
			},
		});

		const input3 = createFormData('key1', 'string');
		input3.set('key2', 'non number');
		const output4 = await parseWithValibot(input3, { schema: schema1 });
		expect(output4).toMatchObject({
			error: {
				key2: expect.anything(),
			},
		});

		const schema2 = objectAsync({
			nest: schema1,
		});
		const input4 = new FormData();
		const output5 = await parseWithValibot(input4, { schema: schema2 });
		expect(output5).toMatchObject({
			error: {
				'nest.key1': expect.anything(),
				'nest.key2': expect.anything(),
			},
		});
	});

	test('should pass objects with pipe', async () => {
		const schema = pipeAsync(
			objectAsync({
				key: string(),
			}),
			forwardAsync(
				checkAsync(async ({ key }) => key !== 'error name', 'key is error'),
				['key'],
			),
		);

		const output = await parseWithValibot(createFormData('key', 'valid'), {
			schema,
		});
		expect(output).toMatchObject({
			status: 'success',
			value: { key: 'valid' },
		});

		const errorOutput = await parseWithValibot(
			createFormData('key', 'error name'),
			{
				schema,
			},
		);
		expect(errorOutput).toMatchObject({
			error: {
				key: expect.anything(),
			},
		});
	});

	test('should fail with check on object', async () => {
		const schema = pipeAsync(
			objectAsync({
				key1: string(),
				key2: string(),
			}),
			checkAsync(({ key1, key2 }) => key1 === key2, 'keys must match'),
		);

		const input = createFormData('key1', 'foo');
		input.append('key2', 'bar');

		const errorOutput = await parseWithValibot(input, {
			schema,
		});

		expect(errorOutput).toMatchObject({
			error: {
				'': ['keys must match'],
			},
		});
	});
});
