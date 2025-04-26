import {
	checkAsync,
	nullishAsync,
	number,
	objectAsync,
	pipeAsync,
	string,
} from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('nullishAsync', () => {
	test('should pass also undefined', async () => {
		const schema = objectAsync({
			name: nullishAsync(string()),
			age: nullishAsync(number()),
		});

		expect(await parseWithValibot(new FormData(), { schema })).toMatchObject({
			status: 'success',
			value: {},
		});

		const output = await parseWithValibot(createFormData('age', ''), {
			schema,
		});

		expect(output).toMatchObject({
			status: 'success',
			value: { age: undefined },
		});
		expect(
			await parseWithValibot(createFormData('age', '20'), { schema }),
		).toMatchObject({
			status: 'success',
			value: { age: 20 },
		});
		expect(
			await parseWithValibot(createFormData('age', 'non number'), { schema }),
		).toMatchObject({
			error: { age: expect.anything() },
		});
	});

	test('should pass nullish with pipe', async () => {
		const schema = objectAsync({
			age: pipeAsync(
				nullishAsync(number()),
				checkAsync(
					async (value) => value == null || value > 0,
					'age must be greater than 0',
				),
			),
		});

		const output1 = await parseWithValibot(createFormData('age', ''), {
			schema,
		});
		expect(output1).toMatchObject({
			status: 'success',
			value: { age: undefined },
		});

		const output2 = await parseWithValibot(createFormData('age', '20'), {
			schema,
		});
		expect(output2).toMatchObject({
			status: 'success',
			value: { age: 20 },
		});

		const errorOutput = await parseWithValibot(createFormData('age', '0'), {
			schema,
		});
		expect(errorOutput).toMatchObject({
			error: { age: expect.anything() },
		});
	});

	test('should use default if required', async () => {
		const default_ = 'default';

		const schema1 = objectAsync({ name: nullishAsync(string(), default_) });
		const output1 = await parseWithValibot(createFormData('name', ''), {
			schema: schema1,
		});
		expect(output1).toMatchObject({
			status: 'success',
			value: { name: 'default' },
		});

		const schema2 = objectAsync({
			name: nullishAsync(string(), () => default_),
		});
		const output2 = await parseWithValibot(createFormData('name', ''), {
			schema: schema2,
		});
		expect(output2).toMatchObject({
			status: 'success',
			value: { name: 'default' },
		});

		const schema3 = objectAsync({
			name: nullishAsync(string(), () => default_),
		});
		const output3 = await parseWithValibot(createFormData('age', '30'), {
			schema: schema3,
		});
		expect(output3).toMatchObject({
			status: 'success',
			value: { name: 'default' },
		});
	});
});
