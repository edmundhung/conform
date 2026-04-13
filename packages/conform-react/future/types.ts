import type {
	CustomSerialize,
	FieldName,
	FormError,
	FormValue,
	Serialize,
	SubmissionResult,
	ValidationAttributes,
} from '@conform-to/dom/future';
import type { StandardSchemaV1 } from './standard-schema';

export type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

/** Reference to a form element. Can be either a React ref object or a form ID string. */
export type FormRef =
	| React.RefObject<
			| HTMLFormElement
			| HTMLFieldSetElement
			| HTMLInputElement
			| HTMLSelectElement
			| HTMLTextAreaElement
			| HTMLButtonElement
			| null
	  >
	| string;

export type DefaultControlValue = string | string[] | File | File[] | FileList;

export type Control<
	Value = DefaultControlValue,
	DefaultValue = Value,
	Payload = unknown,
> = {
	/**
	 * Current string value derived from the control payload.
	 */
	value: string | undefined;
	/**
	 * Checked state derived from the control payload.
	 */
	checked: boolean | undefined;
	/**
	 * Current string array derived from the control payload.
	 */
	options: string[] | undefined;
	/**
	 * Current file array derived from the control payload.
	 */
	files: File[] | undefined;
	/**
	 * The rendered payload used as the source for base control(s).
	 *
	 * For simple native controls, this mirrors `defaultValue` / `defaultChecked`.
	 * For structural controls (i.e. `<fieldset>`), this is the latest payload
	 * snapshot that drives which hidden inputs are rendered.
	 */
	defaultValue: DefaultValue | null | undefined;
	/**
	 * Current payload snapshot derived from the registered base control(s).
	 *
	 * For structural controls (i.e. `<fieldset>`), this is reconstructed from
	 * descendant fields under the registered fieldset name.
	 */
	payload: Payload | null | undefined;
	/**
	 * Registers the base control element.
	 *
	 * Accepts `<input>`, `<select>`, `<textarea>`, `<fieldset>`,
	 * or a collection of checkbox / radio inputs with the same name.
	 */
	register: (
		element:
			| HTMLInputElement
			| HTMLSelectElement
			| HTMLTextAreaElement
			| HTMLFieldSetElement
			| HTMLCollectionOf<HTMLInputElement>
			| NodeListOf<HTMLInputElement>
			| null
			| undefined,
	) => void;
	/**
	 * A ref object containing the form element associated with the registered base control.
	 * Use this with hooks like useFormData() and useIntent().
	 */
	formRef: React.RefObject<HTMLFormElement | null>;
	/**
	 * Programmatically updates the input value and emits
	 * both [change](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event) and
	 * [input](https://developer.mozilla.org/en-US/docs/Web/API/Element/input_event) events.
	 */
	change: (value: Value | null) => void;
	/**
	 * Emits [focus](https://developer.mozilla.org/en-US/docs/Web/API/Element/focus_event) and
	 * [focusin](https://developer.mozilla.org/en-US/docs/Web/API/Element/focusin_event) events.
	 *
	 * This does not move the actual keyboard focus to the input.
	 * Use [HTMLElement.focus()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus)
	 * if you want to move focus to the input.
	 */
	focus: () => void;
	/**
	 * Emits [blur](https://developer.mozilla.org/en-US/docs/Web/API/Element/blur_event) and
	 * [focusout](https://developer.mozilla.org/en-US/docs/Web/API/Element/focusout_event) events.
	 *
	 * This does not move the actual keyboard focus away from the input.
	 */
	blur: () => void;
};

export type StandardControlOptions<
	Value extends DefaultControlValue = DefaultControlValue,
> = {
	/**
	 * The initial value of the base control.
	 */
	defaultValue?: Value | null | undefined;
	/**
	 * A callback function that is triggered when the base control is focused.
	 * Use this to delegate focus to a custom input.
	 */
	onFocus?: () => void;
};

export type CheckedControlOptions = {
	/**
	 * Whether the base control should be checked by default.
	 */
	defaultChecked?: boolean | undefined;
	/**
	 * The value of a checkbox or radio control when checked.
	 */
	value?: string;
	/**
	 * A callback function that is triggered when the base control is focused.
	 * Use this to delegate focus to a custom input.
	 */
	onFocus?: () => void;
};

export type CustomControlOptions<Value = unknown, DefaultValue = Value> = {
	/**
	 * Initial value used to seed the control.
	 * For structural controls, this is the payload used to render hidden inputs.
	 */
	defaultValue?: DefaultValue | null | undefined;
	/**
	 * Payload parser applied to the current payload snapshot.
	 *
	 * Use this to coerce unknown DOM-derived data into a typed shape.
	 * Any thrown error is surfaced to the caller.
	 */
	parse: (payload: unknown) => Value | null;
	/**
	 * Optional serializer to convert the parsed payload back to a form value for populating the base control(s).
	 */
	serialize?: (value: Value) => FormValue;
	/**
	 * A callback function that is triggered when the base control is focused.
	 * Use this to delegate focus to a custom input.
	 */
	onFocus?: () => void;
};

export type ControlOptions =
	| StandardControlOptions
	| CheckedControlOptions
	| CustomControlOptions;

