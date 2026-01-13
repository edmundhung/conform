import {
	type FieldName,
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
	IntentDispatcher,
	FormMetadata,
	Fieldset,
	ValidateResult,
	GlobalFormOptions,
	FormOptions,
	FieldMetadata,
	Control,
	Selector,
	UseFormDataOptions,
	ValidateHandler,
	ErrorHandler,
	SubmitHandler,
	FormState,
	FormRef,
	BaseErrorShape,
	DefaultErrorShape,
	BaseSchemaType,
	InferInput,
	InferOutput,
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
	resetFormValue,
} from './dom';
import { StandardSchemaV1 } from './standard-schema';

// Static reset key for consistent hydration during Next.js prerendering
// See: https://nextjs.org/docs/messages/next-prerender-current-time-client
export const INITIAL_KEY = 'INITIAL_KEY';

export const GlobalFormOptionsContext = createContext<
	GlobalFormOptions & { observer: ReturnType<typeof createGlobalFormsObserver> }
>({
	intentName: DEFAULT_INTENT_NAME,
	observer: createGlobalFormsObserver(),
	serialize,
	shouldValidate: 'onSubmit',
});

export const FormContextContext = createContext<FormContext[]>([]);

/**
 * Provides form context to child components.
 * Stacks contexts to support nested forms, with latest context taking priority.
 */
export function FormProvider(props: {
	context: FormContext;
	children: React.ReactNode;
}): React.ReactElement {
	const stack = useContext(FormContextContext);
	const value = useMemo(
		// Put the latest form context first to ensure that to be the first one found
		() => [props.context].concat(stack),
		[stack, props.context],
	);

	return (
		<FormContextContext.Provider value={value}>
			{props.children}
		</FormContextContext.Provider>
	);
}

export function FormOptionsProvider(
	props: Partial<GlobalFormOptions> & {
		children: React.ReactNode;
	},
): React.ReactElement {
	const { children, ...providedOptions } = props;
	const defaultOptions = useContext(GlobalFormOptionsContext);
	const options = useMemo(
		() => ({
			...defaultOptions,
			...providedOptions,
		}),
		[defaultOptions, providedOptions],
	);

	return (
		<GlobalFormOptionsContext.Provider value={options}>
			{children}
		</GlobalFormOptionsContext.Provider>
	);
}

