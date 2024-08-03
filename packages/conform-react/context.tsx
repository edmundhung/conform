import {
	type Constraint,
	type Combine,
	type FormId,
	type FieldName,
	type FormContext as BaseFormContext,
	type FormValue,
	type FormState,
	type Intent,
	type SubscriptionScope,
	type SubscriptionSubject,
	type FormOptions as BaseFormOptions,
	unstable_createFormContext as createBaseFormContext,
	formatPaths,
	getPaths,
	isPrefix,
	STATE,
	INTENT,
} from '@conform-to/dom';
import {
	type FormEvent,
	type ReactElement,
	type ReactNode,
	type MutableRefObject,
	createContext,
	useMemo,
	useCallback,
	useContext,
	useSyncExternalStore,
	useRef,
	useEffect,
} from 'react';

export type Pretty<T> = { [K in keyof T]: T[K] } & {};

export type Primitive =
	| string
	| number
	| bigint
	| boolean
	| Date
	| File
	| null
	| undefined;

export type Metadata<
	Schema,
	FormSchema extends Record<string, unknown>,
	FormError = string[],
> = {
	key: string | undefined;
	id: string;
	errorId: string;
	descriptionId: string;
	name: FieldName<Schema, FormSchema, FormError>;
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
> = Omit<Metadata<Schema, Schema, FormError>, 'id'> &
	Pick<FormContext<Schema, FormError>, Intent['type']> & {
		id: FormId<Schema, FormError>;
		context: Wrapped<FormContext<Schema, FormError>>;
		status?: 'success' | 'error';
		getFieldset: () => Required<{
			[Key in keyof Combine<Schema>]: FieldMetadata<
				Combine<Schema>[Key],
				Schema,
				FormError
			>;
		}>;
		onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
		noValidate: boolean;
	};

type SubfieldMetadata<
	Schema,
	FormSchema extends Record<string, any>,
	FormError,
> = [Schema] extends [Primitive]
	? {}
	: [Schema] extends [Array<infer Item> | null | undefined]
		? {
				getFieldList: () => Array<FieldMetadata<Item, FormSchema, FormError>>;
			}
		: [Schema] extends [Record<string, any> | null | undefined]
			? {
					getFieldset: () => Required<{
						[Key in keyof Combine<Schema>]: FieldMetadata<
							Combine<Schema>[Key],
							FormSchema,
							FormError
						>;
					}>;
				}
			: {};

export type FieldMetadata<
	Schema = unknown,
	FormSchema extends Record<string, any> = Record<string, unknown>,
	FormError = string[],
> = Metadata<Schema, FormSchema, FormError> &
	Constraint & { formId: FormId<FormSchema, FormError> } & SubfieldMetadata<
		Schema,
		FormSchema,
		FormError
	>;

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
		? contexts.find((context) => formId === context.getFormId())
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

	const state = useSyncExternalStore(subscribe, form.getState, form.getState);

	useEffect(() => {
		const formId = form.getFormId();
		const formElement = document.forms.namedItem(formId);
		const scope = subjectRef?.current.key;

		if (!formElement || !scope) {
			return;
		}

		const getAll = (value: unknown) => {
			if (typeof value === 'string') {
				return [value];
			}

			if (
				Array.isArray(value) &&
				value.every((item) => typeof item === 'string')
			) {
				return value;
			}

			return undefined;
		};
		const get = (value: unknown) => getAll(value)?.[0];

		for (const element of formElement.elements) {
			if (
				(element instanceof HTMLInputElement ||
					element instanceof HTMLTextAreaElement ||
					element instanceof HTMLSelectElement) &&
				scope.name?.includes(element.name)
			) {
				const prev = element.dataset.conform;
				const next = state.key[element.name];
				const defaultValue = state.initialValue[element.name];

				if (typeof prev === 'undefined' || prev !== next) {
					element.dataset.conform = next;

					if ('options' in element) {
						const value = getAll(defaultValue) ?? [];

						for (const option of element.options) {
							option.selected = value.includes(option.value);
						}
					} else if (
						'checked' in element &&
						(element.type === 'checkbox' || element.type === 'radio')
					) {
						element.checked = get(defaultValue) === element.value;
					} else {
						element.value = get(defaultValue) ?? '';
					}
				}
			}
		}
	}, [form, state, subjectRef]);

	return state;
}

