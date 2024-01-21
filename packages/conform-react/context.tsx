import {
	type Constraint,
	type FormId,
	type FieldName,
	type FormContext,
	type FormValue,
	type FormState,
	type Intent,
	type SubscriptionScope,
	type SubscriptionSubject,
	type UnionKeyof,
	type UnionKeyType,
	formatPaths,
	getPaths,
	isPrefix,
	STATE,
} from '@conform-to/dom';
import {
	type ReactElement,
	type ReactNode,
	type MutableRefObject,
	createContext,
	useMemo,
	useCallback,
	useContext,
	useSyncExternalStore,
	useRef,
} from 'react';

export type Pretty<T> = { [K in keyof T]: T[K] } & {};

export type Primitive =
	| string
	| number
	| boolean
	| Date
	| File
	| null
	| undefined;

export type Metadata<
	Schema,
	FormError,
	FormSchema extends Record<string, unknown>,
> = {
	key: string | undefined;
	id: string;
	errorId: string;
	descriptionId: string;
	name: FieldName<Schema, FormError, FormSchema>;
	initialValue: FormValue<Schema>;
	value: FormValue<Schema>;
	errors: FormError | undefined;
	allErrors: Record<string, FormError>;
	valid: boolean;
	dirty: boolean;
};

export type FormMetadata<
	Schema extends Record<string, unknown> = Record<string, unknown>,
	FormError = string[],
> = Omit<Metadata<Schema, FormError, Schema>, 'id'> &
	Pick<FormContext<Schema, FormError>, Intent['type']> & {
		id: FormId<Schema, FormError>;
		context: Wrapped<FormContext<Schema, FormError>>;
		status?: 'success' | 'error';
		getFieldset: () => {
			[Key in UnionKeyof<Schema>]: FieldMetadata<
				UnionKeyType<Schema, Key>,
				FormError,
				Schema
			>;
		};
		onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
		noValidate: boolean;
	};

export type FieldMetadata<
	Schema = unknown,
	FormError = string[],
	FormSchema extends Record<string, any> = Record<string, unknown>,
> = Metadata<Schema, FormError, FormSchema> & {
	formId: FormId<FormSchema, FormError>;
	constraint?: Constraint;
	getFieldset: unknown extends Schema
		? () => unknown
		: Schema extends Primitive | Array<any>
		? never
		: () => {
				[Key in UnionKeyof<Schema>]: FieldMetadata<
					UnionKeyType<Schema, Key>,
					FormError
				>;
		  };
	getFieldList: unknown extends Schema
		? () => unknown
		: Schema extends Array<infer Item>
		? () => Array<FieldMetadata<Item, FormError>>
		: never;
};

export const Form = createContext<FormContext[]>([]);

// To hide the FormContext type from the public API
const wrappedSymbol = Symbol('wrapped');

export type Wrapped<Type> = {
	[wrappedSymbol]: Type;
};

export function getWrappedFormContext(
	context: Wrapped<FormContext>,
): FormContext {
	return context[wrappedSymbol];
}

export function useFormContext<Schema extends Record<string, any>, FormError>(
	formId?: FormId<Schema, FormError>,
): FormContext<Schema, FormError, unknown> {
	const contexts = useContext(Form);
	const form = formId
		? contexts.find((context) => context.formId === formId)
		: contexts[0];

	if (!form) {
		throw new Error('Form context is not available');
	}

	return form as unknown as FormContext<Schema, FormError, unknown>;
}

export function useFormState<FormError>(
	form: FormContext<any, FormError>,
	subjectRef?: MutableRefObject<SubscriptionSubject>,
): FormState<FormError> {
	const subscribe = useCallback(
		(callback: () => void) =>
			form.subscribe(callback, () => subjectRef?.current),
		[form, subjectRef],
	);

	return useSyncExternalStore(subscribe, form.getState, form.getState);
}

export function FormProvider(props: {
	context: Wrapped<FormContext<any, any, any>>;
	children: ReactNode;
}): ReactElement {
	const forms = useContext(Form);
	const context = getWrappedFormContext(props.context);
	const value = useMemo(
		() => [context].concat(forms), // Put the latest form context first
		[forms, context],
	);

	return <Form.Provider value={value}>{props.children}</Form.Provider>;
}

export function FormStateInput(props: { formId?: string }): React.ReactElement {
	const context = useFormContext(props.formId);

	return (
		<input
			type="hidden"
			name={STATE}
			value={context.getSerializedState()}
			form={props.formId}
		/>
	);
}

export function useSubjectRef(
	initialSubject: SubscriptionSubject = {},
): MutableRefObject<SubscriptionSubject> {
	const subjectRef = useRef(initialSubject);

	// Reset the subject everytime the component is rerendered
	// This let us subscribe to data used in the last render only
	subjectRef.current = initialSubject;

	return subjectRef;
}

