import type {
	FormError,
	FormValue,
	SubmissionResult,
	ValidationAttributes,
} from '@conform-to/dom/future';
import type { defaultActionHandlers } from './form';

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

export type FormState<FormShape, ErrorShape> = {
	key: string;
	intendedValue: Record<string, unknown> | null;
	serverValidatedValue: Record<string, unknown> | null;
	serverError: FormError<FormShape, ErrorShape> | null;
	clientError: FormError<FormShape, ErrorShape> | null;
	touchedFields: string[];
	listKeys: Record<string, string[]>;
};

export type FormAction<
	FormShape,
	ErrorShape,
	Intent = UnknownIntent | null | undefined,
	Context = {
		handlers: Record<string, ActionHandler>;
		reset: () => FormState<FormShape, ErrorShape>;
	},
> = {
	type: 'initialize' | 'server' | 'client';
	result: SubmissionResult<FormShape, ErrorShape>;
	intent: Intent;
	ctx: Context;
};

export interface FormContext<FormShape, ErrorShape> {
	formId: string;
	state: FormState<FormShape, ErrorShape>;
	defaultValue?: DefaultValue<FormShape>;
	constraint?: Record<string, ValidationAttributes>;
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

export type ValidateAction = {
	/**
	 * Validate the whole form or a specific field?
	 */
	(name?: string): void;
};

export type ResetAction = {
	/**
	 * Reset the form to its initial state.
	 */
	(): void;
};

export type UpdateAction = {
	/**
	 * Update a field or a fieldset.
	 * If you provide a fieldset name, it will update all fields within that fieldset
	 */
	<Schema>(options: {
		/**
		 * The name of the field. If you provide a fieldset name, it will update all fields within that fieldset.
		 */
		name?: FieldName<Schema>;
		/**
		 * Specify the index of the item to update if the field is an array.
		 */
		index?: Schema extends Array<any> ? number : never;
		/**
		 * The new value for the field or fieldset.
		 */
		value: Partial<Schema>;
	}): void;
};

export type InsertAction = {
	/**
	 * Insert a new item into an array field.
	 */
	<Schema>(options: {
		/**
		 * The name of the array field to insert into.
		 */
		name: FieldName<Schema[]>;
		/**
		 * The index at which to insert the new item.
		 * If not provided, it will be added to the end of the array.
		 */
		index?: number;
		/**
		 * The default value for the new item.
		 */
		defaultValue?: Partial<Schema>;
	}): void;
};

export type RemoveAction = {
	/**
	 * Remove an item from an array field.
	 */
	(options: {
		/**
		 * The name of the array field to remove from.
		 */
		name: FieldName<Array<any>>;
		/**
		 * The index of the item to remove.
		 */
		index: number;
	}): void;
};

export type ReorderAction = {
	/**
	 * Reorder items in an array field.
	 */
	(options: { name: FieldName<Array<any>>; from: number; to: number }): void;
};

export type ActionHandler<
	Signature extends (payload: any) => void = (payload: any) => void,
> = {
	validatePayload?(...args: UnknownArgs<Parameters<Signature>>): boolean;
	onApply?(
		value: Record<string, FormValue>,
		...args: Parameters<Signature>
	): Record<string, FormValue> | null;
	onUpdate?<FormShape, ErrorShape>(
		state: FormState<FormShape, ErrorShape>,
		action: FormAction<
			FormShape,
			ErrorShape,
			{
				type: string;
				payload: Signature extends (payload: infer Payload) => void
					? Payload
					: undefined;
			}
		>,
	): FormState<FormShape, ErrorShape>;
};

export type IntentDispatcher<
	Handlers extends Record<
		string,
		ActionHandler<(...args: Array<any>) => void>
	> = typeof defaultActionHandlers,
> = {
	[Type in keyof Handlers]: Handlers[Type] extends ActionHandler<
		infer Signature
	>
		? Signature
		: never;
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
	Metadata extends Record<string, unknown>,
> = Metadata &
	Readonly<{ key: string | undefined; name: FieldName<FieldShape> }> &
	([FieldShape] extends [Date | File]
		? {}
		: [FieldShape] extends [Array<infer Item> | null | undefined]
			? {
					getFieldList: () => Array<Field<Item, Metadata>>;
				}
			: [FieldShape] extends [Record<string, unknown> | null | undefined]
				? {
						getFieldset: () => Fieldset<FieldShape, Metadata>;
					}
				: {});

export type Fieldset<FormShape, Metadata extends Record<string, unknown>> = {
	[Key in keyof Combine<FormShape>]-?: Field<Combine<FormShape>[Key], Metadata>;
};

export type FormMetadata<
	ErrorShape,
	FormProps extends React.DetailedHTMLProps<
		React.FormHTMLAttributes<HTMLFormElement>,
		HTMLFormElement
	> = DefaultFormProps,
> = Readonly<{
	id: string;
	touched: boolean;
	invalid: boolean;
	errors: ErrorShape | undefined;
	fieldErrors: Record<string, ErrorShape>;
	props: FormProps;
}>;

export type DefaultFormProps = Readonly<{
	id: string;
	onSubmit: React.FormEventHandler<HTMLFormElement>;
	onBlur: React.FocusEventHandler<HTMLFormElement>;
	onInput: React.FormEventHandler<HTMLFormElement>;
	noValidate: boolean;
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
