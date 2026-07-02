import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFormContext } from '../form';

describe('createFormContext', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	function setupFormData(value: string) {
		class TestElement {}

		const form = {
			elements: [] as unknown[],
			isConnected: true,
		};
		const input = Object.assign(new TestElement(), {
			tagName: 'INPUT',
			type: 'text',
			name: 'name',
			form,
			focus: vi.fn(),
		});

		form.elements = [input];

		vi.stubGlobal('Element', TestElement);
		vi.stubGlobal(
			'FormData',
			class {
				get(name: string) {
					if (name === '__intent__' || name === '__state__') {
						return null;
					}

					return name === 'name' ? value : null;
				}

				entries() {
					return [['name', value]][Symbol.iterator]();
				}
			},
		);
		vi.stubGlobal('document', {
			forms: {
				namedItem: () => form,
			},
		});

		return { input };
	}

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

	it('keeps current values when lastResult omits initialValue', () => {
		const { input } = setupFormData('typed value');

		const context = createFormContext({
			formId: 'test-form',
			defaultValue: {
				name: 'initial value',
			},
			lastResult: null,
		});

		context.onInput({
			target: input,
			defaultPrevented: false,
		} as unknown as Event);

		expect(context.getState().initialValue.name).toBe('initial value');
		expect(context.getState().value.name).toBe('typed value');

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
		expect(context.getState().value.name).toBe('typed value');
		expect(context.getState().error.name).toEqual(['some error message']);
	});

	it('resets current values when lastResult initialValue is null', () => {
		const { input } = setupFormData('typed value');

		const context = createFormContext({
			formId: 'test-form',
			defaultValue: {
				name: 'initial value',
			},
			lastResult: null,
		});

		context.onInput({
			target: input,
			defaultPrevented: false,
		} as unknown as Event);

		expect(context.getState().value.name).toBe('typed value');

		context.onUpdate({
			lastResult: {
				status: 'error',
				initialValue: null,
				error: {
					name: ['some error message'],
				},
				fields: ['name'],
			},
		});

		expect(context.getState().submissionStatus).toBeUndefined();
		expect(context.getState().value.name).toBe('initial value');
		expect(context.getState().error.name).toBeUndefined();
	});
});