export type Selector<FormValue, Result> = (
	formData: FormValue,
	lastResult: Result | undefined,
) => Result;

export type UseFormDataOptions<Value = undefined> = {
	/**
	 * Set to `true` to preserve file inputs and receive a `FormData` object in the selector.
	 * If omitted or `false`, the selector receives a `URLSearchParams` object, where all values are coerced to strings.
	 */
	acceptFiles?: boolean;
	/**
	 * The fallback value to return when the form element is not available (e.g., on SSR or initial client render).
	 * If not provided, the hook returns `undefined` when the form is unavailable.
	 */
	fallback?: Value;
};

export type DefaultValue<Shape> =
	Shape extends Record<string, any>
		? { [Key in keyof Shape]?: DefaultValue<Shape[Key]> } | null | undefined
		: Shape extends Array<infer Item>
			? Array<DefaultValue<Item>> | null | undefined
			: Shape extends File | File[]
				? null | undefined // We don't support setting default value for file inputs yet
				: Shape | string | null | undefined;

export type FormState<ErrorShape = any> = {
	/** Unique identifier that changes on form reset to trigger reset side effects */
	resetKey: string;
	/** Initial form values */
	defaultValue: Record<string, unknown>;
	/** Form values that will be synced to the DOM  */
	targetValue: Record<string, unknown> | null;
	/** Form values from server actions, or submitted values when no server intent exists */
	serverValue: Record<string, unknown> | null;
	/** Validation errors from server-side processing */
	serverError: FormError<ErrorShape> | null;
	/** Validation errors from client-side validation */
	clientError: FormError<ErrorShape> | null;
	/** Array of field names that have been touched (validated) */
	touchedFields: string[];
	/** Mapping of array field names to their item keys for React list rendering */
	listKeys: Record<string, string[]>;
};

export type FormAction<
	ErrorShape = any,
	Intent extends UnknownIntent | null | undefined = UnknownIntent | null,
	Context = {},
> = SubmissionResult<ErrorShape> & {
	type: 'initialize' | 'server' | 'client';
	intent: Intent;
	ctx: Context;
};

/**
 * Augment this interface to customize schema type inference for your schema library.
 *
 * **Example:**
 * ```ts
 * import type { ZodTypeAny, input, output } from 'zod';
 * import type { ZodSchemaOptions } from '@conform-to/zod/v3/future';
 *
 * declare module '@conform-to/react/future' {
 *   interface CustomSchemaTypes<Schema> {
 *     input: Schema extends ZodTypeAny ? input<Schema> : never;
 *     output: Schema extends ZodTypeAny ? output<Schema> : never;
 *     options: Schema extends ZodTypeAny ? ZodSchemaOptions : never;
 *   }
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface CustomSchemaTypes<Schema = unknown> {
	// Empty by default - users augment this interface
}

/**
 * Infer schema options type.
 * Uses CustomSchemaTypes if augmented, otherwise returns never.
 */
export type InferOptions<Schema> = [Schema] extends [undefined]
	? never
	: CustomSchemaTypes<Schema> extends { options: infer T }
		? T
		: never;

/**
 * Marker type for conditional field metadata properties.
 * Used to indicate that a property should only be present when FieldShape matches a condition.
 */
export type ConditionalFieldMetadata<T, Condition> = T & {
	'~condition': Condition;
};

/**
 * Check if T is a FieldName type by checking if '~shape' is a known key.
 * Plain strings don't have '~shape' in their keyof, but FieldName<T> does.
 */
type IsFieldName<T> = '~shape' extends keyof T ? true : false;

/**
 * Transforms a single value, restoring FieldName<unknown> to FieldName<FieldShape>.
 */
type RestoreFieldShapeValue<T, FieldShape> =
	T extends ConditionalFieldMetadata<infer Inner, infer Condition>
		? FieldShape extends Condition
			? Inner
			: never
		: IsFieldName<T> extends true
			? FieldName<FieldShape>
			: T;

/**
 * Restores FieldShape-dependent types that were inferred as `unknown`.
 * This is needed because TypeScript infers generic return types with unresolved type parameters.
 * Also handles conditional field metadata by checking if FieldShape extends the condition.
 *
 * Transforms up to 2 levels deep to handle cases like `textFieldProps.name`.
 */
export type RestoreFieldShape<T, FieldShape> = {
	[K in keyof T]: RestoreFieldShapeValue<T[K], FieldShape> extends infer V
		? V extends Record<string, unknown>
			? { [P in keyof V]: RestoreFieldShapeValue<V[P], FieldShape> }
			: V
		: never;
};

/**
 * Type guard function for conditional field metadata.
 * Used to specify when a custom field metadata property should be available.
 */
export type FieldShapeGuard<Condition> = (shape: unknown) => shape is Condition;

/**
 * Function type for creating conditional field metadata based on shape constraints.
 */
export type DefineConditionalField = <FieldShape, ErrorShape, Metadata>(
	metadata: BaseFieldMetadata<unknown, ErrorShape>,
	shape: FieldShapeGuard<FieldShape>,
	fn: (metadata: BaseFieldMetadata<FieldShape, ErrorShape>) => Metadata,
) => ConditionalFieldMetadata<Metadata, FieldShape>;

