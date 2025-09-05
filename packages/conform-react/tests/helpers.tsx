import {
	DEFAULT_INTENT_NAME,
	FormError,
	FormValue,
	parseSubmission,
	report,
	SubmissionResult,
} from '@conform-to/dom/future';
import { renderToStaticMarkup } from 'react-dom/server';
import {
	applyIntent,
	actionHandlers,
	deserializeIntent,
} from '../future/intent';
import { FormAction } from '../future/types';
import { initializeState } from '../future/state';
import { expect } from 'vitest';
import { Locator } from '@vitest/browser/context';

export function serverRenderHook<Result>(renderCallback: () => Result): Result {
	let result: Result | undefined;

	function TestComponent() {
		result = renderCallback();
		return null;
	}

	renderToStaticMarkup(<TestComponent />);

	if (!result) {
		throw new Error('The hook did not return any value');
	}

	return result;
}

export function createResult(
	entries: Array<[string, FormDataEntryValue]>,
	options?: {
		value?: Record<string, FormValue> | null;
		error?: Partial<FormError<any>> | null;
	},
): SubmissionResult<any, any> {
	const formData = new FormData();

	for (const [name, value] of entries) {
		formData.append(name, value);
	}

	const submission = parseSubmission(formData, {
		intentName: DEFAULT_INTENT_NAME,
	});
	const value = applyIntent(submission);

	return report(submission, {
		intendedValue:
			typeof options?.value !== 'undefined' ? options.value : value,
		error: options?.error,
	});
}

export function createAction(options: {
	type: FormAction<any, any>['type'];
	entries: Array<[string, FormDataEntryValue]>;
	value?: Record<string, FormValue> | null;
	error?: Partial<FormError<any>> | null;
}): FormAction<any, any, any> {
	const formData = new FormData();

	for (const [name, value] of options.entries) {
		formData.append(name, value);
	}

	const submission = parseSubmission(formData, {
		intentName: DEFAULT_INTENT_NAME,
	});
	const value = applyIntent(submission);
	const result = report(submission, {
		intendedValue:
			typeof options?.value !== 'undefined' ? options.value : value,
		error: options?.error,
	});
	const ctx = {
		handlers: actionHandlers,
		reset() {
			return initializeState();
		},
	};

	return {
		...result,
		type: options.type,
		intent: submission.intent ? deserializeIntent(submission.intent) : null,
		ctx,
	};
}

export async function expectNoErrorMessages(...inputs: Locator[]) {
	for (const input of inputs) {
		await expect.element(input).toHaveAccessibleDescription('');
	}
}

export async function expectErrorMessage(input: Locator, message: string) {
	await expect.element(input).toHaveAccessibleDescription(message);
}
