import { expect, test } from 'vitest';
import { serialize, deepEqual } from '../util';

test('serialize', () => {
	expect(serialize('test')).toBe('test');
	expect(serialize(true)).toBe('on');
	expect(serialize(false)).toBeUndefined();
	expect(serialize(123)).toBe('123');
	expect(serialize(987654321n)).toBe('987654321');
	expect(serialize(new Date(12345))).toBe(new Date(12345).toISOString());
	expect(serialize(new Map())).toBeUndefined();
	expect(serialize(new Set())).toBeUndefined();
	expect(serialize(new File([], 'example'))).toBeUndefined();
	expect(serialize(null)).toBeUndefined();
	expect(serialize(undefined)).toBeUndefined();
	expect(serialize({ a: 1, b: 2, c: 3 })).toBeUndefined();
	expect(serialize(['foo', 'bar'])).toBeUndefined();
});

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
