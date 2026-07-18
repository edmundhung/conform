import { test, expect, vi } from 'vitest';
import {
	applyIntent,
	defineIntent,
	serializeIntent,
	deserializeIntent,
	parseIntent,
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
	expect(serializeIntent({ type: 'reset', args: [] })).toBe('reset');

	// Test intent with payload
	expect(serializeIntent({ type: 'validate', args: ['email'] })).toBe(
		'validate("email")',
	);

	// Test intent with object payload
	const updateIntent = {
		type: 'update',
		args: [{ name: 'email', value: 'test@example.com' }],
	};
	expect(serializeIntent(updateIntent)).toBe(
		'update({"name":"email","value":"test@example.com"})',
	);

	// Test intent with falsy payloads
	expect(serializeIntent({ type: 'custom', args: [0] })).toBe('custom(0)');
	expect(serializeIntent({ type: 'custom', args: [false] })).toBe(
		'custom(false)',
	);
	expect(serializeIntent({ type: 'custom', args: [''] })).toBe('custom("")');
	expect(serializeIntent({ type: 'custom', args: [null] })).toBe(
		'custom(null)',
	);
	expect(serializeIntent({ type: 'custom', args: [undefined, 1] })).toBe(
		'custom("$$__undefined__$$",1)',
	);
	expect(
		serializeIntent({
			type: 'custom',
			args: [undefined, 1, undefined, 2, undefined],
		}),
	).toBe('custom("$$__undefined__$$",1,"$$__undefined__$$",2)');
	expect(serializeIntent({ type: 'custom', args: [undefined] })).toBe('custom');
	expect(
		serializeIntent({
			type: 'custom',
			args: [{ a: undefined, b: 123 }, undefined],
		}),
	).toBe('custom({"b":123})');
	// Undefined object properties are omitted while array positions are preserved.
	expect(
		serializeIntent({
			type: 'custom',
			args: [[undefined, { a: undefined, b: 1 }]],
		}),
	).toBe('custom(["$$__undefined__$$",{"b":1}])');
	expect(
		serializeIntent({
			type: 'custom',
			args: [{ items: [undefined, 1, undefined], missing: undefined }],
		}),
	).toBe('custom({"items":["$$__undefined__$$",1,"$$__undefined__$$"]})');
	expect(
		serializeIntent({
			type: 'custom',
			args: [[1, undefined], undefined],
		}),
	).toBe('custom([1,"$$__undefined__$$"])');

	// Test intent with undefined payload
	expect(serializeIntent({ type: 'reset', args: [] })).toBe('reset');
});

