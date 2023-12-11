import {
	flatten,
	formatPaths,
	getFormData,
	getPaths,
	getValue,
	isPlainObject,
	isPrefix,
	setValue,
} from './formdata';
import {
	type FieldElement,
	isFieldElement,
	getFormAction,
	getFormEncType,
	getFormMethod,
} from './dom';
import { clone, generateId, invariant } from './util';
import {
	type Intent,
	type Submission,
	type SubmissionResult,
	STATE,
	requestIntent,
	getSubmissionContext,
	setListState,
	setListValue,
	setState,
	serialize,
	intent,
} from './submission';

export type UnionKeyof<T> = T extends any ? keyof T : never;

export type UnionKeyType<T, K extends UnionKeyof<T>> = T extends {
	[k in K]?: any;
}
	? T[K]
	: undefined;

export type DefaultValue<Schema> = Schema extends
	| string
	| number
	| boolean
	| Date
	| null
	| undefined
	? Schema | string | null | undefined
	: Schema extends File
	? null | undefined
	: Schema extends Array<infer Item>
	? Array<DefaultValue<Item>> | null | undefined
	: Schema extends Record<string, any>
	?
			| {
					[Key in UnionKeyof<Schema>]?: DefaultValue<UnionKeyType<Schema, Key>>;
			  }
			| null
			| undefined
	: string | null | undefined;

export type FormValue<Schema> = Schema extends
	| string
	| number
	| boolean
	| Date
	| null
	| undefined
	? string | undefined
	: Schema extends File
	? File | undefined
	: Schema extends Array<infer Item>
	? Array<FormValue<Item>> | undefined
	: Schema extends Record<string, any>
	?
			| { [Key in UnionKeyof<Schema>]?: FormValue<UnionKeyType<Schema, Key>> }
			| undefined
	: unknown;

export type FormId<Schema extends Record<string, unknown>, Error> = string & {
	__error?: Error;
	__schema?: Schema;
};

export type FieldName<Schema> = string & { __schema?: Schema };

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

export type FormMeta<Error> = {
	submissionStatus?: 'error' | 'success';
	defaultValue: Record<string, unknown>;
	initialValue: Record<string, unknown>;
	value: Record<string, unknown>;
	error: Record<string, Error>;
	constraint: Record<string, Constraint>;
	key: Record<string, string>;
	validated: Record<string, boolean>;
};

export type FormState<Error> = FormMeta<Error> & {
	valid: Record<string, boolean>;
	dirty: Record<string, boolean>;
};

export type FormOptions<Schema, Error, Value = Schema> = {
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
	lastResult?: SubmissionResult<Error>;

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
	 * A function to be called when the form should be (re)validated.
	 */
	onValidate?: (context: {
		form: HTMLFormElement;
		submitter: HTMLInputElement | HTMLButtonElement | null;
		formData: FormData;
	}) => Submission<Schema, Error, Value>;

	/**
	 * A function to be called before the form is submitted.
	 */
	onSubmit?: (
		event: SubmitEvent,
		context: {
			formData: FormData;
			action: ReturnType<typeof getFormAction>;
			encType: ReturnType<typeof getFormEncType>;
			method: ReturnType<typeof getFormMethod>;
			submission?: Submission<Schema, Error, Value>;
		},
	) => void;
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

export type FormContext<
	Schema extends Record<string, any> = any,
	Error = string[],
	Value = Schema,
> = {
	formId: string;
	submit(event: SubmitEvent): void;
	reset(event: Event): void;
	input(event: Event): void;
	blur(event: Event): void;
	report(result: SubmissionResult<Error>): void;
	update(options: Omit<FormOptions<Schema, Error, Value>, 'lastResult'>): void;
	subscribe(
		callback: () => void,
		getSubject?: () => SubscriptionSubject | undefined,
	): () => void;
	getState(): FormState<Error>;
	getSerializedState(): string;
};

function createFormMeta<Schema, Error, Value>(
	options: FormOptions<Schema, Error, Value>,
	initialized?: boolean,
): FormMeta<Error> {
	const lastResult = !initialized ? options.lastResult : undefined;
	const defaultValue = options.defaultValue
		? (serialize(options.defaultValue) as Record<string, unknown>)
		: {};
	const initialValue = lastResult?.initialValue ?? defaultValue;
	const result: FormMeta<Error> = {
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
		error: (lastResult?.error as Record<string, Error>) ?? {},
	};

	if (lastResult?.intent) {
		handleIntent(result, lastResult.intent);
	}

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
				result[formatPaths([...getPaths(key), i])] = generateId();
			}
		}

		return result;
	}, {});
}

