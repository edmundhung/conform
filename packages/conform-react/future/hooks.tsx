import type { StandardSchemaV1 } from '@standard-schema/spec';
import {
	type FormValue,
	type SubmissionResult,
	deepEqual,
	focus,
	change,
	blur,
	isFieldElement,
	getFormData,
	parseSubmission,
	createSubmitEvent,
	report,
	requestIntent,
	ValidationAttributes,
} from '@conform-to/dom/future';
import {
	useEffect,
	useRef,
	useState,
	useSyncExternalStore,
	useCallback,
	useContext,
	useMemo,
	useId,
} from 'react';
import {
	type FormRef,
	addItem,
	focusable,
	getCheckboxGroupValue,
	getDefaultSnapshot,
	getFormElement,
	getInputSnapshot,
	getRadioGroupValue,
	getSubmitEvent,
	initializeField,
	resolveStandardSchemaResult,
	resolveValidateResult,
} from './util';
import {
	applyIntent,
	initializeState,
	updateState,
	serializeIntent,
	updateFormValue,
	deserializeIntent,
	defaultActionHandlers,
} from './form';
import { createFormMetadata, isValidated, createFieldset } from './metadata';
import { Context } from './context';
import type {
	DefaultValue,
	FormContext,
	FormAction,
	FormState,
	UnknownIntent,
	DefaultFormProps,
	DefaultFieldMetadata,
	ActionHandler,
	IntentDispatcher,
	FormMetadata,
	Fieldset,
	ValidateHandler,
	UpdateHandler,
	SubmitHandler,
	ValidateResult,
	FormStateHandler,
} from './types';

/**
 * The default intent name
 */
export const DEFAULT_INTENT = '__intent__';

export type ConformOptions<ErrorShape, Output> = {
	lastResult?: SubmissionResult<NoInfer<ErrorShape>> | null;
	intentName?: string;
	onValidate?: ValidateHandler<ErrorShape, Output>;
	onUpdate?: UpdateHandler<NoInfer<ErrorShape>>;
	onSubmit?: SubmitHandler<NoInfer<ErrorShape>, NoInfer<Output>>;
};

export interface FormOptions<
	FormShape,
	ErrorShape = string[],
	Value = undefined,
	FormProps extends React.DetailedHTMLProps<
		React.FormHTMLAttributes<HTMLFormElement>,
		HTMLFormElement
	> = DefaultFormProps,
	FieldMetadata = DefaultFieldMetadata<ErrorShape>,
> {
	id?: string;
	schema?: StandardSchemaV1<FormShape, Value>;
	defaultValue?: NoInfer<DefaultValue<FormShape>>;
	constraint?: Record<string, ValidationAttributes>;
	/**
	 * Define when conform should start validation.
	 * Support "onSubmit", "onInput", "onBlur".
	 *
	 * @default "onSubmit"
	 */
	shouldValidate?: 'onSubmit' | 'onBlur' | 'onInput';
	/**
	 * Define when conform should revalidate again.
	 * Support "onSubmit", "onInput", "onBlur".
	 *
	 * @default Same as shouldValidate, or "onSubmit" if shouldValidate is not provided.
	 */
	shouldRevalidate?: 'onSubmit' | 'onBlur' | 'onInput';

	lastResult?: SubmissionResult<NoInfer<ErrorShape>> | null;
	intentName?: string;
	onValidate?: ValidateHandler<ErrorShape, Value>;
	onUpdate?: UpdateHandler<NoInfer<ErrorShape>>;
	onSubmit?: SubmitHandler<NoInfer<ErrorShape>, NoInfer<Value>>;

	defineFormProps?: (
		props: DefaultFormProps,
		context: FormContext<FormShape, ErrorShape>,
	) => FormProps;
	defineFieldMetadata?: (
		name: string,
		metadata: DefaultFieldMetadata<ErrorShape>,
		context: FormContext<FormShape, ErrorShape>,
	) => FieldMetadata;
}

