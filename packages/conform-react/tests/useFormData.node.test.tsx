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
		const result = serverRenderHook(() => useFormData('test', selector));

		expect(result).toEqual('no formdata');
		expect(selector).toHaveBeenCalledWith(null, undefined);
		expect(selector).toHaveBeenCalledTimes(1);
	});
});
