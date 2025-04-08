import { check, number, object, pipe, string, tuple } from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('tuple', () => {
	test('should pass only tuples', () => {
		const schema1 = object({ tuple: tuple([number(), string()]) });
		const input1 = createFormData('tuple', '1');
		input1.append('tuple', 'test');
		const output1 = parseWithValibot(input1, { schema: schema1 });
		expect(output1).toMatchObject({
			status: 'success',
			value: { tuple: [1, 'test'] },
		});
		const input2 = createFormData('tuple', '1');
		input2.append('tuple', 'test');
		input2.append('tuple', '');
		const output2 = parseWithValibot(input2, { schema: schema1 });
		expect(output2).toMatchObject({
			status: 'success',
			value: { tuple: [1, 'test'] },
		});

		const errorInput1 = createFormData('tuple', '1');
		expect(parseWithValibot(errorInput1, { schema: schema1 })).toMatchObject({
			error: { tuple: expect.anything() },
		});
		const errorInput2 = createFormData('tuple', '123');
		expect(parseWithValibot(errorInput2, { schema: schema1 })).toMatchObject({
			error: { tuple: expect.anything() },
		});
	});

	test('should pass only tuples with pipe', () => {
		const schema = object({
			tuple: pipe(
				tuple([number(), string()]),
				check(([num]) => num > 0, 'num is not greater than 0'),
			),
		});

		const input = createFormData('tuple', '1');
		input.append('tuple', 'test');
		const output = parseWithValibot(input, {
			schema,
		});
		expect(output).toMatchObject({
			status: 'success',
			value: { tuple: [1, 'test'] },
		});

		const errorInput = createFormData('tuple', '0');
		errorInput.append('tuple', 'test');
		expect(parseWithValibot(errorInput, { schema })).toMatchObject({
			error: { tuple: expect.anything() },
		});
	});
});