export function useForm<
	FormShape,
	ErrorShape = string[],
	Value = undefined,
	FormProps extends React.DetailedHTMLProps<
		React.FormHTMLAttributes<HTMLFormElement>,
		HTMLFormElement
	> = DefaultFormProps,
	FieldMetadata extends Record<
		string,
		unknown
	> = DefaultFieldMetadata<ErrorShape>,
>(
	options: FormOptions<FormShape, ErrorShape, Value, FormProps, FieldMetadata>,
): {
	context: FormContext<FormShape, ErrorShape>;
	intent: IntentDispatcher;
	form: FormMetadata<ErrorShape, FormProps>;
	fields: Fieldset<FormShape, FieldMetadata>;
} {
	const {
		id,
		defaultValue,
		constraint,
		shouldValidate = 'onSubmit',
		shouldRevalidate = shouldValidate,
		defineFormProps,
		defineFieldMetadata,
	} = options;
	const fallbackId = useId();
	const formId = id ?? `form-${fallbackId}`;
	const [state, handleSubmit] = useConform<ErrorShape, Value>(formId, {
		...options,
		onValidate(value, ctx) {
			if (options.schema) {
				const standardResult = options.schema['~standard'].validate(value);

				if (standardResult instanceof Promise) {
					return standardResult.then((actualStandardResult) => {
						if (typeof options.onValidate === 'function') {
							throw new Error(
								'The "onValidate" handler is not supported when used with asynchronous schema validation.',
							);
						}

						return resolveStandardSchemaResult(
							actualStandardResult,
						) as ValidateResult<ErrorShape, Value>;
					});
				}

				const resovledResult = resolveStandardSchemaResult(standardResult);

				if (!options.onValidate) {
					return resovledResult as ValidateResult<ErrorShape, Value>;
				}

				// Update the schema error in the context
				if (resovledResult.error) {
					ctx.error = resovledResult.error;
				}

				return options.onValidate(value, ctx);
			}

			return (
				options.onValidate?.(value, ctx) ?? {
					// To avoid conform falling back to server validation,
					// if neither schema nor validation handler is provided,
					// we just treat it as a valid client submission
					error: null,
				}
			);
		},
	});
	const intent = useIntent(formId, options);
	const context = useMemo<FormContext<FormShape, ErrorShape>>(
		() => ({
			formId,
			state,
			defaultValue,
			constraint,
		}),
		[formId, state, defaultValue, constraint],
	);
	const props = useMemo<DefaultFormProps>(
		() => ({
			id: formId,
			onSubmit: handleSubmit,
			onBlur(event) {
				if (
					isFieldElement(event.target) &&
					(isValidated(state, event.target.name)
						? shouldRevalidate === 'onBlur'
						: shouldValidate === 'onBlur')
				) {
					intent.validate(event.target.name);
				}
			},
			onInput(event) {
				if (
					isFieldElement(event.target) &&
					(isValidated(state, event.target.name)
						? shouldRevalidate === 'onInput'
						: shouldValidate === 'onInput')
				) {
					intent.validate(event.target.name);
				}
			},
			noValidate: true,
		}),
		[formId, handleSubmit, state, intent, shouldValidate, shouldRevalidate],
	);
	const form = useMemo(
		() =>
			createFormMetadata(context, defineFormProps?.(props, context) ?? props),
		[context, props, defineFormProps],
	);
	const fields = useMemo(
		() => createFieldset(context, { defineFieldMetadata }),
		[context, defineFieldMetadata],
	);

	return {
		context,
		intent,
		//@ts-expect-error
		form,
		fields,
	};
}

