import {
	checkAsync,
	forwardAsync,
	looseObjectAsync,
	number,
	pipeAsync,
	string,
} from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('looseObjectAsync', () => {
	test('should pass only loose objects', async () => {
		const schema1 = looseObjectAsync({ key1: string(), key2: number() });
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
		// @ts-expect-error
		expect(output2.value).toStrictEqual({
			key1: 'test',
			key2: 123,
			key3: '',
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
	});

	test('should pass objects with pipe', async () => {
		const schema = pipeAsync(
			looseObjectAsync({
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
});
