import { expect, test, vi } from 'vitest';
import { memorize } from '../src/memorize';

test('memoize()', () => {
	const mock = vi.fn((a: number, b: number) => a + b);
	const fn = memorize(mock);

	expect(fn(5, 2)).toEqual(7);
	expect(mock).toHaveBeenNthCalledWith(1, 5, 2);
	expect(fn(5, 2)).toEqual(7);
	expect(mock).toBeCalledTimes(1);
	expect(fn(2, 3)).toEqual(5);
	expect(mock).toHaveBeenNthCalledWith(2, 2, 3);
	fn.clearCache();
	expect(fn(2, 3)).toEqual(5);
	expect(mock).toHaveBeenNthCalledWith(3, 2, 3);
});
