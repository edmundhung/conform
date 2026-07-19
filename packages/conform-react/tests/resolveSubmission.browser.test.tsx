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
		resolveSubmission({
			intent: null,
			payload: { email: 'test@example.com' },
			fields: ['email'],
		}),
	).toEqual({
		intent: { type: 'submit', payload: undefined },
		targetValue: { email: 'test@example.com' },
	});

	expect(
		resolveSubmission({
			intent: 'reset',
			payload: { email: 'test@example.com' },
			fields: ['email'],
		}),
	).toEqual({
		intent: { type: 'reset', payload: undefined },
		targetValue: undefined,
	});

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
		targetValue: {
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
		targetValue: {
			email: 'test@example.com',
		},
	});
});
