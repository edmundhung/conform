import {
	type Constraint,
	type DefaultValue,
	type FieldName,
	type Form,
	type FormContext,
	type SubscriptionScope,
	type SubscriptionSubject,
	formatPaths,
	getPaths,
	isSubpath,
	STATE,
} from '@conform-to/dom';
import {
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

export type BaseMetadata<Type> = {
	key?: string;
	id: string;
	errorId: string;
	descriptionId: string;
	defaultValue: DefaultValue<Type>;
	value: DefaultValue<Type>;
	error: string[] | undefined;
	allError: Record<string, string[]>;
	allValid: boolean;
	valid: boolean;
	dirty: boolean;
};

export type Field<Type> = {
	name: FieldName<Type>;
	formId: string;
};

export type FormMetadata<Type extends Record<string, any>> = BaseMetadata<Type>;

export type FieldMetadata<Type> = BaseMetadata<Type> & {
	formId: string;
	name: FieldName<Type>;
	constraint?: Constraint;
};

export const Context = createContext<Record<string, Form>>({});

export function useContextForm(formId: string, context?: Form) {
	const registry = useContext(Context);
	const form = context ?? registry[formId];

	if (!form) {
		throw new Error('Form context is not available');
	}

	return form;
}

export function useFormContext(
	formId: string,
	context?: Form,
	subjectRef?: MutableRefObject<SubscriptionSubject>,
): FormContext {
	const form = useContextForm(formId, context);
	const subscribe = useCallback(
		(callback: () => void) =>
			form.subscribe(callback, () => subjectRef?.current),
		[form, subjectRef],
	);
	const result = useSyncExternalStore(
		subscribe,
		form.getContext,
		form.getContext,
	);

	return result;
}

export function FormContextProvider(props: {
	context: Form;
	children: ReactNode;
}): ReactNode {
	const context = useContext(Context);
	const value = useMemo(
		() => ({ ...context, [props.context.id]: props.context }),
		[context, props.context],
	);

	return <Context.Provider value={value}>{props.children}</Context.Provider>;
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
	const form = useContextForm(props.formId ?? props.context.id, props.context);

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

export function getBaseMetadata<Type>(
	formId: string,
	context: FormContext,
	options: {
		name?: string;
		subjectRef: MutableRefObject<SubscriptionSubject>;
	},
): BaseMetadata<Type> {
	const name = options.name ?? '';
	const id = name ? `${formId}-${name}` : formId;
	const error = context.error[name];
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
			defaultValue: context.initialValue[name] as DefaultValue<Type>,
			value: context.value[name] as DefaultValue<Type>,
			get key() {
				return context.state.key[name];
			},
			get valid() {
				return context.state.valid[name] as boolean;
			},
			get dirty() {
				return context.state.dirty[name] as boolean;
			},
			get allValid() {
				const keys = Object.keys(context.error);

				if (name === '') {
					return keys.length === 0;
				}

				for (const key of Object.keys(context.error)) {
					if (isSubpath(key, name) && !context.state.valid[key]) {
						return false;
					}
				}

				return true;
			},
			get allError() {
				if (name === '') {
					return context.error;
				}

				const result: Record<string, string[]> = {};

				for (const [key, errors] of Object.entries(context.error)) {
					if (isSubpath(key, name)) {
						result[key] = errors;
					}
				}

				return result;
			},
			error,
		},
		{
			get(target, key, receiver) {
				switch (key) {
					case 'key':
					case 'error':
					case 'defaultValue':
					case 'value':
					case 'valid':
					case 'dirty':
						updateSubject(key, 'name');
						break;
					case 'allError':
						updateSubject('error', 'parent');
						break;
					case 'allValid':
						updateSubject('valid', 'parent');
						break;
				}

				return Reflect.get(target, key, receiver);
			},
		},
	);
}

export function getFieldMetadata<Type>(
	formId: string,
	context: FormContext,
	options: {
		name?: string;
		key?: string | number;
		subjectRef: MutableRefObject<SubscriptionSubject>;
	},
): FieldMetadata<Type> {
	const name =
		typeof options.key !== 'undefined'
			? formatPaths([...getPaths(options.name ?? ''), options.key])
			: options.name ?? '';
	const metadata = getBaseMetadata(formId, context, {
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
					return context.metadata.constraint[name];
			}

			return Reflect.get(target, key, receiver);
		},
	});
}
