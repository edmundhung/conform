import { array, check, nullish, number, object, pipe, string } from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('array', () => {
	test('should pass only arrays', () => {
		const schema = object({ select: array(string()) });
		const formData = createFormData('select', '1');
		const outputForNonArray = parseWithValibot(formData, { schema });

		expect(outputForNonArray).toMatchObject({
			status: 'success',
			value: { select: ['1'] },
		});

		formData.append('select', '2');
		formData.append('select', '3');
		const outputForArray = parseWithValibot(formData, { schema });

		expect(outputForArray).toMatchObject({
			status: 'success',
			value: { select: ['1', '2', '3'] },
		});

		const schema2 = object({ nest: array(object({ name: string() })) });
		const formData2 = createFormData('nest[0].name', 'test name');
		const output2 = parseWithValibot(formData2, { schema: schema2 });
		expect(output2).toMatchObject({
			status: 'success',
			value: { nest: [{ name: 'test name' }] },
		});

		const errorFormData = createFormData('nest[0].name', '');
		const errorOutput = parseWithValibot(errorFormData, { schema: schema2 });
		expect(errorOutput).toMatchObject({
			error: {
				'nest[0].name': expect.anything(),
			},
		});
	});

	test('should pass arrays with pipe', () => {
		const schema = object({
			select: pipe(
				array(string()),
				check((value) => value.length === 3, 'error in number of arrays'),
			),
		});
		const formData = createFormData('select', '1');
		formData.append('select', '2');
		formData.append('select', '3');

		const outputWithPipe = parseWithValibot(formData, {
			schema,
		});
		expect(outputWithPipe).toMatchObject({
			status: 'success',
			value: { select: ['1', '2', '3'] },
		});
	});

	test('should pass array with nullish', () => {
		const schema = object({
			age: nullish(array(number())),
		});

		expect(parseWithValibot(new FormData(), { schema })).toMatchObject({
			status: 'success',
			value: {},
		});

		const output = parseWithValibot(createFormData('age', ''), { schema });

		expect(output).toMatchObject({
			status: 'success',
			value: { age: undefined },
		});
		expect(
			parseWithValibot(createFormData('age', '20'), { schema }),
		).toMatchObject({
			status: 'success',
			value: { age: [20] },
		});
		expect(
			parseWithValibot(createFormData('age', 'non number'), { schema }),
		).toMatchObject({
			error: { 'age[0]': expect.anything() },
		});
	});
});
