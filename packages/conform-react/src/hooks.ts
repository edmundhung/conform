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
import {
	getFormData,
	parseSubmission,
	report,
	requestIntent,
} from 'conform-dom';
import type { FormIntent, FormState, UnknownIntent } from './control';
import { applyIntent, control } from './control';
import {
	type Prettify,
	type FormRef,
	deepEqual,
	getFormElement,
	getSubmitEvent,
	resolveValidateResult,
	updateFieldValue,
	mutate,
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

export type Formupdate<FormShape, ErrorShape> = {
	type: 'server' | 'client' | 'client-async';
	result: SubmissionResult<FormShape, ErrorShape, FormIntent>;
	state: {
		prev: FormState<FormShape, ErrorShape>;
		next: FormState<FormShape, ErrorShape>;
	};
};

export type UpdateHandler<FormShape, ErrorShape> = (
	update: Formupdate<FormShape, ErrorShape>,
) => void;

export type FormStateHandler<
	State,
	FormShape = unknown,
	ErrorShape = unknown,
> = (
	state: State,
	update: {
		type: 'server' | 'client' | 'client-async';
		result: SubmissionResult<FormShape, ErrorShape, FormIntent>;
		reset: () => State;
		state: {
			prev: FormState<FormShape, ErrorShape>;
			next: FormState<FormShape, ErrorShape>;
		};
	},
) => State;

export type SubmitHandler<FormShape, ErrorShape, Value> = (
	event: React.FormEvent<HTMLFormElement>,
	ctx: {
		formData: FormData;
		value: NonNullable<Value>;
		update: (options: {
			error?: Partial<FormError<FormShape, ErrorShape>> | null;
			reset?: boolean;
		}) => void;
	},
) => void | Promise<void>;

/**
 * The default intent name
 */
export const DEFAULT_INTENT = '__intent__';

export type FormControlOptions<FormShape, ErrorShape, Value> = {
	lastResult?: SubmissionResult<FormShape, ErrorShape, FormIntent> | null;
	intentName?: string;
	onUpdate?: UpdateHandler<FormShape, ErrorShape>;
	onValidate: ValidateHandler<FormShape, ErrorShape, Value>;
	onSubmit?: SubmitHandler<FormShape, ErrorShape, Value>;
};

export function useFormControl<FormShape, ErrorShape, Value = undefined>(
	formRef: FormRef,
	options?: Prettify<FormControlOptions<FormShape, ErrorShape, Value>>,
): {
	state: FormState<FormShape, ErrorShape>;
	handleSubmit(event: React.FormEvent<HTMLFormElement>): void;
	intent: IntentDispatcher<FormIntent>;
} {
	const { intentName = DEFAULT_INTENT, lastResult } = options ?? {};
	const [{ state, sideEffects }, updateForm] = useState<{
		state: FormState<FormShape, ErrorShape>;
		sideEffects: Array<{
			intent: FormIntent;
			run: (formElement: HTMLFormElement) => void;
		}>;
	}>(() => {
		let state = control.initializeState<FormShape, ErrorShape>();

		if (lastResult) {
			const result = control.updateState(state, {
				type: 'server',
				result: lastResult,
				reset: () => state,
			});

			options?.onUpdate?.({
				type: 'server',
				result: lastResult,
				state: {
					prev: state,
					next: result,
				},
			});

			state = result;
		}

		return {
			state: state,
			sideEffects: [],
		};
	});
	const optionsRef = useRef(options);
	const lastResultRef = useRef(lastResult);
	const pendingIntentsRef = useRef<Set<FormIntent>>(new Set());
	const lastAsyncResultRef = useRef<{
		event: SubmitEvent;
		value: Value | undefined;
	} | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);
	const intent = useIntent(formRef, { intentName });
	const handleSubmission = useCallback(
		(
			result: SubmissionResult<FormShape, ErrorShape, FormIntent>,
			options: {
				type: 'server' | 'client' | 'client-async';
			},
		) => {
			const { onUpdate } = optionsRef.current ?? {};

			updateForm((form) => {
				const state = control.updateState(form.state, {
					type: options.type,
					result,
					reset() {
						return control.initializeState<FormShape, ErrorShape>();
					},
				});
				const intent = result.intent;

				let sideEffects = form.sideEffects;

				if (options.type === 'client' && intent) {
					const sideEffect = control.getSideEffect(intent, state);

					if (sideEffect) {
						sideEffects = sideEffects
							// We will clean up the side effect only when there is new side effect
							// To minimize unnecessary re-renders
							.filter((sideEffect) =>
								pendingIntentsRef.current.has(sideEffect.intent),
							)
							.concat({
								intent,
								run(formElement) {
									sideEffect(formElement);
									pendingIntentsRef.current.delete(intent);
								},
							});

						pendingIntentsRef.current.add(intent);
					}
				}

				onUpdate?.({
					type: options.type,
					result,
					state: {
						prev: form.state,
						next: state,
					},
				});

				return mutate(form, {
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
		// To avoid re-applying the same result twice
		if (lastResult && lastResult !== lastResultRef.current) {
			handleSubmission(lastResult, { type: 'server' });
			lastResultRef.current = lastResult;
		}
	}, [lastResult, handleSubmission]);

	useEffect(() => {
		const formElement = getFormElement(formRef);

		if (!formElement) {
			// eslint-disable-next-line no-console
			console.error('Side effect failed; Form element is not found');
			return;
		}

		for (const sideEffect of sideEffects) {
			sideEffect.run(formElement);
		}
	}, [formRef, sideEffects]);

	const handleSubmit = useCallback(
		(event: React.FormEvent<HTMLFormElement>) => {
			const abortController = new AbortController();

			// Keep track of the abort controller so we can cancel the previous request if a new one is made
			abortControllerRef.current?.abort('A new submission is made');
			abortControllerRef.current = abortController;

			const formElement = event.currentTarget;
			const submitEvent = getSubmitEvent(event);
			const formData = getFormData(formElement, submitEvent.submitter);
			const submission = parseSubmission(formData, {
				intentName,
			});
			const [intent, value] = applyIntent(submission, {
				pendingIntents: Array.from(pendingIntentsRef.current),
			});
			const submissionResult = report<FormShape, ErrorShape, FormIntent>(
				submission,
				{
					keepFile: true,
					value,
					intent,
				},
			);

			let resultValue: Value | undefined;

			// The form might be re-submitted manually if there was an async validation
			if (event.nativeEvent === lastAsyncResultRef.current?.event) {
				resultValue = lastAsyncResultRef.current.value;
				submissionResult.error = null;
			} else {
				const validateResult =
					value !== null
						? optionsRef.current?.onValidate?.(value, {
								formElement,
							})
						: // Treat it as a valid submission if the value is null (form reset)
							{ error: null };

				// If the validation is async
				if (validateResult instanceof Promise) {
					// Update the form when the validation result is resolved
					validateResult.then((data) => {
						const { error, value } = resolveValidateResult(data);

						// Update the form with the validation result
						// There is no need to flush the update in this case
						if (!abortController.signal.aborted) {
							handleSubmission(
								{ ...submissionResult, error },
								{
									type: 'client-async',
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
					resultValue = result.value;
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
						if (typeof resultValue === 'undefined' || resultValue === null) {
							throw new Error(
								'`value` is not available; Please make sure you have included the value in the `onValidate` result.',
							);
						}

						return resultValue;
					},
					update(options) {
						if (!abortController.signal.aborted) {
							const result = report(submission, {
								...options,
								keepFile: true,
							});
							handleSubmission(result, { type: 'server' });
						}
					},
				});
			}
		},
		[handleSubmission, intentName],
	);

	return {
		state,
		handleSubmit,
		intent,
	};
}

export function useIntent(
	formRef: FormRef,
	options?: {
		intentName?: string;
	},
): IntentDispatcher<FormIntent> {
	const intentName = options?.intentName ?? DEFAULT_INTENT;

	return useMemo(
		() =>
			new Proxy<IntentDispatcher<FormIntent>>({} as any, {
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
								} as FormIntent),
							);
						};
					}

					return Reflect.get(target, type, receiver);
				},
			}),
		[formRef, intentName],
	);
}

export function useFormState<State>(
	handler: FormStateHandler<State>,
	options: {
		initialState: State | (() => State);
	},
) {
	const argsRef = useRef([handler, options.initialState] as const);
	const [state, setState] = useState(options.initialState);
	const handleUpdate = useCallback(
		<FormShape, ErrorShape>(update: Formupdate<FormShape, ErrorShape>) => {
			const [handle, initialState] = argsRef.current;

			setState((currentState) => {
				const reset = (): State => {
					if (typeof initialState === 'function') {
						// @ts-expect-error initialState is a function
						return initialState();
					} else {
						return initialState;
					}
				};

				if (update.result.value === null) {
					return reset();
				}

				return handle(currentState, {
					...update,
					reset,
				});
			});
		},
		[],
	);

	useEffect(() => {
		argsRef.current = [handler, options.initialState];
	});

	return [state, handleUpdate] as const;
}

export function useFormData<Value>(
	formRef: FormRef,
	select: (formData: FormData | null, currentValue: Value | undefined) => Value,
): Value {
	const valueRef = useRef<Value>();
	const formDataRef = useRef<FormData | null>(null);
	const value = useSyncExternalStore(
		useCallback(
			(callback) =>
				formObserver.onFormDataChanged((formElement, submitter) => {
					if (formElement === getFormElement(formRef)) {
						formDataRef.current = getFormData(formElement, submitter);
						callback();
					}
				}),
			[formRef],
		),
		() => select(formDataRef.current, valueRef.current),
		() => select(null, undefined),
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

export type InputControl = {
	value: string | undefined;
	selected: string[] | undefined;
	register: React.RefCallback<
		HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | undefined
	>;
	/**
	 * @deprecated Use `changed()` instead
	 */
	change(value: string | string[]): void;
	/**
	 * @deprecated Use `focused()` instead
	 */
	focus(): void;
	/**
	 * @deprecated Use `blurred()` instead
	 */
	blur(): void;
	changed(value: string | string[]): void;
	focused(): void;
	blurred(): void;
	visuallyHiddenProps: typeof visuallyHiddenProps;
};

export function useInput(
	defaultValue?: string | string[] | null,
): InputControl {
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
		register: control.register,
		change: control.changed,
		focus: control.focused,
		blur: control.blurred,
		changed: control.changed,
		focused: control.focused,
		blurred: control.blurred,
		visuallyHiddenProps,
	};
}
