import { exactOptionalAsync, number, objectAsync, string } from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('exactOptionalAsync', () => {
	test('should pass only exactOptional', async () => {
		const schema = objectAsync({
			name: string(),
			age: exactOptionalAsync(number()),
		});
		const formData1 = createFormData('name', 'Jane');
		expect(await parseWithValibot(formData1, { schema })).toMatchObject({
			status: 'success',
			value: { name: 'Jane' },
		});

		formData1.append('age', '20');
		expect(await parseWithValibot(formData1, { schema })).toMatchObject({
			status: 'success',
			value: { name: 'Jane', age: 20 },
		});

		const formData2 = createFormData('name', 'Jane');
		formData2.append('age', 'abc');
		expect(await parseWithValibot(formData2, { schema })).toMatchObject({
			error: { age: expect.anything() },
		});
	});
});