export function FormProvider(props: {
	context: Wrapped<FormContext<any, any>>;
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
	subject: 'status' | 'formId',
): void;
export function updateSubjectRef(
	ref: MutableRefObject<SubscriptionSubject>,
	subject: Exclude<keyof SubscriptionSubject, 'status' | 'formId'>,
	scope: keyof SubscriptionScope,
	name: string,
): void;
export function updateSubjectRef(
	ref: MutableRefObject<SubscriptionSubject>,
	subject: keyof SubscriptionSubject,
	scope?: keyof SubscriptionScope,
	name?: string,
): void {
	if (subject === 'status' || subject === 'formId') {
		ref.current[subject] = true;
	} else if (typeof scope !== 'undefined' && typeof name !== 'undefined') {
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
	context: FormContext<FormSchema, FormError, any>,
	subjectRef: MutableRefObject<SubscriptionSubject>,
	stateSnapshot: FormState<FormError>,
	name: FieldName<Schema, FormSchema, FormError> = '',
): Metadata<Schema, FormSchema, FormError> {
	const id = name ? `${context.getFormId()}-${name}` : context.getFormId();
	const state = context.getState();

	return new Proxy(
		{
			id,
			name,
			errorId: `${id}-error`,
			descriptionId: `${id}-description`,
			get initialValue() {
				return state.initialValue[name] as FormValue<Schema>;
			},
			get value() {
				return state.value[name] as FormValue<Schema>;
			},
			get errors() {
				return state.error[name];
			},
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
								return getFieldMetadata(
									context,
									subjectRef,
									stateSnapshot,
									name,
									key,
								);
							}

							return Reflect.get(target, key, receiver);
						},
					});
			},
		},
		{
			get(target, key, receiver) {
				// We want to minize re-render by identifying whether the field is used in a callback only
				// but there is no clear way to know if it is accessed during render or not
				// if the stateSnapshot is not the latest, then it must be accessed in a callback
				if (state === stateSnapshot) {
					switch (key) {
						case 'id':
						case 'errorId':
						case 'descriptionId':
							updateSubjectRef(subjectRef, 'formId');
							break;
						case 'key':
						case 'initialValue':
						case 'value':
						case 'valid':
						case 'dirty': {
							if (key === 'initialValue') {
								// If `initialValue` is subscribed, it's likely that we will want the field to be updated
								updateSubjectRef(subjectRef, 'key', 'name', name);
							}
							updateSubjectRef(subjectRef, key, 'name', name);
							break;
						}
						case 'errors':
						case 'allErrors':
							updateSubjectRef(
								subjectRef,
								'error',
								key === 'errors' ? 'name' : 'prefix',
								name,
							);
							break;
					}
				}

				return Reflect.get(target, key, receiver);
			},
		},
	);
}

export function getFieldMetadata<
	Schema,
	FormSchema extends Record<string, any>,
	FormError,
>(
	context: FormContext<FormSchema, FormError, any>,
	subjectRef: MutableRefObject<SubscriptionSubject>,
	stateSnapshot: FormState<FormError>,
	prefix = '',
	key?: string | number,
): FieldMetadata<Schema, FormSchema, FormError> {
	const name =
		typeof key === 'undefined'
			? prefix
			: formatPaths([...getPaths(prefix), key]);

	return new Proxy({} as any, {
		get(_, key, receiver) {
			const metadata = getMetadata(context, subjectRef, stateSnapshot, name);
			const state = context.getState();

			switch (key) {
				case 'formId':
					if (state === stateSnapshot) {
						updateSubjectRef(subjectRef, 'formId');
					}
					return context.getFormId();
				case 'required':
				case 'minLength':
				case 'maxLength':
				case 'min':
				case 'max':
				case 'pattern':
				case 'step':
				case 'multiple':
					return state.constraint[name]?.[key];
				case 'getFieldList': {
					return () => {
						const initialValue = state.initialValue[name] ?? [];

						if (state === stateSnapshot) {
							updateSubjectRef(subjectRef, 'initialValue', 'name', name);
						}

						if (!Array.isArray(initialValue)) {
							throw new Error(
								'The initial value at the given name is not a list',
							);
						}

						return Array(initialValue.length)
							.fill(0)
							.map((_, index) =>
								getFieldMetadata(
									context,
									subjectRef,
									stateSnapshot,
									name,
									index,
								),
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
	FormValue = Schema,
>(
	context: FormContext<Schema, FormError, FormValue>,
	subjectRef: MutableRefObject<SubscriptionSubject>,
	stateSnapshot: FormState<FormError>,
	noValidate: boolean,
): FormMetadata<Schema, FormError> {
	return new Proxy({} as any, {
		get(_, key, receiver) {
			const metadata = getMetadata(context, subjectRef, stateSnapshot);
			const state = context.getState();

			switch (key) {
				case 'context':
					return {
						[wrappedSymbol]: context,
					};
				case 'status':
					if (state === stateSnapshot) {
						updateSubjectRef(subjectRef, 'status');
					}
					return state.submissionStatus;
				case 'validate':
				case 'update':
				case 'reset':
				case 'insert':
				case 'remove':
				case 'reorder':
					return context[key];
				case 'onSubmit':
					return context.submit;
				case 'noValidate':
					return noValidate;
			}

			return Reflect.get(metadata, key, receiver);
		},
	});
}

export type FormOptions<
	Schema extends Record<string, any> = any,
	FormError = string[],
	FormValue = Schema,
> = BaseFormOptions<Schema, FormError, FormValue> & {
	/**
	 * A function to be called before the form is submitted.
	 */
	onSubmit?: (
		event: FormEvent<HTMLFormElement>,
		context: ReturnType<
			BaseFormContext<Schema, FormError, FormValue>['submit']
		>,
	) => void;
};

export type FormContext<
	Schema extends Record<string, any> = any,
	FormError = string[],
	FormValue = Schema,
> = Omit<
	BaseFormContext<Schema, FormError, FormValue>,
	'submit' | 'onUpdate'
> & {
	submit: (event: FormEvent<HTMLFormElement>) => void;
	onUpdate: (
		options: Partial<FormOptions<Schema, FormError, FormValue>>,
	) => void;
};

export function createFormContext<
	Schema extends Record<string, any> = any,
	FormError = string[],
	FormValue = Schema,
>(
	options: FormOptions<Schema, FormError, FormValue>,
): FormContext<Schema, FormError, FormValue> {
	let { onSubmit } = options;
	const context = createBaseFormContext(options);

	return {
		...context,
		submit(event) {
			const submitEvent = event.nativeEvent as SubmitEvent;
			const result = context.submit(submitEvent);

			if (
				!result.submission ||
				result.submission.status === 'success' ||
				result.submission.error === null
			) {
				if (!result.formData.has(INTENT)) {
					onSubmit?.(event, result);
				}
			} else {
				event.preventDefault();
			}
		},
		onUpdate(options) {
			onSubmit = options.onSubmit;
			context.onUpdate(options);
		},
	};
}
