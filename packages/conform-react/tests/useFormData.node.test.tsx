import { describe, it, expect, vi } from 'vitest';
import { useFormData } from '../future';
import { serverRenderHook } from './helpers';

describe('future export: useFormData', () => {
	it('returns undefined on the server when form is not available', async () => {
		const selector = vi.fn((formData, currentValue) => {
			return formData.get('example') || 'fallback value';
		});
		
		// On the server, useFormData returns undefined without calling the selector
		// We need to call the hook directly without using serverRenderHook since it doesn't allow undefined
		let result: any;
		function TestComponent() {
			result = useFormData('test', selector);
			return null;
		}
		
		// Render on server
		const React = require('react');
		const ReactDOMServer = require('react-dom/server');
		ReactDOMServer.renderToStaticMarkup(React.createElement(TestComponent));

		expect(result).toBeUndefined();
		expect(selector).not.toHaveBeenCalled();
	});
});
