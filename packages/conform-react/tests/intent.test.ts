import { test, expect, vi } from 'vitest';
import {
	serializeIntent,
	deserializeIntent,
	normalizeIntent,
	resolveIntent,
	insertItem,
	removeItem,
	reorderItems,
	updateListKeys,
	defaultIntentHandlers,
} from '../future/intent';
import type { Submission, SubmissionResult } from '@conform-to/dom/future';
import { IntentHandler } from '../future/types';

test('serializeIntent', () => {
	// Test intent without payload
	expect(serializeIntent({ type: 'reset' })).toBe('reset');

	// Test intent with payload
	expect(serializeIntent({ type: 'validate', payload: 'email' })).toBe(
		'validate("email")',
	);

	// Test intent with object payload
	const updateIntent = {
		type: 'update',
		payload: { name: 'email', value: 'test@example.com' },
	};
	expect(serializeIntent(updateIntent)).toBe(
		'update({"name":"email","value":"test@example.com"})',
	);

	// Test intent with falsy payloads
	expect(serializeIntent({ type: 'custom', payload: 0 })).toBe('custom(0)');
	expect(serializeIntent({ type: 'custom', payload: false })).toBe(
		'custom(false)',
	);
	expect(serializeIntent({ type: 'custom', payload: '' })).toBe('custom("")');
	expect(serializeIntent({ type: 'custom', payload: null })).toBe(
		'custom(null)',
	);

	// Test intent with undefined payload
	expect(serializeIntent({ type: 'reset', payload: undefined })).toBe('reset');
});

test('deserializeIntent', () => {
	// Test simple intent
	expect(deserializeIntent('reset')).toEqual({
		type: 'reset',
		payload: undefined,
	});

	// Test intent with string payload
	expect(deserializeIntent('validate("email")')).toEqual({
		type: 'validate',
		payload: 'email',
	});

	// Test intent with object payload
	expect(deserializeIntent('update({"name":"email","value":"test"})')).toEqual({
		type: 'update',
		payload: { name: 'email', value: 'test' },
	});

	// Test malformed JSON (should ignore error)
	expect(deserializeIntent('update({invalid)')).toEqual({
		type: 'update',
		payload: undefined,
	});

	// Test without closing parenthesis
	expect(deserializeIntent('validate("email"')).toEqual({
		type: 'validate("email"',
		payload: undefined,
	});

	// Test empty parentheses
	expect(deserializeIntent('reset()')).toEqual({
		type: 'reset',
		payload: undefined,
	});
});

test('normalizeIntent', () => {
	expect(normalizeIntent(null)).toEqual({
		type: 'submit',
		payload: undefined,
	});

	expect(normalizeIntent('submit')).toEqual({
		type: 'submit',
		payload: undefined,
	});
});

test('normalizeIntent preserves invalid custom payloads', () => {
	const handlers = {
		custom: {
			validate(payload) {
				return typeof payload === 'string';
			},
		},
	} satisfies Record<string, IntentHandler>;

	expect(normalizeIntent('custom(123)', { handlers })).toEqual({
		type: 'custom',
		payload: 123,
	});
});

test('normalizeIntent preserves unknown custom intent', () => {
	expect(normalizeIntent('custom')).toEqual({
		type: 'custom',
		payload: undefined,
	});
});

