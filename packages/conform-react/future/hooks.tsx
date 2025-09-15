import {
	type FormValue,
	type Serialize,
	type SubmissionResult,
	DEFAULT_INTENT_NAME,
	deepEqual,
	change,
	focus,
	blur,
	createGlobalFormsObserver,
	createSubmitEvent,
	getFormData,
	isFieldElement,
	parseSubmission,
	report,
	serialize,
} from '@conform-to/dom/future';
import {
	useEffect,
	useRef,
	useSyncExternalStore,
	useCallback,
	useContext,
	useMemo,
	useId,
	createContext,
	useState,
	useLayoutEffect,
} from 'react';
import {
	appendUniqueItem,
	resolveStandardSchemaResult,
	resolveValidateResult,
} from './util';
import {
	getFormMetadata,
	isTouched,
	getFieldset,
	getField,
	initializeState,
	updateState,
} from './state';
import type {
	FormContext,
	DefaultMetadata,
	IntentDispatcher,
	FormMetadata,
	Fieldset,
	ValidateResult,
	FormOptions,
	FieldName,
	FieldMetadata,
	Control,
	Selector,
	UseFormDataOptions,
	ValidateHandler,
	ErrorHandler,
	SubmitHandler,
	FormState,
	FormRef,
} from './types';
import { actionHandlers, applyIntent, deserializeIntent } from './intent';
import {
	makeInputFocusable,
	focusFirstInvalidField,
	getCheckboxGroupValue,
	createDefaultSnapshot,
	createIntentDispatcher,
	getFormElement,
	getInputSnapshot,
	getRadioGroupValue,
	getSubmitEvent,
	initializeField,
	updateFormValue,
} from './dom';

export const FormConfig = createContext({
	intentName: DEFAULT_INTENT_NAME,
	observer: createGlobalFormsObserver(),
	serialize,
});

export const Form = createContext<FormContext[]>([]);

/**
 * Provides form context to child components.
 * Stacks contexts to support nested forms, with latest context taking priority.
 */
export function FormProvider(props: {
	context: FormContext;
	children: React.ReactNode;
}): React.ReactElement {
	const stack = useContext(Form);
	const value = useMemo(
		// Put the latest form context first to ensure that to be the first one found
		() => [props.context].concat(stack),
		[stack, props.context],
	);

	return <Form.Provider value={value}>{props.children}</Form.Provider>;
}

export function useFormContext(formId?: string): FormContext<any> {
	const contexts = useContext(Form);
	const context = formId
		? contexts.find((context) => formId === context.formId)
		: contexts[0];

	if (!context) {
		throw new Error(
			'No form context found; Have you render a <FormProvider /> with the corresponding form context?',
		);
	}

	return context;
}

/**
 * Core form hook that manages form state, validation, and submission.
 * Handles both sync and async validation, intent dispatching, and DOM updates.
 */
