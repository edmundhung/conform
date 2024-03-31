import {
	flatten,
	formatPaths,
	getFormData,
	getPaths,
	getValue,
	isPlainObject,
	isPrefix,
	setValue,
	normalize,
	formatName,
} from './formdata';
import {
	type FieldElement,
	isFieldElement,
	getFormAction,
	getFormEncType,
	getFormMethod,
	requestSubmit,
} from './dom';
import { clone, generateId, invariant } from './util';
import {
	type Intent,
	type Submission,
	type SubmissionResult,
	INTENT,
	getSubmissionContext,
	setListState,
	setListValue,
	setState,
	serialize,
	serializeIntent,
	root,
} from './submission';

type BaseCombine<
	T,
	K extends PropertyKey = T extends unknown ? keyof T : never,
> = T extends unknown ? T & Partial<Record<Exclude<K, keyof T>, never>> : never;

export type Combine<T> = {
	[K in keyof BaseCombine<T>]: BaseCombine<T>[K];
};

export type DefaultValue<Schema> = Schema extends
	| string
	| number
	| boolean
	| Date
	| bigint
	| null
	| undefined
	? Schema | string | null | undefined
	: Schema extends File
	? null | undefined
	: Schema extends Array<infer Item>
	? Array<DefaultValue<Item>> | null | undefined
	: Schema extends Record<string, any>
	? { [Key in keyof Schema]?: DefaultValue<Schema[Key]> } | null | undefined
	: string | null | undefined;

export type FormValue<Schema> = Schema extends
	| string
	| number
	| boolean
	| Date
	| bigint
	| null
	| undefined
	? string | undefined
	: Schema extends File
	? File | undefined
	: Schema extends File[]
	? File | Array<File> | undefined
	: Schema extends Array<infer Item>
	? string | Array<FormValue<Item>> | undefined
	: Schema extends Record<string, any>
	? { [Key in keyof Schema]?: FormValue<Schema[Key]> } | null | undefined
	: unknown;

const error = Symbol('error');
const field = Symbol('field');
const form = Symbol('form');

export type FormId<
	Schema extends Record<string, unknown> = Record<string, unknown>,
	Error = string[],
> = string & {
	[error]?: Error;
	[form]?: Schema;
};

export type FieldName<
	FieldSchema,
	FormSchema extends Record<string, unknown> = Record<string, unknown>,
	Error = string[],
> = string & {
	[field]?: FieldSchema;
	[error]?: Error;
	[form]?: FormSchema;
};

export type Constraint = {
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	min?: string | number;
	max?: string | number;
	step?: string | number;
	multiple?: boolean;
	pattern?: string;
};

export type FormMeta<FormError> = {
	submissionStatus?: 'error' | 'success';
	defaultValue: Record<string, unknown>;
	initialValue: Record<string, unknown>;
	value: Record<string, unknown>;
	error: Record<string, FormError>;
	constraint: Record<string, Constraint>;
	key: Record<string, string | undefined>;
	validated: Record<string, boolean>;
};

export type FormState<FormError> = FormMeta<FormError> & {
	valid: Record<string, boolean>;
	dirty: Record<string, boolean>;
};

export type FormOptions<Schema, FormError = string[], FormValue = Schema> = {
	/**
	 * The id of the form.
	 */
	formId: string;

	/**
	 * An object representing the initial value of the form.
	 */
	defaultValue?: DefaultValue<Schema>;

	/**
	 * An object describing the constraint of each field
	 */
	constraint?: Record<string, Constraint>;

	/**
	 * An object describing the result of the last submission
	 */
	lastResult?: SubmissionResult<FormError> | null | undefined;

	/**
	 * Define when conform should start validation.
	 * Support "onSubmit", "onInput", "onBlur".
	 *
	 * @default "onSubmit"
	 */
	shouldValidate?: 'onSubmit' | 'onBlur' | 'onInput';

	/**
	 * Define when conform should revalidate again.
	 * Support "onSubmit", "onInput", "onBlur".
	 *
	 * @default Same as shouldValidate, or "onSubmit" if shouldValidate is not provided.
	 */
	shouldRevalidate?: 'onSubmit' | 'onBlur' | 'onInput';

	/**
	 * Define if conform should considered the field for dirty state.
	 * e.g. Excluding form fields that are not managed by Conform, such as CSRF token
	 */
	shouldDirtyConsider?: (name: string) => boolean;

	/**
	 * A function to be called when the form should be (re)validated.
	 */
	onValidate?: (context: {
		form: HTMLFormElement;
		submitter: HTMLInputElement | HTMLButtonElement | null;
		formData: FormData;
	}) => Submission<Schema, FormError, FormValue>;
};

