import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFormContext } from '../form';

describe('createFormContext', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('keeps last submission errors when initialValue is omitted', () => {
		vi.stubGlobal('document', {
			forms: {
				namedItem: () => null,
			},
		});

		const context = createFormContext({
			formId: 'test-form',
			lastResult: null,
		});

		context.onUpdate({
			lastResult: {
				status: 'error',
				error: {
					name: ['some error message'],
				},
				fields: ['name'],
			},
		});

		expect(context.getState().submissionStatus).toBe('error');
		expect(context.getState().error.name).toEqual(['some error message']);
	});
});