test('deserializeIntent', () => {
	// Test simple intent
	expect(deserializeIntent('reset')).toEqual({
		type: 'reset',
		args: [],
	});

	// Test intent with string payload
	expect(deserializeIntent('validate("email")')).toEqual({
		type: 'validate',
		args: ['email'],
	});

	// Test intent with object payload
	expect(deserializeIntent('update({"name":"email","value":"test"})')).toEqual({
		type: 'update',
		args: [{ name: 'email', value: 'test' }],
	});

	// Test malformed JSON
	expect(deserializeIntent('update({invalid)')).toBeUndefined();

	// Test without closing parenthesis
	expect(deserializeIntent('validate("email"')).toEqual({
		type: 'validate("email"',
		args: [],
	});

	// Test empty parentheses
	expect(deserializeIntent('reset()')).toEqual({
		type: 'reset',
		args: [],
	});

	expect(deserializeIntent('custom("__undefined__")')).toEqual({
		type: 'custom',
		args: ['__undefined__'],
	});
	expect(deserializeIntent('custom("$$__undefined__$$",1)')).toEqual({
		type: 'custom',
		args: [undefined, 1],
	});
	expect(
		deserializeIntent('custom("$$__undefined__$$",1,"$$__undefined__$$",2)'),
	).toEqual({
		type: 'custom',
		args: [undefined, 1, undefined, 2],
	});
	expect(deserializeIntent('custom( "$$__undefined__$$" ,1)')).toEqual({
		type: 'custom',
		args: [undefined, 1],
	});
	expect(deserializeIntent('custom("$$__undefined__$$")')).toEqual({
		type: 'custom',
		args: [undefined],
	});
	expect(deserializeIntent('custom({"nested":{"$undefined":true}})')).toEqual({
		type: 'custom',
		args: [{ nested: { $undefined: true } }],
	});
	expect(deserializeIntent('custom("",1)')).toEqual({
		type: 'custom',
		args: ['', 1],
	});
	expect(deserializeIntent('custom("a,b",{"items":[1,2]})')).toEqual({
		type: 'custom',
		args: ['a,b', { items: [1, 2] }],
	});
	expect(deserializeIntent('custom("a\\\"?{},b","c\\\\d",{"?":"?"})')).toEqual({
		type: 'custom',
		args: ['a"?{},b', 'c\\d', { '?': '?' }],
	});
	expect(
		deserializeIntent('custom({"items":[1,{"nested":[2,3]}]},[4,[5,6]])'),
	).toEqual({
		type: 'custom',
		args: [{ items: [1, { nested: [2, 3] }] }, [4, [5, 6]]],
	});
	expect(deserializeIntent('custom(true,-1.5,1e3)')).toEqual({
		type: 'custom',
		args: [true, -1.5, 1000],
	});
	expect(
		deserializeIntent(
			serializeIntent({
				type: 'custom',
				args: [
					[undefined, { items: [1, undefined] }],
					{ items: [undefined], missing: undefined },
				],
			}),
		),
	).toEqual({
		type: 'custom',
		args: [[undefined, { items: [1, undefined] }], { items: [undefined] }],
	});
	expect(
		deserializeIntent(
			serializeIntent({
				type: 'custom',
				args: [
					['$__undefined__$$', '$$__undefined__$', '__undefined__'],
					{ value: 'prefix$$__undefined__$$suffix' },
				],
			}),
		),
	).toEqual({
		type: 'custom',
		args: [
			['$__undefined__$$', '$$__undefined__$', '__undefined__'],
			{ value: 'prefix$$__undefined__$$suffix' },
		],
	});
	expect(
		deserializeIntent(serializeIntent({ type: 'custom', args: [-0] })),
	).toEqual({
		type: 'custom',
		args: [0],
	});
	expect(deserializeIntent('custom(1,)')).toBeUndefined();
	expect(deserializeIntent('custom({])')).toBeUndefined();
	expect(deserializeIntent('custom([})')).toBeUndefined();
	expect(deserializeIntent('custom("unterminated,,,,)')).toBeUndefined();
	expect(
		deserializeIntent(`custom("${'\\"?'.repeat(50_000)})`),
	).toBeUndefined();

	// Test empty string
	expect(deserializeIntent('')).toBeUndefined();
});

test('parseIntent', () => {
	expect(parseIntent(null, { handlers: defaultIntentHandlers })).toEqual({
		type: 'submit',
		payload: undefined,
	});

	expect(parseIntent('submit', { handlers: defaultIntentHandlers })).toEqual({
		type: 'submit',
		payload: undefined,
	});
	expect(parseIntent('custom', { handlers: defaultIntentHandlers })).toBe(
		undefined,
	);
	expect(
		parseIntent('validate(null)', { handlers: defaultIntentHandlers }),
	).toBe(undefined);
	expect(parseIntent('validate', { handlers: defaultIntentHandlers })).toEqual({
		type: 'validate',
		payload: undefined,
	});

	const handlers = {
		custom: {
			parse() {
				throw new Error('Invalid custom intent args');
			},
		},
	} satisfies Record<string, IntentHandler>;
	const fallbackHandlers = {
		singleArg: defineIntent({
			resolve: vi.fn(),
		}),
		zeroArg: defineIntent({
			apply({ result }) {
				return result;
			},
		}),
	} satisfies Record<string, IntentHandler>;

	expect(
		parseIntent('singleArg("field")', { handlers: fallbackHandlers }),
	).toEqual({
		type: 'singleArg',
		payload: 'field',
	});
	expect(parseIntent('zeroArg', { handlers: fallbackHandlers })).toEqual({
		type: 'zeroArg',
		payload: undefined,
	});
	expect(
		parseIntent('singleArg("field",1)', { handlers: fallbackHandlers }),
	).toBe(undefined);

	expect(
		parseIntent('reset({invalid)', { handlers: defaultIntentHandlers }),
	).toBeUndefined();

	expect(
		parseIntent(
			serializeIntent({
				type: 'custom',
				args: ['field', 1],
			}),
			{ handlers },
		),
	).toBeUndefined();

	expect(
		parseIntent(
			serializeIntent({
				type: 'custom',
				args: ['field', 1],
			}),
			{ handlers: defaultIntentHandlers },
		),
	).toBeUndefined();
});