export type SubscriptionSubject = {
	[key in
		| 'error'
		| 'initialValue'
		| 'value'
		| 'key'
		| 'valid'
		| 'dirty']?: SubscriptionScope;
} & {
	status?: boolean;
};

export type SubscriptionScope = {
	prefix?: string[];
	name?: string[];
};

export type ControlButtonProps = {
	name: string;
	value: string;
	form: string;
	formNoValidate: boolean;
};

export type FormContext<
	Schema extends Record<string, any> = any,
	FormError = string[],
	FormValue = Schema,
> = {
	formId: string;
	submit(event: SubmitEvent): {
		formData: FormData;
		action: ReturnType<typeof getFormAction>;
		encType: ReturnType<typeof getFormEncType>;
		method: ReturnType<typeof getFormMethod>;
		submission?: Submission<Schema, FormError, FormValue>;
	};
	onReset(event: Event): void;
	onInput(event: Event): void;
	onBlur(event: Event): void;
	onUpdate(options: Partial<FormOptions<Schema, FormError, FormValue>>): void;
	observe(): () => void;
	subscribe(
		callback: () => void,
		getSubject?: () => SubscriptionSubject | undefined,
	): () => void;
	getState(): FormState<FormError>;
	getSerializedState(): string;
} & {
	[Type in Intent['type']]: {} extends Extract<
		Intent,
		{ type: Type }
	>['payload']
		? (<FieldSchema = Schema>(
				payload?: Extract<Intent<FieldSchema>, { type: Type }>['payload'],
		  ) => void) & {
				getButtonProps<FieldSchema = Schema>(
					payload?: Extract<Intent<FieldSchema>, { type: Type }>['payload'],
				): ControlButtonProps;
		  }
		: (<FieldSchema = Schema>(
				payload: Extract<Intent<FieldSchema>, { type: Type }>['payload'],
		  ) => void) & {
				getButtonProps<FieldSchema = Schema>(
					payload: Extract<Intent<FieldSchema>, { type: Type }>['payload'],
				): ControlButtonProps;
		  };
};

function createFormMeta<Schema, FormError, FormValue>(
	options: FormOptions<Schema, FormError, FormValue>,
	initialized?: boolean,
): FormMeta<FormError> {
	const lastResult = !initialized ? options.lastResult : undefined;
	const defaultValue = options.defaultValue
		? (serialize(options.defaultValue) as Record<string, unknown>)
		: {};
	const initialValue = lastResult?.initialValue ?? defaultValue;
	const result: FormMeta<FormError> = {
		submissionStatus: lastResult?.status,
		defaultValue,
		initialValue,
		value: initialValue,
		constraint: options.constraint ?? {},
		validated: lastResult?.state?.validated ?? {},
		key: !initialized
			? getDefaultKey(defaultValue)
			: {
					'': generateId(),
					...getDefaultKey(defaultValue),
			  },
		// The `lastResult` should comes from the server which we won't expect the error to be null
		// We can consider adding a warning if it happens
		error: (lastResult?.error as Record<string, FormError>) ?? {},
	};

	handleIntent(result, lastResult?.intent, lastResult?.fields);

	return result;
}

function getDefaultKey(
	defaultValue: Record<string, unknown> | Array<unknown>,
	prefix?: string,
): Record<string, string> {
	return Object.entries(flatten(defaultValue, { prefix })).reduce<
		Record<string, string>
	>((result, [key, value]) => {
		if (Array.isArray(value)) {
			for (let i = 0; i < value.length; i++) {
				result[formatName(key, i)] = generateId();
			}
		}

		return result;
	}, {});
}

function setFieldsValidated<Error>(
	meta: FormMeta<Error>,
	fields: string[] | undefined,
): void {
	for (const name of Object.keys(meta.error).concat(fields ?? [])) {
		meta.validated[name] = true;
	}
}