export function useConform<ErrorShape, Value = undefined>(
	formRef: FormRef,
	options: {
		key?: string;
		serialize: Serialize;
		intentName: string;
		lastResult?: SubmissionResult<NoInfer<ErrorShape>> | null;
		onValidate?: ValidateHandler<ErrorShape, Value>;
		onError?: ErrorHandler<ErrorShape>;
		onSubmit?: SubmitHandler<NoInfer<ErrorShape>, NoInfer<Value>>;
	},
): [FormState<ErrorShape>, (event: React.FormEvent<HTMLFormElement>) => void] {
	const { lastResult } = options;
	const [state, setState] = useState<FormState<ErrorShape>>(() => {
		let state = initializeState<ErrorShape>();

		if (lastResult) {
			state = updateState(state, {
				...lastResult,
				type: 'initialize',
				intent: lastResult.submission.intent
					? deserializeIntent(lastResult.submission.intent)
					: null,
				ctx: {
					handlers: actionHandlers,
					reset: () => state,
				},
			});
		}

		return state;
	});
	const keyRef = useRef(options.key);
	const resetKeyRef = useRef(state.resetKey);
	const optionsRef = useLatest(options);
	const lastResultRef = useRef(lastResult);
	const lastIntentedValueRef = useRef<
		Record<string, FormValue> | null | undefined
	>();
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
			const intent = result.submission.intent
				? deserializeIntent(result.submission.intent)
				: null;

			setState((state) =>
				updateState(state, {
					...result,
					type: options.type,
					intent,
					ctx: {
						handlers: actionHandlers,
						reset() {
							return initializeState<ErrorShape>();
						},
					},
				}),
			);

			const formElement = getFormElement(formRef);

			if (!formElement || !result.error) {
				return;
			}

			optionsRef.current.onError?.({
				formElement,
				error: result.error,
				intent,
			});
		},
		[formRef, optionsRef],
	);

	useEffect(() => {
		return () => {
			// Cancel pending validation request
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
		// Reset the form state if the form key changes
		if (options.key !== keyRef.current) {
			keyRef.current = options.key;
			setState(initializeState<ErrorShape>());
		}
	}, [options.key]);

	useEffect(() => {
		const formElement = getFormElement(formRef);

		// Reset the form values if the reset key changes
		if (formElement && state.resetKey !== resetKeyRef.current) {
			resetKeyRef.current = state.resetKey;
			formElement.reset();
		}
	}, [formRef, state.resetKey]);

	useEffect(() => {
		if (!state.clientIntendedValue) {
			return;
		}

		const formElement = getFormElement(formRef);

		if (!formElement) {
			// eslint-disable-next-line no-console
			console.error('Failed to update form value; No form element found');
			return;
		}

		updateFormValue(
			formElement,
			state.clientIntendedValue,
			optionsRef.current.serialize,
		);
		lastIntentedValueRef.current = undefined;
	}, [formRef, state.clientIntendedValue, optionsRef]);

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
					intentName: optionsRef.current.intentName,
				});

				// Patch missing fields in the submission object
				for (const element of formElement.elements) {
					if (isFieldElement(element) && element.name) {
						appendUniqueItem(submission.fields, element.name);
					}
				}

				// Override submission value if the last intended value is not applied yet (i.e. batch updates)
				if (lastIntentedValueRef.current != null) {
					submission.payload = lastIntentedValueRef.current;
				}

				const intendedValue = applyIntent(submission);

				// Update the last intended value in case there will be another intent dispatched
				lastIntentedValueRef.current =
					intendedValue === submission.payload ? undefined : intendedValue;

				const submissionResult = report<ErrorShape>(submission, {
					keepFiles: true,
					intendedValue,
				});
				const validateResult =
					// Skip validation on form reset
					intendedValue !== null
						? optionsRef.current.onValidate?.({
								payload: intendedValue,
								error: {
									formErrors: [],
									fieldErrors: {},
								},
								intent: submission.intent
									? deserializeIntent(submission.intent)
									: null,
								formElement,
								submitter: submitEvent.submitter,
								formData,
							})
						: { error: null };

				const { syncResult, asyncResult } =
					resolveValidateResult(validateResult);

				if (typeof syncResult !== 'undefined') {
					submissionResult.error = syncResult.error;
					resolvedValue = syncResult.value;
				}

				if (typeof asyncResult !== 'undefined') {
					// Update the form when the validation result is resolved
					asyncResult.then(({ error, value }) => {
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

				handleSubmission(submissionResult, {
					type: 'client',
				});

				if (
					// If client validation happens
					(typeof syncResult !== 'undefined' ||
						typeof asyncResult !== 'undefined') &&
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
				optionsRef.current.onSubmit?.(event, {
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
		[handleSubmission, optionsRef],
	);

	return [state, handleSubmit];
}

/**
 * The main React hook for form management. Handles form state, validation, and submission
 * while providing access to form metadata, field objects, and form actions.
 *
 * @see https://conform.guide/api/react/future/useForm
 * @example
 * ```tsx
 * const { form, fields } = useForm({
 *   onValidate({ payload, error }) {
 *     if (!payload.email) {
 * 		 error.fieldErrors.email = ['Required'];
 *     }
 *     return error;
 *   }
 * });
 *
 * return (
 *   <form {...form.props}>
 *     <input name={fields.email.name} defaultValue={fields.email.defaultValue} />
 *     <div>{fields.email.errors}</div>
 *   </form>
 * );
 * ```
 */
export function useForm<
	FormShape extends Record<string, any> = Record<string, any>,
	ErrorShape = string,
	Value = undefined,
>(
	options: FormOptions<FormShape, ErrorShape, Value>,
): {
	form: FormMetadata<ErrorShape>;
	fields: Fieldset<FormShape, DefaultMetadata<ErrorShape>>;
	intent: IntentDispatcher;
} {
	const { id, defaultValue, constraint } = options;
	const config = useContext(FormConfig);
	const optionsRef = useLatest(options);
	const fallbackId = useId();
	const formId = id ?? `form-${fallbackId}`;
	const [state, handleSubmit] = useConform<ErrorShape, Value>(formId, {
		...options,
		serialize: config.serialize,
		intentName: config.intentName,
		onError: optionsRef.current.onError ?? focusFirstInvalidField,
		onValidate(ctx) {
			if (options.schema) {
				const standardResult = options.schema['~standard'].validate(
					ctx.payload,
				);

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

				const resolvedResult = resolveStandardSchemaResult(standardResult);

				if (!options.onValidate) {
					return resolvedResult as ValidateResult<ErrorShape, Value>;
				}

				// Update the schema error in the context
				if (resolvedResult.error) {
					ctx.error = resolvedResult.error;
				}

				const validateResult = resolveValidateResult(options.onValidate(ctx));

				if (validateResult.syncResult) {
					validateResult.syncResult.value ??= resolvedResult.value;
				}

				if (validateResult.asyncResult) {
					validateResult.asyncResult = validateResult.asyncResult.then(
						(result) => {
							result.value ??= resolvedResult.value;
							return result;
						},
					);
				}

				return [validateResult.syncResult, validateResult.asyncResult];
			}

			return (
				options.onValidate?.(ctx) ?? {
					// To avoid conform falling back to server validation,
					// if neither schema nor validation handler is provided,
					// we just treat it as a valid client submission
					error: null,
				}
			);
		},
	});
	const intent = useIntent(formId);
	const context = useMemo<FormContext<ErrorShape>>(
		() => ({
			formId,
			state,
			defaultValue: defaultValue ?? null,
			constraint: constraint ?? null,
			handleSubmit: handleSubmit,
			handleInput(event) {
				if (
					!isFieldElement(event.target) ||
					event.target.name === '' ||
					event.target.form === null ||
					event.target.form !== getFormElement(formId)
				) {
					return;
				}

				optionsRef.current.onInput?.({
					...event,
					target: event.target,
					currentTarget: event.target.form,
				});

				if (event.defaultPrevented) {
					return;
				}

				const {
					shouldValidate = 'onSubmit',
					shouldRevalidate = shouldValidate,
				} = optionsRef.current;

				if (
					isTouched(state, event.target.name)
						? shouldRevalidate === 'onInput'
						: shouldValidate === 'onInput'
				) {
					intent.validate(event.target.name);
				}
			},
			handleBlur(event) {
				if (
					!isFieldElement(event.target) ||
					event.target.name === '' ||
					event.target.form === null ||
					event.target.form !== getFormElement(formId)
				) {
					return;
				}

				optionsRef.current.onBlur?.({
					...event,
					target: event.target,
					currentTarget: event.target.form,
				});

				if (event.defaultPrevented) {
					return;
				}

				const {
					shouldValidate = 'onSubmit',
					shouldRevalidate = shouldValidate,
				} = optionsRef.current;

				if (
					isTouched(state, event.target.name)
						? shouldRevalidate === 'onBlur'
						: shouldValidate === 'onBlur'
				) {
					intent.validate(event.target.name);
				}
			},
		}),
		[formId, state, defaultValue, constraint, handleSubmit, intent, optionsRef],
	);
	const form = useMemo(
		() => getFormMetadata(context, { serialize: config.serialize }),
		[context, config.serialize],
	);
	const fields = useMemo(
		() =>
			getFieldset<FormShape, ErrorShape>(context, {
				serialize: config.serialize,
			}),
		[context, config.serialize],
	);

	return {
		form,
		fields,
		intent,
	};
}

/**
 * A React hook that provides access to form-level metadata and state.
 * Requires `FormProvider` context when used in child components.
 *
 * @see https://conform.guide/api/react/future/useFormMetadata
 * @example
 * ```tsx
 * function ErrorSummary() {
 *   const form = useFormMetadata();
 *
 *   if (form.valid) return null;
 *
 *   return (
 *     <div>Please fix {Object.keys(form.fieldErrors).length} errors</div>
 *   );
 * }
 * ```
 */
export function useFormMetadata<ErrorShape = string[]>(
	options: {
		formId?: string;
	} = {},
): FormMetadata<ErrorShape> {
	const config = useContext(FormConfig);
	const context = useFormContext(options.formId);
	const formMetadata = useMemo(
		() =>
			getFormMetadata(context, {
				serialize: config.serialize,
			}),
		[context, config.serialize],
	);

	return formMetadata;
}

/**
 * A React hook that provides access to a specific field's metadata and state.
 * Requires `FormProvider` context when used in child components.
 *
 * @see https://conform.guide/api/react/future/useField
 * @example
 * ```tsx
 * function FormField({ name, label }) {
 *   const field = useField(name);
 *
 *   return (
 *     <div>
 *       <label htmlFor={field.id}>{label}</label>
 *       <input id={field.id} name={field.name} defaultValue={field.defaultValue} />
 *       {field.errors && <div>{field.errors.join(', ')}</div>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useField<FieldShape = any>(
	name: FieldName<FieldShape>,
	options: {
		formId?: string;
	} = {},
): FieldMetadata<FieldShape> {
	const config = useContext(FormConfig);
	const context = useFormContext(options.formId);
	const field = useMemo(
		() =>
			getField(context, {
				name,
				serialize: config.serialize,
			}),
		[context, name, config.serialize],
	);

	return field;
}

/**
 * A React hook that provides an intent dispatcher for programmatic form actions.
 * Intent dispatchers allow you to trigger form operations like validation, field updates,
 * and array manipulations without manual form submission.
 *
 * @see https://conform.guide/api/react/future/useIntent
 * @example
 * ```tsx
 * function ResetButton() {
 *   const buttonRef = useRef<HTMLButtonElement>(null);
 *   const intent = useIntent(buttonRef);
 *
 *   return (
 *     <button type="button" ref={buttonRef} onClick={() => intent.reset()}>
 *       Reset Form
 *     </button>
 *   );
 * }
 * ```
 */
export function useIntent(formRef: FormRef): IntentDispatcher {
	const config = useContext(FormConfig);

	return useMemo(
		() =>
			createIntentDispatcher(() => getFormElement(formRef), config.intentName),
		[formRef, config.intentName],
	);
}

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
	const { observer } = useContext(FormConfig);
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

	const defaultSnapshot = createDefaultSnapshot(
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
						makeInputFocusable(element);
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
							makeInputFocusable(input);
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
	const { observer } = useContext(FormConfig);
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

/**
 * useLayoutEffect is client-only.
 * This basically makes it a no-op on server
 */
export const useSafeLayoutEffect =
	typeof document === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Keep a mutable ref in sync with the latest value.
 * Useful to avoid stale closures in event handlers or async callbacks.
 */
export function useLatest<Value>(value: Value) {
	const ref = useRef(value);

	useSafeLayoutEffect(() => {
		ref.current = value;
	}, [value]);

	return ref;
}
