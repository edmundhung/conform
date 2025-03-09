import {
	checkAsync,
	number,
	objectAsync,
	optionalAsync,
	pipeAsync,
	string,
	tupleWithRestAsync,
} from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('tupleWithRestAsync', () => {
	test('should pass only tuples', async () => {
		const schema1 = objectAsync({
			tuple: tupleWithRestAsync([string()], optionalAsync(number())),
		});
		const input2 = createFormData('tuple[]', 'test');
		const output2 = await parseWithValibot(input2, { schema: schema1 });
		expect(output2).toMatchObject({
			status: 'success',
			value: { tuple: ['test'] },
		});
		const input3 = createFormData('tuple', 'test');
		input3.append('tuple', '');
		const output3 = await parseWithValibot(input3, { schema: schema1 });
		expect(output3).toMatchObject({
			status: 'success',
			value: { tuple: ['test', undefined] },
		});
		const input4 = createFormData('tuple', 'test');
		input4.append('tuple', '1');
		input4.append('tuple', '2');
		const output4 = await parseWithValibot(input4, { schema: schema1 });
		expect(output4).toMatchObject({
			status: 'success',
			value: { tuple: ['test', 1, 2] },
		});
	});

	test('should pass tuples with pipe', async () => {
		const schema = objectAsync({
			tuple: pipeAsync(
				tupleWithRestAsync([string()], optionalAsync(number())),
				checkAsync(
					async (v) => v.length > 2,
					'tuple must have more than 1 element',
				),
			),
		});
		const input = createFormData('tuple', 'test');
		input.append('tuple', '1');
		input.append('tuple', '2');
		const output = await parseWithValibot(input, { schema });
		expect(output).toMatchObject({
			status: 'success',
			value: { tuple: ['test', 1, 2] },
		});

		const errorInput = createFormData('tuple', 'test');
		errorInput.append('tuple', '1');
		expect(await parseWithValibot(errorInput, { schema })).toMatchObject({
			error: { tuple: expect.anything() },
		});
	});
});