/**
 * Extract the condition type from a FieldShapeGuard.
 */
export type ExtractFieldCondition<T> =
	T extends FieldShapeGuard<infer C> ? C : never;

/**
 * Extract conditions from a record of field shape guards.
 */
export type ExtractFieldConditions<
	T extends Record<string, FieldShapeGuard<any>>,
> = {
	[K in keyof T]: ExtractFieldCondition<T[K]>;
};

/**
 * Resolved configuration from configureForms factory.
 * Properties with defaults are required, others remain optional.
 */
export type FormsConfig<
	BaseErrorShape,
	BaseSchema,
	SchemaErrorShape,
	CustomFormMetadata extends Record<string, unknown>,
	CustomFieldMetadata extends Record<string, unknown>,
> = {
	/**
	 * The name of the submit button field that indicates the submission intent.
	 * @default "__intent__"
	 */
	intentName: string;
	/**
	 * A custom serializer for converting form values.
	 */
	serialize?: CustomSerialize | undefined;
	/**
	 * Determines when validation should run for the first time on a field.
	 * @default "onSubmit"
	 */
	shouldValidate: 'onSubmit' | 'onBlur' | 'onInput';
	/**
	 * Determines when validation should run again after the field has been validated once.
	 * @default Same as shouldValidate
	 */
	shouldRevalidate: 'onSubmit' | 'onBlur' | 'onInput';
	/**
	 * Runtime type guard to check if a value is a schema.
	 * Used to determine if the first argument to useForm is a schema or options object.
	 *
	 * **Example:**
	 * ```ts
	 * import { configureForms } from '@conform-to/react/future';
	 * import {
	 *   isSchema,
	 *   validateSchema,
	 *   getConstraints,
	 * } from '@conform-to/zod/v3/future';
	 *
	 * const { useForm } = configureForms({
	 *   isSchema,
	 *   validateSchema,
	 *   getConstraints,
	 * });
	 * ```
	 */
	isSchema: (schema: unknown) => schema is BaseSchema;
	/**
	 * Validates a schema against form payload.
	 */
	validateSchema: <Schema extends BaseSchema>(
		schema: Schema,
		payload: Record<string, FormValue>,
		options?: InferOptions<Schema>,
	) => MaybePromise<{
		error: FormError<SchemaErrorShape> | null;
		value?: InferOutput<Schema>;
	}>;
	/**
	 * A type guard function to specify the shape of error objects.
	 */
	isError?: (error: unknown) => error is BaseErrorShape;
	/**
	 * Extracts HTML validation constraints from a schema.
	 */
	getConstraints?: <Schema extends BaseSchema>(
		schema: Schema,
	) => Record<string, ValidationAttributes> | undefined;
	/**
	 * Extends form metadata with custom properties.
	 */
	extendFormMetadata?: <ErrorShape extends BaseErrorShape>(
		metadata: BaseFormMetadata<ErrorShape>,
	) => CustomFormMetadata;
	/**
	 * Extends field metadata with custom properties.
	 * Use `when` for properties that depend on the field shape.
	 */
	extendFieldMetadata?: <FieldShape, ErrorShape extends BaseErrorShape>(
		metadata: BaseFieldMetadata<FieldShape, ErrorShape>,
		ctx: {
			form: BaseFormMetadata<ErrorShape>;
			when: DefineConditionalField;
		},
	) => CustomFieldMetadata;
};

export type NonPartial<T> = {
	[K in keyof Required<T>]: T[K];
};

export type RequireKey<T, K extends keyof T> = Prettify<
	Omit<T, K> & {
		[P in K]-?: Exclude<T[P], undefined>;
	}
>;

export type BaseSchemaType = StandardSchemaV1<any, any>;

/**
 * Infer schema input type.
 * For StandardSchemaV1 schemas (zod, valibot, etc.), uses StandardSchemaV1.InferInput.
 * For other schemas, uses CustomSchemaTypes if augmented.
 */
export type InferInput<Schema> = Schema extends StandardSchemaV1
	? StandardSchemaV1.InferInput<Schema>
	: CustomSchemaTypes<Schema> extends { input: infer T }
		? T
		: Record<string, any>;

export type InferFormShape<Schema> =
	InferInput<Schema> extends Record<string, any>
		? InferInput<Schema>
		: Record<string, any>;

/**
 * Infer schema output type.
 * For StandardSchemaV1 schemas (zod, valibot, etc.), uses StandardSchemaV1.InferOutput.
 * For other schemas, uses CustomSchemaTypes if augmented.
 */
export type InferOutput<Schema> = Schema extends StandardSchemaV1
	? StandardSchemaV1.InferOutput<Schema>
	: CustomSchemaTypes<Schema> extends { output: infer T }
		? T
		: undefined;

export type FormOptions<
	FormShape extends Record<string, any> = Record<string, any>,
	ErrorShape = any,
	Value = undefined,
	Schema = unknown,
	SchemaErrorShape = ErrorShape,
