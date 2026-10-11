import { expect, test, vi } from 'vitest';
import type { IntentHandler } from '../future';
import { configureForms, defineIntent, resolveSubmission } from '../future';

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
			intent: 'reset()',
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
		intent: {
			type: 'submit',
			payload: 'unknown',
		},
		targetValue: {
			email: 'test@example.com',
		},
	});

	expect(
		resolveSubmission(
			{
				intent: 'unknown()',
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

test('configureForms.resolveSubmission includes default and global handlers', () => {
	const copyField = defineIntent<string>({
		resolve({ value, payload }) {
			return { ...value, confirm: payload };
		},
	});
	const forms = configureForms({ intents: { copyField } });
	const submission = {
		intent: 'copyField("email")',
		payload: { email: 'test@example.com' },
		fields: ['email'],
	};

	expect(forms.resolveSubmission(submission)).toEqual({
		intent: { type: 'copyField', payload: 'email' },
		targetValue: { email: 'test@example.com', confirm: 'email' },
	});
	expect(forms.resolveSubmission({ ...submission, intent: 'reset()' })).toEqual(
		{
			intent: { type: 'reset', payload: undefined },
			targetValue: undefined,
		},
	);

	const customReset = defineIntent({
		resolve({ value }) {
			return { ...value, email: 'global@example.com' };
		},
	});
	const custom = configureForms({ intents: { reset: customReset } });

	expect(
		custom.resolveSubmission({ ...submission, intent: 'reset()' }),
	).toEqual({
		intent: { type: 'reset', payload: undefined },
		targetValue: { email: 'global@example.com' },
	});
});

test('configureForms.resolveSubmission extends and overrides handlers per call', () => {
	const globalHandler = defineIntent({
		resolve({ value }) {
			return { ...value, email: 'global@example.com' };
		},
	});
	const inlineHandler = defineIntent({
		resolve({ value }) {
			return { ...value, email: 'inline@example.com' };
		},
	});
	const forms = configureForms({
		intents: { custom: globalHandler, reset: globalHandler },
	});
	const submission = {
		intent: 'custom()',
		payload: { email: 'test@example.com' },
		fields: ['email'],
	};

	expect(
		forms.resolveSubmission(submission, {
			handlers: { inline: inlineHandler },
		}),
	).toEqual({
		intent: { type: 'custom', payload: undefined },
		targetValue: { email: 'global@example.com' },
	});

	for (const type of ['custom', 'reset', 'inline']) {
		expect(
			forms.resolveSubmission(
				{ ...submission, intent: `${type}()` },
				{
					handlers: {
						custom: inlineHandler,
						reset: inlineHandler,
						inline: inlineHandler,
					},
				},
			),
		).toEqual({
			intent: { type, payload: undefined },
			targetValue: { email: 'inline@example.com' },
		});
	}
});
