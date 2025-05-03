import { config, empty, object, pipe, string } from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('config', () => {
	test('should fail with message', () => {
		const schema = object({
			key: config(pipe(string(), empty()), { message: 'wrong value' }),
		});
		const input = createFormData('key', 'value');
		const output = parseWithValibot(input, { schema });
		expect(output).toMatchObject({
			status: 'error',
			error: { key: ['wrong value'] },
		});
	});
});
