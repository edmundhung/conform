import { test, expect, vi } from 'vitest';
import {
	serializeIntent,
	deserializeIntent,
	applyIntent,
	insertItem,
	removeItem,
	reorderItems,
	updateListKeys,
	actionHandlers,
} from '../future/intent';
import type { Submission } from '@conform-to/dom/future';

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

	// Test intent with null payload
	expect(serializeIntent({ type: 'reset', payload: null })).toBe('reset');

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

test('applyIntent', () => {
	const submission: Submission = {
		intent: 'reset',
		payload: { email: 'test@example.com', name: 'John' },
		fields: ['email', 'name'],
	};

	// Test reset intent
	expect(applyIntent(submission)).toBeUndefined();

	// Test submission without intent
	const noIntentSubmission: Submission = {
		intent: null,
		payload: { email: 'test' },
		fields: ['email'],
	};
	expect(applyIntent(noIntentSubmission)).toEqual({ email: 'test' });

	// Test with custom handlers
	const customHandlers = {
		custom: {
			onApply: vi.fn((payload) => ({ ...payload, custom: true })),
			validatePayload: vi.fn(() => true),
		},
	};

	const customSubmission: Submission = {
		intent: 'custom',
		payload: { email: 'test' },
		fields: ['email'],
	};

	const result = applyIntent(customSubmission, { handlers: customHandlers });
	expect(customHandlers.custom.onApply).toHaveBeenCalledWith(
		{ email: 'test' },
		undefined,
	);
	expect(result).toEqual({ email: 'test', custom: true });

	// Test with validation failure
	const failingHandler = {
		failing: {
			onApply: vi.fn(),
			validatePayload: vi.fn(() => false),
		},
	};

	const failingSubmission: Submission = {
		intent: 'failing',
		payload: { test: true },
		fields: ['test'],
	};

	const failResult = applyIntent(failingSubmission, {
		handlers: failingHandler,
	});
	expect(failingHandler.failing.onApply).not.toHaveBeenCalled();
	expect(failResult).toEqual({ test: true });
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
	expect(actionHandlers.reset.validatePayload?.(undefined)).toBe(true);
	expect(actionHandlers.reset.validatePayload?.({})).toBe(true);
	expect(actionHandlers.reset.validatePayload?.({ defaultValue: null })).toBe(
		true,
	);
	expect(
		actionHandlers.reset.validatePayload?.({ defaultValue: { email: 'test' } }),
	).toBe(true);
	expect(actionHandlers.reset.validatePayload?.('string')).toBe(false);

	// Test onApply with no options
	expect(actionHandlers.reset.onApply?.({}, undefined)).toBeUndefined();

	// Test onApply with null defaultValue
	expect(actionHandlers.reset.onApply?.({}, { defaultValue: null })).toEqual(
		{},
	);

	// Test onApply with custom defaultValue
	expect(
		actionHandlers.reset.onApply?.(
			{},
			{ defaultValue: { email: 'test@example.com' } },
		),
	).toEqual({ email: 'test@example.com' });
});

test('actionHandlers.validate', () => {
	// Test validate payload
	expect(actionHandlers.validate.validatePayload?.('email')).toBe(true);
	expect(actionHandlers.validate.validatePayload?.(undefined)).toBe(true);
	expect(actionHandlers.validate.validatePayload?.(123)).toBe(false);
});

test('actionHandlers.update', () => {
	// Test validate payload
	expect(
		actionHandlers.update.validatePayload?.({ name: 'email', value: 'test' }),
	).toBe(true);
	expect(
		actionHandlers.update.validatePayload?.({
			name: 'email',
			index: 0,
			value: 'test',
		}),
	).toBe(true);
	expect(actionHandlers.update.validatePayload?.({ name: 123 })).toBe(false);
	expect(actionHandlers.update.validatePayload?.('string')).toBe(false);

	// Test onApply with explicit value
	expect(
		actionHandlers.update.onApply?.(
			{ email: 'old@example.com' },
			{ name: 'email', value: 'new@example.com' },
		),
	).toEqual({
		email: 'new@example.com',
	});

	// Test update field value to null
	expect(
		actionHandlers.update.onApply?.(
			{ username: 'John', email: 'test@example.com' },
			{ name: 'email', value: null },
		),
	).toEqual({
		username: 'John',
		email: null,
	});

	// Test update form value to null (clear all fields)
	expect(
		actionHandlers.update.onApply?.(
			{ email: 'test@example.com', name: 'John' },
			{ value: null },
		),
	).toEqual({});

	// Test with array index
	const arrayPayload = { items: ['a', 'b', 'c'] };
	const arrayOptions = { name: 'items', index: 1, value: 'updated' };
	expect(actionHandlers.update.onApply?.(arrayPayload, arrayOptions)).toEqual({
		items: ['a', 'updated', 'c'],
	});
});

test('actionHandlers.insert', () => {
	// Test validate payload
	expect(actionHandlers.insert.validatePayload?.({ name: 'items' })).toBe(true);
	expect(
		actionHandlers.insert.validatePayload?.({ name: 'items', index: 0 }),
	).toBe(true);
	expect(actionHandlers.insert.validatePayload?.({ name: 123 })).toBe(false);
	expect(actionHandlers.insert.validatePayload?.('string')).toBe(false);

	// Test onApply
	const payload = { items: ['a', 'b'] };
	const options = { name: 'items', defaultValue: 'new' };
	expect(actionHandlers.insert.onApply?.(payload, options)).toEqual({
		items: ['a', 'b', 'new'],
	});
});

test('actionHandlers.remove', () => {
	// Test validate payload
	expect(
		actionHandlers.remove.validatePayload?.({ name: 'items', index: 0 }),
	).toBe(true);
	expect(actionHandlers.remove.validatePayload?.({ name: 'items' })).toBe(
		false,
	);
	expect(actionHandlers.remove.validatePayload?.({ name: 123, index: 0 })).toBe(
		false,
	);

	// Test onApply
	const payload = { items: ['a', 'b', 'c'] };
	const options = { name: 'items', index: 1 };
	expect(actionHandlers.remove.onApply?.(payload, options)).toEqual({
		items: ['a', 'c'],
	});
});

test('actionHandlers.reorder', () => {
	// Test validate payload
	expect(
		actionHandlers.reorder.validatePayload?.({ name: 'items', from: 0, to: 2 }),
	).toBe(true);
	expect(
		actionHandlers.reorder.validatePayload?.({ name: 'items', from: 0 }),
	).toBe(false);
	expect(
		actionHandlers.reorder.validatePayload?.({ name: 123, from: 0, to: 2 }),
	).toBe(false);

	// Test onApply
	const payload = { items: ['a', 'b', 'c', 'd'] };
	const options = { name: 'items', from: 1, to: 3 };
	expect(actionHandlers.reorder.onApply?.(payload, options)).toEqual({
		items: ['a', 'c', 'd', 'b'],
	});
});
