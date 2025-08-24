import type {
	FormError,
	FormValue,
	SubmissionResult,
	ValidationAttributes,
} from '@conform-to/dom/future';

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
	key: string;
	intendedValue: Record<string, unknown> | null;
	serverValidatedValue: Record<string, unknown> | null;
	serverError: FormError<ErrorShape> | null;
	clientError: FormError<ErrorShape> | null;
	touchedFields: string[];
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

export interface FormContext<FormShape = any, ErrorShape = string[]> {
	formId: string;
	state: FormState<ErrorShape>;
	defaultValue?: DefaultValue<FormShape>;
	constraint?: Record<string, ValidationAttributes>;
	handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
	handleInput: (event: React.FormEvent<HTMLFormElement>) => void;
	handleBlur: (event: React.FocusEvent<HTMLFormElement>) => void;
}

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

export type Field<
	FieldShape,
	Metadata extends Record<string, unknown> = DefaultFieldMetadata<unknown>,
> = Readonly<
	Metadata & {
		key: string | undefined;
		name: FieldName<FieldShape>;
		getFieldset(): Fieldset<
			[FieldShape] extends [Record<string, unknown> | null | undefined]
				? FieldShape
				: unknown,
			Metadata
		>;
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

export type Fieldset<
	FieldShape, // extends Record<string, unknown>,
	Metadata extends Record<string, unknown>,
> = {
	[Key in keyof Combine<FieldShape>]-?: Field<
		Combine<FieldShape>[Key],
		Metadata
	>;
};

export type FormMetadata<
	ErrorShape,
	FieldMetadata extends Record<
		string,
		unknown
	> = DefaultFieldMetadata<ErrorShape>,
> = Readonly<{
	id: string;
	touched: boolean;
	invalid: boolean;
	errors: ErrorShape | undefined;
	fieldErrors: Record<string, ErrorShape>;
	props: Readonly<{
		id: string;
		onSubmit: React.FormEventHandler<HTMLFormElement>;
		onBlur: React.FocusEventHandler<HTMLFormElement>;
		onInput: React.FormEventHandler<HTMLFormElement>;
		noValidate: boolean;
	}>;
	getField<FieldShape>(
		name: FieldName<FieldShape>,
	): Field<FieldShape, FieldMetadata>;
	getFieldset<FieldShape>(
		name: FieldName<FieldShape>,
	): Fieldset<
		[FieldShape] extends [Record<string, unknown> | null | undefined]
			? FieldShape
			: unknown,
		FieldMetadata
	>;
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

export type DefaultFieldMetadata<ErrorShape> = Readonly<
	ValidationAttributes & {
		id: string;
		descriptionId: string;
		errorId: string;
		defaultValue: string | undefined;
		defaultOptions: string[] | undefined;
		defaultChecked: boolean | undefined;
		validated: boolean;
		invalid: boolean;
		errors: ErrorShape | undefined;
	}
>;

export type ValidateResult<ErrorShape, Value> =
	| FormError<ErrorShape>
	| null
	| {
			error: FormError<ErrorShape> | null;
			value?: Value;
	  };

export type ValidateHandler<
	ErrorShape,
	Value,
	Intent extends UnknownIntent | undefined,
> = (
	value: Record<string, FormValue>,
	ctx: {
		formElement: HTMLFormElement;
		submitter: HTMLElement | null;
		error: FormError<string[]>;
		intent: Intent | null;
	},
) =>
	| ValidateResult<ErrorShape, Value>
	| Promise<ValidateResult<ErrorShape, Value>>
	| [
			ValidateResult<ErrorShape, Value>,
			Promise<ValidateResult<ErrorShape, Value>>,
	  ]
	| undefined;

export type UpdateHandler<ErrorShape> = (
	action: FormAction<
		ErrorShape,
		UnknownIntent | null,
		{
			prevState: FormState<ErrorShape>;
			nextState: FormState<ErrorShape>;
		}
	>,
) => void;

export interface FormEvent extends React.FormEvent<HTMLFormElement> {
	target: EventTarget &
		(HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement);
	currentTarget: EventTarget & HTMLFormElement;
}

export type InputHandler = (
	event: React.FormEvent<HTMLFormElement>,
	input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
) => void;

export type BlurHandler = (
	event: React.FocusEvent<HTMLFormElement>,
	input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
) => void;

export type FormStateHandler<State, ErrorShape = unknown> = (
	state: State,
	action: FormAction<
		ErrorShape,
		UnknownIntent | null,
		{
			prevState: FormState<ErrorShape>;
			nextState: FormState<ErrorShape>;
			reset: () => State;
		}
	>,
) => State;

export type SubmitHandler<ErrorShape, Value> = (
	event: React.FormEvent<HTMLFormElement>,
	ctx: {
		formData: FormData;
		value: Value;
		update: (options: {
			error?: Partial<FormError<ErrorShape>> | null;
			reset?: boolean;
		}) => void;
	},
) => void | Promise<void>;
