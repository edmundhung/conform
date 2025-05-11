import { empty, fallback, object, pipe, string } from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('fallback', () => {
	test('should pass with fallback', () => {
		const schema = object({
			key: fallback(pipe(string(), empty()), 'fallback value'),
		});
		const input = createFormData('key', 'value');
		const output = parseWithValibot(input, { schema });
		expect(output).toMatchObject({
			status: 'success',
			value: { key: 'fallback value' },
		});
	});
});
