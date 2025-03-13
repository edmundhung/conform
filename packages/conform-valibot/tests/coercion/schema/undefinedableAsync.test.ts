import { number, objectAsync, string, undefinedableAsync } from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('undefinedableAsync', () => {
	test('should pass only undefinedable', async () => {
		const schema = objectAsync({
			name: string(),
			age: undefinedableAsync(number()),
		});
		const formData1 = createFormData('name', 'Jane');
		formData1.append('age', '');
		expect(await parseWithValibot(formData1, { schema })).toMatchObject({
			status: 'success',
			value: { name: 'Jane', age: undefined },
		});

		const formData2 = createFormData('name', 'Jane');
		expect(await parseWithValibot(formData2, { schema })).toMatchObject({
			error: { age: expect.anything() },
		});

		formData2.append('age', '20');
		expect(await parseWithValibot(formData2, { schema })).toMatchObject({
			status: 'success',
			value: { name: 'Jane', age: 20 },
		});
	});
});
