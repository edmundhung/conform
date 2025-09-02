import { test, expect } from 'vitest';
import {
	isUndefined,
	isString,
	isNumber,
	isOptional,
	getArrayAtPath,
	updateValueAtPath,
	createPathIndexUpdater,
	normalizeFormError,
	normalizeValidateResult,
	resolveValidateResult,
	resolveStandardSchemaPath,
	resolveStandardSchemaResult,
	merge,
	transformKeys,
	appendUniqueItem,
	compactMap,
	generateUniqueKey,
} from '../future/util';
import type { FormError } from '@conform-to/dom/future';

test('isUndefined', () => {
	expect(isUndefined(undefined)).toBe(true);
	expect(isUndefined(null)).toBe(false);
	expect(isUndefined('')).toBe(false);
	expect(isUndefined(0)).toBe(false);
	expect(isUndefined(false)).toBe(false);
});

test('isString', () => {
	expect(isString('hello')).toBe(true);
	expect(isString('')).toBe(true);
	expect(isString(123)).toBe(false);
	expect(isString(null)).toBe(false);
	expect(isString(undefined)).toBe(false);
});

test('isNumber', () => {
	expect(isNumber(123)).toBe(true);
	expect(isNumber(0)).toBe(true);
	expect(isNumber(-1)).toBe(true);
	expect(isNumber(3.14)).toBe(true);
	expect(isNumber('123')).toBe(false);
	expect(isNumber(null)).toBe(false);
	expect(isNumber(undefined)).toBe(false);
});

test('isOptional', () => {
	expect(isOptional(undefined, isString)).toBe(true);
	expect(isOptional('hello', isString)).toBe(true);
	expect(isOptional(123, isString)).toBe(false);
	expect(isOptional(null, isString)).toBe(false);

	expect(isOptional(undefined, isNumber)).toBe(true);
	expect(isOptional(123, isNumber)).toBe(true);
	expect(isOptional('123', isNumber)).toBe(false);
});

test('getArrayAtPath', () => {
	const formValue = {
		items: [1, 2, 3],
		nested: {
			list: ['a', 'b'],
		},
		empty: [],
	};

	expect(getArrayAtPath(formValue, 'items')).toEqual([1, 2, 3]);
	expect(getArrayAtPath(formValue, 'nested.list')).toEqual(['a', 'b']);
	expect(getArrayAtPath(formValue, 'empty')).toEqual([]);
	expect(getArrayAtPath(formValue, 'nonexistent')).toEqual([]);
	expect(getArrayAtPath(null, 'items')).toEqual([]);

	// Test error case
	const invalidValue = { notArray: 'string' };
	expect(() => getArrayAtPath(invalidValue, 'notArray')).toThrow(
		'The value of "notArray" is not an array',
	);
});

test('updateValueAtPath', () => {
	const data = { a: 1, b: { c: 2 } };

	// Test updating nested value
	const result1 = updateValueAtPath(data, 'b.c', 3);
	expect(result1).toEqual({ a: 1, b: { c: 3 } });
	expect(result1).not.toBe(data); // Should be immutable

	// Test updating root value
	const result2 = updateValueAtPath(data, 'a', 5);
	expect(result2).toEqual({ a: 5, b: { c: 2 } });

	// Test empty path (replace entire object)
	const newData = { x: 10, y: 20 };
	const result3 = updateValueAtPath(data, '', newData);
	expect(result3).toEqual(newData);

	// Test error case with empty path and non-object value
	expect(() => updateValueAtPath(data, '', 'string' as any)).toThrow(
		'The value must be an object',
	);
});

test('createPathIndexUpdater', () => {
	const updater = createPathIndexUpdater('items', (index) =>
		index < 2 ? index + 1 : index,
	);

	// Test matching path with index update
	expect(updater('items[0].name')).toBe('items[1].name');
	expect(updater('items[1].name')).toBe('items[2].name');
	expect(updater('items[2].name')).toBe('items[2].name'); // No change

	// Test non-matching path
	expect(updater('other[0].name')).toBe('other[0].name');
	expect(updater('items')).toBe('items'); // No index

	// Test removal (null return)
	const remover = createPathIndexUpdater('items', (index) =>
		index === 1 ? null : index,
	);
	expect(remover('items[1].name')).toBeNull();
	expect(remover('items[0].name')).toBe('items[0].name');

	// Test nested list
	const nestedUpdater = createPathIndexUpdater(
		'form.items',
		(index) => index + 1,
	);
	expect(nestedUpdater('form.items[0].field')).toBe('form.items[1].field');
});