test('applyIntent', () => {
	const submission: Submission = {
		intent: 'reset',
		payload: { email: 'test@example.com', name: 'John' },
		fields: ['email', 'name'],
	};

	// Test reset intent
	expect(resolveIntent(submission)).toBeUndefined();

	// Test submission without intent
	const noIntentSubmission: Submission = {
		intent: null,
		payload: { email: 'test' },
		fields: ['email'],
	};
	expect(resolveIntent(noIntentSubmission)).toEqual({ email: 'test' });

	// Test with custom handlers
	const customHandlers = {
		custom: {
			validate: vi.fn(() => true),
			resolve: vi.fn((payload) => ({ ...payload, custom: true })),
		},
	} satisfies Record<string, IntentHandler>;

	const customSubmission: Submission = {
		intent: 'custom',
		payload: { email: 'test' },
		fields: ['email'],
	};

	const result = resolveIntent(customSubmission, { handlers: customHandlers });
	expect(customHandlers.custom.resolve).toHaveBeenCalledWith(
		{ email: 'test' },
		undefined,
	);
	expect(result).toEqual({ email: 'test', custom: true });

	// Test with validation failure
	const failingHandler = {
		failing: {
			validate: vi.fn(() => false),
			resolve: vi.fn(),
		},
	} satisfies Record<string, IntentHandler>;

	const failingSubmission: Submission = {
		intent: 'failing',
		payload: { test: true },
		fields: ['test'],
	};

	const failResult = resolveIntent(failingSubmission, {
		handlers: failingHandler,
	});
	expect(failingHandler.failing.resolve).not.toHaveBeenCalled();
	expect(failResult).toEqual({ test: true });

	const ambiguousHandlers = {
		ambiguous: {
			validate: vi.fn(() => true),
			resolve: vi.fn(() => ({ name: 'Alice', value: 'Engineer' })),
		},
	} satisfies Record<string, IntentHandler>;

	const ambiguousResult = resolveIntent(
		{
			intent: 'ambiguous',
			payload: { email: 'test@example.com' },
			fields: ['email'],
		},
		{ handlers: ambiguousHandlers },
	);
	expect(ambiguousResult).toEqual({
		name: 'Alice',
		value: 'Engineer',
	});

	const targetedHandlers = {
		targeted: {
			validate: vi.fn(() => true),
			resolve: vi.fn(() => ({
				email: 'next@example.com',
				name: 'John',
			})),
		},
	} satisfies Record<string, IntentHandler>;

	const targetedResult = resolveIntent(
		{
			intent: 'targeted',
			payload: { email: 'test@example.com', name: 'John' },
			fields: ['email', 'name'],
		},
		{ handlers: targetedHandlers },
	);
	expect(targetedResult).toEqual({
		email: 'next@example.com',
		name: 'John',
	});

	const wrappedHandlers = {
		wrapped: {
			validate: vi.fn(() => true),
			resolve: vi.fn(() => ({ email: 'wrapped@example.com' })),
		},
	} satisfies Record<string, IntentHandler>;

	const wrappedResult = resolveIntent(
		{
			intent: 'wrapped',
			payload: { email: 'test@example.com' },
			fields: ['email'],
		},
		{ handlers: wrappedHandlers },
	);
	expect(wrappedResult).toEqual({ email: 'wrapped@example.com' });
});

test('insertItem', () => {
	const list = ['a', 'b', 'c'];

	// Test insert at beginning
	insertItem(list, 'x', 0);
	expect(list).toEqual(['x', 'a', 'b', 'c']);

	// Test insert in middle
	const list2 = ['a', 'b', 'c'];
	insertItem(list2, 'y', 2);
	expect(list2).toEqual(['a', 'b', 'y', 'c']);

	// Test insert at end
	const list3 = ['a', 'b', 'c'];
	insertItem(list3, 'z', 3);
	expect(list3).toEqual(['a', 'b', 'c', 'z']);
});

test('removeItem', () => {
	const list = ['a', 'b', 'c', 'd'];

	// Test remove from beginning
	removeItem(list, 0);
	expect(list).toEqual(['b', 'c', 'd']);

	// Test remove from middle
	const list2 = ['a', 'b', 'c', 'd'];
	removeItem(list2, 2);
	expect(list2).toEqual(['a', 'b', 'd']);

	// Test remove from end
	const list3 = ['a', 'b', 'c', 'd'];
	removeItem(list3, 3);
	expect(list3).toEqual(['a', 'b', 'c']);
});

