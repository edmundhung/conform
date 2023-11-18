import {
	type Constraint,
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

export type BaseMetadata<Schema> = {
	key?: string;
	id: string;
	errorId: string;
	descriptionId: string;
	initialValue: FormValue<Schema>;
	value: FormValue<Schema>;
	errors: string[] | undefined;
	allErrors: Record<string, string[]>;
	allValid: boolean;
	valid: boolean;
	dirty: boolean;
};

export type Field<Schema> = {
	name: FieldName<Schema>;
	formId: string;
};

export type FormMetadata<Schema extends Record<string, any>> =
	BaseMetadata<Schema> & {
		onSubmit: (
			event: React.FormEvent<HTMLFormElement>,
		) => ReturnType<Form<Schema>['submit']>;
		onReset: (event: React.FormEvent<HTMLFormElement>) => void;
		noValidate: boolean;
	};

export type FieldsetMetadata<Schema> = Schema extends Array<any>
	? { [Key in keyof Schema]: FieldMetadata<Schema[Key]> }
	: Schema extends { [key in string]?: any }
	? { [Key in UnionKeyof<Schema>]: FieldMetadata<UnionKeyType<Schema, Key>> }
	: Record<string | number, FieldMetadata<any>>;

export type FieldMetadata<Schema> = BaseMetadata<Schema> & {
	formId: string;
	name: FieldName<Schema>;
	constraint?: Constraint;
};

export const Registry = createContext<Record<string, Form>>({});

export function useRegistry(formId: string, context?: Form): Form {
	const registry = useContext(Registry);
	const form = context ?? registry[formId];

	if (!form) {
		throw new Error('Form context is not available');
	}

	return form;
}

export function useFormState(
	form: Form,
	subjectRef?: MutableRefObject<SubscriptionSubject>,
): FormState {
	const subscribe = useCallback(
		(callback: () => void) =>
			form.subscribe(callback, () => subjectRef?.current),
		[form, subjectRef],
	);
	const result = useSyncExternalStore(subscribe, form.getState, form.getState);

	return result;
}

export function FormProvider(props: {
	context: Form;
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

export function getBaseMetadata<Schema>(
	formId: string,
	state: FormState,
	options: {
		name?: string;
		subjectRef: MutableRefObject<SubscriptionSubject>;
	},
): BaseMetadata<Schema> {
	const name = options.name ?? '';
	const id = name ? `${formId}-${name}` : formId;
	const updateSubject = (
		subject: keyof SubscriptionSubject,
		scope: keyof SubscriptionScope,
	) => {
		options.subjectRef.current[subject] = {
			...options.subjectRef.current[subject],
			[scope]: (options.subjectRef.current[subject]?.[scope] ?? []).concat(
				name,
			),
		};
	};

	return new Proxy(
		{
			id,
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
			get allErrors() {
				if (name === '') {
					return state.error;
				}

				const result: Record<string, string[]> = {};

				for (const [key, errors] of Object.entries(state.error)) {
					if (isPrefix(key, name)) {
						result[key] = errors;
					}
				}

				return result;
			},
		},
		{
			get(target, key, receiver) {
				switch (key) {
					case 'key':
					case 'errors':
					case 'initialValue':
					case 'value':
					case 'valid':
					case 'dirty':
						updateSubject(key === 'errors' ? 'error' : key, 'name');
						break;
					case 'allErrors':
						updateSubject('error', 'prefix');
						break;
					case 'allValid':
						updateSubject('valid', 'prefix');
						break;
				}

				return Reflect.get(target, key, receiver);
			},
		},
	);
}

export function getFieldMetadata<Schema>(
	formId: string,
	state: FormState,
	options: {
		name?: string;
		key?: string | number;
		subjectRef: MutableRefObject<SubscriptionSubject>;
	},
): FieldMetadata<Schema> {
	const name =
		typeof options.key !== 'undefined'
			? formatPaths([...getPaths(options.name ?? ''), options.key])
			: options.name ?? '';
	const metadata = getBaseMetadata(formId, state, {
		subjectRef: options.subjectRef,
		name,
	});

	return new Proxy(metadata as any, {
		get(target, key, receiver) {
			switch (key) {
				case 'formId':
					return formId;
				case 'name':
					return name;
				case 'constraint':
					return state.constraint[name];
			}

			return Reflect.get(target, key, receiver);
		},
	});
}

export function getFormMetadata<Schema extends Record<string, any>>(
	formId: string,
	state: FormState,
	options: {
		subjectRef: MutableRefObject<SubscriptionSubject>;
		form: Form<Schema>;
		noValidate: boolean;
	},
): FormMetadata<Schema> {
	const metadata = getBaseMetadata(formId, state, {
		subjectRef: options.subjectRef,
	});

	return new Proxy(metadata as any, {
		get(target, key, receiver) {
			switch (key) {
				case 'onSubmit':
					return (event: React.FormEvent<HTMLFormElement>) => {
						const submitEvent = event.nativeEvent as SubmitEvent;
						const result = options.form.submit(submitEvent);

						if (submitEvent.defaultPrevented) {
							event.preventDefault();
						}

						return result;
					};
				case 'onReset':
					return (event: React.FormEvent<HTMLFormElement>) =>
						options.form.reset(event.nativeEvent);
				case 'noValidate':
					return options.noValidate;
			}

			return Reflect.get(target, key, receiver);
		},
	});
}

export function getFieldsetMetadata<Schema>(
	formId: string,
	state: FormState,
	options: {
		subjectRef: MutableRefObject<SubscriptionSubject>;
		name?: FieldName<Schema>;
	},
): Pretty<FieldsetMetadata<Schema>> {
	return new Proxy({} as any, {
		get(target, prop, receiver) {
			const getMetadata = (key: string | number) =>
				getFieldMetadata(formId, state, {
					subjectRef: options.subjectRef,
					name: options.name,
					key: key,
				});

			if (typeof prop === 'string') {
				const index = Number(prop);

				return getMetadata(Number.isNaN(index) ? prop : index);
			}

			return Reflect.get(target, prop, receiver);
		},
	});
}
