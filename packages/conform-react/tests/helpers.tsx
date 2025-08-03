import {
	createGlobalFormsObserver,
	FormError,
	FormValue,
	parseSubmission,
	report,
	SubmissionResult,
} from '@conform-to/dom/future';
import { useEffect, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DEFAULT_INTENT } from '../future/hooks';
import {
	applyIntent,
	defaultActionHandlers,
	deserializeIntent,
	initializeState,
} from '../future/form';
import { FormAction } from '../future/types';

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

export function useFormObserver() {
	const observerRef = useRef<ReturnType<typeof createGlobalFormsObserver>>();

	if (!observerRef.current) {
		observerRef.current = createGlobalFormsObserver();
	}

	useEffect(() => {
		observerRef.current?.dispose();
	}, []);

	return observerRef.current;
}

export function createResult(
	entries: Array<[string, FormDataEntryValue]>,
	options?: {
		value?: Record<string, FormValue> | null;
		error?: Partial<FormError<any, any>> | null;
	},
): SubmissionResult<any, any, any> {
	const formData = new FormData();

	for (const [name, value] of entries) {
		formData.append(name, value);
	}

	const submission = parseSubmission(formData, {
		intentName: DEFAULT_INTENT,
	});
	const value = applyIntent(submission);

	return report(submission, {
		value: typeof options?.value !== 'undefined' ? options.value : value,
		error: options?.error,
	});
}

export function createAction(options: {
	type: FormAction<any, any>['type'];
	entries: Array<[string, FormDataEntryValue]>;
	value?: Record<string, FormValue> | null;
	error?: Partial<FormError<any, any>> | null;
}): FormAction<any, any> {
	const formData = new FormData();

	for (const [name, value] of options.entries) {
		formData.append(name, value);
	}

	const submission = parseSubmission(formData, {
		intentName: DEFAULT_INTENT,
	});
	const value = applyIntent(submission);
	const result = report(submission, {
		value: typeof options?.value !== 'undefined' ? options.value : value,
		error: options?.error,
	});
	const ctx = {
		handlers: defaultActionHandlers,
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
