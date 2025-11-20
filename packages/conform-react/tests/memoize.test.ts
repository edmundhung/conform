import { describe, test, expect, vi } from 'vitest';
import { memoize, defaultEqualityCheck } from '../future/memoize';

describe('defaultEqualityCheck', () => {
	test('returns true for identical primitive arguments', () => {
		expect(defaultEqualityCheck([1, 'hello'], [1, 'hello'])).toBe(true);
		expect(defaultEqualityCheck([true, false], [true, false])).toBe(true);
		expect(defaultEqualityCheck([null, undefined], [null, undefined])).toBe(
			true,
		);
	});

	test('returns false for different primitive arguments', () => {
		expect(defaultEqualityCheck([1, 'hello'], [2, 'hello'])).toBe(false);
		expect(defaultEqualityCheck([1, 'hello'], [1, 'world'])).toBe(false);
		expect(defaultEqualityCheck([true], [false])).toBe(false);
	});

	test('returns false for different argument lengths', () => {
		expect(defaultEqualityCheck([1, 2], [1, 2, 3])).toBe(false);
		expect(defaultEqualityCheck([1, 2, 3], [1, 2])).toBe(false);
	});

	test('handles NaN correctly', () => {
		expect(defaultEqualityCheck([NaN], [NaN])).toBe(true);
		expect(defaultEqualityCheck([NaN, 1], [NaN, 1])).toBe(true);
	});

	test('uses reference equality for objects', () => {
		const obj = { id: 1 };
		expect(defaultEqualityCheck([obj], [obj])).toBe(true);
		expect(defaultEqualityCheck([{ id: 1 }], [{ id: 1 }])).toBe(false);
	});
});

describe('memoize function', () => {
	test('caches and returns the same result for identical arguments', () => {
		const mockFn = vi.fn((a: number, b: string) => `${a}-${b}`);
		const memoized = memoize(mockFn);

		const result1 = memoized(1, 'hello');
		const result2 = memoized(1, 'hello');

		expect(result1).toBe('1-hello');
		expect(result2).toBe('1-hello');
		expect(mockFn).toHaveBeenCalledTimes(1);
	});

	test('calls function again for different arguments', () => {
		const mockFn = vi.fn((a: number) => a * 2);
		const memoized = memoize(mockFn);

		const result1 = memoized(5);
		const result2 = memoized(10);

		expect(result1).toBe(10);
		expect(result2).toBe(20);
		expect(mockFn).toHaveBeenCalledTimes(2);
	});

	test('only caches the most recent call', () => {
		const mockFn = vi.fn((a: number) => a * 2);
		const memoized = memoize(mockFn);

		memoized(1); // First call
		memoized(2); // Second call (clears cache)
		memoized(1); // Should call function again
		memoized(1); // Cached

		expect(mockFn).toHaveBeenCalledTimes(3);
		expect(mockFn).toHaveBeenNthCalledWith(1, 1);
		expect(mockFn).toHaveBeenNthCalledWith(2, 2);
		expect(mockFn).toHaveBeenNthCalledWith(3, 1);
	});

	test('handles async functions', async () => {
		const mockFn = vi.fn(async (input: string) => {
			return Promise.resolve(`processed-${input}`);
		});
		const memoized = memoize(mockFn);

		const result1 = await memoized('test');
		const result2 = await memoized('test');

		expect(result1).toBe('processed-test');
		expect(result2).toBe('processed-test');
		expect(mockFn).toHaveBeenCalledTimes(1);
	});

	test('clears cache when async function rejects', async () => {
		let shouldFail = true;
		const mockFn = vi.fn(async (input: string) => {
			if (shouldFail) {
				shouldFail = false;
				throw new Error('Network error');
			}
			return `success-${input}`;
		});
		const memoized = memoize(mockFn);

		// First call should fail and clear cache
		await expect(memoized('test')).rejects.toThrow('Network error');

		// Second call should succeed (function called again)
		await expect(memoized('test')).resolves.toBe('success-test');
		expect(mockFn).toHaveBeenCalledTimes(2);

		// Third call with same args should be cached
		await expect(memoized('test')).resolves.toBe('success-test');
		expect(mockFn).toHaveBeenCalledTimes(2);
	});

	test('preserves this context', () => {
		class TestClass {
			value = 42;

			getValue(multiplier: number) {
				return this.value * multiplier;
			}
		}

		const instance = new TestClass();
		const memoized = memoize(instance.getValue);

		const result1 = memoized.call(instance, 2);
		const result2 = memoized.call(instance, 2);

		expect(result1).toBe(84);
		expect(result2).toBe(84);
	});

	test('handles different this contexts', () => {
		const mockFn = vi.fn(function (this: { id: number }, input: string) {
			return `${this.id}-${input}`;
		});

		const memoized = memoize(mockFn);
		const context1 = { id: 1 };
		const context2 = { id: 2 };

		const result1 = memoized.call(context1, 'test');
		const result2 = memoized.call(context1, 'test'); // Same context, same args - should be cached
		const result3 = memoized.call(context2, 'test'); // Different context - should call function

		expect(result1).toBe('1-test');
		expect(result2).toBe('1-test');
		expect(result3).toBe('2-test');
		expect(mockFn).toHaveBeenCalledTimes(2);
	});

	test('supports custom equality function', () => {
		const mockFn = vi.fn(
			(user: { id: number; name: string }) => `User: ${user.name}`,
		);

		// Custom equality that only compares by ID
		const memoized = memoize(mockFn, (prevArgs, nextArgs) => {
			return prevArgs[0].id === nextArgs[0].id;
		});

		const result1 = memoized({ id: 1, name: 'Alice' });
		const result2 = memoized({ id: 1, name: 'Bob' }); // Different name, same ID - should be cached

		expect(result1).toBe('User: Alice');
		expect(result2).toBe('User: Alice'); // Returns cached result from first call
		expect(mockFn).toHaveBeenCalledTimes(1);
	});

	test('provides clearCache method', () => {
		const mockFn = vi.fn((input: string) => input.toUpperCase());
		const memoized = memoize(mockFn);

		memoized('hello');
		memoized('hello'); // Should be cached

		memoized.clearCache();
		memoized('hello'); // Should call function again after cache clear

		expect(mockFn).toHaveBeenCalledTimes(2);
	});

	test('handles functions with no arguments', () => {
		const mockFn = vi.fn(() => Math.random());
		const memoized = memoize(mockFn);

		const result1 = memoized();
		const result2 = memoized();

		expect(result1).toBe(result2);
		expect(mockFn).toHaveBeenCalledTimes(1);
	});

	test('handles functions with multiple return types', () => {
		const mockFn = vi.fn((returnError: boolean) => {
			return returnError ? null : ['Error message'];
		});
		const memoized = memoize(mockFn);

		const result1 = memoized(false);
		const result2 = memoized(false);
		const result3 = memoized(true);

		expect(result1).toEqual(['Error message']);
		expect(result2).toEqual(['Error message']);
		expect(result3).toBeNull();
		expect(mockFn).toHaveBeenCalledTimes(2);
	});
});