function handleIntent<Error>(
	meta: FormMeta<Error>,
	intent: Intent | undefined,
	fields: string[] | undefined,
	initialized?: boolean,
): void {
	if (!intent) {
		setFieldsValidated(meta, fields);
		return;
	}

	switch (intent.type) {
		case 'validate': {
			if (intent.payload.name) {
				meta.validated[intent.payload.name] = true;
			} else {
				setFieldsValidated(meta, fields);
			}
			break;
		}
		case 'update': {
			const { validated, value } = intent.payload;
			const name = formatName(intent.payload.name, intent.payload.index);

			if (typeof value !== 'undefined') {
				updateValue(meta, name ?? '', serialize(value));
			}

			if (typeof validated !== 'undefined') {
				// Clean up previous validated state
				if (name) {
					setState(meta.validated, name, () => undefined);
				} else {
					meta.validated = {};
				}

				if (validated) {
					if (isPlainObject(value) || Array.isArray(value)) {
						Object.assign(
							meta.validated,
							flatten(value, {
								resolve() {
									return true;
								},
								prefix: name,
							}),
						);
					}

					meta.validated[name ?? ''] = true;
				} else if (name) {
					delete meta.validated[name];
				}
			}
			break;
		}
		case 'reset': {
			const name = formatName(intent.payload.name, intent.payload.index);
			const value = getValue(meta.defaultValue, name);

			updateValue(meta, name, value);

			if (name) {
				setState(meta.validated, name, () => undefined);
				delete meta.validated[name];
			} else {
				meta.validated = {};
			}
			break;
		}
		case 'insert':
		case 'remove':
		case 'reorder': {
			if (initialized) {
				meta.initialValue = clone(meta.initialValue);
				meta.key = clone(meta.key);

				setListState(meta.key, intent, (defaultValue) => {
					if (!Array.isArray(defaultValue) && !isPlainObject(defaultValue)) {
						return generateId();
					}

					return Object.assign(getDefaultKey(defaultValue), {
						[root]: generateId(),
					});
				});
				setListValue(meta.initialValue, intent);
			}

			setListState(meta.validated, intent);
			meta.validated[intent.payload.name] = true;
			break;
		}
	}

	meta.error = Object.entries(meta.error).reduce<Record<string, Error>>(
		(result, [name, error]) => {
			if (meta.validated[name]) {
				result[name] = error;
			}

			return result;
		},
		{},
	);
}

function updateValue<Error>(
	meta: FormMeta<Error>,
	name: string,
	value: unknown,
): void {
	if (name === '') {
		meta.initialValue = value as Record<string, unknown>;
		meta.value = value as Record<string, unknown>;
		meta.key = getDefaultKey(value as Record<string, unknown>);
		return;
	}

	meta.initialValue = clone(meta.initialValue);
	meta.value = clone(meta.value);
	meta.key = clone(meta.key);

	setValue(meta.initialValue, name, () => value);
	setValue(meta.value, name, () => value);

	if (isPlainObject(value) || Array.isArray(value)) {
		setState(meta.key, name, () => undefined);

		Object.assign(meta.key, getDefaultKey(value, name));
	}

	meta.key[name] = generateId();
}

function createStateProxy<State>(
	fn: (name: string, proxy: Record<string, State>) => State,
): Record<string, State> {
	const cache: Record<string, State> = {};
	return new Proxy(cache, {
		get(_, name: string | Symbol, receiver) {
			if (typeof name !== 'string') {
				return;
			}

			return (cache[name] ??= fn(name, receiver));
		},
	});
}

function createValueProxy(
	value: Record<string, unknown>,
): Record<string, unknown> {
	const val = normalize(value);
	return createStateProxy((name, proxy) => {
		if (name === '') {
			return val;
		}

		const paths = getPaths(name);
		const basename = formatPaths(paths.slice(0, -1));
		const key = formatPaths(paths.slice(-1));
		const parentValue = proxy[basename];

		return getValue(parentValue, key);
	});
}

function createConstraintProxy(
	constraint: Record<string, Constraint>,
): Record<string, Constraint> {
	return createStateProxy((name, proxy) => {
		let result = constraint[name];

		if (!result) {
			const paths = getPaths(name);

			for (let i = paths.length - 1; i >= 0; i--) {
				const path = paths[i];

				if (typeof path === 'number' && !Number.isNaN(path)) {
					paths[i] = Number.NaN;
					break;
				}
			}

			const alternative = formatPaths(paths);

			if (name !== alternative) {
				result = proxy[alternative];
			}
		}

		return result ?? {};
	});
}

