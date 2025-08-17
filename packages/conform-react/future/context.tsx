import { createContext, useContext, useMemo } from 'react';
import { createGlobalFormsObserver } from '@conform-to/dom/future';
import {
	DefaultFieldMetadata,
	Field,
	FieldName as FieldName,
	FormContext,
	FormMetadata,
} from './types';
import { getField, getFormMetadata } from './metadata';

export const Context = createContext({
	observer: createGlobalFormsObserver(),
});

export const Form = createContext<FormContext[]>([]);

export function FormProvider(props: {
	context: FormContext;
	children: React.ReactNode;
}): React.ReactElement {
	const forms = useContext(Form);
	const value = useMemo(
		// Put the latest form context first to ensure that to be the first one found
		() => [props.context].concat(forms),
		[forms, props.context],
	);

	return <Form.Provider value={value}>{props.children}</Form.Provider>;
}

export function useFormContext(formId?: string): FormContext<any, any> {
	const contexts = useContext(Form);
	const context = formId
		? contexts.find((context) => formId === context.formId)
		: contexts[0];

	if (!context) {
		throw new Error('Form context is not available');
	}

	return context;
}

export function useField<
	FieldShape = any,
	ErrorShape = string[],
	Metadata extends Record<string, unknown> = DefaultFieldMetadata<ErrorShape>,
>(
	name: FieldName<FieldShape>,
	options: {
		formId?: string;
		serialize?: (value: unknown) => string | string[] | undefined;
		customize?: (
			name: string,
			metadata: DefaultFieldMetadata<ErrorShape>,
			context: FormContext<any, ErrorShape>,
		) => Metadata;
	} = {},
): Field<FieldShape, Metadata> {
	const context = useFormContext(options.formId);
	const field = useMemo(
		() =>
			getField(context, {
				name,
				serialize: options.serialize,
				customize: options.customize,
			}),
		[context, name, options.serialize, options.customize],
	);

	return field;
}

export function useFormMetadata<
	ErrorShape = string[],
	FieldMetadata extends Record<
		string,
		unknown
	> = DefaultFieldMetadata<ErrorShape>,
>(
	options: {
		formId?: string;
		serialize?: (value: unknown) => string | string[] | undefined;
		customize?: (
			name: string,
			metadata: DefaultFieldMetadata<ErrorShape>,
			context: FormContext<any, ErrorShape>,
		) => FieldMetadata;
	} = {},
): FormMetadata<ErrorShape, FieldMetadata> {
	const context = useFormContext(options.formId);
	const formMetadata = useMemo(
		() =>
			getFormMetadata(context, {
				serialize: options.serialize,
				customize: options.customize,
			}),
		[context, options.serialize, options.customize],
	);

	return formMetadata;
}
