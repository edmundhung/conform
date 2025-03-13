import { number, object } from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('number', () => {
	test('should pass only numbers', () => {
		const schema = object({ age: number() });
		const output = parseWithValibot(createFormData('age', '20'), { schema });

		expect(output).toMatchObject({ status: 'success', value: { age: 20 } });
		expect(
			parseWithValibot(createFormData('age', ''), { schema }),
		).toMatchObject({
			error: { age: expect.anything() },
		});
		expect(
			parseWithValibot(createFormData('age', 'non number'), { schema }),
		).toMatchObject({
			error: { age: expect.anything() },
		});
	});
});
