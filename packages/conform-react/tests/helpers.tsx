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
	defaultIntentHandlers,
	mergeIntentHandlers,
	parseIntent,
	resolveIntent,
} from '../future/intent';
import { FormAction, IntentHandler } from '../future/types';
import { getApplyStatus, initializeState } from '../future/state';
import { expect } from 'vitest';
import { Locator } from 'vitest/browser';

export function serverRenderHook<Result>(renderCallback: () => Result): Result {
	let called = false;
	let result: Result;

	function TestComponent() {
		result = renderCallback();
		called = true;
		return null;
	}

	renderToStaticMarkup(<TestComponent />);

	if (!called) {
		throw new Error('The hook was not called');
	}

	return result!;
}

export function createResult(
	entries: Array<[string, FormDataEntryValue]>,
	options?: {
		targetValue?: Record<string, FormValue> | null;
		error?: Partial<FormError<any>> | null;
		handlers?: Record<string, IntentHandler<any, any>>;
	},
): SubmissionResult<any, any> {
	const formData = new FormData();

	for (const [name, value] of entries) {
		formData.append(name, value);
	}

	const submission = parseSubmission(formData, {
		intentName: DEFAULT_INTENT_NAME,
	});
	const handlers = mergeIntentHandlers(
		defaultIntentHandlers,
		options?.handlers,
	);
	const intent = parseIntent(submission.intent, { handlers });
	const value = resolveIntent(submission, { handlers, intent });

	return report(submission, {
		value:
			typeof options?.targetValue !== 'undefined' ? options.targetValue : value,
		error: options?.error,
	});
}

export function createAction(options: {
	type: FormAction<any, any>['type'];
	entries: Array<[string, FormDataEntryValue]>;
	reset?: boolean;
	defaultValue?: Record<string, unknown> | null;
	targetValue?: Record<string, FormValue> | null;
	error?: Partial<FormError<any>> | null;
	handlers?: Record<string, IntentHandler<any, any>>;
}): FormAction<any, any, any> {
	const formData = new FormData();

	for (const [name, value] of options.entries) {
		formData.append(name, value);
	}

	const submission = parseSubmission(formData, {
		intentName: DEFAULT_INTENT_NAME,
	});
	const handlers = mergeIntentHandlers(
		defaultIntentHandlers,
		options?.handlers,
	);
	const intent = parseIntent(submission.intent, { handlers });
	const value = resolveIntent(submission, { handlers, intent: intent });
	const result = report(submission, {
		value:
			options.targetValue !== undefined
				? options.targetValue
				: options.reset
					? undefined
					: value,
		reset: options.reset,
		error: options.error,
	});
	const finalResult = applyIntent(result, intent, { handlers });

	return {
		...finalResult,
		type: options.type,
		intent: intent,
		ctx: {
			handlers,
			status: getApplyStatus(result.targetValue, finalResult.targetValue),
			reset(defaultValue?: Record<string, unknown> | null) {
				return initializeState({
					defaultValue: defaultValue ?? options.defaultValue,
				});
			},
		},
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
