import { describe, it, expect, vi } from 'vitest';
import { useFormData } from '../future';
import { serverRenderHook } from './helpers';

describe('future export: useFormData', () => {
	it('runs the selector with no formData and current value on the server', async () => {
		const selector = vi.fn((formData, currentValue) => {
			if (formData === null) {
				return currentValue ?? 'no formdata';
			}

			return formData.get('example') || 'fallback value';
		});
		const result = serverRenderHook(() =>
			useFormData('test', selector, { optional: true }),
		);

		expect(result).toEqual('no formdata');
		expect(selector).toHaveBeenCalledWith(null, undefined);
		expect(selector).toHaveBeenCalledTimes(1);
	});

	it('throws an error when form element is not available and optional is not set', () => {
		const selector = vi.fn((formData) => formData.get('example'));

		expect(() => {
			serverRenderHook(() => useFormData('test', selector));
		}).toThrow(
			'Form element not found during SSR. Pass `optional: true` if the form element might not be available.',
		);
	});

	it('throws an error when form element is not available with optional: false', () => {
		const selector = vi.fn((formData) => formData.get('example'));

		expect(() => {
			serverRenderHook(() =>
				useFormData('test', selector, { optional: false }),
			);
		}).toThrow(
			'Form element not found during SSR. Pass `optional: true` if the form element might not be available.',
		);
	});
});