> = {
	/** Optional form identifier. If not provided, a unique ID is automatically generated. */
	id?: string | undefined;
	/** Optional key for form state reset. When the key changes, the form resets to its initial state. */
	key?: string | undefined;
	/** Server-side submission result for form state synchronization. */
	lastResult?: SubmissionResult<ErrorShape> | null | undefined;
	/** Form submission handler called when the form is submitted with no validation errors. */
	onSubmit?:
		| SubmitHandler<FormShape, NoInfer<ErrorShape>, NoInfer<Value>>
		| undefined;
	/** Initial form values. Can be a partial object matching your form structure. */
	defaultValue?: DefaultValue<FormShape> | undefined;
	/**
	 * Override serialization for specific fields on this form and delegate the rest
	 * to the configured global serializer.
	 */
	serialize?: CustomSerialize | undefined;
	/** HTML validation attributes for fields (required, minLength, pattern, etc.). */
	constraint?: Record<string, ValidationAttributes> | undefined;
	/**
	 * Schema-specific validation options (e.g., Zod's errorMap).
	 * The available options depend on the schema library configured in `configureForms`.
	 */
	schemaOptions?: InferOptions<Schema>;
	/**
	 * Determines when validation should run for the first time on a field.
	 * Overrides the default configured through `configureForms()` if provided.
	 *
	 * @default Inherits from `configureForms()`, or "onSubmit" if not configured
	 */
	shouldValidate?: 'onSubmit' | 'onBlur' | 'onInput' | undefined;
	/**
	 * Determines when validation should run again after the field has been validated once.
	 * Overrides the default configured through `configureForms()` if provided.
	 *
	 * @default Inherits from `configureForms()`, or same as shouldValidate
	 */
	shouldRevalidate?: 'onSubmit' | 'onBlur' | 'onInput' | undefined;
	/** Error handling callback triggered when validation errors occur. By default, it focuses the first invalid field. */
	onError?: ErrorHandler<NoInfer<ErrorShape>> | undefined;
	/** Input event handler for custom input event logic. */
	onInput?: InputHandler | undefined;
	/** Blur event handler for custom focus handling logic. */
	onBlur?: BlurHandler | undefined;
	/** Custom validation handler. Can be skipped when a schema is passed as the first argument, or combined with schema validation to customize errors. */
	onValidate?:
		| ValidateHandler<ErrorShape, Value, InferOutput<Schema>, SchemaErrorShape>
		| undefined;
};

/**
 * The object returned by `useForm()`, containing form-level metadata,
 * typed field metadata, and the intent dispatcher for programmatic updates.
 */
export type FormHandle<
	FormShape extends Record<string, any>,
	ErrorShape,
	CustomFormMetadata extends Record<string, unknown> = {},
	CustomFieldMetadata extends Record<string, unknown> = {},
> = {
	/** Form-level metadata and helpers. */
	form: FormMetadata<ErrorShape, CustomFormMetadata, CustomFieldMetadata>;
	/** Field metadata mapped from the form shape. */
	fields: Fieldset<FormShape, ErrorShape, CustomFieldMetadata>;
	/** Intent dispatcher for validate, reset, insert, remove, reorder, and update actions. */
	intent: IntentDispatcher<FormShape>;
};

export interface FormContext<ErrorShape = any> {
	/** The form's unique identifier */
	formId: string;
	/** Internal form state with validation results and field data */
	state: FormState<ErrorShape>;
	/** Serializer used to derive field defaults and sync values for this form. */
	serialize: Serialize;
	/** HTML validation attributes for fields */
	constraint: Record<string, ValidationAttributes> | null;
	/** Form submission event handler */
	handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
	/** Input event handler for form-wide input events */
	handleInput: (event: React.FormEvent) => void;
	/** Blur event handler for form-wide blur events */
	handleBlur: (event: React.FocusEvent) => void;
}

export type UnknownIntent = {
	type: string;
	payload?: unknown;
};

export type UnknownArgs<Args extends any[]> = {
	[Key in keyof Args]: unknown;
};

export interface IntentDispatcher<
	FormShape extends Record<string, any> = Record<string, any>,