export function updateSubjectRef(
	ref: MutableRefObject<SubscriptionSubject>,
	name: string,
	subject: keyof SubscriptionSubject,
	scope: keyof SubscriptionScope,
): void {
	if (subject === 'status') {
		ref.current[subject] = true;
	} else {
		ref.current[subject] = {
			...ref.current[subject],
			[scope]: (ref.current[subject]?.[scope] ?? []).concat(name),
		};
	}
}

export function getMetadata<
	Schema,
	FormError,
	FormSchema extends Record<string, any>,
>(
	formId: FormId<FormSchema, FormError>,
	state: FormState<FormError>,
	subjectRef: MutableRefObject<SubscriptionSubject>,
	name: FieldName<Schema, FormError, FormSchema> = '',
): Metadata<Schema, FormError, FormSchema> {
	const id = name ? `${formId}-${name}` : formId;

	return new Proxy(
		{
			id,
			name,
			errorId: `${id}-error`,
			descriptionId: `${id}-description`,
			initialValue: state.initialValue[name] as FormValue<Schema>,
			value: state.value[name] as FormValue<Schema>,
			errors: state.error[name],
			get key() {
				return state.key[name];
			},
			get valid() {
				return state.valid[name] as boolean;
			},
			get dirty() {
				return state.dirty[name] as boolean;
			},
			get allErrors() {
				if (name === '') {
					return state.error;
				}

				const result: Record<string, FormError> = {};

				for (const [key, error] of Object.entries(state.error)) {
					if (isPrefix(key, name)) {
						result[key] = error;
					}
				}

				return result;
			},
			get getFieldset() {
				return () =>
					new Proxy({} as any, {
						get(target, key, receiver) {
							if (typeof key === 'string') {
								return getFieldMetadata(formId, state, subjectRef, name, key);
							}

							return Reflect.get(target, key, receiver);
						},
					});
			},
		},
		{
			get(target, key, receiver) {
				switch (key) {
					case 'key':
					case 'initialValue':
					case 'value':
					case 'valid':
					case 'dirty':
						updateSubjectRef(subjectRef, name, key, 'name');
						break;
					case 'errors':
					case 'allErrors':
						updateSubjectRef(
							subjectRef,
							name,
							'error',
							key === 'errors' ? 'name' : 'prefix',
						);
						break;
				}

				return Reflect.get(target, key, receiver);
			},
		},
	);
}

export function getFieldMetadata<
	Schema,
	FormError,
	FormSchema extends Record<string, any>,
>(
	formId: FormId<FormSchema, FormError>,
	state: FormState<FormError>,
	subjectRef: MutableRefObject<SubscriptionSubject>,
	prefix = '',
	key?: string | number,
): FieldMetadata<Schema, FormError, FormSchema> {
	const name =
		typeof key === 'undefined'
			? prefix
			: formatPaths([...getPaths(prefix), key]);
	const metadata = getMetadata(formId, state, subjectRef, name);

	return new Proxy({} as any, {
		get(_, key, receiver) {
			switch (key) {
				case 'formId':
					return formId;
				case 'constraint':
					return state.constraint[name];
				case 'getFieldList': {
					return () => {
						const initialValue = state.initialValue[name] ?? [];

						updateSubjectRef(subjectRef, name, 'initialValue', 'name');

						if (!Array.isArray(initialValue)) {
							throw new Error(
								'The initial value at the given name is not a list',
							);
						}

						return Array(initialValue.length)
							.fill(0)
							.map((_, index) =>
								getFieldMetadata(formId, state, subjectRef, name, index),
							);
					};
				}
			}

			return Reflect.get(metadata, key, receiver);
		},
	});
}

export function getFormMetadata<
	Schema extends Record<string, any>,
	FormError = string[],
>(
	formId: FormId<Schema, FormError>,
	state: FormState<FormError>,
	subjectRef: MutableRefObject<SubscriptionSubject>,
	context: FormContext<Schema, FormError, any>,
	noValidate: boolean,
): FormMetadata<Schema, FormError> {
	const metadata = getMetadata(formId, state, subjectRef);

	return new Proxy({} as any, {
		get(_, key, receiver) {
			switch (key) {
				case 'context':
					return {
						[wrappedSymbol]: context,
					};
				case 'status':
					return state.submissionStatus;
				case 'validate':
				case 'update':
				case 'reset':
				case 'insert':
				case 'remove':
				case 'reorder':
					return context[key];
				case 'onSubmit':
					return (event: React.FormEvent<HTMLFormElement>) => {
						const submitEvent = event.nativeEvent as SubmitEvent;
						const submission = context.submit(submitEvent);

						if (
							submission &&
							submission.status !== 'success' &&
							submission.error !== null
						) {
							event.preventDefault();
						}
					};
				case 'noValidate':
					return noValidate;
			}

			return Reflect.get(metadata, key, receiver);
		},
	});
}
