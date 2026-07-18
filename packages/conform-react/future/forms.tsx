import { isFieldElement, FieldName } from '@conform-to/dom';
import {
	type Submission,
	DEFAULT_INTENT_NAME,
	defaultSerialize,
	FormValue,
} from '@conform-to/dom/future';
import { useContext, useMemo, useId, useState, createContext } from 'react';
import {
	focusFirstInvalidField,
	createIntentDispatcher,
	getFormElement,
} from './dom';
import { useLatest, useConform } from './hooks';
import { StandardSchemaV1 } from './standard-schema';
import {
	isTouched,
	getFieldset,
	getField,
	getFormMetadata,
	mergeCustomStateHandlers,
} from './state';
import type {
	FormRef,
	FormsConfig,
	FormContext,
	FormMetadata,
	FormOptions,
	FieldMetadata,
	FormHandle,
	FormCustomState,
	InferOutput,
	InferFormShape,
	DefaultIntentHandlers,
	IntentHandler,
	IntentDispatcher,
	RequireKey,
	ValidateResult,
	FormIntent,
	CustomStateHandler,
} from './types';
import {
	isStandardSchemaV1,
	resolveValidateResult,
	resolveSerialize,
	validateStandardSchemaV1,
} from './util';
import {
	defaultIntentHandlers,
	mergeIntentHandlers,
	parseIntent,
	resolveIntent,
} from './intent';

export function configureForms<
	BaseErrorShape = any,
	BaseSchema = StandardSchemaV1,
	SchemaErrorShape = string[],
	CustomFormMetadata extends Record<string, unknown> = {},
	CustomFieldMetadata extends Record<string, unknown> = {},
	GlobalIntentHandlers extends Record<string, IntentHandler<any, any>> = {},
	GlobalCustomStateHandlers extends Record<
		string,
		CustomStateHandler<any, any, BaseErrorShape>
	> = {},
