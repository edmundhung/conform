import {
	type Constraint,
	type FormId,
	type FieldName,
	type Form,
	type FormValue,
	type FormState,
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

export type FieldProps<
	FieldSchema = unknown,
	Error = unknown,
	FormSchema extends Record<string, unknown> = Record<string, unknown>,
> = {
	name: FieldName<FieldSchema>;
	formId: FormId<FormSchema, Error>;
};

export type Metadata<Schema, Error> = {
	key?: string;
	id: string;
	errorId: string;
	descriptionId: string;
	initialValue: FormValue<Schema>;
	value: FormValue<Schema>;
	error: Error | undefined;
	allError: Record<string, Error>;
	allValid: boolean;
	valid: boolean;
	dirty: boolean;
};

export type FormMetadata<
	Schema extends Record<string, unknown> = Record<string, unknown>,
	Error = unknown,
> = Omit<Metadata<Schema, Error>, 'id'> & {
	id: FormId<Schema, Error>;
	context: Form<Schema, Error>;
	getFieldset: () => {
		[Key in UnionKeyof<Schema>]: FieldMetadata<
			UnionKeyType<Schema, Key>,
			Error,
			Schema
		>;
	};
	onSubmit: (
		event: React.FormEvent<HTMLFormElement>,
	) => ReturnType<Form<Schema>['submit']>;
	onReset: (event: React.FormEvent<HTMLFormElement>) => void;
	noValidate: boolean;
};

export type FieldMetadata<
	Schema = unknown,
	Error = unknown,
	FormSchema extends Record<string, any> = Record<string, unknown>,
> = Metadata<Schema, Error> & {
	formId: FormId<FormSchema, Error>;
	name: FieldName<Schema>;
	constraint?: Constraint;
	getFieldset: unknown extends Schema
		? () => unknown
		: Schema extends Primitive | Array<any>
		? never
		: () => {
				[Key in UnionKeyof<Schema>]: FieldMetadata<
					UnionKeyType<Schema, Key>,
					Error
				>;
		  };
	getFieldList: unknown extends Schema
		? () => unknown
		: Schema extends Array<infer Item>
		? () => Array<FieldMetadata<Item, Error>>
		: never;
};

export const Registry = createContext<Record<string, Form>>({});

export function useRegistry<
	Schema extends Record<string, any>,
	Error,
	Value = Schema,
>(
	formId: FormId<Schema, Error>,
	context?: Form<Schema, Error, Value>,
): Form<Schema, Error, Value> {
	const registry = useContext(Registry);
	const form = context ?? registry[formId];

	if (!form) {
		throw new Error('Form context is not available');
	}

	return form as Form<Schema, Error, Value>;
}

export function useFormState<Error>(
	form: Form<any, Error>,
	subjectRef?: MutableRefObject<SubscriptionSubject>,
): FormState<Error> {
	const subscribe = useCallback(
		(callback: () => void) =>
			form.subscribe(callback, () => subjectRef?.current),
		[form, subjectRef],
	);

	return useSyncExternalStore(subscribe, form.getState, form.getState);
}

export function FormProvider(props: {
	context: Form<any, any, any>;
	children: ReactNode;
}): ReactElement {
	const registry = useContext(Registry);
	const value = useMemo(
		() => ({ ...registry, [props.context.id]: props.context }),
		[registry, props.context],
	);

	return <Registry.Provider value={value}>{props.children}</Registry.Provider>;
}

export function FormStateInput(
	props:
		| {
				formId: string;
				context?: undefined;
		  }
		| {
				formId?: undefined;
				context: Form;
		  },
): React.ReactElement {
	const form = useRegistry(props.formId ?? props.context.id, props.context);

	return (
		<input
			type="hidden"
			name={STATE}
			value={form.getSerializedState()}
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
	ref.current[subject] = {
		...ref.current[subject],
		[scope]: (ref.current[subject]?.[scope] ?? []).concat(name),
	};
}

export function getMetadata<
	Schema,
	Error,
	FormSchema extends Record<string, any>,
>(
	formId: FormId<FormSchema, Error>,
	state: FormState<Error>,
	subjectRef: MutableRefObject<SubscriptionSubject>,
	name: FieldName<Schema> = '',
): Metadata<Schema, Error> {
	const id = name ? `${formId}-${name}` : formId;

	return new Proxy(
		{
			id,
			errorId: `${id}-error`,
			descriptionId: `${id}-description`,
			initialValue: state.initialValue[name] as FormValue<Schema>,
			value: state.value[name] as FormValue<Schema>,
			error: state.error[name],
			get key() {
				return state.key[name];
			},
			get valid() {
				return state.valid[name] as boolean;
			},
			get dirty() {
				return state.dirty[name] as boolean;
			},
			get allValid() {
				const keys = Object.keys(state.error);

				if (name === '') {
					return keys.length === 0;
				}

				for (const key of Object.keys(state.error)) {
					if (isPrefix(key, name) && !state.valid[key]) {
						return false;
					}
				}

				return true;
			},
			get allError() {
				if (name === '') {
					return state.error;
				}

				const result: Record<string, Error> = {};

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
					case 'error':
					case 'initialValue':
					case 'value':
					case 'valid':
					case 'dirty':
						updateSubjectRef(subjectRef, name, key, 'name');
						break;
					case 'allError':
						updateSubjectRef(subjectRef, name, 'error', 'prefix');
						break;
					case 'allValid':
						updateSubjectRef(subjectRef, name, 'valid', 'prefix');
						break;
				}

				return Reflect.get(target, key, receiver);
			},
		},
	);
}

export function getFieldMetadata<
	Schema,
	Error,
	FormSchema extends Record<string, any>,
>(
	formId: FormId<FormSchema, Error>,
	state: FormState<Error>,
	subjectRef: MutableRefObject<SubscriptionSubject>,
	prefix: string,
	key?: string | number,
): FieldMetadata<Schema, Error, FormSchema> {
	const name =
		typeof key !== 'undefined'
			? formatPaths([...getPaths(prefix), key])
			: prefix;
	const metadata = getMetadata(formId, state, subjectRef, name);

	return new Proxy(metadata as any, {
		get(target, key, receiver) {
			switch (key) {
				case 'formId':
					return formId;
				case 'name':
					return name;
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

			return Reflect.get(target, key, receiver);
		},
	});
}

export function getFormMetadata<Schema extends Record<string, any>, Error>(
	formId: FormId<Schema, Error>,
	state: FormState<Error>,
	subjectRef: MutableRefObject<SubscriptionSubject>,
	form: Form<Schema, Error, any>,
	noValidate: boolean,
): FormMetadata<Schema, Error> {
	const metadata = getMetadata(formId, state, subjectRef);

	return new Proxy(metadata as any, {
		get(target, key, receiver) {
			switch (key) {
				case 'context':
					return form;
				case 'onSubmit':
					return (event: React.FormEvent<HTMLFormElement>) => {
						const submitEvent = event.nativeEvent as SubmitEvent;

						form.submit(submitEvent);

						if (submitEvent.defaultPrevented) {
							event.preventDefault();
						}
					};
				case 'noValidate':
					return noValidate;
			}

			return Reflect.get(target, key, receiver);
		},
	});
}