> {
	/**
	 * Validate the whole form or a specific field?
	 */
	validate(name?: string): void;

	/**
	 * Reset the form to a specific default value.
	 *
	 * @param options.defaultValue - The value to reset the form to. Pass `null` to clear all fields, or omit to reset to the initial default value from `useForm`.
	 *
	 * **Example:**
	 * ```tsx
	 * // Reset to initial default value
	 * intent.reset()
	 *
	 * // Clear all fields
	 * intent.reset({ defaultValue: null })
	 *
	 * // Restore to a specific snapshot
	 * intent.reset({ defaultValue: snapshotValue })
	 * ```
	 */
	reset(options?: {
		/**
		 * The value to reset the form to. If not provided, resets to the default value from `useForm`. Pass `null` to clear all fields instead.
		 */
		defaultValue?: DefaultValue<FormShape>;
	}): void;

	/**
	 * Update a field or a fieldset.
	 * If you provide a fieldset name, it will update all fields within that fieldset
	 */
	update<FieldShape = FormShape>(
		options:
			| {
					/**
					 * The name of the field. If you provide a fieldset name, it will update all fields within that fieldset.
					 */
					name?: FieldName<FieldShape>;
					/**
					 * Specify the index of the item to update if the field is an array.
					 */
					index?: undefined;
					/**
					 * The new value for the field or fieldset.
					 */
					value: DefaultValue<FieldShape>;
			  }
			| {
					/**
					 * The name of the field. If you provide a fieldset name, it will update all fields within that fieldset.
					 */
					name: FieldName<FieldShape>;
					/**
					 * Specify the index of the item to update if the field is an array.
					 */
					index: number;
					/**
					 * The new value for the field or fieldset.
					 * When index is specified, this should be the item type, not the array type.
					 */
					value: unknown extends FieldShape
						? any
						: FieldShape extends Array<infer ItemShape>
							? ItemShape
							: any;
			  },
	): void;

	/**
	 * Insert a new item into an array field.
	 */
	insert<FieldShape extends Array<any> | null | undefined>(options: {
		/**
		 * The name of the array field to insert into.
		 */
		name: FieldName<FieldShape>;
		/**
		 * The index at which to insert the new item.
		 * If not provided, it will be added to the end of the array.
		 */
		index?: number;
		/**
		 * The default value for the new item.
		 */
		defaultValue?: NonNullable<FieldShape> extends Array<infer ItemShape>
			? DefaultValue<ItemShape>
			: never;
		/**
		 * The name of a field to read the value from.
		 * When specified, the value is read from this field, validated,
		 * and if valid, inserted into the array and the source field is cleared.
		 * If validation fails, the error is shown on the source field instead.
		 * Requires the validation error to be available synchronously.
		 */
		from?: string;
		/**
		 * What to do when the insert causes a validation error on the array.
		 * - 'revert': Don't insert, keep original array state.
		 * Requires the validation error to be available synchronously.
		 */
		onInvalid?: 'revert';
	}): void;

	/**
	 * Remove an item from an array field.
	 */
	remove<FieldShape extends Array<any> | null | undefined>(options: {
		/**
		 * The name of the array field to remove from.
		 */
		name: FieldName<FieldShape>;
		/**
		 * The index of the item to remove.
		 */
		index: number;
		/**
		 * What to do when the remove causes a validation error on the array.
		 * - 'revert': Don't remove, keep original item as-is.
		 * - 'insert': Remove the item but insert a new blank item at the end.
		 * Requires the validation error to be available synchronously.
		 */
		onInvalid?: 'revert' | 'insert';
		/**
		 * The default value for the new item when onInvalid is 'insert'.
		 */
		defaultValue?: NonNullable<FieldShape> extends Array<infer ItemShape>
			? DefaultValue<ItemShape>
			: never;
	}): void;

	/**
	 * Reorder items in an array field.
	 */
	reorder(options: {
		name: FieldName<Array<any>>;
		from: number;
		to: number;
	}): void;
}

export type FormIntent<Dispatcher extends IntentDispatcher = IntentDispatcher> =
	{
		[Type in keyof Dispatcher]: Dispatcher[Type] extends (
			...args: infer Args
		) => void
			? {
					type: Type;
					payload: Args extends [infer Payload] ? Payload : undefined;
				}
			: never;
	}[keyof Dispatcher];

export type IntentHandler<
	Signature extends (payload: any) => void = (payload: any) => void,
> = {
	validate?(...args: UnknownArgs<Parameters<Signature>>): boolean;
	resolve?(
		value: Record<string, FormValue>,
		...args: Parameters<Signature>
	): Record<string, FormValue> | undefined;
	apply?<ErrorShape>(
		result: SubmissionResult<ErrorShape>,
		...args: Parameters<Signature>
	): SubmissionResult<ErrorShape>;
	update?<ErrorShape>(
		state: FormState<ErrorShape>,
		action: FormAction<
			ErrorShape,
			{
				type: string;
				payload: Signature extends (payload: infer Payload) => void
					? Payload
					: undefined;
			},
			{
				reset: (
					defaultValue?: Record<string, unknown> | null,
				) => FormState<ErrorShape>;
				cancelled?: boolean;
			}
		>,
	): FormState<ErrorShape>;
};

type BaseCombine<
	T,
	K extends PropertyKey = T extends unknown ? keyof T : never,
> = T extends unknown ? T & Partial<Record<Exclude<K, keyof T>, never>> : never;

export type Combine<T> = {
	[K in keyof BaseCombine<T>]: BaseCombine<T>[K];
};

export type SatisfyComponentProps<
	ElementType extends React.ElementType,
	CustomProps extends React.ComponentPropsWithoutRef<ElementType>,
> = CustomProps;

/** Field metadata object containing field state, validation attributes, and nested field access methods. */
export type FieldMetadata<
	FieldShape,
	ErrorShape = any,
	CustomFieldMetadata extends Record<string, unknown> = {},