export function useFormContext(formId?: string): FormContext {
	const contexts = useContext(FormContextContext);
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
export function useConform<
	FormShape extends Record<string, any>,
	ErrorShape,
	Value = undefined,
	SchemaValue = undefined,
>(
	formRef: FormRef,
	options: {
		key?: string | undefined;
		defaultValue?: Record<string, FormValue> | null | undefined;
		serialize: Serialize;
		intentName: string;
		lastResult?: SubmissionResult<NoInfer<ErrorShape>> | null | undefined;
		onValidate?: ValidateHandler<ErrorShape, Value, SchemaValue> | undefined;
		onError?: ErrorHandler<ErrorShape> | undefined;
		onSubmit?:
			| SubmitHandler<FormShape, NoInfer<ErrorShape>, NoInfer<Value>>
			| undefined;
	},
): [FormState<ErrorShape>, (event: React.FormEvent<HTMLFormElement>) => void] {
	const { lastResult } = options;
	const [state, setState] = useState<FormState<ErrorShape>>(() => {
		let state = initializeState<ErrorShape>({
			defaultValue: options.defaultValue,
			resetKey: INITIAL_KEY,
		});

		if (lastResult) {
			state = updateState(state, {
				...lastResult,
				type: 'initialize',
				intent: lastResult.submission.intent
					? deserializeIntent(lastResult.submission.intent)
					: null,
				ctx: {
					handlers: actionHandlers,
					reset: (defaultValue) =>
						initializeState<ErrorShape>({
							defaultValue: defaultValue ?? options.defaultValue,
							resetKey: INITIAL_KEY,
						}),
				},
			});
		}

		return state;
	});
	const keyRef = useRef(options.key);
	const resetKeyRef = useRef(state.resetKey);
	const optionsRef = useLatest(options);
	const lastResultRef = useRef(lastResult);
	const pendingValueRef = useRef<Record<string, FormValue> | undefined>();
	const lastAsyncResultRef = useRef<{
		event: SubmitEvent;
		result: SubmissionResult<ErrorShape>;
		formData: FormData;
		resolvedValue: Value | undefined;
	} | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);
	const handleSubmission = useCallback(
		(
			type: 'server' | 'client',
			result: SubmissionResult<ErrorShape>,
			options = optionsRef.current,
		) => {
			const intent = result.submission.intent
				? deserializeIntent(result.submission.intent)
				: null;

			setState((state) =>
				updateState(state, {
					...result,
					type,
					intent,
					ctx: {
						handlers: actionHandlers,
						reset(defaultValue) {
							return initializeState<ErrorShape>({
								defaultValue: defaultValue ?? options.defaultValue,
							});
						},
					},
				}),
			);

			// TODO: move on error handler to a new effect
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

	if (options.key !== keyRef.current) {
		keyRef.current = options.key;
		setState(
			initializeState<ErrorShape>({
				defaultValue: options.defaultValue,
			}),
		);
	} else if (lastResult && lastResult !== lastResultRef.current) {
		lastResultRef.current = lastResult;
		handleSubmission('server', lastResult, options);
	}

	useEffect(() => {
		return () => {
			// Cancel pending validation request
			abortControllerRef.current?.abort('The component is unmounted');
		};
	}, []);

	useSafeLayoutEffect(() => {
		const formElement = getFormElement(formRef);

		// Reset the form values if the reset key changes
		if (formElement && state.resetKey !== resetKeyRef.current) {
			resetKeyRef.current = state.resetKey;
			resetFormValue(
				formElement,
				state.defaultValue,
				optionsRef.current.serialize,
			);
			pendingValueRef.current = undefined;
		}
	}, [formRef, state.resetKey, state.defaultValue, optionsRef]);

	useSafeLayoutEffect(() => {
		if (state.targetValue) {
			const formElement = getFormElement(formRef);

			if (!formElement) {
				// eslint-disable-next-line no-console
				console.error('Failed to update form value; No form element found');
				return;
			}

			updateFormValue(
				formElement,
				state.targetValue,
				optionsRef.current.serialize,
			);
		}

		pendingValueRef.current = undefined;
	}, [formRef, state.targetValue, optionsRef]);

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
						submission.fields = appendUniqueItem(
							submission.fields,
							element.name,
						);
					}
				}

				// Override submission value if the pending value is not applied yet (i.e. batch updates)
				if (pendingValueRef.current !== undefined) {
					submission.payload = pendingValueRef.current;
				}

				const value = applyIntent(submission);
				const submissionResult = report<ErrorShape>(submission, {
					keepFiles: true,
					value,
				});

				// If there is target value, keep track of it as pending value
				if (submission.payload !== value) {
					pendingValueRef.current =
						value ?? optionsRef.current.defaultValue ?? {};
				}

				const validateResult =
					// Skip validation on form reset
					value !== undefined
						? optionsRef.current.onValidate?.({
								payload: value,
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
								schemaValue: undefined as SchemaValue,
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

							handleSubmission('server', submissionResult);

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

				handleSubmission('client', submissionResult);

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
							handleSubmission('server', submissionResult);
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
 * It can be called in two ways:
 * - **Schema first**: Pass a schema as the first argument for automatic validation with type inference
 * - **Manual configuration**: Pass options with custom `onValidate` handler for manual validation
 *
 * @see https://conform.guide/api/react/future/useForm
 * @example Schema first setup with zod:
 *
 * ```tsx
 * const { form, fields } = useForm(zodSchema, {
 *   lastResult,
 *   shouldValidate: 'onBlur',
 * });
 *
 * return (
 *   <form {...form.props}>
 *     <input name={fields.email.name} defaultValue={fields.email.defaultValue} />
 *     <div>{fields.email.errors}</div>
 *   </form>
 * );
 * ```
 *
 * @example Manual configuration setup with custom validation:
 *
 * ```tsx
 * const { form, fields } = useForm({
 *    onValidate({ payload, error }) {
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
	Schema extends BaseSchemaType,
	ErrorShape extends BaseErrorShape = DefaultErrorShape,
	Value = InferOutput<Schema>,
>(
	schema: Schema,
	options: FormOptions<
		InferInput<Schema>,
		ErrorShape,
		Value,
		Schema,
		string extends ErrorShape ? never : 'onValidate'
	>,
): {
	form: FormMetadata<ErrorShape>;
	fields: Fieldset<InferInput<Schema>, ErrorShape>;
	intent: IntentDispatcher<InferInput<Schema>>;
};
/**
 * @deprecated Use `useForm(schema, options)` instead for better type inference.
 */
export function useForm<
	FormShape extends Record<string, any> = Record<string, any>,
	ErrorShape extends BaseErrorShape = DefaultErrorShape,
	Value = undefined,
>(
	options: FormOptions<
		FormShape,
		ErrorShape,
		Value,
		undefined,
		undefined extends Value ? 'onValidate' : never
	> & {
		/**
		 * @deprecated Use `useForm(schema, options)` instead for better type inference.
		 *
		 * Optional standard schema for validation (e.g., Zod, Valibot, Yup).
		 * Removes the need for manual onValidate setup.
		 *
		 */
		schema: StandardSchemaV1<FormShape, Value>;
	},
): {
	form: FormMetadata<ErrorShape>;
	fields: Fieldset<FormShape, ErrorShape>;
	intent: IntentDispatcher<FormShape>;
};
export function useForm<
	FormShape extends Record<string, any> = Record<string, any>,
	ErrorShape extends BaseErrorShape = DefaultErrorShape,
	Value = undefined,
>(
	options: FormOptions<FormShape, ErrorShape, Value, undefined, 'onValidate'>,
): {
	form: FormMetadata<ErrorShape>;
	fields: Fieldset<FormShape, ErrorShape>;
	intent: IntentDispatcher<FormShape>;
};
export function useForm<
	Schema extends BaseSchemaType = any,
	FormShape extends Record<string, any> = Record<string, any>,
	ErrorShape extends BaseErrorShape = DefaultErrorShape,
	Value = undefined,
>(
	schemaOrOptions:
		| Schema
		| FormOptions<FormShape, ErrorShape, Value, undefined, 'onValidate'>,
	maybeOptions?: FormOptions<InferInput<Schema>, ErrorShape, Value, Schema>,
): {
	form: FormMetadata<ErrorShape>;
	fields: Fieldset<Record<string, any>, ErrorShape>;
	intent: IntentDispatcher;
} {
	let schema: Schema | undefined;
	let options: FormOptions<InferInput<Schema>, ErrorShape, Value, Schema>;

	if (maybeOptions) {
		schema = schemaOrOptions as Schema;
		options = maybeOptions as FormOptions<
			InferInput<Schema>,
			ErrorShape,
			Value,
			Schema
		>;
	} else {
		const fullOptions = schemaOrOptions as FormOptions<
			InferInput<Schema>,
			ErrorShape,
			Value,
			Schema
		> & {
			schema?: Schema;
		};

		options = fullOptions;
		schema = fullOptions.schema;
	}

	const { id, constraint } = options;
	const globalOptions = useContext(GlobalFormOptionsContext);
	const optionsRef = useLatest(options);
	const globalOptionsRef = useLatest(globalOptions);
	const fallbackId = useId();
	const formId = id ?? `form-${fallbackId}`;
	const [state, handleSubmit] = useConform<
		FormShape,
		ErrorShape,
		Value,
		InferOutput<Schema>
	>(formId, {
		...options,
		serialize: globalOptions.serialize,
		intentName: globalOptions.intentName,
		onError: options.onError ?? focusFirstInvalidField,
		onValidate(ctx) {
			if (schema) {
				const standardResult = schema['~standard'].validate(ctx.payload);

				if (standardResult instanceof Promise) {
					return standardResult.then((actualStandardResult) => {
						if (typeof options.onValidate === 'function') {
							throw new Error(
								'The "onValidate" handler is not supported when used with asynchronous schema validation.',
							);
						}

						return resolveStandardSchemaResult(
							actualStandardResult,
						) as ValidateResult<ErrorShape, any>;
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

				ctx.schemaValue = resolvedResult.value;

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
	const intent = useIntent<FormShape>(formId);
	const context = useMemo<FormContext<ErrorShape>>(
		() => ({
			formId,
			state,
			constraint: constraint ?? null,
			handleSubmit,
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
					shouldValidate = globalOptionsRef.current.shouldValidate,
					shouldRevalidate = globalOptionsRef.current.shouldRevalidate ??
						shouldValidate,
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
					shouldValidate = globalOptionsRef.current.shouldValidate,
					shouldRevalidate = globalOptionsRef.current.shouldRevalidate ??
						shouldValidate,
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
		[
			formId,
			state,
			constraint,
			handleSubmit,
			intent,
			optionsRef,
			globalOptionsRef,
		],
	);
	const form = useMemo(
		() =>
			getFormMetadata(context, {
				serialize: globalOptions.serialize,
				customize: globalOptions.defineCustomMetadata,
			}),
		[context, globalOptions.serialize, globalOptions.defineCustomMetadata],
	);
	const fields = useMemo(
		() =>
			getFieldset<FormShape, ErrorShape>(context, {
				serialize: globalOptions.serialize,
				customize: globalOptions.defineCustomMetadata,
			}),
		[context, globalOptions.serialize, globalOptions.defineCustomMetadata],
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
export function useFormMetadata(
	options: {
		formId?: string;
	} = {},
): FormMetadata {
	const globalOptions = useContext(GlobalFormOptionsContext);
	const context = useFormContext(options.formId);
	const formMetadata = useMemo(
		() =>
			getFormMetadata(context, {
				serialize: globalOptions.serialize,
				customize: globalOptions.defineCustomMetadata,
			}),
		[context, globalOptions.serialize, globalOptions.defineCustomMetadata],
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
	const globalOptions = useContext(GlobalFormOptionsContext);
	const context = useFormContext(options.formId);
	const field = useMemo(
		() =>
			getField(context, {
				name,
				serialize: globalOptions.serialize,
				customize: globalOptions.defineCustomMetadata,
			}),
		[
			context,
			name,
			globalOptions.serialize,
			globalOptions.defineCustomMetadata,
		],
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
export function useIntent<FormShape extends Record<string, any>>(
	formRef: FormRef,
): IntentDispatcher<FormShape> {
	const globalOptions = useContext(GlobalFormOptionsContext);

	return useMemo(
		() =>
			createIntentDispatcher(
				() => getFormElement(formRef),
				globalOptions.intentName,
			),
		[formRef, globalOptions.intentName],
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
	const { observer } = useContext(GlobalFormOptionsContext);
	const inputRef = useRef<
		| HTMLInputElement
		| HTMLSelectElement
		| HTMLTextAreaElement
		| Array<HTMLInputElement>
		| null
	>(null);
	const formRef = useMemo(
		() => ({
			get current() {
				const input = inputRef.current;
				if (!input) {
					return null;
				}
				return Array.isArray(input) ? input[0]?.form ?? null : input.form;
			},
		}),
		[],
	);
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
		formRef,
		register: useCallback(
			(element) => {
				if (!element) {
					inputRef.current = null;
				} else if (isFieldElement(element)) {
					inputRef.current = element;

					// Conform excludes hidden type inputs by default when updating form values
					// Fix that by using the hidden attribute instead
					if (element.type === 'hidden') {
						element.hidden = true;
						element.removeAttribute('type');
					}

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
 * Returns `undefined` when the form element is not available (e.g., on SSR or initial client render).
 *
 * @see https://conform.guide/api/react/future/useFormData
 * @example
 * ```ts
 * const value = useFormData(formRef, formData => formData.get('fieldName') ?? '');
 * // Handle undefined case
 * if (value === undefined) {
 *   return <div>Loading...</div>;
 * }
 * ```
 */
export function useFormData<Value = any>(
	formRef: FormRef,
	select: Selector<FormData, Value>,
	options: UseFormDataOptions & {
		acceptFiles: true;
	},
): Value | undefined;
export function useFormData<Value = any>(
	formRef: FormRef,
	select: Selector<URLSearchParams, Value>,
	options?: UseFormDataOptions & {
		acceptFiles?: boolean;
	},
): Value | undefined;
export function useFormData<Value = any>(
	formRef: FormRef,
	select: Selector<FormData, Value> | Selector<URLSearchParams, Value>,
	options?: UseFormDataOptions,
): Value | undefined {
	const { observer } = useContext(GlobalFormOptionsContext);
	const valueRef = useRef<Value | undefined>();
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
			// Return undefined if form is not available
			if (formDataRef.current === null) {
				return undefined;
			}

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
		() => undefined,
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