>(
	config: Partial<
		FormsConfig<
			BaseErrorShape,
			BaseSchema,
			SchemaErrorShape,
			CustomFormMetadata,
			CustomFieldMetadata,
			GlobalIntentHandlers,
			GlobalCustomStateHandlers
		>
	> = {},
) {
	/**
	 * Global serializer that composes the user-provided serializer with the default serializer.
	 */
	const globalSerialize = resolveSerialize(config.serialize, defaultSerialize);
	const globalIntentHandlers = mergeIntentHandlers(
		defaultIntentHandlers,
		config.intents,
	);

	/**
	 * Global configuration with defaults applied
	 */
	const globalConfig: FormsConfig<
		BaseErrorShape,
		BaseSchema,
		SchemaErrorShape,
		CustomFormMetadata,
		CustomFieldMetadata,
		GlobalIntentHandlers,
		GlobalCustomStateHandlers
	> = {
		...config,
		intents: config.intents,
		customState: config.customState,
		intentName: config.intentName ?? DEFAULT_INTENT_NAME,
		shouldValidate: config.shouldValidate ?? 'onSubmit',
		shouldRevalidate:
			config.shouldRevalidate ?? config.shouldValidate ?? 'onSubmit',
		isSchema: (config.isSchema ?? isStandardSchemaV1) as (
			schema: unknown,
		) => schema is BaseSchema,
		validateSchema: (config.validateSchema ??
			validateStandardSchemaV1) as FormsConfig<
			BaseErrorShape,
			BaseSchema,
			SchemaErrorShape,
			CustomFormMetadata,
			CustomFieldMetadata,
			GlobalIntentHandlers,
			GlobalCustomStateHandlers
		>['validateSchema'],
	};

	/**
	 * React context
	 */
	const ReactFormContext = createContext<
		FormContext<BaseErrorShape, FormCustomState<GlobalCustomStateHandlers>>[]
	>([]);

	/**
	 * Provides form context to child components.
	 * Stacks contexts to support nested forms, with latest context taking priority.
	 */
	function FormProvider(props: {
		context: FormContext<
			BaseErrorShape,
			FormCustomState<GlobalCustomStateHandlers>
		>;
		children: React.ReactNode;
	}): React.ReactElement {
		const stack = useContext(ReactFormContext);
		const value = useMemo(
			// Put the latest form context first to ensure that to be the first one found
			() => [props.context].concat(stack),
			[stack, props.context],
		);

		return (
			<ReactFormContext.Provider value={value}>
				{props.children}
			</ReactFormContext.Provider>
		);
	}

	function useFormContext(
		formId?: string,
	): FormContext<BaseErrorShape, FormCustomState<GlobalCustomStateHandlers>> {
		const contexts = useContext(ReactFormContext);
		const context = formId
			? contexts.find((context) => formId === context.formId)
			: contexts[0];

		if (!context) {
			throw new Error(
				'No form context found. ' +
					'Wrap your component with <FormProvider context={form.context}> ' +
					'where `form` is returned from useForm().',
			);
		}

		return context;
	}

	/**
	 * The main React hook for form management. Handles form state, validation, and submission
	 * while providing access to form metadata, field objects, and form actions.
	 *
	 * It can be called in two ways:
	 * - **Schema first**: Pass a schema as the first argument for automatic validation with type inference
	 * - **Manual configuration**: Pass options with custom `onValidate` handler for manual validation
	 *
	 * See https://conform.guide/api/react/future/useForm
	 *
	 * **Schema first setup with zod:**
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
	 * **Manual configuration setup with custom validation:**
	 *
	 * ```tsx
	 * const { form, fields } = useForm({
	 *   onValidate({ payload, error }) {
	 *     if (!payload.email) {
	 *       error.fieldErrors.email = ['Required'];
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
	function useForm<
		Schema extends BaseSchema,
		ErrorShape extends BaseErrorShape,
		Value = InferOutput<Schema>,
		CustomIntentHandlers extends Record<string, IntentHandler<any, any>> = {},
		CustomStateHandlers extends Record<
			string,
			CustomStateHandler<any, any, ErrorShape>
		> = {},
	>(
		schema: Schema,
		options: RequireKey<
			FormOptions<
				InferFormShape<Schema>,
				ErrorShape,
				Value,
				Schema,
				SchemaErrorShape,
				CustomIntentHandlers,
				GlobalIntentHandlers,
				CustomStateHandlers
			>,
			'onValidate'
		>,
	): FormHandle<
		InferFormShape<Schema>,
		ErrorShape,
		CustomFormMetadata,
		CustomFieldMetadata,
		GlobalIntentHandlers & CustomIntentHandlers,
		FormCustomState<GlobalCustomStateHandlers & CustomStateHandlers>
	>;
	function useForm<
		Schema extends BaseSchema,
		ErrorShape extends BaseErrorShape = SchemaErrorShape extends BaseErrorShape
			? SchemaErrorShape
			: BaseErrorShape,
		Value = InferOutput<Schema>,
		CustomIntentHandlers extends Record<string, IntentHandler<any, any>> = {},
		CustomStateHandlers extends Record<
			string,
			CustomStateHandler<any, any, ErrorShape>
		> = {},
	>(
		schema: Schema,
		options: RequireKey<
			FormOptions<
				InferFormShape<Schema>,
				ErrorShape,
				Value,
				Schema,
				SchemaErrorShape,
				CustomIntentHandlers,
				GlobalIntentHandlers,
				CustomStateHandlers
			>,
			SchemaErrorShape extends BaseErrorShape ? never : 'onValidate'
		>,
	): FormHandle<
		InferFormShape<Schema>,
		ErrorShape,
		CustomFormMetadata,
		CustomFieldMetadata,
		GlobalIntentHandlers & CustomIntentHandlers,
		FormCustomState<GlobalCustomStateHandlers & CustomStateHandlers>
	>;
	function useForm<
		FormShape extends Record<string, any> = Record<string, any>,
		ErrorShape extends BaseErrorShape = BaseErrorShape,
		Value = undefined,
		CustomIntentHandlers extends Record<string, IntentHandler<any, any>> = {},
		CustomStateHandlers extends Record<
			string,
			CustomStateHandler<any, any, ErrorShape>
		> = {},
	>(
		options: RequireKey<
			FormOptions<
				FormShape,
				ErrorShape,
				Value,
				undefined,
				SchemaErrorShape,
				CustomIntentHandlers,
				GlobalIntentHandlers,
				CustomStateHandlers
			>,
			'onValidate'
		>,
	): FormHandle<
		FormShape,
		ErrorShape,
		CustomFormMetadata,
		CustomFieldMetadata,
		GlobalIntentHandlers & CustomIntentHandlers,
		FormCustomState<GlobalCustomStateHandlers & CustomStateHandlers>
	>;
	function useForm<
		FormShape extends Record<string, any> = Record<string, any>,
		ErrorShape extends BaseErrorShape = BaseErrorShape,
		Value = undefined,
	>(
		schemaOrOptions:
			| BaseSchema
			| FormOptions<
					FormShape,
					ErrorShape,
					Value,
					undefined,
					any,
					any,
					any,
					any
			  >,
		maybeOptions?: FormOptions<
			any,
			ErrorShape,
			Value,
			undefined,
			any,
			any,
			any,
			any
		>,
	): FormHandle<
		Record<string, any>,
		ErrorShape,
		CustomFormMetadata,
		CustomFieldMetadata,
		Record<string, IntentHandler>,
		Record<string, unknown>
	> {
		// implementation signature is broader than the public overloads above
		let schema: BaseSchema | undefined;
		let options: FormOptions<
			any,
			ErrorShape,
			Value,
			undefined,
			any,
			any,
			any,
			any
		>;

		if (globalConfig.isSchema(schemaOrOptions)) {
			schema = schemaOrOptions;
			options = maybeOptions ?? {};
		} else {
			options = schemaOrOptions;
		}

		const constraint =
			options.constraint ??
			(schema ? globalConfig.getConstraints?.(schema) : undefined);
		const optionsRef = useLatest(options);
		const serialize = useMemo(
			() => resolveSerialize(options.serialize, globalSerialize),
			[options.serialize],
		);
		const [customStateHandlers] = useState(() =>
			mergeCustomStateHandlers(globalConfig.customState, options.customState),
		);
		const fallbackId = useId();
		const formId = options.id ?? `form-${fallbackId}`;
		const [state, handleSubmit] = useConform<
			FormShape,
			ErrorShape,
			Value,
			any,
			SchemaErrorShape,
			GlobalCustomStateHandlers
		>(formId, {
			...options,
			intentHandlers: mergeIntentHandlers(
				globalIntentHandlers,
				options.intents,
			),
			customStateHandlers,
			serialize,
			intentName: globalConfig.intentName,
			onError: options.onError ?? focusFirstInvalidField,
			onValidate(ctx) {
				if (schema) {
					const schemaResult = globalConfig.validateSchema(
						schema,
						ctx.payload,
						options.schemaOptions,
					);

					if (schemaResult instanceof Promise) {
						return schemaResult.then((resolvedResult) => {
							if (typeof options.onValidate === 'function') {
								throw new Error(
									'The "onValidate" handler is not supported when used with asynchronous schema validation.',
								);
							}

							return resolvedResult as ValidateResult<ErrorShape, any>;
						});
					}

					if (!options.onValidate) {
						return schemaResult as ValidateResult<ErrorShape, Value>;
					}

					// Update the schema error in the context
					if (schemaResult.error) {
						ctx.error = schemaResult.error;
					}

					const schemaValue = schemaResult.value as Value | undefined;

					ctx.schemaValue = schemaValue;

					const validateResult = resolveValidateResult(
						options.onValidate(ctx as any),
					);

					if (
						validateResult.syncResult &&
						typeof schemaValue !== 'undefined' &&
						typeof validateResult.syncResult.value === 'undefined'
					) {
						validateResult.syncResult = {
							...validateResult.syncResult,
							value: schemaValue,
						};
					}

					if (validateResult.asyncResult) {
						validateResult.asyncResult = validateResult.asyncResult.then(
							(result) => {
								if (
									typeof schemaValue !== 'undefined' &&
									typeof result.value === 'undefined'
								) {
									return {
										...result,
										value: schemaValue,
									};
								}

								return result;
							},
						);
					}

					return [validateResult.syncResult, validateResult.asyncResult];
				}

				return (
					options.onValidate?.(ctx as any) ?? {
						// To avoid conform falling back to server validation,
						// if neither schema nor validation handler is provided,
						// we just treat it as a valid client submission
						error: null,
					}
				);
			},
		});
		const intent = useIntent<FormShape, GlobalIntentHandlers>(formId);
		const context = useMemo<
			FormContext<ErrorShape, FormCustomState<GlobalCustomStateHandlers>>
		>(
			() => ({
				formId,
				state,
				serialize,
				constraint: constraint ?? null,
				handleSubmit,
				handleInput(event) {
					if (
						!(
							isFieldElement(event.target) ||
							event.target instanceof HTMLFieldSetElement
						) ||
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

					const shouldValidate =
						optionsRef.current.shouldValidate ?? globalConfig.shouldValidate;
					const shouldRevalidate =
						optionsRef.current.shouldRevalidate ??
						optionsRef.current.shouldValidate ??
						globalConfig.shouldRevalidate;

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
						!(
							isFieldElement(event.target) ||
							event.target instanceof HTMLFieldSetElement
						) ||
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

					const shouldValidate =
						optionsRef.current.shouldValidate ?? globalConfig.shouldValidate;
					const shouldRevalidate =
						optionsRef.current.shouldRevalidate ??
						optionsRef.current.shouldValidate ??
						globalConfig.shouldRevalidate;

					if (
						isTouched(state, event.target.name)
							? shouldRevalidate === 'onBlur'
							: shouldValidate === 'onBlur'
					) {
						intent.validate(event.target.name);
					}
				},
			}),
			[formId, state, serialize, constraint, handleSubmit, intent, optionsRef],
		);
		const form = useMemo(
			() =>
				getFormMetadata(context, {
					extendFormMetadata: globalConfig.extendFormMetadata,
					extendFieldMetadata: globalConfig.extendFieldMetadata,
				}),
			[context],
		);
		const fields = useMemo(
			() =>
				getFieldset(context, {
					extendFieldMetadata: globalConfig.extendFieldMetadata,
				}),
			[context],
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
	 * See https://conform.guide/api/react/future/useFormMetadata
	 *
	 * **Example:**
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
	function useFormMetadata(
		options: {
			formId?: string;
		} = {},
	): FormMetadata<
		BaseErrorShape,
		CustomFormMetadata,
		CustomFieldMetadata,
		FormCustomState<GlobalCustomStateHandlers>
	> {
		const context = useFormContext(options.formId);
		const formMetadata = useMemo(
			() =>
				getFormMetadata(context, {
					extendFormMetadata: globalConfig.extendFormMetadata,
					extendFieldMetadata: globalConfig.extendFieldMetadata,
				}),
			[context],
		);

		return formMetadata as FormMetadata<
			BaseErrorShape,
			CustomFormMetadata,
			CustomFieldMetadata,
			FormCustomState<GlobalCustomStateHandlers>
		>;
	}

	/**
	 * A React hook that provides access to a specific field's metadata and state.
	 * Requires `FormProvider` context when used in child components.
	 *
	 * See https://conform.guide/api/react/future/useField
	 *
	 * **Example:**
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
	function useField<FieldShape = any>(
		name: FieldName<FieldShape>,
		options: {
			formId?: string;
		} = {},
	): FieldMetadata<FieldShape, BaseErrorShape, CustomFieldMetadata> {
		const context = useFormContext(options.formId);
		const field = useMemo(
			() =>
				getField(context, {
					name,
					extendFieldMetadata: globalConfig.extendFieldMetadata,
				}),
			[context, name],
		);

		return field as FieldMetadata<
			FieldShape,
			BaseErrorShape,
			CustomFieldMetadata
		>;
	}

	/**
	 * A React hook that provides an intent dispatcher for programmatic form actions.
	 * Intent dispatchers allow you to trigger form operations like validation, field updates,
	 * and array manipulations without manual form submission.
	 *
	 * See https://conform.guide/api/react/future/useIntent
	 *
	 * **Example:**
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
	function useIntent(
		formRef: FormRef,
	): IntentDispatcher<
		Record<string, any>,
		DefaultIntentHandlers & GlobalIntentHandlers
	>;
	function useIntent<
		IntentHandlers extends Record<string, IntentHandler<any, any>>,
	>(
		formRef: FormRef,
	): IntentDispatcher<
		Record<string, any>,
		DefaultIntentHandlers & GlobalIntentHandlers & IntentHandlers
	>;
	function useIntent<FormShape extends Record<string, any>>(
		formRef: FormRef,
	): IntentDispatcher<FormShape, DefaultIntentHandlers & GlobalIntentHandlers>;
	function useIntent<
		FormShape extends Record<string, any>,
		IntentHandlers extends Record<string, IntentHandler<any, any>>,
	>(
		formRef: FormRef,
	): IntentDispatcher<
		FormShape,
		DefaultIntentHandlers & GlobalIntentHandlers & IntentHandlers
	>;
	function useIntent(formRef: FormRef) {
		return useMemo(
			() =>
				createIntentDispatcher(
					() => getFormElement(formRef),
					globalConfig.intentName,
				),
			[formRef],
		);
	}

	/**
	 * Parses and resolves a submission payload using the configured default and global intent handlers.
	 * Pass `handlers` to extend or override them for a specific call.
	 */
	function resolveSubmission<
		IntentHandlers extends Record<string, IntentHandler<any, any>> = {},
	>(
		submission: Submission,
		options?: {
			handlers?: IntentHandlers;
		},
	): {
		intent:
			| FormIntent<
					Record<string, any>,
					DefaultIntentHandlers & GlobalIntentHandlers & IntentHandlers
			  >
			| { type: 'submit'; payload: undefined }
			| undefined;
		value: Record<string, FormValue> | undefined;
	} {
		const handlers = mergeIntentHandlers(
			globalIntentHandlers,
			options?.handlers,
		);
		const intent = parseIntent(submission.intent, { handlers });
		const value = resolveIntent(submission, {
			handlers,
			intent,
		});

		return {
			intent,
			value,
		};
	}

	return {
		FormProvider,
		useForm,
		useFormMetadata,
		useField,
		useIntent,
		resolveSubmission,
		config: globalConfig,
	};
}

