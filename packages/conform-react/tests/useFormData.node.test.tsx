import { describe, it, expect, vi } from 'vitest';
import { useFormData } from '../future';
import { serverRenderHook } from './helpers';

describe('future export: useFormData', () => {
	it('returns undefined on the server when form is not available', async () => {
		const selector = vi.fn((formData, currentValue) => {
			return formData.get('example') || 'fallback value';
		});
		const result = serverRenderHook(() => useFormData('test', selector));

		expect(result).toBeUndefined();
		expect(selector).not.toHaveBeenCalled();
	});
});