test('reorderItems', () => {
	const list = ['a', 'b', 'c', 'd'];

	// Test move forward
	reorderItems(list, 1, 3);
	expect(list).toEqual(['a', 'c', 'd', 'b']);

	// Test move backward
	const list2 = ['a', 'b', 'c', 'd'];
	reorderItems(list2, 3, 1);
	expect(list2).toEqual(['a', 'd', 'b', 'c']);

	// Test no movement (same position)
	const list3 = ['a', 'b', 'c', 'd'];
	reorderItems(list3, 2, 2);
	expect(list3).toEqual(['a', 'b', 'c', 'd']);
});

test('updateListKeys', () => {
	const keys = {
		items: ['key1', 'key2', 'key3'],
		'items[0].nested': ['nested1'],
		'items[1].nested': ['nested2'],
		other: ['other1'],
	};

	// Test removing child keys
	const result1 = updateListKeys(keys, 'items[1]');
	expect(result1).toEqual({
		items: ['key1', 'key2', 'key3'],
		'items[0].nested': ['nested1'],
		other: ['other1'],
	});

	// Test with update function - only updates keys that don't match the removal pattern
	const updateKey = (key: string) =>
		key.startsWith('items[1]') ? key.replace('[1]', '[0]') : key;
	const result2 = updateListKeys(keys, 'items[0]', updateKey);
	expect(result2).toEqual({
		items: ['key1', 'key2', 'key3'], // Not removed as it doesn't match items[0]
		'items[0].nested': ['nested2'], // items[1].nested becomes items[0].nested
		other: ['other1'],
	});

	// Test with empty keys
	expect(updateListKeys({}, 'items[0]')).toEqual({});

	// Test with undefined keys
	expect(updateListKeys(undefined, 'items[0]')).toEqual({});
});

test('actionHandlers.reset', () => {
	// Test validate payload
	expect(defaultIntentHandlers.reset.validate?.(undefined)).toBe(true);
	expect(defaultIntentHandlers.reset.validate?.({})).toBe(true);
	expect(defaultIntentHandlers.reset.validate?.({ defaultValue: null })).toBe(
		true,
	);
	expect(
		defaultIntentHandlers.reset.validate?.({ defaultValue: { email: 'test' } }),
	).toBe(true);
	expect(defaultIntentHandlers.reset.validate?.('string')).toBe(false);

	// Test onApply with no options
	expect(defaultIntentHandlers.reset.resolve?.({}, undefined)).toBeUndefined();

	// Test onApply with null defaultValue
	expect(
		defaultIntentHandlers.reset.resolve?.({}, { defaultValue: null }),
	).toEqual({});

	// Test onApply with custom defaultValue
	expect(
		defaultIntentHandlers.reset.resolve?.(
			{},
			{ defaultValue: { email: 'test@example.com' } },
		),
	).toEqual({ email: 'test@example.com' });
});

test('actionHandlers.validate', () => {
	// Test validate payload
	expect(defaultIntentHandlers.validate.validate?.('email')).toBe(true);
	expect(defaultIntentHandlers.validate.validate?.(undefined)).toBe(true);
	expect(defaultIntentHandlers.validate.validate?.(123)).toBe(false);
});

