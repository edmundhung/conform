import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
} from 'react';
import type { FormError, FormValue } from 'conform-dom';
import {
	DEFAULT_INTENT,
	parseSubmission,
	requestIntent,
	Submission,
} from 'conform-dom';
import type {
	DefaultValue,
	FormControl,
	FormState,
	DefaultFormIntent,
	FormControlAdditionalState,
	UnknownIntent,
} from './control';
import {
	applyIntent,
	defaultFormControl,
	initializeElement,
	initializeForm,
} from './control';
import {
	deepEqual,
	FormRef,
	getFormElement,
	getSubmitEvent,
	updateFieldValue,
	updateObject,
} from './util';
import { formObserver } from './observer';

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

export function useForm<
	Schema,
	ErrorShape,
	Intent extends UnknownIntent,
	AdditionalState extends Record<string, unknown> = {},
	Value = unknown,
>(
	formRef: FormRef,
	options: {
		control: FormControl<Intent, AdditionalState>;
		lastResult?:
			| Submission<Intent | null, Schema, ErrorShape>
			| Submission<null, Schema, ErrorShape>
			| null;
		defaultValue?: DefaultValue<Schema>;
		intentName?: string;
		onValidate?: (
			value: Record<string, FormValue>,
			ctx: {
				formElement: HTMLFormElement;
			},
		) =>
			| {
					value?: Value;
					error: FormError<Schema, ErrorShape> | null;
			  }
			| Promise<{
					value?: Value;
					error: FormError<Schema, ErrorShape> | null;
			  }>
			| undefined;
		onSubmit?: (
			event: React.FormEvent<HTMLFormElement>,
			ctx: {
				submission: Submission<Intent | null, Schema, ErrorShape>;
				formData: FormData;
				value: Value | undefined;
				update: (
					submission: Submission<Intent | null, Schema, ErrorShape>,
				) => void;
			},
		) =>
			| Promise<Submission<Intent | null, Schema, ErrorShape>>
			| undefined
			| void;
	},
): {
	state: FormState<Schema, ErrorShape, AdditionalState>;
	handleSubmit(event: React.FormEvent<HTMLFormElement>): void;
	intent: IntentDispatcher<Intent>;
};
export function useForm<Schema, ErrorShape = string[], Value = unknown>(
	formRef: FormRef,
	options?: {
		control?: undefined;
		lastResult?:
			| Submission<DefaultFormIntent | null, Schema, ErrorShape>
			| Submission<null, Schema, ErrorShape>
			| null;
		defaultValue?: DefaultValue<Schema>;
		intentName?: string;
		onValidate?: (
			value: Record<string, FormValue>,
			ctx: {
				formElement: HTMLFormElement;
			},
		) =>
			| {
					value?: Value;
					error: FormError<Schema, ErrorShape> | null;
			  }
			| Promise<{
					value?: Value;
					error: FormError<Schema, ErrorShape> | null;
			  }>
			| undefined;
		onSubmit?: (
			event: React.FormEvent<HTMLFormElement>,
			ctx: {
				submission: Submission<DefaultFormIntent | null, Schema, ErrorShape>;
				formData: FormData;
				value: Value | undefined;
				update: (
					submission: Submission<DefaultFormIntent | null, Schema, ErrorShape>,
				) => void;
			},
		) =>
			| Promise<Submission<DefaultFormIntent | null, Schema, ErrorShape>>
			| undefined
			| void;
	},
): {
	state: FormState<
		Schema,
		ErrorShape,
		FormControlAdditionalState<typeof defaultFormControl>
	>;
	handleSubmit(event: React.FormEvent<HTMLFormElement>): void;
	intent: IntentDispatcher<DefaultFormIntent>;
};
export function useForm<
	Schema,
	ErrorShape,
	Intent extends UnknownIntent,
	AdditionalState extends Record<string, unknown> = {},
	Value = unknown,
