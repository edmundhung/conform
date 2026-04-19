import { expect, test } from 'vitest';
import { deepEqual, serializeHtmlPattern } from '../util';

test('deepEqual', () => {
	expect(deepEqual(null, null)).toBe(true);
	expect(deepEqual(undefined, undefined)).toBe(true);
	expect(deepEqual(1, 1)).toBe(true);
	expect(deepEqual('test', 'test')).toBe(true);
	expect(deepEqual(true, true)).toBe(true);
	expect(deepEqual(false, false)).toBe(true);
	expect(deepEqual({}, {})).toBe(true);
	expect(deepEqual([], [])).toBe(true);
	expect(deepEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } })).toBe(true);
	expect(deepEqual([1, 2, { a: 3 }], [1, 2, { a: 3 }])).toBe(true);
	expect(deepEqual(1, '1')).toBe(false);
	expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
	expect(deepEqual([1], [1, 2])).toBe(false);
	expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
	expect(deepEqual([1, 2], [2, 1])).toBe(false);
	expect(deepEqual(new Date(12345), new Date(12345))).toBe(false);
	expect(deepEqual(new File([], 'example'), new File([], 'example'))).toBe(
		false,
	);
});

test('serializeHtmlPattern', () => {
	// Empty array
	expect(serializeHtmlPattern([])).toBeUndefined();

	// Single RegExp
	expect(serializeHtmlPattern(/[A-Z]/)).toBe('^(?=.*(?:[A-Z])).*$');
	expect(serializeHtmlPattern(/^[A-Z]+$/)).toBe('^(?=.*(?:^[A-Z]+$)).*$');

	// Single pattern in array
	expect(serializeHtmlPattern([/[A-Z]/])).toBe('^(?=.*(?:[A-Z])).*$');
	expect(serializeHtmlPattern([/^[A-Z]+$/])).toBe('^(?=.*(?:^[A-Z]+$)).*$');

	// Multiple patterns without flags
	expect(serializeHtmlPattern([/[A-Z]/, /[0-9]/])).toBe(
		'^(?=.*(?:[A-Z]))(?=.*(?:[0-9])).*$',
	);

	// Unsupported flags
	expect(serializeHtmlPattern([/[A-Z]/i])).toBeUndefined();
	expect(serializeHtmlPattern([/[A-Z]/, /[0-9]/i])).toBeUndefined();

	// Other flags
	expect(serializeHtmlPattern([/[A-Z]/g])).toBe('^(?=.*(?:[A-Z])).*$');
	expect(serializeHtmlPattern([/[A-Z]/m])).toBe('^(?=.*(?:[A-Z])).*$');
	expect(serializeHtmlPattern([/[A-Z]/s])).toBe('^(?=.*(?:[A-Z])).*$');
	expect(serializeHtmlPattern([/[A-Z]/u])).toBe('^(?=.*(?:[A-Z])).*$');

	// Semantic validation: single pattern (uppercase)
	const single = serializeHtmlPattern([/^[A-Z]+$/]);
	expect(single).toBeDefined();
	const singleRegex = new RegExp(single || '');
	expect(singleRegex.test('ABC')).toBe(true);
	expect(singleRegex.test('abc')).toBe(false);
	expect(singleRegex.test('ABC123')).toBe(false);

	// Semantic validation: multiple patterns (uppercase and digit)
	const multi = serializeHtmlPattern([/[A-Z]/, /[0-9]/]);
	expect(multi).toBeDefined();
	const multiRegex = new RegExp(multi || '');
	expect(multiRegex.test('ABC')).toBe(false);
	expect(multiRegex.test('123')).toBe(false);
	expect(multiRegex.test('ABC123')).toBe(true);
	expect(multiRegex.test('abc123')).toBe(false);
});
