'use client';

import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
} from 'react';
import type { FormError, FormValue, SubmissionResult } from 'conform-dom';
import { parseSubmission, report, requestIntent } from 'conform-dom';
import type {
	FormControl,
	FormState,
	FormControlIntent,
	FormControlCustomState,
	UnknownIntent,
} from './control';
import { applyIntent, baseControl } from './control';
import {
	deepEqual,
	FormRef,
	getFormElement,
	getSubmitEvent,
	resolveValidateResult,
	updateFieldValue,
	updateObject,
} from './util';
import { createFormObserver } from './observer';

export const formObserver = createFormObserver();

export function useNoValidate(defaultNoValidate = true): boolean {
	const [noValidate, setNoValidate] = useState(defaultNoValidate);

	useEffect(() => {
		// This is necessary to fix an issue in strict mode with related to our proxy setup
		// It avoids the component from being rerendered without re-rendering the child
		// Which reset the proxy but failed to capture its usage within child component
		if (!noValidate) {
			setNoValidate(true);
		}
	}, [noValidate]);

	return noValidate;
}

export type IntentDispatcher<Intent extends UnknownIntent> = {
	[Type in Intent['type']]: undefined extends Extract<
		Intent,
		{ type: Type }
	>['payload']
		? (payload?: Extract<Intent, { type: Type }>['payload']) => void
		: (payload: Extract<Intent, { type: Type }>['payload']) => void;
};

export type SubmitContext<FormShape, ErrorShape, Value> = {
	formData: FormData;
	value: NonNullable<Value>;
	update: (options: {
		error?: Partial<FormError<FormShape, ErrorShape>> | null;
		reset?: boolean;
	}) => void;
};

export type ValidateHandler<FormShape, ErrorShape, Value> = (
	value: Record<string, FormValue>,
	ctx: {
		formElement: HTMLFormElement;
	},
) =>
	| FormError<FormShape, ErrorShape>
	| null
	| {
			value?: Value;
			error: FormError<FormShape, ErrorShape> | null;
	  }
	| Promise<
			| FormError<FormShape, ErrorShape>
			| null
			| {
					value?: Value;
					error: FormError<FormShape, ErrorShape> | null;
			  }
	  >
	| undefined;

export type SubmitHandler<FormShape, ErrorShape, Value> = (
	event: React.FormEvent<HTMLFormElement>,
	ctx: SubmitContext<FormShape, ErrorShape, Value>,
) => void | Promise<void>;

/**
 * The default intent name
 */
export const DEFAULT_INTENT = '__intent__';

export function useFormControl<
	FormShape,
	ErrorShape,
	Intent extends UnknownIntent,
	CustomState extends Record<string, unknown> = {},
	Value = unknown,
>(
	formRef: FormRef,
	options: {
		control: FormControl<Intent, CustomState>;
		lastResult?:
			| SubmissionResult<FormShape, ErrorShape, Intent | null>
			| SubmissionResult<FormShape, ErrorShape, null>
			| null;
		intentName?: string;
		onValidate?: ValidateHandler<FormShape, ErrorShape, Value>;
		onSubmit?: SubmitHandler<FormShape, ErrorShape, Value>;
	},
): {
	state: FormState<FormShape, ErrorShape, CustomState>;
	handleSubmit(event: React.FormEvent<HTMLFormElement>): void;
	intent: IntentDispatcher<Intent>;
};
export function useFormControl<
	FormShape,
	ErrorShape = string[],
	Value = unknown,
>(
	formRef: FormRef,
	options?: {
		control?: undefined;
		lastResult?:
			| SubmissionResult<
					FormShape,
					ErrorShape,
					FormControlIntent<typeof baseControl> | null
			  >
			| SubmissionResult<FormShape, ErrorShape, null>
			| null;
		intentName?: string;
		onValidate?: ValidateHandler<FormShape, ErrorShape, Value>;
		onSubmit?: SubmitHandler<FormShape, ErrorShape, Value>;
	},
): {
	state: FormState<
		FormShape,
		ErrorShape,
		FormControlCustomState<typeof baseControl>
	>;
	handleSubmit(event: React.FormEvent<HTMLFormElement>): void;
	intent: IntentDispatcher<FormControlIntent<typeof baseControl>>;
};
export function useFormControl<
	FormShape,
	ErrorShape,
	Intent extends UnknownIntent,
	AdditionalState extends Record<string, unknown> = {},
	Value = never,