export function useConform<ErrorShape, Value = undefined>(
	formRef: FormRef,
	options: ConformOptions<ErrorShape, Value>,
): [FormState<ErrorShape>, (event: React.FormEvent<HTMLFormElement>) => void] {
	const { intentName = DEFAULT_INTENT, lastResult } = options ?? {};
	const [state, setState] = useState<FormState<ErrorShape>>(() => {
		let state = initializeState<ErrorShape>();

		if (lastResult) {
			const intent = lastResult.submission.intent
				? deserializeIntent(lastResult.submission.intent)
				: null;
			const result = updateState(state, {
				...lastResult,
				type: 'initialize',
				intent,
				ctx: {
					handlers: defaultActionHandlers,
					reset: () => state,
				},
			});

			options?.onUpdate?.({
				...lastResult,
				type: 'initialize',
				intent,
				ctx: {
					prevState: state,
					nextState: result,
				},
			});

			state = result;
		}

		return state;
	});
	const keyRef = useRef(state.key);
	const optionsRef = useRef(options);
	const lastResultRef = useRef(lastResult);
	const lastIntentedValueRef = useRef<Record<string, FormValue> | null>(null);
	const lastAsyncResultRef = useRef<{
		event: SubmitEvent;
		result: SubmissionResult<ErrorShape>;
		formData: FormData;
		resolvedValue: Value | undefined;
	} | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);
	const handleSubmission = useCallback(
		(
			result: SubmissionResult<ErrorShape>,
			options: {
				type: 'server' | 'client';
			},
		) => {
			const { onUpdate } = optionsRef.current ?? {};
			const intent = result.submission.intent
				? deserializeIntent(result.submission.intent)
				: null;

			setState((prevState) => {
				const nextState = updateState(prevState, {
					...result,
					type: options.type,
					intent,
					ctx: {
						handlers: defaultActionHandlers,
						reset() {
							return initializeState<ErrorShape>();
						},
					},
				});

				onUpdate?.({
					...result,
					type: options.type,
					intent,
					ctx: {
						prevState,
						nextState,
					},
				});

				return nextState;
			});

			// We are currently focusing the first invalid input before the state is flushed
			// Which seems to be safe to do so as we are not expecting the input element to be mounted/unmounted
			// Is it necessary to trigger a re-render and do it in the `useEffect` hook?
			if (result.error && intent === null) {
				const formElement = getFormElement(formRef);

				if (formElement) {
					for (const element of formElement.elements) {
						if (
							isFieldElement(element) &&
							result.error.fieldErrors[element.name]
						) {
							element.focus();
							break;
						}
					}
				}
			}
		},
		[formRef],
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

		if (formElement && state.key !== keyRef.current) {
			keyRef.current = state.key;
			formElement.reset();
		}
	}, [formRef, state.key]);

	useEffect(() => {
		if (!state.intendedValue) {
			return;
		}

		const formElement = getFormElement(formRef);

		if (!formElement) {
			// eslint-disable-next-line no-console
			console.error('Failed to update form value; No form element found');
			return;
		}

		updateFormValue(formElement, state.intendedValue);
		lastIntentedValueRef.current = null;
	}, [formRef, state.intendedValue]);

	const handleSubmit = useCallback(
		(event: React.FormEvent<HTMLFormElement>) => {
			const abortController = new AbortController();

			// Keep track of the abort controller so we can cancel the previous request if a new one is made
			abortControllerRef.current?.abort('A new submission is made');
			abortControllerRef.current = abortController;

			let formData: FormData;
			let result: SubmissionResult<ErrorShape> | undefined;
			let resolvedValue: Value | undefined;

			// The form might be re-submitted manually if there was an async validation
			if (event.nativeEvent === lastAsyncResultRef.current?.event) {
				formData = lastAsyncResultRef.current.formData;
				result = lastAsyncResultRef.current.result;
				resolvedValue = lastAsyncResultRef.current.resolvedValue;
			} else {
				const formElement = event.currentTarget;
				const submitEvent = getSubmitEvent(event);

				formData = getFormData(formElement, submitEvent.submitter);

				const submission = parseSubmission(formData, {
					intentName,
				});

				// Patch missing fields in the submission object
				for (const element of formElement.elements) {
					if (isFieldElement(element) && element.name) {
						addItem(submission.fields, element.name);
					}
				}

				// Override submission value if the last intended value is not applied yet (i.e. batch updates)
				if (lastIntentedValueRef.current) {
					submission.value = lastIntentedValueRef.current;
				}

				const value = applyIntent(submission);
				const submissionResult = report<ErrorShape>(submission, {
					keepFiles: true,
					value,
				});

				// Update the last intended value only if there is an intented value in the result
				if (submissionResult.value) {
					lastIntentedValueRef.current = submissionResult.value;
				}

				const validateResult =
					// Skip validation on form reset
					value !== null
						? optionsRef.current.onValidate?.(value, {
								formElement,
								submitter: submitEvent.submitter,
								error: {
									formErrors: null,
									fieldErrors: {},
								},
							})
						: { error: null };

				if (typeof validateResult !== 'undefined') {
					let syncResult: ValidateResult<ErrorShape, Value> | undefined;
					let asyncResult:
						| Promise<ValidateResult<ErrorShape, Value>>
						| undefined;

					if (validateResult instanceof Promise) {
						asyncResult = validateResult;
					} else if (Array.isArray(validateResult)) {
						syncResult = validateResult[0];
						asyncResult = validateResult[1];
					} else {
						syncResult = validateResult;
					}

					if (syncResult) {
						const result = resolveValidateResult(syncResult);

						submissionResult.error = result.error;
						resolvedValue = result.value;
					}

					if (asyncResult) {
						// Update the form when the validation result is resolved
						asyncResult.then((data) => {
							const { error, value } = resolveValidateResult(data);

							// Update the form with the validation result
							// There is no need to flush the update in this case
							if (!abortController.signal.aborted) {
								submissionResult.error = error;

								handleSubmission(submissionResult, {
									type: 'server',
								});

								// If the form is meant to be submitted and there is no error
								if (error === null && !submission.intent) {
									const event = createSubmitEvent(submitEvent.submitter);

									// Keep track of the submit event so we can skip validation on the next submit
									lastAsyncResultRef.current = {
										event,
										formData,
										resolvedValue: value,
										result: submissionResult,
									};
									formElement.dispatchEvent(event);
								}
							}
						});
					}
				}

				handleSubmission(submissionResult, {
					type: 'client',
				});

				if (
					// If client validation happens
					typeof validateResult !== 'undefined' &&
					// Either the form is not meant to be submitted (i.e. intent is present) or there is an error / pending validation
					(submissionResult.submission.intent ||
						submissionResult.error !== null)
				) {
					event.preventDefault();
				}

				result = submissionResult;
			}

			// We might not prevent form submission if server validation is required
			// But the `onSubmit` handler should be triggered only if there is no intent
			if (!event.isDefaultPrevented() && result.submission.intent === null) {
				optionsRef.current?.onSubmit?.(event, {
					formData,
					get value() {
						if (typeof resolvedValue === 'undefined') {
							throw new Error(
								'`value` is not available; Please make sure you have included the value in the `onValidate` result.',
							);
						}

						return resolvedValue;
					},
					update(options) {
						if (!abortController.signal.aborted) {
							const submissionResult = report(result.submission, {
								...options,
								keepFiles: true,
							});
							handleSubmission(submissionResult, { type: 'server' });
						}
					},
				});
			}
		},
		[handleSubmission, intentName],
	);

	return [state, handleSubmit];
}