test('normalizeFormError', () => {
	// Test error with messages
	const errorWithMessages: FormError<string> = {
		formErrors: ['Form error'],
		fieldErrors: { email: ['Required'] },
	};
	expect(normalizeFormError(errorWithMessages)).toBe(errorWithMessages);

	// Test error without messages
	const emptyError: FormError<string> = {
		formErrors: [],
		fieldErrors: { email: [] },
	};
	expect(normalizeFormError(emptyError)).toBeNull();

	// Test null error
	expect(normalizeFormError(null)).toBeNull();

	// Test mixed empty/non-empty fields
	const mixedError: FormError<string> = {
		formErrors: [],
		fieldErrors: { email: [], password: ['Required'] },
	};
	expect(normalizeFormError(mixedError)).toBe(mixedError);
});

test('normalizeValidateResult', () => {
	// Test result with error property
	const resultWithError = {
		error: { formErrors: ['Error'], fieldErrors: {} },
		value: { email: 'test@example.com' },
	};
	expect(normalizeValidateResult(resultWithError)).toEqual({
		error: { formErrors: ['Error'], fieldErrors: {} },
		value: { email: 'test@example.com' },
	});

	// Test direct error result
	const directError: FormError<string> = {
		formErrors: ['Direct error'],
		fieldErrors: {},
	};
	expect(normalizeValidateResult(directError)).toEqual({
		error: directError,
	});

	// Test null result
	expect(normalizeValidateResult(null)).toEqual({
		error: null,
	});
});

test('resolveValidateResult', () => {
	// Test Promise result
	const promiseResult = Promise.resolve(null);
	const resolved1 = resolveValidateResult(promiseResult);
	expect(resolved1.syncResult).toBeUndefined();
	expect(resolved1.asyncResult).toBeInstanceOf(Promise);

	// Test Array result [sync, async]
	const syncError: FormError<string> = {
		formErrors: ['Sync error'],
		fieldErrors: {},
	};
	const asyncPromise = Promise.resolve(null);
	const resolved2 = resolveValidateResult([syncError, asyncPromise]);
	expect(resolved2.syncResult).toEqual({ error: syncError });
	expect(resolved2.asyncResult).toBeInstanceOf(Promise);

	// Test direct result
	const directError: FormError<string> = {
		formErrors: ['Direct error'],
		fieldErrors: {},
	};
	const resolved3 = resolveValidateResult(directError);
	expect(resolved3.syncResult).toEqual({ error: directError });
	expect(resolved3.asyncResult).toBeUndefined();
});

test('resolveStandardSchemaPath', () => {
	// Test simple path
	const issue1 = { path: ['email'], message: 'Required' };
	expect(resolveStandardSchemaPath(issue1)).toEqual(['email']);

	// Test nested path with objects
	const issue2 = {
		path: [{ key: 'profile' }, { key: 'name' }],
		message: 'Required',
	};
	expect(resolveStandardSchemaPath(issue2)).toEqual(['profile', 'name']);

	// Test mixed path
	const issue3 = {
		path: ['items', 0, { key: 'name' }],
		message: 'Required',
	};
	expect(resolveStandardSchemaPath(issue3)).toEqual(['items', 0, 'name']);

	// Test empty path
	const issue4 = { path: [], message: 'Form error' };
	expect(resolveStandardSchemaPath(issue4)).toEqual([]);

	// Test undefined path
	const issue5 = { message: 'Root error' };
	expect(resolveStandardSchemaPath(issue5)).toEqual([]);

	// Test symbol in path (should throw)
	const symbolIssue = { path: [Symbol('test')], message: 'Error' };
	expect(() => resolveStandardSchemaPath(symbolIssue)).toThrow(
		'Path segments must not contain symbols',
	);
});