test('resolveIntent', () => {
	const submission: Submission = {
		intent: 'reset',
		payload: { email: 'test@example.com', name: 'John' },
		fields: ['email', 'name'],
	};
	const submissionIntent = parseIntent(submission.intent, {
		handlers: defaultIntentHandlers,
	});

	// Test reset intent
	expect(
		resolveIntent(submission, {
			handlers: defaultIntentHandlers,
			intent: submissionIntent,
		}),
	).toBeUndefined();

	// Test submission without intent
	const noIntentSubmission: Submission = {
		intent: null,
		payload: { email: 'test' },
		fields: ['email'],
	};
	expect(
		resolveIntent(noIntentSubmission, {
			handlers: defaultIntentHandlers,
			intent: parseIntent(noIntentSubmission.intent, {
				handlers: defaultIntentHandlers,
			}),
		}),
	).toEqual({
		email: 'test',
	});

	// Test with custom handlers
	const customHandlers = {
		custom: {
			parse: vi.fn((payload) => payload),
			resolve: vi.fn(({ value }) => ({ ...value, custom: true })),
		},
	} satisfies Record<string, IntentHandler>;

	const customSubmission: Submission = {
		intent: 'custom',
		payload: { email: 'test' },
		fields: ['email'],
	};

	const result = resolveIntent(customSubmission, {
		handlers: customHandlers,
		intent: parseIntent(customSubmission.intent, { handlers: customHandlers }),
	});
	expect(customHandlers.custom.resolve).toHaveBeenCalledWith({
		value: { email: 'test' },
		payload: undefined,
	});
	expect(result).toEqual({ email: 'test', custom: true });

	// Test with validation failure
	const failingHandler = {
		failing: {
			parse: vi.fn(() => {
				throw new Error('Invalid payload');
			}),
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
		intent: parseIntent(failingSubmission.intent, { handlers: failingHandler }),
	});
	expect(failingHandler.failing.resolve).not.toHaveBeenCalled();
	expect(failResult).toEqual({ test: true });

	const targetedHandlers = {
		targeted: {
			parse: vi.fn((payload) => payload),
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
		{
			handlers: targetedHandlers,
			intent: parseIntent('targeted', { handlers: targetedHandlers }),
		},
	);
	expect(targetedResult).toEqual({
		email: 'next@example.com',
		name: 'John',
	});

	const wrappedHandlers = {
		wrapped: {
			parse: vi.fn((payload) => payload),
			resolve: vi.fn(() => ({ email: 'wrapped@example.com' })),
		},
	} satisfies Record<string, IntentHandler>;

	const wrappedResult = resolveIntent(
		{
			intent: 'wrapped',
			payload: { email: 'test@example.com' },
			fields: ['email'],
		},
		{
			handlers: wrappedHandlers,
			intent: parseIntent('wrapped', { handlers: wrappedHandlers }),
		},
	);
	expect(wrappedResult).toEqual({ email: 'wrapped@example.com' });
});

test('applyIntent', () => {
	const resetResult: SubmissionResult = {
		submission: {
			intent: 'reset',
			payload: { email: 'test@example.com' },
			fields: ['email'],
		},
		error: null,
	};

	expect(
		applyIntent(
			resetResult,
			parseIntent(resetResult.submission.intent, {
				handlers: defaultIntentHandlers,
			}),
			{ handlers: defaultIntentHandlers },
		),
	).toEqual({
		...resetResult,
		reset: true,
	});

	const customHandlers = {
		custom: defineIntent({
			apply: vi.fn(({ result, payload }) => ({
				...result,
				targetValue: {
					...(result.submission.payload as Record<string, unknown>),
					custom: payload,
				},
			})),
		}),
	} satisfies Record<string, IntentHandler>;
	const customResult: SubmissionResult = {
		submission: {
			intent: 'custom',
			payload: { email: 'test@example.com' },
			fields: ['email'],
		},
		error: null,
	};

	expect(
		applyIntent(
			customResult,
			parseIntent(customResult.submission.intent, { handlers: customHandlers }),
			{ handlers: customHandlers },
		),
	).toEqual({
		...customResult,
		targetValue: {
			email: 'test@example.com',
			custom: undefined,
		},
	});
	expect(customHandlers.custom.apply).toHaveBeenCalledWith({
		result: customResult,
		payload: undefined,
	});
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
	// Test parse payload
	expect(defaultIntentHandlers.reset.parse?.(undefined)).toBe(undefined);
	expect(defaultIntentHandlers.reset.parse?.({})).toEqual({});
	expect(defaultIntentHandlers.reset.parse?.({ defaultValue: null })).toEqual({
		defaultValue: null,
	});
	expect(
		defaultIntentHandlers.reset.parse?.({ defaultValue: { email: 'test' } }),
	).toEqual({ defaultValue: { email: 'test' } });
	expect(() => defaultIntentHandlers.reset.parse?.('string' as any)).toThrow();

	// Test resolve with no options
	expect(
		defaultIntentHandlers.reset.resolve?.({ value: {}, payload: undefined }),
	).toBeUndefined();

	// Test resolve with null defaultValue
	expect(
		defaultIntentHandlers.reset.resolve?.({
			value: {},
			payload: { defaultValue: null },
		}),
	).toEqual({});

	// Test resolve with custom defaultValue
	expect(
		defaultIntentHandlers.reset.resolve?.({
			value: {},
			payload: { defaultValue: { email: 'test@example.com' } },
		}),
	).toEqual({ email: 'test@example.com' });
});

test('actionHandlers.validate', () => {
	// Test parse payload
	expect(defaultIntentHandlers.validate.parse?.('email')).toBe('email');
	expect(defaultIntentHandlers.validate.parse?.(undefined)).toBe(undefined);
	expect(() => defaultIntentHandlers.validate.parse?.(123 as any)).toThrow();
});

test('actionHandlers.update', () => {
	// Test parse payload
	expect(
		defaultIntentHandlers.update.parse?.({ name: 'email', value: 'test' }),
	).toEqual({ name: 'email', value: 'test' });
	expect(
		defaultIntentHandlers.update.parse?.({
			name: 'email',
			index: 0,
			value: 'test',
		}),
	).toEqual({ name: 'email', index: 0, value: 'test' });
	expect(() =>
		defaultIntentHandlers.update.parse?.({ name: 123 } as any),
	).toThrow();
	expect(() => defaultIntentHandlers.update.parse?.('string' as any)).toThrow();

	// Test resolve with explicit value
	expect(
		defaultIntentHandlers.update.resolve?.({
			value: { email: 'old@example.com' },
			payload: { name: 'email', value: 'new@example.com' },
		}),
	).toEqual({
		email: 'new@example.com',
	});

	// Test update field value to null
	expect(
		defaultIntentHandlers.update.resolve?.({
			value: { username: 'John', email: 'test@example.com' },
			payload: { name: 'email', value: null },
		}),
	).toEqual({
		username: 'John',
		email: null,
	});

	// Test update form value to null (clear all fields)
	expect(
		defaultIntentHandlers.update.resolve?.({
			value: { email: 'test@example.com', name: 'John' },
			payload: { value: null },
		}),
	).toEqual({});

	// Test with array index
	const arrayPayload = { items: ['a', 'b', 'c'] };
	const arrayOptions = { name: 'items', index: 1, value: 'updated' };
	expect(
		defaultIntentHandlers.update.resolve?.({
			value: arrayPayload,
			payload: arrayOptions,
		}),
	).toEqual({
		items: ['a', 'updated', 'c'],
	});
});

test('actionHandlers.insert', () => {
	// Test parse payload
	expect(defaultIntentHandlers.insert.parse?.({ name: 'items' })).toEqual({
		name: 'items',
	});
	expect(
		defaultIntentHandlers.insert.parse?.({ name: 'items', index: 0 }),
	).toEqual({ name: 'items', index: 0 });
	expect(() =>
		defaultIntentHandlers.insert.parse?.({ name: 123 } as any),
	).toThrow();
	expect(() => defaultIntentHandlers.insert.parse?.('string' as any)).toThrow();

	// Test resolve
	const payload = { items: ['a', 'b'] };
	const options = { name: 'items', defaultValue: 'new' };
	expect(
		defaultIntentHandlers.insert.resolve?.({
			value: payload,
			payload: options,
		}),
	).toEqual({
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
		defaultIntentHandlers.insert.apply?.({
			result: validResult,
			payload: {
				name: 'items',
				from: 'newItem',
			},
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
		defaultIntentHandlers.insert.apply?.({
			result: invalidResult,
			payload: {
				name: 'items',
				from: 'newItem',
			},
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
		defaultIntentHandlers.insert.apply?.({
			result: resultWithFromError,
			payload: {
				name: 'items',
				from: 'newItem',
			},
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
		defaultIntentHandlers.insert.apply?.({
			result: maxResult,
			payload: {
				name: 'items',
				onInvalid: 'revert',
			},
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
		defaultIntentHandlers.insert.apply?.({
			result: normalResult,
			payload: {
				name: 'items',
			},
		}),
	).toBe(normalResult);
});

test('actionHandlers.remove', () => {
	// Test parse payload
	expect(
		defaultIntentHandlers.remove.parse?.({ name: 'items', index: 0 }),
	).toEqual({ name: 'items', index: 0 });
	expect(() =>
		defaultIntentHandlers.remove.parse?.({ name: 'items' } as any),
	).toThrow();
	expect(() =>
		defaultIntentHandlers.remove.parse?.({ name: 123, index: 0 } as any),
	).toThrow();

	// Test resolve
	const payload = { items: ['a', 'b', 'c'] };
	const options = { name: 'items', index: 1 };
	expect(
		defaultIntentHandlers.remove.resolve?.({
			value: payload,
			payload: options,
		}),
	).toEqual({
		items: ['a', 'c'],
	});

	const minResult: SubmissionResult<string[]> = {
		submission: { intent: null, payload: { items: ['a'] }, fields: [] },
		targetValue: { items: [] },
		error: { formErrors: [], fieldErrors: { items: ['Min 1 item'] } },
	};
	expect(
		defaultIntentHandlers.remove.apply?.({
			result: minResult,
			payload: {
				name: 'items',
				index: 0,
				onInvalid: 'revert',
			},
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
		defaultIntentHandlers.remove.apply?.({
			result: insertResult,
			payload: {
				name: 'items',
				index: 0,
				onInvalid: 'insert',
				defaultValue: '',
			},
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
		defaultIntentHandlers.remove.apply?.({
			result: noRevertResult,
			payload: {
				name: 'items',
				index: 0,
			},
		}),
	).toBe(noRevertResult);

	const normalResult: SubmissionResult<string[]> = {
		submission: { intent: null, payload: { items: ['a', 'b'] }, fields: [] },
		targetValue: { items: ['a'] },
		error: null,
	};
	expect(
		defaultIntentHandlers.remove.apply?.({
			result: normalResult,
			payload: {
				name: 'items',
				index: 1,
			},
		}),
	).toBe(normalResult);
});

test('actionHandlers.reorder', () => {
	// Test parse payload
	expect(
		defaultIntentHandlers.reorder.parse?.({ name: 'items', from: 0, to: 2 }),
	).toEqual({ name: 'items', from: 0, to: 2 });
	expect(() =>
		defaultIntentHandlers.reorder.parse?.({ name: 'items', from: 0 } as any),
	).toThrow();
	expect(() =>
		defaultIntentHandlers.reorder.parse?.({ name: 123, from: 0, to: 2 } as any),
	).toThrow();

	// Test resolve
	const payload = { items: ['a', 'b', 'c', 'd'] };
	const options = { name: 'items', from: 1, to: 3 };
	expect(
		defaultIntentHandlers.reorder.resolve?.({
			value: payload,
			payload: options,
		}),
	).toEqual({
		items: ['a', 'c', 'd', 'b'],
	});
});