>(
	formRef: FormRef,
	options?: {
		control?: FormControl<
			Intent | FormControlIntent<typeof baseControl>,
			AdditionalState | FormControlCustomState<typeof baseControl>
		>;
		lastResult?:
			| SubmissionResult<
					FormShape,
					ErrorShape,
					Intent | FormControlIntent<typeof baseControl> | null
			  >
			| SubmissionResult<FormShape, ErrorShape, null>
			| null;
		intentName?: string;
		onValidate?: ValidateHandler<FormShape, ErrorShape, Value>;
		onSubmit?: SubmitHandler<FormShape, ErrorShape, Value>;
	},
): {
	state: FormState<
		FormShape,
		ErrorShape,
		AdditionalState | FormControlCustomState<typeof baseControl>
	>;
	handleSubmit(event: React.FormEvent<HTMLFormElement>): void;
	intent: IntentDispatcher<Intent | FormControlIntent<typeof baseControl>>;
} {
	const {
		intentName = DEFAULT_INTENT,
		control = baseControl,
		lastResult,
	} = options ?? {};
	const [{ state, sideEffects }, updateForm] = useState<{
		state: FormState<FormShape, ErrorShape, {} | AdditionalState>;
		sideEffects: Array<{
			intent: Intent | FormControlIntent<typeof baseControl>;
			state: FormState<FormShape, ErrorShape, {} | AdditionalState>;
		}>;
	}>(() => {
		let state = control.initializeState<FormShape, ErrorShape>();

		if (lastResult) {
			state = control.updateState(state, {
				type: 'server',
				result: lastResult,
				reset: () => state,
			});
		}

		return {
			state,
			sideEffects: [],
		};
	});
	const optionsRef = useRef(options);
	const lastResultRef = useRef(lastResult);
	const pendingIntentsRef = useRef<
		Array<Intent | FormControlIntent<typeof baseControl>>
	>([]);
	const lastAsyncResultRef = useRef<{
		event: SubmitEvent;
		value: Value | undefined;
	} | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);
	const intent = useIntent(formRef, {
		intentName,
		control,
	});
	const handleSubmission = useCallback(
		(
			result: SubmissionResult<
				FormShape,
				ErrorShape,
				Intent | FormControlIntent<typeof baseControl> | null
			>,
			options: {
				type: 'server' | 'client';
			},
		) => {
			if (result === lastResultRef.current) {
				return;
			}

			lastResultRef.current = result;

			const { control = baseControl } = optionsRef.current ?? {};
			const pendingIntents = pendingIntentsRef.current;

			// If there is an intent and it has a side effect, add it to the pending intents
			if (
				options.type === 'client' &&
				result.intent &&
				control.hasSideEffect(result.intent)
			) {
				pendingIntents.push(result.intent);
			}

			updateForm((form) => {
				const state = control.updateState(form.state, {
					type: options.type,
					result,
					reset() {
						return control.initializeState<FormShape, ErrorShape>();
					},
				});

				let sideEffects = form.sideEffects;

				// If the result has an intent and it is in the pending intents, it must have some side effect
				if (result.intent && pendingIntents.includes(result.intent)) {
					sideEffects = sideEffects
						.filter((sideEffect) => pendingIntents.includes(sideEffect.intent))
						.concat({
							intent: result.intent,
							state,
						});
				}

				return updateObject(form, {
					state,
					sideEffects,
				});
			});
		},
		[],
	);

	useEffect(() => {
		optionsRef.current = options;
	});

	useEffect(() => {
		return () => {
			// Cancal pending validation request
			abortControllerRef.current?.abort('The component is unmounted');
		};
	}, []);

	useEffect(() => {
		if (lastResult) {
			handleSubmission(lastResult, { type: 'server' });
		}
	}, [lastResult, handleSubmission]);

	useEffect(() => {
		const formElement = getFormElement(formRef);

		if (!formElement) {
			// eslint-disable-next-line no-console
			console.error('Side effect failed; Form element is not found');
			return;
		}

		const pendingIntents = pendingIntentsRef.current;

		for (const sideEffect of sideEffects) {
			// Ensure that the side effect is only applied once
			if (!pendingIntents.includes(sideEffect.intent)) {
				continue;
			}

			control.applySideEffect(formElement, sideEffect.intent, sideEffect.state);

			// Remove the intent from the pending intents
			pendingIntents.splice(pendingIntents.indexOf(sideEffect.intent), 1);
		}
	}, [formRef, sideEffects, control]);

	return {
		state,
		handleSubmit(event: React.FormEvent<HTMLFormElement>) {
			const abortController = new AbortController();

			// Keep track of the abort controller so we can cancel the previous request if a new one is made
			abortControllerRef.current?.abort('A new submission is made');
			abortControllerRef.current = abortController;

			const formElement = event.currentTarget;
			const submitEvent = getSubmitEvent(event);
			const formData = new FormData(formElement, submitEvent.submitter);
			const submission = parseSubmission(formData, {
				intentName,
			});
			const [intent, intentValue] = applyIntent(submission, {
				control,
				pendingIntents: pendingIntentsRef.current,
			});
			const submissionResult = report<
				FormShape,
				ErrorShape,
				Intent | FormControlIntent<typeof baseControl> | null
			>(submission, {
				value: intentValue,
				intent,
			});

			let value: Value | undefined;

			// The form might be re-submitted manually if there was an async validation
			if (event.nativeEvent === lastAsyncResultRef.current?.event) {
				value = lastAsyncResultRef.current.value;
				submissionResult.error = null;
			} else {
				const validateResult =
					intentValue !== null
						? optionsRef.current?.onValidate?.(intentValue, {
								formElement,
							})
						: // Treat it as a valid submission if the value is null (form reset)
							{ error: null };

				// If the validation is async
				if (validateResult instanceof Promise) {
					// Update the form when the validation result is resolved
					validateResult.then((result) => {
						const { error, value } = resolveValidateResult(result);

						// Update the form with the validation result
						// There is no need to flush the update in this case
						if (!abortController.signal.aborted) {
							handleSubmission(
								{ ...submissionResult, error },
								{
									type: 'server',
								},
							);

							// If the form is meant to be submitted and there is no error
							if (error === null && !submission.intent) {
								const event = new SubmitEvent('submit', {
									bubbles: true,
									cancelable: true,
									submitter: submitEvent.submitter,
								});

								// Keep track of the submit event so we can skip validation on the next submit
								lastAsyncResultRef.current = {
									event,
									value,
								};
								formElement.dispatchEvent(event);
							}
						}
					});
				} else if (typeof validateResult !== 'undefined') {
					const result = resolveValidateResult(validateResult);

					submissionResult.error = result.error;
					value = result.value;
				}

				handleSubmission(submissionResult, {
					type: 'client',
				});

				if (
					// If client validation happens
					typeof validateResult !== 'undefined' &&
					// Either the form is not meant to be submitted (i.e. intent is present) or there is an error / pending validation
					(submissionResult.intent || submissionResult.error !== null)
				) {
					event.preventDefault();
				}
			}

			// We might not prevent form submission if server validation is required
			// But the `onSubmit` handler should be triggered only if there is no intent
			if (!event.isDefaultPrevented() && intent === null) {
				optionsRef.current?.onSubmit?.(event, {
					formData,
					get value() {
						if (typeof value === 'undefined' || value === null) {
							throw new Error(
								'`value` is not available; Please make sure you have included the value in the `onValidate` result.',
							);
						}

						return value;
					},
					update(options) {
						if (!abortController.signal.aborted) {
							const result = report(submission, {
								...options,
								value: intentValue,
								intent,
							});
							handleSubmission(result, { type: 'server' });
						}
					},
				});
			}
		},
		intent,
	};
}

