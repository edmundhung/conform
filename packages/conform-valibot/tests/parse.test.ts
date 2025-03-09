import { check, object, pipe, string } from 'valibot';
import { describe, expect, test } from 'vitest';
import { conformValibotMessage, parseWithValibot } from '../parse';
import { createFormData } from './helpers/FormData';

describe('parseWithValibot', () => {
	test('should return null for an error field when its error message is skipped', () => {
		const schema = object({
			key: pipe(
				string(),
				check(
					(input) => input === 'valid',
					conformValibotMessage.VALIDATION_SKIPPED,
				),
			),
		});
		const output = parseWithValibot(createFormData('key', 'invalid'), {
			schema,
		});
		expect(output).toMatchObject({ error: { key: null } });
	});

	test('should return null for the error when any error message is undefined', () => {
		const schema = object({
			key: pipe(
				string(),
				check(
					(input) => input === 'valid',
					conformValibotMessage.VALIDATION_UNDEFINED,
				),
			),
		});
		const output = parseWithValibot(createFormData('key', 'invalid'), {
			schema,
		});
		expect(output).toMatchObject({ error: null });
	});
});
