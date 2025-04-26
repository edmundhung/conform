import { check, forward, number, pipe, strictObject, string } from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('strictObject', () => {
	test('should pass only strict objects', () => {
		const schema1 = strictObject({ key1: string(), key2: number() });
		const input1 = createFormData('key1', 'test');
		input1.append('key2', '123');
		const output1 = parseWithValibot(input1, { schema: schema1 });
		expect(output1).toMatchObject({
			status: 'success',
			value: { key1: 'test', key2: 123 },
		});

		input1.append('key3', '');
		const output2 = parseWithValibot(input1, { schema: schema1 });
		expect(output2).toMatchObject({
			error: {
				key3: expect.anything(),
			},
		});

		const input2 = createFormData('key1', '');
		input2.append('key2', '123');
		const output3 = parseWithValibot(input2, { schema: schema1 });
		expect(output3).toMatchObject({
			error: {
				key1: expect.anything(),
			},
		});

		const input3 = createFormData('key1', 'string');
		input3.set('key2', 'non number');
		const output4 = parseWithValibot(input3, { schema: schema1 });
		expect(output4).toMatchObject({
			error: {
				key2: expect.anything(),
			},
		});

		const schema2 = strictObject({
			nest: schema1,
		});
		const input4 = new FormData();
		const output5 = parseWithValibot(input4, { schema: schema2 });
		expect(output5).toMatchObject({
			error: {
				'nest.key1': expect.anything(),
				'nest.key2': expect.anything(),
			},
		});
	});

	test('should pass objects with pipe', () => {
		const schema = pipe(
			strictObject({
				key: string(),
			}),
			forward(
				check(({ key }) => key !== 'error name', 'key is error'),
				['key'],
			),
		);

		const output = parseWithValibot(createFormData('key', 'valid'), {
			schema,
		});
		expect(output).toMatchObject({
			status: 'success',
			value: { key: 'valid' },
		});

		const errorOutput = parseWithValibot(createFormData('key', 'error name'), {
			schema,
		});
		expect(errorOutput).toMatchObject({
			error: {
				key: expect.anything(),
			},
		});
	});
});