export function useIntent<
	Intent extends UnknownIntent = FormControlIntent<typeof baseControl>,
>(
	formRef: FormRef,
	options?: {
		intentName?: string;
		control?: FormControl<Intent | FormControlIntent<typeof baseControl>>;
	},
): IntentDispatcher<Intent> {
	const { intentName = DEFAULT_INTENT, control = baseControl } = options ?? {};

	return useMemo(
		() =>
			new Proxy<IntentDispatcher<Intent>>({} as any, {
				get(target, type, receiver) {
					if (typeof type === 'string') {
						// @ts-expect-error We are creating an intent dispatcher on the fly
						target[type] ??= (payload: unknown) => {
							const formElement = getFormElement(formRef);

							if (!formElement) {
								throw new Error(
									'Failed to dispatch intent; Form element is not found',
								);
							}

							requestIntent(
								formElement,
								intentName,
								control.serializeIntent({
									type,
									payload,
								}),
							);
						};
					}

					return Reflect.get(target, type, receiver);
				},
			}),
		[formRef, intentName, control],
	);
}

export function useFormData<Value>(
	formRef: FormRef,
	select: (formData: FormData, currentValue: Value | undefined) => Value,
): Value | undefined {
	const valueRef = useRef<Value>();
	const value = useSyncExternalStore(
		useCallback(
			(callback) =>
				formObserver.onFormDataChanged((formElement) => {
					if (formElement === getFormElement(formRef)) {
						callback();
					}
				}),
			[formRef],
		),
		() => {
			const formElement = getFormElement(formRef);

			if (!formElement) {
				return;
			}

			const formData = new FormData(formElement);

			return select(formData, valueRef.current);
		},
		() => undefined,
	);

	valueRef.current = value;

	return value;
}