test('actionHandlers.update', () => {
	// Test validate payload
	expect(
		defaultIntentHandlers.update.validate?.({ name: 'email', value: 'test' }),
	).toBe(true);
	expect(
		defaultIntentHandlers.update.validate?.({
			name: 'email',
			index: 0,
			value: 'test',
		}),
	).toBe(true);
	expect(defaultIntentHandlers.update.validate?.({ name: 123 })).toBe(false);
	expect(defaultIntentHandlers.update.validate?.('string')).toBe(false);

	// Test onApply with explicit value
	expect(
		defaultIntentHandlers.update.resolve?.(
			{ email: 'old@example.com' },
			{ name: 'email', value: 'new@example.com' },
		),
	).toEqual({
		email: 'new@example.com',
	});

	// Test update field value to null
	expect(
		defaultIntentHandlers.update.resolve?.(
			{ username: 'John', email: 'test@example.com' },
			{ name: 'email', value: null },
		),
	).toEqual({
		username: 'John',
		email: null,
	});

	// Test update form value to null (clear all fields)
	expect(
		defaultIntentHandlers.update.resolve?.(
			{ email: 'test@example.com', name: 'John' },
			{ value: null },
		),
	).toEqual({});

	// Test with array index
	const arrayPayload = { items: ['a', 'b', 'c'] };
	const arrayOptions = { name: 'items', index: 1, value: 'updated' };
	expect(
		defaultIntentHandlers.update.resolve?.(arrayPayload, arrayOptions),
	).toEqual({
		items: ['a', 'updated', 'c'],
	});
});

test('actionHandlers.insert', () => {
	// Test validate payload
	expect(defaultIntentHandlers.insert.validate?.({ name: 'items' })).toBe(true);
	expect(
		defaultIntentHandlers.insert.validate?.({ name: 'items', index: 0 }),
	).toBe(true);
	expect(defaultIntentHandlers.insert.validate?.({ name: 123 })).toBe(false);
	expect(defaultIntentHandlers.insert.validate?.('string')).toBe(false);

	// Test onApply
	const payload = { items: ['a', 'b'] };
	const options = { name: 'items', defaultValue: 'new' };
	expect(defaultIntentHandlers.insert.resolve?.(payload, options)).toEqual({
		items: ['a', 'b', 'new'],
	});

	const validResult: SubmissionResult<string[]> = {
		submission: {
			intent: null,
			payload: { items: [], newItem: 'value' },
			fields: [],
		},
		targetValue: { items: ['value'], newItem: '' },
		error: null,
	};
	expect(
		defaultIntentHandlers.insert.apply?.(validResult, {
			name: 'items',
			from: 'newItem',
		}),
	).toBe(validResult);

	const invalidResult: SubmissionResult<string[]> = {
		submission: {
			intent: null,
			payload: { items: [], newItem: 'bad' },
			fields: [],
		},
		targetValue: { items: ['bad'], newItem: '' },
		error: { formErrors: [], fieldErrors: { 'items[0]': ['Invalid'] } },
	};
	expect(
		defaultIntentHandlers.insert.apply?.(invalidResult, {
			name: 'items',
			from: 'newItem',
		}),
	).toEqual({
		...invalidResult,
		targetValue: undefined,
		error: {
			formErrors: [],
			fieldErrors: {
				'items[0]': null,
				newItem: ['Invalid'],
			},
		},
	});

	const resultWithFromError: SubmissionResult<string[]> = {
		submission: {
			intent: null,
			payload: { items: [], newItem: 'bad' },
			fields: [],
		},
		targetValue: { items: ['bad'], newItem: '' },
		error: {
			formErrors: [],
			fieldErrors: {
				'items[0]': ['Invalid'],
				newItem: ['Existing error'],
			},
		},
	};
	expect(
		defaultIntentHandlers.insert.apply?.(resultWithFromError, {
			name: 'items',
			from: 'newItem',
		}),
	).toEqual({
		...resultWithFromError,
		targetValue: undefined,
		error: {
			formErrors: [],
			fieldErrors: {
				'items[0]': null,
				newItem: ['Existing error'],
			},
		},
	});

	const maxResult: SubmissionResult<string[]> = {
		submission: { intent: null, payload: { items: ['a', 'b'] }, fields: [] },
		targetValue: { items: ['a', 'b', 'c'] },
		error: { formErrors: [], fieldErrors: { items: ['Max 2 items'] } },
	};
	expect(
		defaultIntentHandlers.insert.apply?.(maxResult, {
			name: 'items',
			onInvalid: 'revert',
		}),
	).toEqual({
		...maxResult,
		targetValue: undefined,
		error: { formErrors: [], fieldErrors: { items: ['Max 2 items'] } },
	});

	const normalResult: SubmissionResult<string[]> = {
		submission: { intent: null, payload: { items: ['a'] }, fields: [] },
		targetValue: { items: ['a', 'b'] },
		error: null,
	};
	expect(
		defaultIntentHandlers.insert.apply?.(normalResult, {
			name: 'items',
		}),
	).toBe(normalResult);
});

