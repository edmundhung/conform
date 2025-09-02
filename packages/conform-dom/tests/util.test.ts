import { expect, test } from 'vitest';
import { deepEqual } from '../util';

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
