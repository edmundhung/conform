import { check, forward, looseObject, number, pipe, string } from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('looseObject', () => {
	test('should pass only loose objects', () => {
		const schema1 = looseObject({ key1: string(), key2: number() });
		const input1 = createFormData('key1', 'test');
		input1.append('key2', '123');
		const output1 = parseWithValibot(input1, { schema: schema1 });
		expect(output1).toMatchObject({
			status: 'success',
			value: { key1: 'test', key2: 123 },
		});

		input1.append('key3', '');
		const output2 = parseWithValibot(input1, { schema: schema1 });
		expect(output2.status).toBe('success');
		// @ts-expect-error
		expect(output2.value).toStrictEqual({
			key1: 'test',
			key2: 123,
			key3: '',
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

		const schema2 = looseObject({
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
			looseObject({
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