const defaultForms = configureForms();

/**
 * Provides form context to child components.
 * Stacks contexts to support nested forms, with latest context taking priority.
 */
export const FormProvider = defaultForms.FormProvider;

/**
 * The main React hook for form management. Handles form state, validation, and submission
 * while providing access to form metadata, field objects, and form actions.
 *
 * It can be called in two ways:
 * - **Schema first**: Pass a schema as the first argument for automatic validation with type inference
 * - **Manual configuration**: Pass options with custom `onValidate` handler for manual validation
 *
 * See https://conform.guide/api/react/future/useForm
 *
 * **Schema first setup with zod:**
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
 * **Manual configuration setup with custom validation:**
 *
 * ```tsx
 * const { form, fields } = useForm({
 *   onValidate({ payload, error }) {
 *     if (!payload.email) {
 *       error.fieldErrors.email = ['Required'];
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
export const useForm = defaultForms.useForm;

/**
 * A React hook that provides access to form-level metadata and state.
 * Requires `FormProvider` context when used in child components.
 *
 * See https://conform.guide/api/react/future/useFormMetadata
 *
 * **Example:**
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
export const useFormMetadata = defaultForms.useFormMetadata;

/**
 * A React hook that provides access to a specific field's metadata and state.
 * Requires `FormProvider` context when used in child components.
 *
 * See https://conform.guide/api/react/future/useField
 *
 * **Example:**
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
export const useField = defaultForms.useField;

/**
 * A React hook that provides an intent dispatcher for programmatic form actions.
 * Intent dispatchers allow you to trigger form operations like validation, field updates,
 * and array manipulations without manual form submission.
 *
 * See https://conform.guide/api/react/future/useIntent
 *
 * **Example:**
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
export const useIntent = defaultForms.useIntent;

/**
 * Parses and resolves a submission payload using the default configured form intent handlers.
 *
 * See https://conform.guide/api/react/future/resolveSubmission
 */
export const resolveSubmission = defaultForms.resolveSubmission;
