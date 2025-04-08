import { object, string, undefined_ } from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('undefined', () => {
	test('should pass only undefined', () => {
		const schema = object({ name: string(), age: undefined_() });
		const formData1 = createFormData('name', 'Jane');
		formData1.append('age', '');
		expect(parseWithValibot(formData1, { schema })).toMatchObject({
			status: 'success',
			value: { name: 'Jane', age: undefined },
		});

		const formData2 = createFormData('name', 'Jane');
		expect(parseWithValibot(formData2, { schema })).toMatchObject({
			error: { age: expect.anything() },
		});

		formData2.append('age', '20');
		expect(parseWithValibot(formData2, { schema })).toMatchObject({
			error: { age: expect.anything() },
		});
	});
});