export function useIntent<
	Handlers extends Record<string, ActionHandler> = typeof defaultActionHandlers,
>(
	formRef: FormRef,
	options?: {
		intentName?: string;
	},
): IntentDispatcher<Handlers> {
	const intentName = options?.intentName ?? DEFAULT_INTENT;

	return useMemo(
		() =>
			new Proxy<IntentDispatcher<Handlers>>({} as any, {
				get(target, type, receiver) {
					if (typeof type === 'string') {
						// @ts-expect-error
						target[type] ??= (payload?: unknown) => {
							const formElement = getFormElement(formRef);

							if (!formElement) {
								throw new Error(
									`Dispatching "${type}" intent failed; No form element found.`,
								);
							}

							requestIntent(
								formElement,
								intentName,
								serializeIntent({
									type,
									payload,
								}),
							);
						};
					}

					return Reflect.get(target, type, receiver);
				},
			}),
		[formRef, intentName],
	);
}

export function useFormState<State, ErrorShape>(
	handler: FormStateHandler<State, ErrorShape>,
	options: {
		initialState: State | (() => State);
	},
) {
	const argsRef = useRef([handler, options.initialState] as const);
	const [state, setState] = useState(options.initialState);
	const handleUpdate = useCallback(
		(
			action: FormAction<
				ErrorShape,
				UnknownIntent | null | undefined,
				{
					prevState: FormState<ErrorShape>;
					nextState: FormState<ErrorShape>;
				}
			>,
		) => {
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

				if (action.value === null) {
					return reset();
				}

				return handle(currentState, {
					...action,
					ctx: {
						...action.ctx,
						reset,
					},
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

export type Control = {
	/**
	 * Current value of the base input. Undefined if the registered input
	 * is a multi-select, file input, or checkbox group.
	 */
	value: string | undefined;
	/**
	 * Selected options of the base input. Defined only when the registered input
	 * is a multi-select or checkbox group.
	 */
	checked: boolean | undefined;
	/**
	 * Checked state of the base input. Defined only when the registered input
	 * is a single checkbox or radio input.
	 */
	options: string[] | undefined;
	/**
	 * Selected files of the base input. Defined only when the registered input
	 * is a file input.
	 */
	files: File[] | undefined;
	/**
	 * Registers the base input element(s). Accepts a single input or an array for groups.
	 */
	register: (
		element:
			| HTMLInputElement
			| HTMLSelectElement
			| HTMLTextAreaElement
			| HTMLCollectionOf<HTMLInputElement>
			| NodeListOf<HTMLInputElement>
			| null
			| undefined,
	) => void;
	/**
	 * Programmatically updates the input value and emits
	 * both [change](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event) and
	 * [input](https://developer.mozilla.org/en-US/docs/Web/API/Element/input_event) events.
	 */
	change(
		value: string | string[] | boolean | File | File[] | FileList | null,
	): void;
	/**
	 * Emits [blur](https://developer.mozilla.org/en-US/docs/Web/API/Element/blur_event) and
	 * [focusout](https://developer.mozilla.org/en-US/docs/Web/API/Element/focusout_event) events.
	 * Does not actually move focus.
	 */
	focus(): void;
	/**
	 * Emits [focus](https://developer.mozilla.org/en-US/docs/Web/API/Element/focus_event) and
	 * [focusin](https://developer.mozilla.org/en-US/docs/Web/API/Element/focusin_event) events.
	 * This does not move the actual keyboard focus to the input. Use `element.focus()` instead
	 * if you want to move focus to the input.
	 */
	blur(): void;
};

/**
 * A React hook that lets you sync the state of an input and dispatch native form events from it.
 * This is useful when emulating native input behavior — typically by rendering a hidden base input
 * and syncing it with a custom input.
 *
 * @example
 * ```ts
 * const control = useControl(options);
 * ```
 */
export function useControl(options?: {
	/**
	 * The initial value of the base input. It will be used to set the value
	 * when the input is first registered.
	 */
	defaultValue?: string | string[] | File | File[] | null | undefined;
	/**
	 * Whether the base input should be checked by default. It will be applied
	 * when the input is first registered.
	 */
	defaultChecked?: boolean | undefined;
	/**
	 * The value of a checkbox or radio input when checked. This sets the
	 * value attribute of the base input.
	 */
	value?: string;
	/**
	 * A callback function that is triggered when the base input is focused.
	 * Use this to delegate focus to a custom input.
	 */
	onFocus?: () => void;
}): Control {
	const { observer } = useContext(Context);
	const inputRef = useRef<
		| HTMLInputElement
		| HTMLSelectElement
		| HTMLTextAreaElement
		| Array<HTMLInputElement>
		| null
	>(null);
	const eventDispatched = useRef<{
		change?: number;
		focus?: number;
		blur?: number;
	}>({});

	const defaultSnapshot = getDefaultSnapshot(
		options?.defaultValue,
		options?.defaultChecked,
		options?.value,
	);
	const snapshotRef = useRef(defaultSnapshot);
	const optionsRef = useRef(options);

	useEffect(() => {
		optionsRef.current = options;
	});

	// This is necessary to ensure that input is re-registered
	// if the onFocus handler changes
	const shouldHandleFocus = typeof options?.onFocus === 'function';
	const snapshot = useSyncExternalStore(
		useCallback(
			(callback) =>
				observer.onFieldUpdate((event) => {
					const input = event.target;

					if (
						Array.isArray(inputRef.current)
							? inputRef.current.some((item) => item === input)
							: inputRef.current === input
					) {
						callback();
					}
				}),
			[observer],
		),
		() => {
			const input = inputRef.current;
			const prev = snapshotRef.current;
			const next = !input
				? defaultSnapshot
				: Array.isArray(input)
					? {
							value: getRadioGroupValue(input),
							options: getCheckboxGroupValue(input),
						}
					: getInputSnapshot(input);

			if (deepEqual(prev, next)) {
				return prev;
			}

			snapshotRef.current = next;
			return next;
		},
		() => snapshotRef.current,
	);

	useEffect(() => {
		const createEventListener = (listener: 'change' | 'focus' | 'blur') => {
			return (event: Event) => {
				if (
					Array.isArray(inputRef.current)
						? inputRef.current.some((item) => item === event.target)
						: inputRef.current === event.target
				) {
					const timer = eventDispatched.current[listener];

					if (timer) {
						clearTimeout(timer);
					}

					eventDispatched.current[listener] = window.setTimeout(() => {
						eventDispatched.current[listener] = undefined;
					});

					if (listener === 'focus') {
						optionsRef.current?.onFocus?.();
					}
				}
			};
		};
		const inputHandler = createEventListener('change');
		const focusHandler = createEventListener('focus');
		const blurHandler = createEventListener('blur');

		document.addEventListener('input', inputHandler, true);
		document.addEventListener('focusin', focusHandler, true);
		document.addEventListener('focusout', blurHandler, true);

		return () => {
			document.removeEventListener('input', inputHandler, true);
			document.removeEventListener('focusin', focusHandler, true);
			document.removeEventListener('focusout', blurHandler, true);
		};
	}, []);

	return {
		value: snapshot.value,
		checked: snapshot.checked,
		options: snapshot.options,
		files: snapshot.files,
		register: useCallback(
			(element) => {
				if (!element) {
					inputRef.current = null;
				} else if (isFieldElement(element)) {
					inputRef.current = element;

					if (shouldHandleFocus) {
						focusable(element);
					}

					if (element.type === 'checkbox' || element.type === 'radio') {
						// React set the value as empty string incorrectly when the value is undefined
						// This make sure the checkbox value falls back to the default value "on" properly
						// @see https://github.com/facebook/react/issues/17590
						element.value = optionsRef.current?.value ?? 'on';
					}

					initializeField(element, optionsRef.current);
				} else {
					const inputs = Array.from(element);
					const name = inputs[0]?.name ?? '';
					const type = inputs[0]?.type ?? '';

					if (
						!name ||
						!(type === 'checkbox' || type === 'radio') ||
						!inputs.every((input) => input.name === name && input.type === type)
					) {
						throw new Error(
							'You can only register a checkbox or radio group with the same name',
						);
					}

					inputRef.current = inputs;

					for (const input of inputs) {
						if (shouldHandleFocus) {
							focusable(input);
						}

						initializeField(input, {
							// We will not be uitlizing defaultChecked / value on checkbox / radio group
							defaultValue: optionsRef.current?.defaultValue,
						});
					}
				}
			},
			[shouldHandleFocus],
		),
		change: useCallback((value) => {
			if (!eventDispatched.current.change) {
				const element = Array.isArray(inputRef.current)
					? inputRef.current?.find((input) => {
							const wasChecked = input.checked;
							const isChecked = Array.isArray(value)
								? value.some((item) => item === input.value)
								: input.value === value;

							switch (input.type) {
								case 'checkbox':
									// We assume that only one checkbox can be checked at a time
									// So we will pick the first element with checked state changed
									return wasChecked !== isChecked;
								case 'radio':
									// We cannot uncheck a radio button
									// So we will pick the first element that should be checked
									return isChecked;
								default:
									return false;
							}
						})
					: inputRef.current;

				if (element) {
					change(
						element,
						typeof value === 'boolean' ? (value ? element.value : null) : value,
					);
				}
			}

			if (eventDispatched.current.change) {
				clearTimeout(eventDispatched.current.change);
			}

			eventDispatched.current.change = undefined;
		}, []),
		focus: useCallback(() => {
			if (!eventDispatched.current.focus) {
				const element = Array.isArray(inputRef.current)
					? inputRef.current[0]
					: inputRef.current;

				if (element) {
					focus(element);
				}
			}

			if (eventDispatched.current.focus) {
				clearTimeout(eventDispatched.current.focus);
			}

			eventDispatched.current.focus = undefined;
		}, []),
		blur: useCallback(() => {
			if (!eventDispatched.current.blur) {
				const element = Array.isArray(inputRef.current)
					? inputRef.current[0]
					: inputRef.current;

				if (element) {
					blur(element);
				}
			}

			if (eventDispatched.current.blur) {
				clearTimeout(eventDispatched.current.blur);
			}

			eventDispatched.current.blur = undefined;
		}, []),
	};
}

type Selector<FormValue, Result> = (
	formData: FormValue | null,
	lastResult: Result | undefined,
) => Result;

type UseFormDataOptions = {
	/**
	 * Set to `true` to preserve file inputs and receive a `FormData` object in the selector.
	 * If omitted or `false`, the selector receives a `URLSearchParams` object, where all values are coerced to strings.
	 */
	acceptFiles?: boolean;
};

/**
 * A React hook that lets you subscribe to the current `FormData` of a form and derive a custom value from it.
 * The selector runs whenever the form's structure or data changes, and the hook re-renders only when the result is deeply different.
 *
 * @see https://conform.guide/api/react/future/useFormData
 * @example
 * ```ts
 * const value = useFormData(formRef, formData => formData?.get('fieldName').toString() ?? '');
 * ```
 */
export function useFormData<Value = any>(
	formRef: FormRef,
	select: Selector<FormData, Value>,
	options: UseFormDataOptions & {
		acceptFiles: true;
	},
): Value;
export function useFormData<Value = any>(
	formRef: FormRef,
	select: Selector<URLSearchParams, Value>,
	options?: UseFormDataOptions & {
		acceptFiles?: boolean;
	},
): Value;
export function useFormData<Value = any>(
	formRef: FormRef,
	select: Selector<FormData, Value> | Selector<URLSearchParams, Value>,
	options?: UseFormDataOptions,
): Value {
	const { observer } = useContext(Context);
	const valueRef = useRef<Value>();
	const formDataRef = useRef<FormData | URLSearchParams | null>(null);
	const value = useSyncExternalStore(
		useCallback(
			(callback) => {
				const formElement = getFormElement(formRef);

				if (formElement) {
					const formData = getFormData(formElement);
					formDataRef.current = options?.acceptFiles
						? formData
						: new URLSearchParams(
								Array.from(formData).map(([key, value]) => [
									key,
									value.toString(),
								]),
							);
				}

				const unsubscribe = observer.onFormUpdate((event) => {
					if (event.target === getFormElement(formRef)) {
						const formData = getFormData(event.target, event.submitter);
						formDataRef.current = options?.acceptFiles
							? formData
							: new URLSearchParams(
									Array.from(formData).map(([key, value]) => [
										key,
										value.toString(),
									]),
								);
						callback();
					}
				});

				return unsubscribe;
			},
			[observer, formRef, options?.acceptFiles],
		),
		() => {
			// @ts-expect-error FIXME
			const result = select(formDataRef.current, valueRef.current);

			if (
				typeof valueRef.current !== 'undefined' &&
				deepEqual(result, valueRef.current)
			) {
				return valueRef.current;
			}

			valueRef.current = result;

			return result;
		},
		() => select(null, undefined),
	);

	return value;
}
