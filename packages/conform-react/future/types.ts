import type {
	FormError,
	FormValue,
	SubmissionResult,
	ValidationAttributes,
} from '@conform-to/dom/future';
import { StandardSchemaV1 } from '@standard-schema/spec';

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
	value?: string;
	options?: string[];
	checked?: boolean;
	files?: File[];
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

export type DefaultValue<FormShape> = FormShape extends
	| string
	| number
	| boolean
	| Date
	| File
	| bigint
	| null
	| undefined
	? FormShape | null | undefined
	: FormShape extends Array<infer Item> | null | undefined
		? Array<DefaultValue<Item>> | null | undefined
		: FormShape extends Record<string, any> | null | undefined
			?
					| { [Key in keyof FormShape]?: DefaultValue<FormShape[Key]> }
					| null
					| undefined
			: unknown;

export type FormState<ErrorShape> = {
	/** Unique identifier that changes on form reset to trigger reset side effects */
	resetKey: string;
	/** Form values from user intent actions (validate, update, insert, remove, etc.) */
	intendedValue: Record<string, unknown> | null;
	/** Form values that have been validated on the server */
	serverValidatedValue: Record<string, unknown> | null;
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
	ErrorShape,
	Intent extends UnknownIntent | null | undefined = UnknownIntent | null,
	Context = {},
> = SubmissionResult<ErrorShape> & {
	type: 'initialize' | 'server' | 'client';
	intent: Intent;
	ctx: Context;
};

export interface FormOptions<
	FormShape,
	ErrorShape = string,
	Value = undefined,
> {
	/** Optional form identifier. If not provided, a unique ID is automatically generated. */
	id?: string;
	/** Optional key for form state reset. When the key changes, the form resets to its initial state. */
	key?: string;
	/** Optional standard schema for validation (e.g., Zod, Valibot, Yup). Removes the need for manual onValidate setup. */
	schema?: StandardSchemaV1<FormShape, Value>;
	/** Initial form values. Can be a partial object matching your form structure. */
	defaultValue?: NoInfer<DefaultValue<FormShape>>;
	/** HTML validation attributes for fields (required, minLength, pattern, etc.). */
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

	/** Server-side submission result for form state synchronization. */
	lastResult?: SubmissionResult<NoInfer<ErrorShape>> | null;
	/** Custom validation handler. Can be skipped if using the schema property, or combined with schema to customize validation errors. */
	onValidate?: ValidateHandler<ErrorShape, Value>;
	/** Error handling callback triggered when validation errors occur. By default, it focuses the first invalid field. */
	onError?: ErrorHandler<ErrorShape>;
	/** Form submission handler called when the form is submitted with no validation errors. */
	onSubmit?: SubmitHandler<NoInfer<ErrorShape>, NoInfer<Value>>;
	/** Input event handler for custom input event logic. */
	onInput?: InputHandler;
	/** Blur event handler for custom focus handling logic. */
	onBlur?: BlurHandler;
}

export interface FormContext<ErrorShape = string> {
	/** The form's unique identifier */
	formId: string;
	/** Internal form state with validation results and field data */
	state: FormState<ErrorShape>;
	/** Initial form values */
	defaultValue: NonNullable<DefaultValue<Record<string, any>>> | null;
	/** HTML validation attributes for fields */
	constraint: Record<string, ValidationAttributes> | null;
	/** Form submission event handler */
	handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
	/** Input event handler for form-wide input events */
	handleInput: (event: React.FormEvent) => void;
	/** Blur event handler for form-wide blur events */
	handleBlur: (event: React.FocusEvent) => void;
}

/** The name of an input field with type information for TypeScript inference. */
export type FieldName<FieldShape> = string & {
	'~shape'?: FieldShape;
};

export type UnknownIntent = {
	type: string;
	payload?: unknown;
};

export type UnknownArgs<Args extends any[]> = {
	[Key in keyof Args]: unknown;
};

export interface IntentDispatcher {
	/**
	 * Validate the whole form or a specific field?
	 */
	validate(name?: string): void;

	/**
	 * Reset the form to its initial state.
	 */
	reset(): void;

	/**
	 * Update a field or a fieldset.
	 * If you provide a fieldset name, it will update all fields within that fieldset
	 */
	update<FieldShape>(options: {
		/**
		 * The name of the field. If you provide a fieldset name, it will update all fields within that fieldset.
		 */
		name?: FieldName<FieldShape>;
		/**
		 * Specify the index of the item to update if the field is an array.
		 */
		index?: [FieldShape] extends [Array<any> | null | undefined]
			? number
			: never;
		/**
		 * The new value for the field or fieldset.
		 */
		value: Partial<FieldShape>;
	}): void;

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
		defaultValue?: [FieldShape] extends [
			Array<infer ItemShape> | null | undefined,
		]
			? Partial<ItemShape>
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
	): Record<string, FormValue> | null;
	onUpdate?<ErrorShape>(
		state: FormState<ErrorShape>,
		action: FormAction<
			ErrorShape,
			{
				type: string;
				payload: Signature extends (payload: infer Payload) => void
					? Payload
					: undefined;
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

/** Field metadata object containing field state, validation attributes, and nested field access methods. */
export type Field<
	FieldShape,
	Metadata extends Record<string, unknown> = DefaultFieldMetadata<unknown>,
> = Readonly<
	Metadata & {
		/** Unique key for React list rendering (for array fields). */
		key: string | undefined;
		/** The field name path exactly as provided. */
		name: FieldName<FieldShape>;
		/** Method to get nested fieldset for object fields under this field. */
		getFieldset(): Fieldset<
			[FieldShape] extends [Record<string, unknown> | null | undefined]
				? FieldShape
				: unknown,
			Metadata
		>;
		/** Method to get array of fields for list/array fields under this field. */
		getFieldList(): Array<
			Field<
				[FieldShape] extends [Array<infer ItemShape> | null | undefined]
					? ItemShape
					: unknown,
				Metadata
			>
		>;
	}
>;

/** Fieldset object containing all form fields as properties with their respective field metadata. */
export type Fieldset<
	FieldShape, // extends Record<string, unknown>,
	FieldMetadata extends Record<string, unknown>,
> = {
	[Key in keyof Combine<FieldShape>]-?: Field<
		Combine<FieldShape>[Key],
		FieldMetadata
	>;
};

/** Form-level metadata and state object containing validation status, errors, and field access methods. */
export type FormMetadata<
	ErrorShape,
	FieldMetadata extends Record<
		string,
		unknown
	> = DefaultFieldMetadata<ErrorShape>,
> = Readonly<{
	/** The form's unique identifier. */
	id: string;
	/** Whether any field in the form has been touched (through intent.validate() or the shouldValidate option). */
	touched: boolean;
	/** Whether the form currently has any validation errors. */
	invalid: boolean;
	/** Form-level validation errors, if any exist. */
	errors: ErrorShape[] | undefined;
	/** Object containing field-specific validation errors for all validated fields. */
	fieldErrors: Record<string, ErrorShape[]>;
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
	): Field<FieldShape, FieldMetadata>;
	/** Method to get a fieldset object for nested object fields. */
	getFieldset<FieldShape>(
		name: FieldName<FieldShape>,
	): Fieldset<
		[FieldShape] extends [Record<string, unknown> | null | undefined]
			? FieldShape
			: unknown,
		FieldMetadata
	>;
	/** Method to get an array of field objects for array fields. */
	getFieldList<FieldShape>(
		name: FieldName<FieldShape>,
	): Array<
		Field<
			[FieldShape] extends [Array<infer ItemShape> | null | undefined]
				? ItemShape
				: unknown,
			FieldMetadata
		>
	>;
}>;

/** Default field metadata object containing field state, validation attributes, and accessibility IDs. */
export type DefaultFieldMetadata<ErrorShape> = Readonly<
	ValidationAttributes & {
		/** The field's unique identifier, automatically generated as {formId}-{fieldName}. */
		id: string;
		/** Auto-generated ID for associating field descriptions via aria-describedby. */
		descriptionId: string;
		/** Auto-generated ID for associating field errors via aria-describedby. */
		errorId: string;
		/** The field's default value as a string. */
		defaultValue: string | undefined;
		/** Default selected options for multi-select fields or checkbox group. */
		defaultOptions: string[] | undefined;
		/** Default checked state for checkbox/radio inputs. */
		defaultChecked: boolean | undefined;
		/** Whether this field has been touched (through intent.validate() or the shouldValidate option). */
		touched: boolean;
		/** Whether this field currently has validation errors. */
		invalid: boolean;
		/** Array of validation error messages for this field. */
		errors: ErrorShape[] | undefined;
	}
>;

export type ValidateResult<ErrorShape, Value> =
	| FormError<ErrorShape>
	| null
	| {
			error: FormError<ErrorShape> | null;
			value?: Value;
	  };

export type ValidateContext = {
	payload: Record<string, FormValue>;
	error: FormError<string>;
	intent: UnknownIntent | null;
	formData: FormData;
	formElement: HTMLFormElement;
	submitter: HTMLElement | null;
};

export type ValidateHandler<ErrorShape, Value> = (
	ctx: ValidateContext,
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

export type SubmitContext<ErrorShape = string, Value = undefined> = {
	formData: FormData;
	value: Value;
	update: (options: {
		error?: Partial<FormError<ErrorShape>> | null;
		reset?: boolean;
	}) => void;
};

export type SubmitHandler<ErrorShape = string, Value = undefined> = (
	event: React.FormEvent<HTMLFormElement>,
	ctx: SubmitContext<ErrorShape, Value>,
) => void | Promise<void>;