function handleIntent<Error>(
	meta: FormMeta<Error>,
	intent: Intent,
	initialized?: boolean,
): void {
	switch (intent.type) {
		case 'replace': {
			const name = intent.payload.name ?? '';
			const value = intent.payload.value;

			updateValue(meta, name, value);
			break;
		}
		case 'reset': {
			if (typeof intent.payload.value === 'undefined' || intent.payload.value) {
				const name = intent.payload.name ?? '';
				const value = getValue(meta.defaultValue, name);

				updateValue(meta, name, value);
			}
			break;
		}
		case 'insert':
		case 'remove':
		case 'reorder': {
			if (initialized) {
				meta.initialValue = clone(meta.initialValue);
				meta.key = clone(meta.key);

				setListState(meta.key, intent, generateId);
				setListValue(meta.initialValue, intent);
			}
			break;
		}
	}
}

function updateValue<Error>(
	meta: FormMeta<Error>,
	name: string,
	value: unknown,
): void {
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
		get(_, name: string, receiver) {
			return (cache[name] ??= fn(name, receiver));
		},
	});
}

function createValueProxy(
	value: Record<string, unknown>,
): Record<string, unknown> {
	return createStateProxy((name, proxy) => {
		if (name === '') {
			return value;
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

function createKeyProxy(key: Record<string, string>): Record<string, string> {
	return createStateProxy((name, proxy) => {
		const currentKey = key[name] ?? '';
		const resultKey =
			name === ''
				? currentKey
				: `${
						proxy[formatPaths(getPaths(name).slice(0, -1))] ?? ''
				  }/${currentKey}`;

		return resultKey;
	});
}

function createValidProxy<Error>(
	error: Record<string, Error>,
): Record<string, boolean> {
	return createStateProxy((name) => typeof error[name] === 'undefined');
}

function createDirtyProxy(
	defaultValue: Record<string, unknown>,
	value: Record<string, unknown>,
): Record<string, boolean> {
	return createStateProxy(
		(name) =>
			JSON.stringify(defaultValue[name]) !== JSON.stringify(value[name]),
	);
}

function shouldNotify<Schema>(config: {
	prev: Record<string, Schema>;
	next: Record<string, Schema>;
	compareFn?: (prev: Schema | undefined, next: Schema | undefined) => boolean;
	cache: Record<string, boolean>;
	scope?: SubscriptionScope;
}): boolean {
	if (config.scope) {
		const prefixes = config.scope.prefix ?? [];
		const names = config.scope.name ?? [];
		const compareFn =
			config.compareFn ??
			((prev, next) => JSON.stringify(prev) !== JSON.stringify(next));
		const list =
			prefixes.length === 0
				? names
				: Array.from(
						new Set([...Object.keys(config.prev), ...Object.keys(config.next)]),
				  );

		for (const name of list) {
			if (
				prefixes.length === 0 ||
				names.includes(name) ||
				prefixes.some((prefix) => isPrefix(name, prefix))
			) {
				config.cache[name] ??= compareFn(config.prev[name], config.next[name]);

				if (config.cache[name]) {
					return true;
				}
			}
		}
	}

	return false;
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
		key: !state || prev.key !== next.key ? createKeyProxy(next.key) : state.key,
		valid:
			!state || prev.error !== next.error
				? createValidProxy(next.error)
				: state.valid,
		dirty:
			!state ||
			prev.defaultValue !== next.defaultValue ||
			prev.value !== next.value
				? createDirtyProxy(next.defaultValue, next.value)
				: state.dirty,
	};
}

export function createFormContext<
	Schema extends Record<string, any>,
	Error,
	Value,
>(
	formId: string,
	options: FormOptions<Schema, Error, Value>,
): FormContext<Schema, Error, Value> {
	let subscribers: Array<{
		callback: () => void;
		getSubject?: () => SubscriptionSubject | undefined;
	}> = [];
	let latestOptions = options;
	let meta = createFormMeta(options);
	let state = createFormState(meta);

	function getFormElement(): HTMLFormElement {
		const element = document.forms.namedItem(formId);
		invariant(element !== null, `Form#${formId} does not exist`);
		return element;
	}

	function updateFormMeta(nextMeta: FormMeta<Error>) {
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
				shouldNotify({
					prev: prevState.error,
					next: nextState.error,
					cache: cache.error,
					scope: subject.error,
				}) ||
				shouldNotify({
					prev: prevState.initialValue,
					next: nextState.initialValue,
					cache: cache.initialValue,
					scope: subject.initialValue,
				}) ||
				shouldNotify({
					prev: prevState.key,
					next: nextState.key,
					compareFn: (prev, next) => prev !== next,
					cache: cache.key,
					scope: subject.key,
				}) ||
				shouldNotify({
					prev: prevState.valid,
					next: nextState.valid,
					compareFn: compareBoolean,
					cache: cache.valid,
					scope: subject.valid,
				}) ||
				shouldNotify({
					prev: prevState.dirty,
					next: nextState.dirty,
					compareFn: compareBoolean,
					cache: cache.dirty,
					scope: subject.dirty,
				}) ||
				shouldNotify({
					prev: prevState.value,
					next: nextState.value,
					cache: cache.value,
					scope: subject.value,
				})
			) {
				subscriber.callback();
			}
		}
	}

	function compareBoolean(prev = false, next = false): boolean {
		return prev !== next;
	}

	function getStateInput(form: HTMLFormElement): FieldElement {
		const element = form.elements.namedItem(STATE);

		invariant(
			element === null || isFieldElement(element),
			`The input name "${STATE}" is reserved by Conform. Please use another name.`,
		);

		if (!element) {
			const input = document.createElement('input');

			input.type = 'hidden';
			input.name = STATE;
			input.value = '';
			form.append(input);

			return input;
		}

		return element;
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
			`The submit event is dispatched by form#${form.id} instead of form#${formId}`,
		);

		const input = getStateInput(form);

		// To ensure it capturing latest state before parsing
		input.value = getSerializedState();

		const formData = getFormData(form, submitter);
		const context = {
			formData,
			action: getFormAction(event),
			encType: getFormEncType(event),
			method: getFormMethod(event),
		};

		if (typeof latestOptions?.onValidate === 'undefined') {
			latestOptions.onSubmit?.(event, context);
		} else {
			try {
				const submission = latestOptions.onValidate({
					form,
					formData,
					submitter,
				});

				if (!submission.value && submission.error !== null) {
					report(submission.reject());
					event.preventDefault();
				}

				latestOptions.onSubmit?.(event, { ...context, submission });
			} catch (error) {
				// eslint-disable-next-line no-console
				console.warn('Client validation failed', error);
			}
		}
	}

	function resolveTarget(event: Event) {
		const form = getFormElement();
		const element = event.target;

		if (
			!isFieldElement(element) ||
			element.form !== form ||
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

	function input(event: Event) {
		const element = resolveTarget(event);

		if (!element || !element.form) {
			return;
		}

		if (event.defaultPrevented || !willValidate(element, 'onInput')) {
			const formData = new FormData(element.form);
			const result = getSubmissionContext(formData);

			updateFormMeta({
				...meta,
				value: result.payload,
			});
		} else {
			requestIntent(formId, intent.validate(element.name));
		}
	}

	function blur(event: Event) {
		const element = resolveTarget(event);

		if (
			!element ||
			event.defaultPrevented ||
			!willValidate(element, 'onBlur')
		) {
			return;
		}

		requestIntent(formId, intent.validate(element.name));
	}

	function reset(event: Event) {
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

	function report(result: SubmissionResult<Error>) {
		const formElement = getFormElement();

		if (typeof result.initialValue === 'undefined') {
			formElement.reset();
			return;
		}

		const error = Object.entries(result.error ?? {}).reduce<
			Record<string, Error>
		>((result, [name, newError]) => {
			const error = newError === null ? meta.error[name] : newError;

			if (error) {
				result[name] = error;
			}

			return result;
		}, {});
		const update: FormMeta<Error> = {
			...meta,
			submissionStatus: result.status,
			value: result.initialValue,
			error,
			validated: result.state?.validated ?? {},
		};

		if (result.intent) {
			handleIntent(update, result.intent, true);
		}

		updateFormMeta(update);

		// TODO: An option to configure the validationMessage
		for (const element of formElement.elements) {
			if (isFieldElement(element) && element.name !== '') {
				element.setCustomValidity(error[element.name] ? 'Invalid' : '');
			}
		}

		if (result.status === 'error') {
			for (const element of formElement.elements) {
				if (isFieldElement(element) && error[element.name]) {
					element.focus();
					break;
				}
			}
		}
	}

	function update(options: FormOptions<Schema, Error, Value>) {
		latestOptions = options;
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

	function getState(): FormState<Error> {
		return state;
	}

	return {
		formId,
		submit,
		reset,
		input,
		blur,
		report,
		update,
		subscribe,
		getState,
		getSerializedState,
	};
}
