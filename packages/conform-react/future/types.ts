import type {
	FieldName,
	FormError,
	FormValue,
	Serialize,
	SubmissionResult,
	ValidationAttributes,
	SchemaTypeKey,
	SchemaConfig,
} from '@conform-to/dom/future';
import { standardSchema } from './schema';
import { StandardSchemaV1 } from './standard-schema';

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

export type InputSnapshot = {
	value?: string | undefined;
	options?: string[] | undefined;
	checked?: boolean | undefined;
	files?: File[] | undefined;
};

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
	 * A ref object containing the form element associated with the registered input.
	 * Use this with hooks like useFormData() and useIntent().
	 */
	formRef: React.RefObject<HTMLFormElement | null>;
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

export type Selector<FormValue, Result> = (
	formData: FormValue | null,
	lastResult: Result | undefined,
) => Result;

export type UseFormDataOptions = {
	/**
	 * Set to `true` to preserve file inputs and receive a `FormData` object in the selector.
	 * If omitted or `false`, the selector receives a `URLSearchParams` object, where all values are coerced to strings.
	 */
	acceptFiles?: boolean;
};

export type DefaultValue<Shape> =
	Shape extends Record<string, any>
		? { [Key in keyof Shape]?: DefaultValue<Shape[Key]> } | null | undefined
		: Shape extends Array<infer Item>
			? Array<DefaultValue<Item>> | null | undefined
			: Shape extends File | File[]
				? null | undefined // We don't support setting default value for file inputs yet
				: Shape | string | null | undefined;

