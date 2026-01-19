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

	it('returns defaultValue on the server when form is not available and defaultValue is provided', () => {
		const selector = vi.fn((formData: URLSearchParams) => {
			return formData.get('example') ?? 'fallback value';
		});
		const defaultValue = 'default value';

		const result = serverRenderHook(() =>
			useFormData('test', selector, { defaultValue }),
		);

		expect(result).toBe(defaultValue);
		expect(selector).not.toHaveBeenCalled();
	});
});