> = Readonly<
	Prettify<
		ValidationAttributes & {
			/** Unique key for React list rendering (for array fields). */
			key: string | undefined;
			/** The field name path exactly as provided. */
			name: FieldName<FieldShape>;
			/** The field's unique identifier, automatically generated as {formId}-field-{fieldName}. */
			id: string;
			/** Auto-generated ID for associating field descriptions via aria-describedby. */
			descriptionId: string;
			/** Auto-generated ID for associating field errors via aria-describedby. */
			errorId: string;
			/** The form's unique identifier for associating field via the `form` attribute. */
			formId: string;
			/**
			 * The field's default value as a string.
			 *
			 * Returns an empty string `''` when:
			 * - No default value is set (field value is `null` or `undefined`)
			 * - The field value cannot be serialized to a string (e.g., objects or arrays)
			 */
			defaultValue: string;
			/**
			 * Default selected options for multi-select fields or checkbox group.
			 *
			 * Returns an empty array `[]` when:
			 * - No default options are set (field value is `null` or `undefined`)
			 * - The field value cannot be serialized to a string array (e.g., nested objects or arrays of objects)
			 */
			defaultOptions: string[];
			/**
			 * Default checked state for checkbox inputs. Returns `true` if the field value is `'on'`.
			 *
			 * For radio buttons, compare the field's `defaultValue` with the radio button's value attribute instead.
			 */
			defaultChecked: boolean;
			/**
			 * The normalized default payload at this field path.
			 *
			 * This is useful for non-native field shapes that need to render a set of
			 * hidden inputs before user interaction.
			 */
			defaultPayload: unknown;
			/** Whether this field has been touched (through intent.validate() or the shouldValidate option). */
			touched: boolean;
			/** Whether this field currently has no validation errors. */
			valid: boolean;
			/** @deprecated Use `.valid` instead. This was not an intentionl breaking change and would be removed in the next minor version soon  */
			invalid: boolean;
			/** Validation error for this field. */
			errors: ErrorShape | undefined;
			/** Object containing validation errors for all touched subfields. */
			fieldErrors: Record<string, ErrorShape>;
			/** Boolean value for the `aria-invalid` attribute. Indicates whether the field has validation errors for screen readers. */
			ariaInvalid: boolean | undefined;
			/** String value for the `aria-describedby` attribute. Contains the errorId when invalid, undefined otherwise. Merge with descriptionId manually if needed (e.g. `${metadata.descriptionId} ${metadata.ariaDescribedBy}`). */
			ariaDescribedBy: string | undefined;
			/** Method to get nested fieldset for object fields under this field. */
			getFieldset<
				FieldsetShape = keyof NonNullable<FieldShape> extends never
					? unknown
					: FieldShape,
			>(): Fieldset<FieldsetShape, ErrorShape, CustomFieldMetadata>;
			/** Method to get array of fields for list/array fields under this field. */
			getFieldList<
				FieldItemShape = [FieldShape] extends [
					Array<infer ItemShape> | null | undefined,
				]
					? ItemShape
					: unknown,
			>(): Array<
				FieldMetadata<FieldItemShape, ErrorShape, CustomFieldMetadata>
			>;
		} & RestoreFieldShape<CustomFieldMetadata, FieldShape>
	>
>;

/**
 * Field metadata without custom extensions. This is the type received in `extendFieldMetadata`.
 * Equivalent to `FieldMetadata<FieldShape, ErrorShape, {}>`.
 */
export type BaseFieldMetadata<FieldShape, ErrorShape = any> = FieldMetadata<
	FieldShape,
	ErrorShape,
	{}
>;

/** Fieldset object containing all form fields as properties with their respective field metadata. */
export type Fieldset<
	FieldShape,
	ErrorShape = any,
	CustomFieldMetadata extends Record<string, unknown> = {},
> = {
	[Key in keyof Combine<FieldShape>]-?: FieldMetadata<
		Combine<FieldShape>[Key],
		ErrorShape,
		CustomFieldMetadata
	>;
};

/** Form-level metadata and state object containing validation status, errors, and field access methods. */
export type FormMetadata<
	ErrorShape = any,
	CustomFormMetadata extends Record<string, unknown> = {},
	CustomFieldMetadata extends Record<string, unknown> = {},
> = Readonly<
	{
		/** Unique identifier that changes on form reset */
		key: string;
		/** The form's unique identifier. */
		id: string;
		/** Auto-generated ID for associating form descriptions via aria-describedby. */
		descriptionId: string;
		/** Auto-generated ID for associating form errors via aria-describedby. */
		errorId: string;
		/** Whether any field in the form has been touched (through intent.validate() or the shouldValidate option). */
		touched: boolean;
		/** Whether the form currently has no validation errors. */
		valid: boolean;
		/** @deprecated Use `.valid` instead. This was not an intentional breaking change and would be removed in the next minor version soon  */
		invalid: boolean;
		/** Form-level validation error, if any exists. */
		errors: ErrorShape | undefined;
		/** Object containing validation errors for all touched fields. */
		fieldErrors: Record<string, ErrorShape>;
		/** The form's initial default values. */
		defaultValue: Record<string, unknown>;
		/** Form props object for spreading onto the <form> element. */
		props: Readonly<{
			id: string;
			onSubmit: React.FormEventHandler<HTMLFormElement>;
			onBlur: React.FocusEventHandler<HTMLFormElement>;
			onInput: React.FormEventHandler<HTMLFormElement>;
			noValidate: boolean;
		}>;
		/** The current state of the form */
		context: FormContext<ErrorShape>;
		/** Method to get metadata for a specific field by name. */
		getField<FieldShape>(
			name: FieldName<FieldShape>,
		): FieldMetadata<FieldShape, ErrorShape, CustomFieldMetadata>;
		/** Method to get a fieldset object for nested object fields. */
		getFieldset<FieldShape>(
			name?: FieldName<FieldShape>,
		): Fieldset<
			keyof NonNullable<FieldShape> extends never ? unknown : FieldShape,
			ErrorShape,
			CustomFieldMetadata
		>;
		/** Method to get an array of field objects for array fields. */
		getFieldList<FieldShape>(
			name: FieldName<FieldShape>,
		): Array<
			FieldMetadata<
				[FieldShape] extends [Array<infer ItemShape> | null | undefined]
					? ItemShape
					: unknown,
				ErrorShape,
				CustomFieldMetadata
			>
		>;
	} & CustomFormMetadata