>(
	formRef: FormRef,
	options?: {
		control?: FormControl<
			Intent | DefaultFormIntent,
			AdditionalState | FormControlAdditionalState<typeof defaultFormControl>
		>;
		lastResult?:
			| Submission<Intent | DefaultFormIntent | null, Schema, ErrorShape>
			| Submission<null, Schema, ErrorShape>
			| null;
		defaultValue?: DefaultValue<Schema>;
		intentName?: string;
		onValidate?: (
			value: Record<string, FormValue>,
			ctx: {
				formElement: HTMLFormElement;
			},
		) =>
			| {
					value?: Value;
					error: FormError<Schema, ErrorShape> | null;
			  }
			| Promise<{
					value?: Value;
					error: FormError<Schema, ErrorShape> | null;
			  }>
			| undefined;
		onSubmit?: (
			event: React.FormEvent<HTMLFormElement>,
			ctx: {
				submission: Submission<
					Intent | DefaultFormIntent | null,
					Schema,
					ErrorShape
				>;
				formData: FormData;
				value: Value | undefined;
				update: (
					submission: Submission<
						Intent | DefaultFormIntent | null,
						Schema,
						ErrorShape
					>,
				) => void;
			},
		) =>
			| Promise<
					Submission<Intent | DefaultFormIntent | null, Schema, ErrorShape>
			  >
			| undefined
			| void;
	},
): {
	state: FormState<
		Schema,
		ErrorShape,
		AdditionalState | FormControlAdditionalState<typeof defaultFormControl>
	>;
	handleSubmit(event: React.FormEvent<HTMLFormElement>): void;
	intent: IntentDispatcher<Intent | DefaultFormIntent>;
} {
	const {
		intentName = DEFAULT_INTENT,
		control = defaultFormControl,
		defaultValue,
		lastResult,
	} = options ?? {};
	const [{ state, sideEffects }, updateForm] = useState<{
		state: FormState<Schema, ErrorShape, {} | AdditionalState>;
		sideEffects: Array<{
			intent: Intent | DefaultFormIntent;
			state: FormState<Schema, ErrorShape, {} | AdditionalState>;
		}>;
	}>(() => ({
		state: control.initializeState({
			defaultValue,
			result: lastResult,
		}),
		sideEffects: [],
	}));
	const optionsRef = useRef(options);
	const lastStateRef = useRef(state);
	const lastResultRef = useRef(lastResult);
	const pendingIntentsRef = useRef<Array<Intent | DefaultFormIntent>>([]);
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
			result: Submission<Intent | DefaultFormIntent | null, Schema, ErrorShape>,
			options: {
				type: 'server' | 'client';
			},
		) => {
			if (result === lastResultRef.current) {
				return;
			}

			lastResultRef.current = result;

			const { control = defaultFormControl, defaultValue } =
				optionsRef.current ?? {};

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
						return control.initializeState<Schema, ErrorShape>({
							defaultValue,
						});
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
		lastStateRef.current = state;
	});

	useEffect(() => {
		const formElement = getFormElement(formRef);
		const unsubscribeInputMounted = formObserver.onInputMounted((element) => {
			if (!element.dataset.conform) {
				initializeElement(element, lastStateRef.current.initialValue);
			}
		});
		const unsubscribeFormReset = formObserver.onFormReset((formElement) => {
			initializeForm(formElement, lastStateRef.current.initialValue);
		});

		if (formElement) {
			initializeForm(formElement, lastStateRef.current.initialValue);
		}

		return () => {
			// Clean up the subscription
			unsubscribeInputMounted();
			unsubscribeFormReset();
			// Cancal pending validation request
			abortControllerRef.current?.abort('The component is unmounted');
		};
	}, [formRef]);

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
			const submission = applyIntent<
				Intent | DefaultFormIntent,
				Schema,
				ErrorShape
			>(
				parseSubmission(formData, {
					intentName,
				}),
				{
					control,
					pendingIntents: pendingIntentsRef.current,
				},
			);

			let value: Value | undefined;

			// The form might be re-submitted manually if there was an async validation
			if (event.nativeEvent === lastAsyncResultRef.current?.event) {
				value = lastAsyncResultRef.current.value;
				submission.error = null;
			} else {
				const validationResult =
					submission.value !== null
						? optionsRef.current?.onValidate?.(submission.value, {
								formElement,
							})
						: // Treat it as a valid submission if the value is null (form reset)
							{ error: null };

				// If the validation is async
				if (validationResult instanceof Promise) {
					// Update the form when the validation result is resolved
					validationResult.then(({ value, error }) => {
						// Update the form with the validation result
						// There is no need to flush the update in this case
						if (!abortController.signal.aborted) {
							handleSubmission(
								{ ...submission, error },
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
				} else if (typeof validationResult !== 'undefined') {
					submission.error = validationResult.error;
					value = validationResult.value;
				}

				handleSubmission(submission, {
					type: 'client',
				});

				if (
					// If client validation happens
					typeof validationResult !== 'undefined' &&
					// Either the form is not meant to be submitted (i.e. intent is present) or there is an error / pending validation
					(submission.intent || submission.error !== null)
				) {
					event.preventDefault();
				}
			}

			if (!event.isDefaultPrevented()) {
				const serverResult = optionsRef.current?.onSubmit?.(event, {
					submission,
					formData,
					value,
					update: (submission) =>
						handleSubmission(submission, { type: 'server' }),
				});

				if (serverResult) {
					serverResult.then((result) => {
						if (!abortController.signal.aborted) {
							handleSubmission(result, {
								type: 'server',
							});
						}
					});
				}
			}
		},
		intent,
	};
}

export function useIntent<Intent extends UnknownIntent = DefaultFormIntent>(
	formRef: FormRef,
	options?: {
		intentName?: string;
		control?: FormControl<Intent | DefaultFormIntent>;
	},
): IntentDispatcher<Intent> {
	const { intentName = DEFAULT_INTENT, control = defaultFormControl } =
		options ?? {};

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
				formObserver.onFormDataChanged(({ formElement }) => {
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

export const visuallyHiddenProps: {
	/**
	 * CSS Style to make the input element visually hidden
	 */
	style: React.CSSProperties;
	/**
	 * Hidden input should not be focusable
	 */
	tabIndex: -1;
	/**
	 * Hidden input should not be announced by screen readers
	 */
	'aria-hidden': true;
} = {
	style: {
		position: 'absolute',
		width: '1px',
		height: '1px',
		padding: 0,
		margin: '-1px',
		overflow: 'hidden',
		clip: 'rect(0,0,0,0)',
		whiteSpace: 'nowrap',
		border: 0,
	},
	tabIndex: -1,
	'aria-hidden': true,
};

export function useCustomInput(initialValue: string): {
	value: string;
	changed(value: string): void;
	focused(): void;
	blurred(): void;
	register: React.RefCallback<
		HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | undefined
	>;
	visuallyHiddenProps: typeof visuallyHiddenProps;
};
export function useCustomInput(initialValue: string[]): {
	value: string[];
	changed(value: string[]): void;
	focused(): void;
	blurred(): void;
	register: React.RefCallback<
		HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | undefined
	>;
	visuallyHiddenProps: typeof visuallyHiddenProps;
};
export function useCustomInput(initialValue?: string | string[] | undefined): {
	value: string | string[] | undefined;
	changed(value: string | string[]): void;
	focused(): void;
	blurred(): void;
	register: React.RefCallback<
		HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | undefined
	>;
	visuallyHiddenProps: typeof visuallyHiddenProps;
};
export function useCustomInput(initialValue?: string | string[] | undefined): {
	value: string | string[] | undefined;
	changed(value: string | string[]): void;
	focused(): void;
	blurred(): void;
	register: React.RefCallback<
		HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | undefined
	>;
	visuallyHiddenProps: typeof visuallyHiddenProps;
} {
	const inputRef = useRef<
		| HTMLInputElement
		| HTMLSelectElement
		| HTMLTextAreaElement
		| null
		| undefined
	>();
	const previous = useRef<string | string[] | undefined>(initialValue);
	const eventDispatching = useRef<Record<string, boolean>>({});
	const value = useSyncExternalStore(
		useCallback(
			(callback) =>
				formObserver.onInputChanged((inputElement) => {
					if (inputElement === inputRef.current) {
						callback();
					}
				}),
			[],
		),
		() => {
			if (!inputRef.current) {
				// eslint-disable-next-line no-console
				console.log(
					'No input element is registered yet; Did you forget to call the `register` function?',
				);
				return initialValue;
			}

			const element = inputRef.current;
			const prev = previous.current;
			const isMultipleSelect =
				element instanceof HTMLSelectElement && element.multiple;
			const value = isMultipleSelect
				? Array.from(element.selectedOptions).map((option) => option.value)
				: [element.value];
			const needsArray =
				typeof initialValue !== 'undefined'
					? Array.isArray(initialValue)
					: isMultipleSelect;
			const next = needsArray ? value : value[0];

			if (deepEqual(prev, next)) {
				return prev;
			}

			return next;
		},
		() => initialValue,
	);

	previous.current = value;

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
					updateFieldValue(element, value);
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
		value,
		changed: control.changed,
		focused: control.focused,
		blurred: control.blurred,
		register: control.register,
		visuallyHiddenProps,
	};
}
