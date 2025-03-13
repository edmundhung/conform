import { check, number, object, pipe, undefined_, union } from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('union', () => {
	test('should pass only union values', () => {
		const schema = object({ age: union([number(), undefined_()]) });
		const output1 = parseWithValibot(createFormData('age', '30'), { schema });
		expect(output1).toMatchObject({ status: 'success', value: { age: 30 } });

		const output2 = parseWithValibot(createFormData('age', ''), { schema });
		expect(output2).toMatchObject({
			status: 'success',
			value: { age: undefined },
		});

		expect(
			parseWithValibot(createFormData('age', 'non number'), { schema }),
		).toMatchObject({
			error: {
				age: expect.anything(),
			},
		});
	});

	test('should pass only union values with pipe', () => {
		const schema = object({
			age: pipe(
				union([number(), undefined_()]),
				check(
					(value) => value == null || value > 0,
					'age must be greater than 0',
				),
			),
		});

		const output1 = parseWithValibot(createFormData('age', '30'), { schema });
		expect(output1).toMatchObject({ status: 'success', value: { age: 30 } });

		const output2 = parseWithValibot(createFormData('age', ''), { schema });
		expect(output2).toMatchObject({
			status: 'success',
			value: { age: undefined },
		});

		const errorOutput1 = parseWithValibot(createFormData('age', 'non number'), {
			schema,
		});
		expect(errorOutput1).toMatchObject({
			error: {
				age: expect.anything(),
			},
		});

		const errorOutput2 = parseWithValibot(createFormData('age', '0'), {
			schema,
		});
		expect(errorOutput2).toMatchObject({
			error: { age: expect.anything() },
		});
	});
});