export type FormState<ErrorShape extends BaseErrorShape = DefaultErrorShape> = {
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
	ErrorShape extends BaseErrorShape = DefaultErrorShape,
	Intent extends UnknownIntent | null | undefined = UnknownIntent | null,
	Context = {},
> = SubmissionResult<ErrorShape> & {
	type: 'initialize' | 'server' | 'client';
	intent: Intent;
	ctx: Context;
};

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
export type WhenField = <Shape, E, Result>(
	metadata: BaseMetadata<unknown, E>,
	shape: FieldShapeGuard<Shape>,
	fn: (metadata: BaseMetadata<Shape, E>) => Result,
) => ConditionalFieldMetadata<Result, Shape>;

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
 * Configuration options for configureForms factory.
 */
export type FormsConfig<
	BaseErrorShape = string,
	TypeKey extends SchemaTypeKey = typeof standardSchema.type,
	CustomFormMetadata extends Record<string, unknown> = {},
	CustomFieldMetadata extends Record<string, unknown> = {},
> = {
	/**
	 * The name of the submit button field that indicates the submission intent.
	 *
	 * @default "__intent__"
	 */
	intentName?: string;
	/**
	 * A custom serialization function for converting form data.
	 */
	serialize?: Serialize;
	/**
	 * Determines when validation should run for the first time on a field.
	 *
	 * @default "onSubmit"
	 */
	shouldValidate?: 'onSubmit' | 'onBlur' | 'onInput';
	/**
	 * Determines when validation should run again after the field has been validated once.
	 *
	 * @default Same as shouldValidate
	 */
	shouldRevalidate?: 'onSubmit' | 'onBlur' | 'onInput';
	/**
	 * A type guard function to specify the shape of error objects.
	 */
	errorShape?: (error: unknown) => error is BaseErrorShape;
	/**
	 * Schema configuration for type inference and validation.
	 * Import from `@conform-to/zod/future` or `@conform-to/valibot/future`
	 * for schema-specific type inference and validation.
	 *
	 * @default standardSchema (uses StandardSchema validation)
	 *
	 * @example
	 * ```ts
	 * import { configureForms } from '@conform-to/react/future';
	 * import { zodSchema } from '@conform-to/zod/future';
	 *
	 * const { useForm } = configureForms({
	 *   schema: zodSchema,
	 * });
	 * ```
	 */
	schema?: SchemaConfig<TypeKey>;
	/**
	 * A function that defines custom form metadata properties.
	 */
	formMetadata?: <ErrorShape extends BaseErrorShape>(
		metadata: BaseFormMetadata<ErrorShape>,
	) => CustomFormMetadata;
	/**
	 * A function that defines custom field metadata properties.
	 * Useful for integrating with UI libraries or custom form components.
	 *
	 * Use `whenField` to define properties that should only
	 * be available for specific field shapes.
	 */
	fieldMetadata?: <FieldShape, ErrorShape extends BaseErrorShape>(
		metadata: BaseMetadata<FieldShape, ErrorShape>,
		ctx: {
			form: BaseFormMetadata<ErrorShape>;
			whenField: WhenField;
		},
	) => CustomFieldMetadata;
};

/**
 * @deprecated Use `FormsConfig` and `configureForms` instead.
 */
export type GlobalFormOptions = {
	/**
	 * The name of the submit button field that indicates the submission intent.
	 *
	 * @default "__intent__"
	 */
	intentName: string;
	/**
	 * A custom serialization function for converting form data.
	 */
	serialize: Serialize;
	/**
	 * Determines when validation should run for the first time on a field.
	 *
	 * @default "onSubmit"
	 */
	shouldValidate: 'onSubmit' | 'onBlur' | 'onInput';
	/**
	 * Determines when validation should run again after the field has been validated once.
	 *
	 * @default Same as shouldValidate
	 */
	shouldRevalidate?: 'onSubmit' | 'onBlur' | 'onInput';
	/**
	 * A function that defines custom metadata properties for form fields.
	 * Useful for integrating with UI libraries or custom form components.
	 */
	defineCustomMetadata?: CustomMetadataDefinition;
};

export type NonPartial<T> = {
	[K in keyof Required<T>]: T[K];
};

export type RequireKey<T, K extends keyof T> = Prettify<
	T & Pick<NonPartial<T>, K>
>;

export type BaseSchemaType = StandardSchemaV1<any, any>;

export type InferInput<Schema> =
	Schema extends StandardSchemaV1<infer input, any> ? input : unknown;

export type InferOutput<Schema> =
	Schema extends StandardSchemaV1<any, infer output> ? output : undefined;

export type BaseFormOptions<
	FormShape extends Record<string, any> = Record<string, any>,
	ErrorShape extends BaseErrorShape = string extends BaseErrorShape
		? string
		: BaseErrorShape,
	Value = undefined,
	SchemaValue = undefined,
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
	/** HTML validation attributes for fields (required, minLength, pattern, etc.). */
	constraint?: Record<string, ValidationAttributes> | undefined;
	/**
	 * Determines when validation should run for the first time on a field.
	 * Overrides the global default set by FormOptionsProvider if provided.
	 *
	 * @default Inherits from FormOptionsProvider, or "onSubmit" if not configured
	 */
	shouldValidate?: 'onSubmit' | 'onBlur' | 'onInput' | undefined;
	/**
	 * Determines when validation should run again after the field has been validated once.
	 * Overrides the global default set by FormOptionsProvider if provided.
	 *
	 * @default Inherits from FormOptionsProvider, or same as shouldValidate
	 */
	shouldRevalidate?: 'onSubmit' | 'onBlur' | 'onInput' | undefined;
	/** Error handling callback triggered when validation errors occur. By default, it focuses the first invalid field. */
	onError?: ErrorHandler<NoInfer<ErrorShape>> | undefined;
	/** Input event handler for custom input event logic. */
	onInput?: InputHandler | undefined;
	/** Blur event handler for custom focus handling logic. */
	onBlur?: BlurHandler | undefined;
	/** Custom validation handler. Can be skipped if using the schema property, or combined with schema to customize validation errors. */
	onValidate?: ValidateHandler<ErrorShape, Value, SchemaValue> | undefined;
};

export type FormOptions<
	FormShape extends Record<string, any> = Record<string, any>,
	ErrorShape extends BaseErrorShape = string extends BaseErrorShape
		? string
		: BaseErrorShape,
	Value = undefined,
	SchemaValue = undefined,
	RequiredKeys extends keyof BaseFormOptions<
		FormShape,
		ErrorShape,
		Value,
		SchemaValue
	> = never,
> = RequireKey<
	BaseFormOptions<FormShape, ErrorShape, Value, SchemaValue>,
	RequiredKeys
>;