function createKeyProxy(
	key: Record<string, string | undefined>,
): Record<string, string | undefined> {
	return createStateProxy((name, proxy) => {
		const currentKey = key[name];
		const paths = getPaths(name);

		if (paths.length === 0) {
			return currentKey;
		}

		const parentKey = proxy[formatPaths(paths.slice(0, -1))];

		if (typeof parentKey === 'undefined') {
			return currentKey;
		}

		return `${parentKey}/${currentKey ?? paths.at(-1)}`;
	});
}

function createValidProxy<FormError>(
	error: Record<string, FormError>,
): Record<string, boolean> {
	return createStateProxy((name) => {
		const keys = Object.keys(error);

		if (name === '') {
			return keys.length === 0;
		}

		for (const key of keys) {
			if (isPrefix(key, name) && typeof error[key] !== 'undefined') {
				return false;
			}
		}

		return true;
	});
}

function createDirtyProxy(
	defaultValue: Record<string, unknown>,
	value: Record<string, unknown>,
	shouldDirtyConsider: (name: string) => boolean,
): Record<string, boolean> {
	return createStateProxy(
		(name) =>
			JSON.stringify(defaultValue[name]) !==
			JSON.stringify(value[name], (key, value) => {
				if (name === '' && key === '' && value) {
					return Object.entries(value).reduce<
						Record<string, unknown> | undefined
					>((result, [name, value]) => {
						if (!shouldDirtyConsider(name)) {
							return result;
						}

						return Object.assign(result ?? {}, { [name]: value });
					}, undefined);
				}

				return value;
			}),
	);
}

function shouldNotify<Schema>(
	prev: Record<string, Schema>,
	next: Record<string, Schema>,
	cache: Record<string, boolean>,
	scope: SubscriptionScope | undefined,
	compareFn: (prev: Schema | undefined, next: Schema | undefined) => boolean = (
		prev,
		next,
	) => JSON.stringify(prev) !== JSON.stringify(next),
): boolean {
	if (scope && prev !== next) {
		const prefixes = scope.prefix ?? [];
		const names = scope.name ?? [];
		const list =
			prefixes.length === 0
				? names
				: Array.from(new Set([...Object.keys(prev), ...Object.keys(next)]));

		for (const name of list) {
			if (
				prefixes.length === 0 ||
				names.includes(name) ||
				prefixes.some((prefix) => isPrefix(name, prefix))
			) {
				cache[name] ??= compareFn(prev[name], next[name]);

				if (cache[name]) {
					return true;
				}
			}
		}
	}

	return false;
}

export function createFormContext<
	Schema extends Record<string, any>,
	FormError = string[],
	FormValue = Schema,
