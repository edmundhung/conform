import {
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
	Intent = FormIntent | null | undefined,
	Context = { reset: () => FormState<FormShape, ErrorShape> },
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

export type ResetIntent = {
	type: 'reset';
};

export type ValidateIntent = {
	type: 'validate';
	payload?: string;
};

export type UpdateIntent = {
	type: 'update';
	payload: {
		name?: string;
		index?: number;
		value: FormValue<string | number | boolean | null>;
	};
};

export type InsertIntent = {
	type: 'insert';
	payload: {
		name: FieldName<any[]>;
		index?: number;
		defaultValue?: FormValue<string | number | boolean | null>;
	};
};

export type RemoveIntent = {
	type: 'remove';
	payload: {
		name: FieldName<any[]>;
		index: number;
	};
};

export type ReorderIntent = {
	type: 'reorder';
	payload: {
		name: FieldName<any[]>;
		from: number;
		to: number;
	};
};

export type UnknownIntent = {
	type: string;
	payload?: unknown;
};

export type FormIntent =
	| ResetIntent
	| ValidateIntent
	| UpdateIntent
	| InsertIntent
	| RemoveIntent
	| ReorderIntent;

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