>;

/**
 * Form metadata without custom extensions. This is the type received in `extendFormMetadata`.
 * Equivalent to `FormMetadata<ErrorShape, {}, CustomFieldMetadata>`.
 */
export type BaseFormMetadata<
	ErrorShape = any,
	CustomFieldMetadata extends Record<string, unknown> = {},
> = FormMetadata<ErrorShape, {}, CustomFieldMetadata>;

export type ValidateResult<ErrorShape, Value> =
	| FormError<ErrorShape>
	| null
	| {
			error: FormError<ErrorShape> | null;
			value?: Value;
	  };

export type ValidateContext<SchemaValue, SchemaErrorShape> = {
	/**
	 * The submitted values mapped by field name.
	 * Supports nested names like `user.email` and indexed names like `items[0].id`.
	 */
	payload: Record<string, FormValue>;
	/**
	 * Form error object. Initially empty, but populated with schema validation
	 * errors when a schema is provided and validation fails.
	 */
	error: FormError<SchemaErrorShape>;
	/**
	 * The submission intent derived from the button that triggered the form submission.
	 */
	intent: UnknownIntent | null;
	/**
	 * The raw FormData object of the submission.
	 */
	formData: FormData;
	/**
	 * Reference to the HTML form element that triggered the submission.
	 */
	formElement: HTMLFormElement;
	/**
	 * The specific element (button/input) that triggered the form submission.
	 */
	submitter: HTMLElement | null;
	/**
	 * The validated value from schema validation. Only defined when a schema is provided
	 * and the validation succeeds. Undefined if no schema is provided or validation fails.
	 */
	schemaValue: SchemaValue;
};

export type ValidateHandler<
	ErrorShape,
	Value,
	SchemaValue = undefined,
	SchemaErrorShape = ErrorShape,
> = (
	ctx: ValidateContext<SchemaValue, SchemaErrorShape>,
) =>
	| ValidateResult<ErrorShape, Value>
	| Promise<ValidateResult<ErrorShape, Value>>
	| [
			ValidateResult<ErrorShape, Value> | undefined,
			Promise<ValidateResult<ErrorShape, Value>> | undefined,
	  ]
	| undefined;

export interface FormInputEvent extends React.FormEvent<HTMLFormElement> {
	currentTarget: EventTarget & HTMLFormElement;
	target: EventTarget &
		(
			| HTMLInputElement
			| HTMLSelectElement
			| HTMLTextAreaElement
			| HTMLFieldSetElement
		);
}

export interface FormFocusEvent extends React.FormEvent<HTMLFormElement> {
	currentTarget: EventTarget & HTMLFormElement;
	relatedTarget: EventTarget | null;
	target: EventTarget &
		(
			| HTMLInputElement
			| HTMLSelectElement
			| HTMLTextAreaElement
			| HTMLFieldSetElement
		);
}

export type ErrorContext<ErrorShape> = {
	formElement: HTMLFormElement;
	error: FormError<ErrorShape>;
	intent: UnknownIntent | null;
};

export type ErrorHandler<ErrorShape> = (ctx: ErrorContext<ErrorShape>) => void;

export type InputHandler = (event: FormInputEvent) => void;

export type BlurHandler = (event: FormFocusEvent) => void;

export type SubmitContext<
	FormShape extends Record<string, any> = Record<string, any>,
	ErrorShape = any,
	Value = undefined,
> = {
	formData: FormData;
	value: Value;
	update: (options: {
		error?: Partial<FormError<ErrorShape>> | null | undefined;
		value?: FormShape | null | undefined;
		reset?: boolean | undefined;
	}) => void;
};

export type SubmitHandler<
	FormShape extends Record<string, any> = Record<string, any>,
	ErrorShape = any,
	Value = undefined,
> = (
	event: React.FormEvent<HTMLFormElement>,
	ctx: SubmitContext<FormShape, ErrorShape, Value>,
) => void | Promise<void>;

/**
 * Infer the base error shape from a FormsConfig.
 *
 * **Example:**
 * ```ts
 * const { config } = configureForms({ isError: shape<{ message: string }>() });
 * type ErrorShape = InferBaseErrorShape<typeof config>; // { message: string }
 * ```
 */
