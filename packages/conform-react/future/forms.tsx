import { isFieldElement, FieldName } from '@conform-to/dom';
import { DEFAULT_INTENT_NAME, serialize } from '@conform-to/dom/future';
import { useContext, useMemo, useId, createContext } from 'react';
import {
	focusFirstInvalidField,
	createIntentDispatcher,
	getFormElement,
} from './dom';
import { useLatest, useConform } from './hooks';
import { StandardSchemaV1 } from './standard-schema';
import { isTouched, getFieldset, getField, getFormMetadata } from './state';
import {
	FormRef,
	FormsConfig,
	FormContext,
	FormMetadata,
	FormOptions,
	Fieldset,
	FieldMetadata,
	InferOutput,
	InferInput,
	IntentDispatcher,
	ValidateResult,
} from './types';
import {
	isStandardSchemaV1,
	resolveValidateResult,
	validateStandardSchemaV1,
} from './util';

export function configureForms<
	BaseErrorShape = string,
	BaseSchema = StandardSchemaV1,
	CustomFormMetadata extends Record<string, unknown> = {},
	CustomFieldMetadata extends Record<string, unknown> = {},
>(
	config: Partial<
		FormsConfig<
			BaseErrorShape,
			BaseSchema,
			CustomFormMetadata,
			CustomFieldMetadata
		>
	> = {},
) {
	/**
	 * Global configuration with defaults applied
	 */
	const globalConfig: FormsConfig<
		BaseErrorShape,
		BaseSchema,
		CustomFormMetadata,
		CustomFieldMetadata
	> = {
		...config,
		intentName: config.intentName ?? DEFAULT_INTENT_NAME,
		serialize: config.serialize ?? serialize,
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
			CustomFormMetadata,
			CustomFieldMetadata
		>['validateSchema'],
	};

	/**
	 * React context
	 */
	const ReactFormContext = createContext<FormContext<BaseErrorShape>[]>([]);

	/**
	 * Provides form context to child components.
	 * Stacks contexts to support nested forms, with latest context taking priority.
	 */
	function FormProvider(props: {
		context: FormContext<BaseErrorShape>;
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

	function useFormContext(formId?: string): FormContext<BaseErrorShape> {
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
	function useForm<
		Schema extends BaseSchema,
		ErrorShape extends BaseErrorShape = BaseErrorShape,
		Value = InferOutput<Schema>,
	>(
		schema: Schema,
		options: FormOptions<
			InferInput<Schema> extends Record<string, any>
				? InferInput<Schema>
				: never,
			ErrorShape,
			Value,
			Schema,
			string extends ErrorShape ? never : 'onValidate'
		>,
	): {
		form: FormMetadata<ErrorShape, CustomFormMetadata, CustomFieldMetadata>;
		fields: Fieldset<InferInput<Schema>, ErrorShape, CustomFieldMetadata>;
		intent: IntentDispatcher<
			InferInput<Schema> extends Record<string, any>
				? InferInput<Schema>
				: never
		>;
	};
	/**
	 * @deprecated Use `useForm(schema, options)` instead for better type inference.
	 */
	function useForm<
		FormShape extends Record<string, any> = Record<string, any>,
		ErrorShape extends BaseErrorShape = BaseErrorShape,
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
			 */
			schema: StandardSchemaV1<FormShape, Value>;
		},
	): {
		form: FormMetadata<ErrorShape, CustomFormMetadata, CustomFieldMetadata>;
		fields: Fieldset<FormShape, ErrorShape, CustomFieldMetadata>;
		intent: IntentDispatcher<FormShape>;
	};
	function useForm<
		FormShape extends Record<string, any> = Record<string, any>,
		ErrorShape extends BaseErrorShape = BaseErrorShape,
		Value = undefined,
	>(
		options: FormOptions<FormShape, ErrorShape, Value, undefined, 'onValidate'>,
	): {
		form: FormMetadata<ErrorShape, CustomFormMetadata, CustomFieldMetadata>;
		fields: Fieldset<FormShape, ErrorShape, CustomFieldMetadata>;
		intent: IntentDispatcher<FormShape>;
	};
	function useForm<
		FormShape extends Record<string, any> = Record<string, any>,
		ErrorShape extends BaseErrorShape = BaseErrorShape,
		Value = undefined,
	>(
		schemaOrOptions:
			| BaseSchema
			| StandardSchemaV1
			| FormOptions<FormShape, ErrorShape, Value, undefined, any>,
		maybeOptions?: FormOptions<any, ErrorShape, Value, undefined, any>,
	): {
		form: FormMetadata<ErrorShape, CustomFormMetadata, CustomFieldMetadata>;
		fields: Fieldset<Record<string, any>, ErrorShape, CustomFieldMetadata>;
		intent: IntentDispatcher;
	} {
		let schema: BaseSchema | undefined;
		let options: FormOptions<any, ErrorShape, Value, undefined, any>;

		if (globalConfig.isSchema(schemaOrOptions)) {
			schema = schemaOrOptions;
			options = maybeOptions ?? {};
		} else {
			options = schemaOrOptions as FormOptions<
				any,
				ErrorShape,
				Value,
				undefined,
				any
			>;
		}

		const constraint =
			options.constraint ??
			(schema ? globalConfig.getConstraints?.(schema) : undefined);
		const optionsRef = useLatest(options);
		const fallbackId = useId();
		const formId = options.id ?? `form-${fallbackId}`;
		const [state, handleSubmit] = useConform<FormShape, ErrorShape, Value, any>(
			formId,
			{
				...options,
				serialize: globalConfig.serialize,
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

						if (validateResult.syncResult) {
							validateResult.syncResult.value ??= schemaValue;
						}

						if (validateResult.asyncResult) {
							validateResult.asyncResult = validateResult.asyncResult.then(
								(result) => {
									result.value ??= schemaValue;
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
			},
		);
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
			[formId, state, constraint, handleSubmit, intent, optionsRef],
		);
		const form = useMemo(
			() =>
				getFormMetadata(context, {
					serialize: globalConfig.serialize,
					extendFormMetadata: globalConfig.extendFormMetadata,
					extendFieldMetadata: globalConfig.extendFieldMetadata,
				}),
			[context],
		);
		const fields = useMemo(
			() =>
				getFieldset(context, {
					serialize: globalConfig.serialize,
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
	function useFormMetadata(
		options: {
			formId?: string;
		} = {},
	): FormMetadata<BaseErrorShape, CustomFormMetadata, CustomFieldMetadata> {
		const context = useFormContext(options.formId);
		const formMetadata = useMemo(
			() =>
				getFormMetadata(context, {
					serialize: globalConfig.serialize,
					extendFormMetadata: globalConfig.extendFormMetadata,
					extendFieldMetadata: globalConfig.extendFieldMetadata,
				}),
			[context],
		);

		return formMetadata as FormMetadata<
			BaseErrorShape,
			CustomFormMetadata,
			CustomFieldMetadata
		>;
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
					serialize: globalConfig.serialize,
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
	function useIntent<FormShape extends Record<string, any>>(
		formRef: FormRef,
	): IntentDispatcher<FormShape> {
		return useMemo(
			() =>
				createIntentDispatcher(
					() => getFormElement(formRef),
					globalConfig.intentName,
				),
			[formRef],
		);
	}

	return {
		FormProvider,
		useForm,
		useFormMetadata,
		useField,
		useIntent,
		config: globalConfig,
	};
}