test('actionHandlers.remove', () => {
	// Test validate payload
	expect(
		defaultIntentHandlers.remove.validate?.({ name: 'items', index: 0 }),
	).toBe(true);
	expect(defaultIntentHandlers.remove.validate?.({ name: 'items' })).toBe(
		false,
	);
	expect(defaultIntentHandlers.remove.validate?.({ name: 123, index: 0 })).toBe(
		false,
	);

	// Test onApply
	const payload = { items: ['a', 'b', 'c'] };
	const options = { name: 'items', index: 1 };
	expect(defaultIntentHandlers.remove.resolve?.(payload, options)).toEqual({
		items: ['a', 'c'],
	});

	const minResult: SubmissionResult<string[]> = {
		submission: { intent: null, payload: { items: ['a'] }, fields: [] },
		targetValue: { items: [] },
		error: { formErrors: [], fieldErrors: { items: ['Min 1 item'] } },
	};
	expect(
		defaultIntentHandlers.remove.apply?.(minResult, {
			name: 'items',
			index: 0,
			onInvalid: 'revert',
		}),
	).toEqual({
		...minResult,
		targetValue: undefined,
		error: { formErrors: [], fieldErrors: { items: ['Min 1 item'] } },
	});

	const insertResult: SubmissionResult<string[]> = {
		submission: { intent: null, payload: { items: ['a'] }, fields: [] },
		targetValue: { items: [] },
		error: { formErrors: [], fieldErrors: { items: ['Min 1 item'] } },
	};
	expect(
		defaultIntentHandlers.remove.apply?.(insertResult, {
			name: 'items',
			index: 0,
			onInvalid: 'insert',
			defaultValue: '',
		}),
	).toEqual({
		...insertResult,
		targetValue: { items: [''] },
	});

	const noRevertResult: SubmissionResult<string[]> = {
		submission: { intent: null, payload: { items: ['a'] }, fields: [] },
		targetValue: { items: [] },
		error: { formErrors: [], fieldErrors: { items: ['Min 1 item'] } },
	};
	expect(
		defaultIntentHandlers.remove.apply?.(noRevertResult, {
			name: 'items',
			index: 0,
		}),
	).toBe(noRevertResult);

	const normalResult: SubmissionResult<string[]> = {
		submission: { intent: null, payload: { items: ['a', 'b'] }, fields: [] },
		targetValue: { items: ['a'] },
		error: null,
	};
	expect(
		defaultIntentHandlers.remove.apply?.(normalResult, {
			name: 'items',
			index: 1,
		}),
	).toBe(normalResult);
});

test('actionHandlers.reorder', () => {
	// Test validate payload
	expect(
		defaultIntentHandlers.reorder.validate?.({ name: 'items', from: 0, to: 2 }),
	).toBe(true);
	expect(
		defaultIntentHandlers.reorder.validate?.({ name: 'items', from: 0 }),
	).toBe(false);
	expect(
		defaultIntentHandlers.reorder.validate?.({ name: 123, from: 0, to: 2 }),
	).toBe(false);

	// Test onApply
	const payload = { items: ['a', 'b', 'c', 'd'] };
	const options = { name: 'items', from: 1, to: 3 };
	expect(defaultIntentHandlers.reorder.resolve?.(payload, options)).toEqual({
		items: ['a', 'c', 'd', 'b'],
	});
});
