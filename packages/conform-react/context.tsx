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

export interface BaseConfig<Type> {
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
}

export type Field<Type> = {
	name: FieldName<Type>;
	formId: string;
};

export interface FieldConfig<Type> extends BaseConfig<Type> {
	key?: string;
	formId: string;
	name: FieldName<Type>;
	constraint: Constraint;
}

export const Context = createContext<Record<string, Form>>({});

export function useFormContext(
	formId: string,
	localContext?: Form | undefined,
	subjectRef?: MutableRefObject<SubscriptionSubject>,
): FormContext {
	const registry = useContext(Context);
	const form = localContext ?? registry[formId];

	if (!form) {
		throw new Error('Form context is not available');
	}

	const subscribe = useCallback(
		(callback: () => void) =>
			form.subscribe(callback, () => subjectRef?.current),
		[form, subjectRef],
	);
	const context = useSyncExternalStore(
		subscribe,
		form.getContext,
		form.getContext,
	);

	return context;
}

export function ConformBoundary(props: { context: Form; children: ReactNode }) {
	const context = useContext(Context);
	const value = useMemo(
		() => ({ ...context, [props.context.id]: props.context }),
		[context, props.context],
	);

	return (
		<Context.Provider value={value}>
			<div
				onInput={(event) => props.context.input(event.nativeEvent)}
				onBlur={(event) => props.context.blur(event.nativeEvent)}
			>
				<FormStateInput formId={props.context.id} />
				{props.children}
			</div>
		</Context.Provider>
	);
}

export function FormStateInput(props: {
	formId: string;
	context?: Form;
}): React.ReactElement {
	const context = useFormContext(props.formId, props.context);

	return (
		<input
			type="hidden"
			name={STATE}
			value={JSON.stringify({
				key: context.state.key,
				validated: context.state.validated,
			})}
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

export function getFieldConfig<Type>(
	formId: string,
	context: FormContext,
	options: {
		name?: string;
		key?: string | number;
		subjectRef: MutableRefObject<SubscriptionSubject>;
	},
): FieldConfig<Type> {
	const name =
		typeof options.key !== 'undefined'
			? formatPaths([...getPaths(options.name ?? ''), options.key])
			: options.name ?? '';
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
			key: context.state.key[name],
			id,
			formId,
			errorId: `${id}-error`,
			descriptionId: `${id}-description`,
			name,
			defaultValue: context.initialValue[name] as DefaultValue<Type>,
			value: context.value[name] as DefaultValue<Type>,
			constraint: context.metadata.constraint[name] ?? {},
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