export type InferBaseErrorShape<Config> =
	Config extends FormsConfig<infer ErrorShape, any, any, any, any>
		? ErrorShape
		: string;

/**
 * Infer the custom form metadata extension from a FormsConfig.
 * Use this to compose with FormMetadata, FieldMetadata, or Fieldset types.
 *
 * **Example:**
 * ```ts
 * const { config } = configureForms({
 *   extendFormMetadata: (meta) => ({ customProp: meta.id })
 * });
 * type MyFormMetadata = FormMetadata<
 *   InferBaseErrorShape<typeof config>,
 *   InferCustomFormMetadata<typeof config>,
 *   InferCustomFieldMetadata<typeof config>
 * >;
 * ```
 */
export type InferCustomFormMetadata<Config> =
	Config extends FormsConfig<any, any, any, infer CustomFormMetadata, any>
		? CustomFormMetadata
		: {};

/**
 * Infer the custom field metadata extension from a FormsConfig.
 * Use this to compose with FieldMetadata or Fieldset types.
 *
 * **Example:**
 * ```ts
 * const { config } = configureForms({
 *   extendFieldMetadata: (meta) => ({ inputProps: { name: meta.name } })
 * });
 * type MyFieldMetadata<T> = FieldMetadata<T, InferBaseErrorShape<typeof config>, InferCustomFieldMetadata<typeof config>>;
 * type MyFieldset<T> = Fieldset<T, InferBaseErrorShape<typeof config>, InferCustomFieldMetadata<typeof config>>;
 * ```
 */
export type InferCustomFieldMetadata<Config> =
	Config extends FormsConfig<any, any, any, any, infer CustomFieldMetadata>
		? CustomFieldMetadata
		: {};

/**
 * Transform a type to make specific keys conditional based on FieldShape.
 * Keys in ConditionalKeys will only be present when FieldShape extends the specified type.
 * Uses ConditionalFieldMetadata wrapper that RestoreFieldShape will detect and evaluate.
 *
 * **Example:**
 * ```ts
 * type Result = MakeConditional<
 *   { textFieldProps: {...}, dateRangePickerProps: {...} },
 *   { dateRangePickerProps: { start: string; end: string } }
 * >;
 * // dateRangePickerProps is wrapped with ConditionalFieldMetadata
 * // and will only be present when FieldShape extends { start: string; end: string }
 * ```
 */
export type MakeConditional<
	T,
	ConditionalKeys extends Record<string, unknown>,
> = Omit<T, keyof ConditionalKeys> & {
	[K in keyof ConditionalKeys]: K extends keyof T
		? ConditionalFieldMetadata<T[K], ConditionalKeys[K]>
		: never;
};

export type MaybePromise<T> = T | Promise<T>;

type BaseFieldsetProps = RequireKey<
	Omit<React.ComponentPropsWithoutRef<'fieldset'>, 'children' | 'defaultValue'>,
	'name'
> & {
	/**
	 * Renders a hidden `<fieldset>` base control with nested hidden `<input>` elements
	 * derived from `defaultValue`.
	 */
	type: 'fieldset';
	/**
	 * Structured default value used to render nested hidden inputs.
	 */
	defaultValue: unknown;
};

type BaseSelectProps = RequireKey<
	Omit<React.ComponentPropsWithoutRef<'select'>, 'children' | 'value'>,
	'name' | 'defaultValue'
> & {
	/**
	 * Renders a hidden `<select>` base control.
	 */
	type: 'select';
};

type BaseTextareaProps = RequireKey<
	Omit<React.ComponentPropsWithoutRef<'textarea'>, 'children' | 'value'>,
	'name' | 'defaultValue'
> & {
	/**
	 * Renders a hidden `<textarea>` base control.
	 */
	type: 'textarea';
};

type BaseCheckedInputProps = RequireKey<
	Omit<
		React.ComponentPropsWithoutRef<'input'>,
		'children' | 'type' | 'checked'
	>,
	'name' | 'defaultChecked'
> & {
	/**
	 * Renders a hidden checkbox or radio base control.
	 */
	type: 'checkbox' | 'radio';
};

type BaseFileInputProps = RequireKey<
	Omit<
		React.ComponentPropsWithoutRef<'input'>,
		'children' | 'type' | 'value' | 'checked'
	>,
	'name'
> & {
	/**
	 * Renders a hidden `<input type="file">` base control.
	 */
	type: 'file';
};

type BaseInputProps = RequireKey<
	Omit<
		React.ComponentPropsWithoutRef<'input'>,
		'children' | 'type' | 'value' | 'checked'
	>,
	'name' | 'defaultValue'
> & {
	/**
	 * Renders a hidden `<input type="...">` base control.
	 */
	type?:
		| 'color'
		| 'date'
		| 'datetime-local'
		| 'email'
		| 'hidden'
		| 'month'
		| 'number'
		| 'password'
		| 'range'
		| 'search'
		| 'tel'
		| 'text'
		| 'time'
		| 'url'
		| 'week';
};

export type BaseControlProps =
	| BaseFieldsetProps
	| BaseSelectProps
	| BaseTextareaProps
	| BaseCheckedInputProps
	| BaseFileInputProps
	| BaseInputProps;