export const visuallyHiddenProps: Readonly<{
	/**
	 * CSS Style to make the input element visually hidden
	 */
	style: Readonly<React.CSSProperties>;
	/**
	 * Hidden input should not be focusable
	 */
	tabIndex: -1;
	/**
	 * Hidden input should not be announced by screen readers
	 */
	'aria-hidden': true;
}> = Object.freeze({
	style: Object.freeze({
		position: 'absolute',
		width: '1px',
		height: '1px',
		padding: 0,
		margin: '-1px',
		overflow: 'hidden',
		clip: 'rect(0,0,0,0)',
		whiteSpace: 'nowrap',
		border: 0,
	}),
	tabIndex: -1,
	'aria-hidden': true,
});

export function useInput(defaultValue?: string | string[] | null): {
	value: string | undefined;
	selected: string[] | undefined;
	changed(value: string | string[]): void;
	focused(): void;
	blurred(): void;
	register: React.RefCallback<
		HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | undefined
	>;
	visuallyHiddenProps: typeof visuallyHiddenProps;
} {
	const initialValue =
		typeof defaultValue === 'string'
			? [defaultValue]
			: defaultValue ?? undefined;
	const inputRef = useRef<
		| HTMLInputElement
		| HTMLSelectElement
		| HTMLTextAreaElement
		| null
		| undefined
	>();
	const isResetRef = useRef(false);
	const previousValueRef = useRef(initialValue);
	const eventDispatching = useRef<Record<string, boolean>>({});
	const value = useSyncExternalStore(
		useCallback(
			(callback) =>
				formObserver.onInputUpdated((element, reason) => {
					if (element === inputRef.current) {
						// As not every UI library will reset the input value when the reset event is dispatched
						// We will update the value manually to force the UI library to update the input value
						isResetRef.current = reason === 'reset';
						callback();
					}
				}),
			[],
		),
		() => {
			const prev = previousValueRef.current;

			let next = initialValue;

			if (inputRef.current && !isResetRef.current) {
				const element = inputRef.current;
				const isMultipleSelect =
					element instanceof HTMLSelectElement && element.multiple;
				const isRadioOrCheckbox =
					element instanceof HTMLInputElement &&
					(element.type === 'radio' || element.type === 'checkbox');

				next = isMultipleSelect
					? Array.from(element.selectedOptions).map((option) => option.value)
					: isRadioOrCheckbox
						? element.checked
							? [element.value]
							: []
						: [element.value];
			}

			if (deepEqual(prev, next)) {
				return prev;
			}

			previousValueRef.current = next;

			return next;
		},
		() => previousValueRef.current,
	);

	useEffect(() => {
		const createDeduplciateEventHandler =
			(isDispatching: boolean) => (event: Event) => {
				const element = inputRef.current;

				if (element && event.target === element) {
					eventDispatching.current[event.type] = isDispatching;
				}
			};

		const startEventHandler = createDeduplciateEventHandler(true);
		const completedEventHandler = createDeduplciateEventHandler(false);

		document.addEventListener('focusin', startEventHandler, true);
		document.addEventListener('focusout', startEventHandler, true);
		document.addEventListener('focusin', completedEventHandler);
		document.addEventListener('focusout', completedEventHandler);

		return () => {
			document.removeEventListener('focusin', startEventHandler, true);
			document.removeEventListener('focusout', startEventHandler, true);
			document.removeEventListener('focusin', completedEventHandler);
			document.removeEventListener('focusout', completedEventHandler);
		};
	}, []);

	const control = useMemo<{
		changed(value: string | string[]): void;
		focused(): void;
		blurred(): void;
		register: React.RefCallback<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | undefined
		>;
	}>(() => {
		return {
			register(element) {
				inputRef.current = element;
			},
			changed(value) {
				const element = inputRef.current;

				if (element) {
					updateFieldValue(element, {
						value,
					});

					// Dispatch input event with the updated input value
					element.dispatchEvent(new InputEvent('input', { bubbles: true }));
					// Dispatch change event (necessary for select to update the selected option)
					element.dispatchEvent(new Event('change', { bubbles: true }));
				}
			},
			focused() {
				if (eventDispatching.current.focusin) {
					return;
				}

				const element = inputRef.current;

				if (element) {
					element.dispatchEvent(
						new FocusEvent('focusin', {
							bubbles: true,
						}),
					);
				}
			},
			blurred() {
				if (eventDispatching.current.focusout) {
					return;
				}

				const element = inputRef.current;

				if (element) {
					element.dispatchEvent(
						new FocusEvent('focusout', {
							bubbles: true,
						}),
					);
				}
			},
		};
	}, []);

	return {
		value: value?.[0],
		selected: value,
		changed: control.changed,
		focused: control.focused,
		blurred: control.blurred,
		register: control.register,
		visuallyHiddenProps,
	};
}