test('resolveStandardSchemaResult', () => {
	// Test success result
	const successResult = {
		value: { email: 'test@example.com' },
	};
	expect(resolveStandardSchemaResult(successResult)).toEqual({
		error: null,
		value: { email: 'test@example.com' },
	});

	// Test result with issues
	const errorResult = {
		issues: [
			{ path: [], message: 'Form is invalid' },
			{ path: ['email'], message: 'Email is required' },
			{ path: ['email'], message: 'Invalid email format' },
			{ path: ['profile', 'name'], message: 'Name is required' },
		],
	};
	expect(resolveStandardSchemaResult(errorResult)).toEqual({
		error: {
			formErrors: ['Form is invalid'],
			fieldErrors: {
				email: ['Email is required', 'Invalid email format'],
				'profile.name': ['Name is required'],
			},
		},
	});
});

test('merge', () => {
	const obj = { a: 1, b: 2, c: 3 };

	// Test no changes
	const result1 = merge(obj, {});
	expect(result1).toBe(obj); // Same reference

	// Test same values
	const result2 = merge(obj, { a: 1, b: 2 });
	expect(result2).toBe(obj); // Same reference

	// Test with changes
	const result3 = merge(obj, { b: 5, d: 4 } as any);
	expect(result3).toEqual({ a: 1, b: 5, c: 3, d: 4 });
	expect(result3).not.toBe(obj); // Different reference

	// Test updating with same object reference
	const result4 = merge(obj, obj);
	expect(result4).toBe(obj);
});

test('transformKeys', () => {
	const obj = {
		'items[0].name': 'John',
		'items[1].name': 'Jane',
		'items[2].name': 'Bob',
		other: 'value',
	};

	// Test key transformation
	const result1 = transformKeys(obj, (key) =>
		key.startsWith('items[')
			? key.replace(/\[(\d+)\]/, (_, num) => `[${parseInt(num) + 1}]`)
			: key,
	);
	expect(result1).toEqual({
		'items[1].name': 'John',
		'items[2].name': 'Jane',
		'items[3].name': 'Bob',
		other: 'value',
	});

	// Test filtering (null removal)
	const result2 = transformKeys(obj, (key) =>
		key === 'items[1].name' ? null : key,
	);
	expect(result2).toEqual({
		'items[0].name': 'John',
		'items[2].name': 'Bob',
		other: 'value',
	});
});

test('appendUniqueItem', () => {
	const list = ['a', 'b', 'c'];

	// Test adding new item
	const result1 = appendUniqueItem(list, 'd');
	expect(result1).toEqual(['a', 'b', 'c', 'd']);
	expect(result1).not.toBe(list); // Different reference

	// Test adding existing item
	const result2 = appendUniqueItem(list, 'b');
	expect(result2).toBe(list); // Same reference
	expect(result2).toEqual(['a', 'b', 'c']);

	// Test with empty list
	const result3 = appendUniqueItem([], 'first');
	expect(result3).toEqual(['first']);
});

test('compactMap', () => {
	const list = ['a', 'b', 'c', 'd'];

	// Test filtering and mapping
	const result1 = compactMap(list, (item) =>
		item === 'b' ? null : item.toUpperCase(),
	);
	expect(result1).toEqual(['A', 'C', 'D']);

	// Test all items pass through
	const result2 = compactMap(list, (item) => item + '!');
	expect(result2).toEqual(['a!', 'b!', 'c!', 'd!']);

	// Test all items filtered
	const result3 = compactMap(list, () => null);
	expect(result3).toEqual([]);

	// Test empty list
	const result4 = compactMap([], (item) => item);
	expect(result4).toEqual([]);
});

test('generateUniqueKey', () => {
	const key1 = generateUniqueKey();
	const key2 = generateUniqueKey();

	expect(typeof key1).toBe('string');
	expect(typeof key2).toBe('string');
	expect(key1).not.toBe(key2); // Should be unique
	expect(key1.length).toBeGreaterThan(0);

	// Test that it's base36
	expect(key1).toMatch(/^[0-9a-z]+$/);
});
