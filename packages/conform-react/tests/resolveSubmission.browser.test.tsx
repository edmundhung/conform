import { expect, test, vi } from 'vitest';
import type { IntentHandler } from '../future';
import { resolveSubmission } from '../future';

test('resolveSubmission', () => {
	const customHandlers = {
		copyField: {
			parse: vi.fn((payload) => payload),
			resolve: vi.fn(({ value, payload }) => ({
				...value,
				confirm: payload,
			})),
		},
	} satisfies Record<string, IntentHandler>;

	expect(
		resolveSubmission(
			{
				intent: 'copyField("email")',
				payload: { email: 'test@example.com' },
				fields: ['email'],
			},
			{
				handlers: customHandlers,
			},
		),
	).toEqual({
		intent: {
			type: 'copyField',
			payload: 'email',
		},
		value: {
			email: 'test@example.com',
			confirm: 'email',
		},
	});

	expect(
		resolveSubmission(
			{
				intent: 'unknown',
				payload: { email: 'test@example.com' },
				fields: ['email'],
			},
			{
				handlers: customHandlers,
			},
		),
	).toEqual({
		intent: undefined,
		value: {
			email: 'test@example.com',
		},
	});
});
