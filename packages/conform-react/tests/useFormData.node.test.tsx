import { describe, it, expect, vi } from 'vitest';
import { useFormData } from '../future';
import { serverRenderHook } from './helpers';

describe('future export: useFormData', () => {
	it('returns undefined on the server when form is not available', () => {
		const selector = vi.fn((formData: URLSearchParams) => {
			return formData.get('example') || 'fallback value';
		});

		const result = serverRenderHook(() => useFormData('test', selector));

		expect(result).toBeUndefined();
		expect(selector).not.toHaveBeenCalled();
	});

	it('returns fallback on the server when form is not available and fallback is provided', () => {
		const selector = vi.fn((formData: URLSearchParams) => {
			return formData.get('example') ?? 'selector fallback';
		});
		const fallback = 'fallback value';

		const result = serverRenderHook(() =>
			useFormData('test', selector, { fallback }),
		);

		expect(result).toBe(fallback);
		expect(selector).not.toHaveBeenCalled();
	});
});