>(
	options: FormOptions<Schema, FormError, FormValue>,
): FormContext<Schema, FormError, FormValue> {
	let subscribers: Array<{
		callback: () => void;
		getSubject?: () => SubscriptionSubject | undefined;
	}> = [];
	let latestOptions = options;
	let meta = createFormMeta(options);
	let state = createFormState(meta);

	function getFormElement(): HTMLFormElement | null {
		return document.forms.namedItem(latestOptions.formId);
	}

	function createFormState<Error>(
		next: FormMeta<Error>,
		prev: FormMeta<Error> = next,
		state?: FormState<Error>,
	): FormState<Error> {
		const defaultValue =
			!state || prev.defaultValue !== next.defaultValue
				? createValueProxy(next.defaultValue)
				: state.defaultValue;
		const initialValue =
			next.initialValue === next.defaultValue
				? defaultValue
				: !state || prev.initialValue !== next.initialValue
				? createValueProxy(next.initialValue)
				: state.initialValue;
		const value =
			next.value === next.initialValue
				? initialValue
				: !state || prev.value !== next.value
				? createValueProxy(next.value)
				: state.value;

		return {
			submissionStatus: next.submissionStatus,
			defaultValue,
			initialValue,
			value,
			error: !state || prev.error !== next.error ? next.error : state.error,
			validated: next.validated,
			constraint:
				!state || prev.constraint !== next.constraint
					? createConstraintProxy(next.constraint)
					: state.constraint,
			key:
				!state || prev.key !== next.key ? createKeyProxy(next.key) : state.key,
			valid:
				!state || prev.error !== next.error
					? createValidProxy(next.error)
					: state.valid,
			dirty:
				!state ||
				prev.defaultValue !== next.defaultValue ||
				prev.value !== next.value
					? createDirtyProxy(
							defaultValue,
							value,
							(key) => latestOptions.shouldDirtyConsider?.(key) ?? true,
					  )
					: state.dirty,
		};
	}

	function updateFormMeta(nextMeta: FormMeta<FormError>) {
		const prevMeta = meta;
		const prevState = state;
		const nextState = createFormState(nextMeta, prevMeta, prevState);

		// Apply change before notifying subscribers
		meta = nextMeta;
		state = nextState;

		const cache: Record<
			Exclude<keyof SubscriptionSubject, 'status'>,
			Record<string, boolean>
		> = {
			value: {},
			error: {},
			initialValue: {},
			key: {},
			valid: {},
			dirty: {},
		};

		for (const subscriber of subscribers) {
			const subject = subscriber.getSubject?.();

			if (
				!subject ||
				(subject.status &&
					prevState.submissionStatus !== nextState.submissionStatus) ||
				shouldNotify(
					prevState.error,
					nextState.error,
					cache.error,
					subject.error,
				) ||
				shouldNotify(
					prevState.initialValue,
					nextState.initialValue,
					cache.initialValue,
					subject.initialValue,
				) ||
				shouldNotify(
					prevState.key,
					nextState.key,
					cache.key,
					subject.key,
					(prev, next) => prev !== next,
				) ||
				shouldNotify(
					prevState.valid,
					nextState.valid,
					cache.valid,
					subject.valid,
					compareBoolean,
				) ||
				shouldNotify(
					prevState.dirty,
					nextState.dirty,
					cache.dirty,
					subject.dirty,
					compareBoolean,
				) ||
				shouldNotify(
					prevState.value,
					nextState.value,
					cache.value,
					subject.value,
				)
			) {
				subscriber.callback();
			}
		}
	}

	function compareBoolean(prev = false, next = false): boolean {
		return prev !== next;
	}

	function getSerializedState(): string {
		return JSON.stringify({
			validated: meta.validated,
		});
	}

	function submit(event: SubmitEvent) {
		const form = event.target as HTMLFormElement;
		const submitter = event.submitter as
			| HTMLButtonElement
			| HTMLInputElement
			| null;

		invariant(
			form === getFormElement(),
			`The submit event is dispatched by form#${form.id} instead of form#${latestOptions.formId}`,
		);

		const formData = getFormData(form, submitter);
		const result = {
			formData,
			action: getFormAction(event),
			encType: getFormEncType(event),
			method: getFormMethod(event),
		};

		if (typeof latestOptions?.onValidate === 'undefined') {
			return result;
		}

		const submission = latestOptions.onValidate({
			form,
			formData,
			submitter,
		});

		if (submission.status === 'success' || submission.error !== null) {
			const result = submission.reply();

			report({
				...result,
				status: result.status !== 'success' ? result.status : undefined,
			});
		}

		return { ...result, submission };
	}

	function resolveTarget(event: Event) {
		const form = getFormElement();
		const element = event.target;

		if (
			!form ||
			!isFieldElement(element) ||
			element.form !== form ||
			!element.form.isConnected ||
			element.name === ''
		) {
			return null;
		}

		return element;
	}

	function willValidate(
		element: FieldElement,
		eventName: 'onInput' | 'onBlur',
	): boolean {
		const { shouldValidate = 'onSubmit', shouldRevalidate = shouldValidate } =
			latestOptions;
		const validated = meta.validated[element.name];

		return validated
			? shouldRevalidate === eventName
			: shouldValidate === eventName;
	}

	function updateFormValue(form: HTMLFormElement) {
		const formData = new FormData(form);
		const result = getSubmissionContext(formData);

		updateFormMeta({
			...meta,
			value: result.payload,
		});
	}

	function onInput(event: Event) {
		const element = resolveTarget(event);

		if (!element || !element.form) {
			return;
		}

		if (event.defaultPrevented || !willValidate(element, 'onInput')) {
			updateFormValue(element.form);
		} else {
			dispatch({
				type: 'validate',
				payload: { name: element.name },
			});
		}
	}

	function onBlur(event: Event) {
		const element = resolveTarget(event);

		if (
			!element ||
			event.defaultPrevented ||
			!willValidate(element, 'onBlur')
		) {
			return;
		}

		dispatch({
			type: 'validate',
			payload: { name: element.name },
		});
	}

	function onReset(event: Event) {
		const element = getFormElement();

		if (
			event.type !== 'reset' ||
			event.target !== element ||
			event.defaultPrevented
		) {
			return;
		}

		updateFormMeta(createFormMeta(latestOptions, true));
	}

	function report(result: SubmissionResult<FormError>) {
		const formElement = getFormElement();

		if (!result.initialValue) {
			formElement?.reset();
			return;
		}

		const error = Object.entries(result.error ?? {}).reduce<
			Record<string, FormError>
		>((result, [name, newError]) => {
			const error = newError === null ? meta.error[name] : newError;

			if (error) {
				result[name] = error;
			}

			return result;
		}, {});
		const update: FormMeta<FormError> = {
			...meta,
			submissionStatus: result.status,
			value: result.initialValue,
			validated: {
				...meta.validated,
				...result.state?.validated,
			},
			error,
		};

		handleIntent(update, result.intent, result.fields, true);
		updateFormMeta(update);

		if (formElement && result.status === 'error') {
			for (const element of formElement.elements) {
				if (isFieldElement(element) && meta.error[element.name]) {
					element.focus();
					break;
				}
			}
		}
	}

	function onUpdate(
		options: Partial<FormOptions<Schema, FormError, FormValue>>,
	) {
		const currentFormId = latestOptions.formId;
		const currentResult = latestOptions.lastResult;

		// Merge new options with the latest options
		Object.assign(latestOptions, options);

		if (latestOptions.formId !== currentFormId) {
			updateFormMeta(createFormMeta(latestOptions, true));
		} else if (options.lastResult && options.lastResult !== currentResult) {
			report(options.lastResult);
		}
	}

	function subscribe(
		callback: () => void,
		getSubject?: () => SubscriptionSubject | undefined,
	) {
		const subscriber = {
			callback,
			getSubject,
		};

		subscribers.push(subscriber);

		return () => {
			subscribers = subscribers.filter((current) => current !== subscriber);
		};
	}

	function getState(): FormState<FormError> {
		return state;
	}

	function dispatch(intent: Intent): void {
		const form = getFormElement();
		const submitter = document.createElement('button');
		const buttonProps = getControlButtonProps(intent);

		submitter.name = buttonProps.name;
		submitter.value = buttonProps.value;
		submitter.hidden = true;
		submitter.formNoValidate = true;

		form?.appendChild(submitter);
		requestSubmit(form, submitter);
		form?.removeChild(submitter);
	}

	function getControlButtonProps(intent: Intent): ControlButtonProps {
		return {
			name: INTENT,
			value: serializeIntent(intent),
			form: latestOptions.formId,
			formNoValidate: true,
		};
	}

	function createFormControl<Type extends Intent['type']>(type: Type) {
		const control = (payload: any = {}) =>
			dispatch({
				type,
				payload,
			});

		return Object.assign(control, {
			getButtonProps(payload: any = {}) {
				return getControlButtonProps({
					type,
					payload,
				});
			},
		});
	}

	function observe() {
		const observer = new MutationObserver((mutations) => {
			const form = getFormElement();

			if (!form) {
				return;
			}

			for (const mutation of mutations) {
				const nodes =
					mutation.type === 'childList'
						? [...mutation.addedNodes, ...mutation.removedNodes]
						: [mutation.target];

				for (const node of nodes) {
					const element = isFieldElement(node)
						? node
						: node instanceof HTMLElement
						? node.querySelector<FieldElement>('input,select,textarea')
						: null;

					if (element?.form === form) {
						updateFormValue(form);
						return;
					}
				}
			}
		});

		observer.observe(document, {
			subtree: true,
			childList: true,
			attributes: true,
			attributeFilter: ['form', 'name'],
		});

		return () => {
			observer.disconnect();
		};
	}

	return {
		get formId() {
			return latestOptions.formId;
		},
		submit,
		onReset,
		onInput,
		onBlur,
		onUpdate,
		validate: createFormControl('validate'),
		reset: createFormControl('reset'),
		update: createFormControl('update'),
		insert: createFormControl('insert'),
		remove: createFormControl('remove'),
		reorder: createFormControl('reorder'),
		subscribe,
		getState,
		getSerializedState,
		observe,
	};
}