export interface FormContext<
	ErrorShape extends BaseErrorShape = DefaultErrorShape,
> {
	/** The form's unique identifier */
	formId: string;
	/** Internal form state with validation results and field data */
	state: FormState<ErrorShape>;
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
	 * @example
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
	insert<FieldShape extends Array<any>>(options: {
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
		defaultValue?: FieldShape extends Array<infer ItemShape>
			? DefaultValue<ItemShape>
			: never;
	}): void;

	/**
	 * Remove an item from an array field.
	 */
	remove(options: {
		/**
		 * The name of the array field to remove from.
		 */
		name: FieldName<Array<any>>;
		/**
		 * The index of the item to remove.
		 */
		index: number;
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

export type ActionHandler<
	Signature extends (payload: any) => void = (payload: any) => void,
> = {
	validatePayload?(...args: UnknownArgs<Parameters<Signature>>): boolean;
	onApply?(
		value: Record<string, FormValue>,
		...args: Parameters<Signature>
	): Record<string, FormValue> | undefined;
	onUpdate?<ErrorShape extends BaseErrorShape>(
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

/**
 * Extend this interface to define the base error shape for validation.
 *
 * @example
 * ```ts
 * declare module '@conform-to/react/future' {
 *   interface CustomTypes {
 *     errorShape: { message: string; code: string };
 *   }
 * }
 * ```
 */
export interface CustomTypes {}

export type BaseErrorShape = CustomTypes extends { errorShape: infer Shape }
	? Shape
	: unknown;

export type DefaultErrorShape = CustomTypes extends { errorShape: infer Shape }
	? Shape
	: string;

/** Base field metadata object containing field state, validation attributes, and accessibility IDs. */
export type BaseMetadata<
	FieldShape,
	ErrorShape extends BaseErrorShape,
> = ValidationAttributes & {
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
	/** Whether this field has been touched (through intent.validate() or the shouldValidate option). */
	touched: boolean;
	/** Whether this field currently has no validation errors. */
	valid: boolean;
	/** @deprecated Use `.valid` instead. This was not an intentionl breaking change and would be removed in the next minor version soon  */
	invalid: boolean;
	/** Array of validation error messages for this field. */
	errors: ErrorShape[] | undefined;
	/** Object containing errors for all touched subfields. */
	fieldErrors: Record<string, ErrorShape[]>;
	/** Boolean value for the `aria-invalid` attribute. Indicates whether the field has validation errors for screen readers. */
	ariaInvalid: boolean | undefined;
	/** String value for the `aria-describedby` attribute. Contains the errorId when invalid, undefined otherwise. Merge with descriptionId manually if needed (e.g. `${metadata.descriptionId} ${metadata.ariaDescribedBy}`). */
	ariaDescribedBy: string | undefined;
	/** Method to get nested fieldset for object fields under this field. */
	getFieldset<
		FieldsetShape = keyof NonNullable<FieldShape> extends never
			? unknown
			: FieldShape,
	>(): Fieldset<FieldsetShape, ErrorShape>;
	/** Method to get array of fields for list/array fields under this field. */
	getFieldList<
		FieldItemShape = [FieldShape] extends [
			Array<infer ItemShape> | null | undefined,
		]
			? ItemShape
			: unknown,
	>(): Array<FieldMetadata<FieldItemShape, ErrorShape>>;
};

export type SatisfyComponentProps<
	ElementType extends React.ElementType,
	CustomProps extends React.ComponentPropsWithoutRef<ElementType>,
> = CustomProps;

/**
 * Interface for extending field metadata with additional properties.
 */
export interface CustomMetadata<
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	FieldShape = any,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	ErrorShape extends BaseErrorShape = DefaultErrorShape,
> {
	// User-defined properties
}

/**
 * @deprecated Use `FieldMetadataDefinition` and `configureConform` instead.
 */
export type CustomMetadataDefinition = <
	FieldShape,
	ErrorShape extends BaseErrorShape,
>(
	metadata: BaseMetadata<FieldShape, ErrorShape>,
) => keyof CustomMetadata<FieldShape, ErrorShape> extends never
	? {}
	: CustomMetadata<any, any>;

/** Field metadata object containing field state, validation attributes, and nested field access methods. */
export type FieldMetadata<
	FieldShape,
	ErrorShape extends BaseErrorShape = DefaultErrorShape,
	CustomFieldMetadata extends Record<string, unknown> = {},
> = Readonly<
	Prettify<
		BaseMetadata<FieldShape, ErrorShape> &
			RestoreFieldShape<CustomFieldMetadata, FieldShape>
	>
>;

/** Fieldset object containing all form fields as properties with their respective field metadata. */
export type Fieldset<
	FieldShape,
	ErrorShape extends BaseErrorShape = DefaultErrorShape,
	CustomFieldMetadata extends Record<string, unknown> = {},
> = {
	[Key in keyof Combine<FieldShape>]-?: FieldMetadata<
		Combine<FieldShape>[Key],
		ErrorShape,
		CustomFieldMetadata
	>;
};

/** Form-level metadata and state object containing validation status, errors, and field access methods. */
export type BaseFormMetadata<
	ErrorShape extends BaseErrorShape = DefaultErrorShape,
	CustomFieldMetadata extends Record<string, unknown> = {},
> = {
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
	/** Form-level validation errors, if any exist. */
	errors: ErrorShape[] | undefined;
	/** Object containing errors for all touched fields. */
	fieldErrors: Record<string, ErrorShape[]>;
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
};

export type FormMetadata<
	ErrorShape extends BaseErrorShape = DefaultErrorShape,
	CustomFormMetadata extends Record<string, unknown> = {},
	CustomFieldMetadata extends Record<string, unknown> = {},
> = Readonly<
	Prettify<
		BaseFormMetadata<ErrorShape, CustomFieldMetadata> & CustomFormMetadata
	>
>;

export type ValidateResult<ErrorShape, Value> =
	| FormError<ErrorShape>
	| null
	| {
			error: FormError<ErrorShape> | null;
			value?: Value;
	  };

export type ValidateContext<SchemaValue> = {
	/**
	 * The submitted values mapped by field name.
	 * Supports nested names like `user.email` and indexed names like `items[0].id`.
	 */
	payload: Record<string, FormValue>;
	/**
	 * Form error object. Initially empty, but populated with schema validation
	 * errors when a schema is provided and validation fails.
	 */
	error: FormError<string>;
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

export type ValidateHandler<ErrorShape, Value, SchemaValue = undefined> = (
	ctx: ValidateContext<SchemaValue>,
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
		(HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement);
}

export interface FormFocusEvent extends React.FormEvent<HTMLFormElement> {
	currentTarget: EventTarget & HTMLFormElement;
	relatedTarget: EventTarget | null;
	target: EventTarget &
		(HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement);
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
	ErrorShape extends BaseErrorShape = DefaultErrorShape,
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
	ErrorShape extends BaseErrorShape = DefaultErrorShape,
	Value = undefined,
> = (
	event: React.FormEvent<HTMLFormElement>,
	ctx: SubmitContext<FormShape, ErrorShape, Value>,
) => void | Promise<void>;

/**
 * Infer the error shape from a FormsConfig.
 */
export type InferErrorShape<Config> =
	Config extends FormsConfig<infer E, any, any> ? E : unknown;

/**
 * Infer the custom form metadata result type from a FormsConfig.
 */
export type InferFormMetadataResult<Config> =
	Config extends FormsConfig<any, infer F, any> ? F : {};

/**
 * Infer the custom field metadata result type from a FormsConfig.
 * Conditions are encoded directly in the return type via the `conditional()` helper.
 */
export type InferFieldMetadataResult<Config> =
	Config extends FormsConfig<any, any, infer M> ? M : {};

/**
 * Transform a type to make specific keys conditional based on FieldShape.
 * Keys in ConditionalKeys will only be present when FieldShape extends the specified type.
 * Uses ConditionalFieldMetadata wrapper that RestoreFieldShape will detect and evaluate.
 *
 * @example
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

// Re-export schema type utilities from @conform-to/dom/future
export type {
	SchemaTypeKey,
	ExtractSchemaType,
	InferSchemaInput,
	InferSchemaOutput,
	SchemaValidationResult,
	SchemaConfig,
} from '@conform-to/dom/future';
