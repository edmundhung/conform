import { exactOptional, number, object, string } from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('exactOptional', () => {
	test('should pass only exactOptional', () => {
		const schema = object({ name: string(), age: exactOptional(number()) });
		const formData1 = createFormData('name', 'Jane');
		expect(parseWithValibot(formData1, { schema })).toMatchObject({
			status: 'success',
			value: { name: 'Jane' },
		});

		formData1.append('age', '20');
		expect(parseWithValibot(formData1, { schema })).toMatchObject({
			status: 'success',
			value: { name: 'Jane', age: 20 },
		});

		const formData2 = createFormData('name', 'Jane');
		formData2.append('age', 'abc');
		expect(parseWithValibot(formData2, { schema })).toMatchObject({
			error: { age: expect.anything() },
		});
	});
});
