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
	? Schema | string | undefined
	: Schema extends File
	? undefined
	: Schema extends Array<infer Item>
	? Array<DefaultValue<Item>>
	: Schema extends Record<string, any>
	? {
			[Key in UnionKeyof<Schema>]?: DefaultValue<UnionKeyType<Schema, Key>>;
	  }
	: string | undefined;

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

export type FormContext<Error> = {
	submissionStatus?: 'error' | 'success';
	defaultValue: Record<string, unknown>;
	initialValue: Record<string, unknown>;
	value: Record<string, unknown>;
	error: Record<string, Error>;
	constraint: Record<string, Constraint>;
	key: Record<string, string>;
	validated: Record<string, boolean>;
};

export type FormState<Error = unknown> = {
	submissionStatus?: 'error' | 'success';
	defaultValue: Record<string, unknown>;
	initialValue: Record<string, unknown>;
	value: Record<string, unknown>;
	error: Record<string, Error>;
	constraint: Record<string, Constraint>;
	key: Record<string, string>;
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

export type Form<
	Schema extends Record<string, any> = any,
	Error = string[],
	Value = Schema,
> = {
	id: string;
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

export function createForm<Schema extends Record<string, any>, Error, Value>(
	formId: string,
	options: FormOptions<Schema, Error, Value>,
): Form<Schema, Error, Value> {
	let subscribers: Array<{
		callback: () => void;
		getSubject?: () => SubscriptionSubject | undefined;
	}> = [];
	let latestOptions = options;
	let context = initializeFormContext();
	let state = initializeFormState(context);

	function getFormElement(): HTMLFormElement {
		const element = document.forms.namedItem(formId);
		invariant(element !== null, `Form#${formId} does not exist`);
		return element;
	}

	function serialize(defaultValue?: DefaultValue<Schema>): FormValue<Schema> {
		if (isPlainObject(defaultValue)) {
			// @ts-expect-error FIXME
			return Object.entries(defaultValue).reduce<Record<string, unknown>>(
				(result, [key, value]) => {
					result[key] = serialize(value);
					return result;
				},
				{},
			);
		} else if (Array.isArray(defaultValue)) {
			// @ts-expect-error FIXME
			return defaultValue.map(serialize);
		} else if (
			// @ts-ignore-error FIXME
			defaultValue instanceof Date
		) {
			// @ts-expect-error FIXME
			return defaultValue.toISOString();
		} else if (typeof defaultValue === 'boolean') {
			// @ts-expect-error FIXME
			return defaultValue ? 'on' : undefined;
		} else {
			// @ts-expect-error FIXME
			return defaultValue?.toString();
		}
	}

	function initializeFormContext(): FormContext<Error> {
		const defaultValue = serialize(options.defaultValue) ?? {};
		const value = options.lastResult?.initialValue ?? defaultValue;
		const result: FormContext<Error> = {
			submissionStatus: options.lastResult?.status,
			constraint: options.constraint ?? {},
			defaultValue,
			initialValue: value,
			validated: options.lastResult?.state?.validated ?? {},
			key: getDefaultKey(defaultValue),
			value,
			// The `lastResult` should comes from the server which we won't expect the error to be null
			// We can consider adding a warning if it happens
			error: (options.lastResult?.error as Record<string, Error>) ?? {},
		};

		if (options.lastResult?.intents) {
			handleIntents(options.lastResult.intents, result);
		}

		return result;
	}

	function initializeFormState(context: FormContext<Error>): FormState<Error> {
		const defaultValue = flatten(context.defaultValue);
		const initialValue =
			context.initialValue === context.defaultValue
				? defaultValue
				: flatten(context.initialValue);
		const value =
			context.value === context.initialValue
				? defaultValue
				: flatten(context.value);

		return {
			defaultValue,
			initialValue,
			value,
			error: context.error,
			constraint: createConstraintProxy(context.constraint),
			key: createKeyProxy(context.key),
			valid: createValidProxy(context.error),
			dirty: createDirtyProxy(defaultValue, context.value),
		};
	}

	function getDefaultKey(
		defaultValue: Record<string, unknown> | Array<unknown>,
		prefix?: string,
	): Record<string, string> {
		const basePaths = getPaths(prefix ?? '');

		return Object.entries(flatten(defaultValue)).reduce<Record<string, string>>(
			(result, [key, value]) => {
				if (Array.isArray(value)) {
					for (let i = 0; i < value.length; i++) {
						result[formatPaths([...basePaths, ...getPaths(key), i])] =
							generateId();
					}
				}

				return result;
			},
			{},
		);
	}

	function updateValue(
		context: FormContext<Error>,
		name: string,
		value: unknown,
	): void {
		context.initialValue = clone(context.initialValue);
		context.value = clone(context.value);
		context.key = clone(context.key);

		setValue(context.initialValue, name, () => value);
		setValue(context.value, name, () => value);

		if (isPlainObject(value) || Array.isArray(value)) {
			setState(context.key, name, () => undefined);

			Object.assign(
				context.key,
				flatten(value, {
					resolve() {
						return generateId();
					},
					prefix: name,
				}),
			);
		}

		context.key[name] = generateId();
	}

	function handleIntents(
		intents: Array<Intent>,
		context: FormContext<Error>,
		initialized?: boolean,
	): void {
		for (const intent of intents) {
			switch (intent.type) {
				case 'replace': {
					const name = intent.payload.name ?? '';
					const value = intent.payload.value;

					updateValue(context, name, value);
					break;
				}
				case 'reset': {
					if (
						typeof intent.payload.value === 'undefined' ||
						intent.payload.value
					) {
						const name = intent.payload.name ?? '';
						const value = getValue(context.defaultValue, name);

						updateValue(context, name, value);
					}
					break;
				}
				case 'insert':
				case 'remove':
				case 'reorder': {
					if (initialized) {
						context.initialValue = clone(context.initialValue);
						context.key = clone(context.key);

						setListState(context.key, intent, generateId);
						setListValue(context.initialValue, intent);
					}
					break;
				}
			}
		}
	}

	function createConstraintProxy(
		constraint: Record<string, Constraint>,
	): Record<string, Constraint> {
		const cache: Record<string, Constraint> = {};
		const proxy = new Proxy(constraint, {
			get(_, name: string) {
				if (typeof cache[name] === 'undefined') {
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

					if (result) {
						cache[name] = result;
					}
				}

				return cache[name];
			},
		});

		return proxy;
	}

	function createKeyProxy(key: Record<string, string>): Record<string, string> {
		const cache: Record<string, string | undefined> = {};
		const keyProxy = new Proxy(key, {
			get(_, name: string) {
				if (typeof cache[name] === 'undefined') {
					const currentKey = key[name] ?? '';
					const resultKey =
						name === ''
							? currentKey
							: `${
									keyProxy[formatPaths(getPaths(name).slice(0, -1))] ?? ''
							  }/${currentKey}`;

					if (resultKey) {
						cache[name] = resultKey;
					}
				}

				return cache[name];
			},
		});

		return keyProxy;
	}

	function createValidProxy(
		error: Record<string, Error>,
	): Record<string, boolean> {
		const cache: Record<string, boolean> = {};

		return new Proxy(
			{},
			{
				get(_, name: string) {
					return (cache[name] ??= typeof error[name] === 'undefined');
				},
			},
		);
	}

	function createDirtyProxy(
		defaultValue: Record<string, unknown>,
		value: Record<string, unknown>,
	): Record<string, boolean> {
		const cache: Record<string, boolean> = {};

		return new Proxy(
			{},
			{
				get(_, name: string) {
					return (cache[name] ??=
						JSON.stringify(defaultValue[name]) !== JSON.stringify(value[name]));
				},
			},
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
							new Set([
								...Object.keys(config.prev),
								...Object.keys(config.next),
							]),
					  );

			for (const name of list) {
				if (
					prefixes.length === 0 ||
					names.includes(name) ||
					prefixes.some((prefix) => isPrefix(name, prefix))
				) {
					config.cache[name] ??= compareFn(
						config.prev[name],
						config.next[name],
					);

					if (config.cache[name]) {
						return true;
					}
				}
			}
		}

		return false;
	}

	function updateContext(next: FormContext<Error>) {
		const prev = context;

		// Apply change before updating state
		context = next;

		const defaultValue =
			prev.defaultValue !== next.defaultValue
				? flatten(next.defaultValue)
				: state.defaultValue;
		const initialValue =
			next.initialValue === next.defaultValue
				? defaultValue
				: prev.initialValue !== next.initialValue
				? flatten(next.initialValue)
				: state.initialValue;
		const value =
			next.value === next.initialValue
				? initialValue
				: prev.value !== next.value
				? flatten(next.value)
				: state.value;

		updateFormState({
			submissionStatus: next.submissionStatus,
			defaultValue,
			initialValue,
			value,
			error: prev.error !== next.error ? next.error : state.error,
			constraint:
				prev.constraint !== next.constraint
					? createConstraintProxy(next.constraint)
					: state.constraint,
			key: prev.key !== next.key ? createKeyProxy(next.key) : state.key,
			valid:
				prev.error !== next.error ? createValidProxy(next.error) : state.valid,
			dirty:
				prev.defaultValue !== next.defaultValue || prev.value !== next.value
					? createDirtyProxy(next.defaultValue, next.value)
					: state.dirty,
		});
	}

	function compareBoolean(prev = false, next = false): boolean {
		return prev !== next;
	}

	function updateFormState(next: FormState<Error>) {
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
		const prev = state;

		// Apply change before notifying subscribers
		state = next;

		for (const subscriber of subscribers) {
			const subject = subscriber.getSubject?.();

			if (
				!subject ||
				(subject.status && prev.submissionStatus !== next.submissionStatus) ||
				shouldNotify({
					prev: prev.error,
					next: next.error,
					cache: cache.error,
					scope: subject.error,
				}) ||
				shouldNotify({
					prev: prev.initialValue,
					next: next.initialValue,
					cache: cache.initialValue,
					scope: subject.initialValue,
				}) ||
				shouldNotify({
					prev: prev.key,
					next: next.key,
					compareFn: (prev, next) => prev !== next,
					cache: cache.key,
					scope: subject.key,
				}) ||
				shouldNotify({
					prev: prev.valid,
					next: next.valid,
					compareFn: compareBoolean,
					cache: cache.valid,
					scope: subject.valid,
				}) ||
				shouldNotify({
					prev: prev.dirty,
					next: next.dirty,
					compareFn: compareBoolean,
					cache: cache.dirty,
					scope: subject.dirty,
				}) ||
				shouldNotify({
					prev: prev.value,
					next: next.value,
					cache: cache.value,
					scope: subject.value,
				})
			) {
				subscriber.callback();
			}
		}
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
			validated: context.validated,
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
		const validated = context.validated[element.name];

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
			const value = flatten(result.payload);

			updateContext({
				...context,
				value,
			});
		} else {
			requestIntent(formId, [intent.validate(element.name)]);
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

		requestIntent(formId, [intent.validate(element.name)]);
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

		const defaultValue = serialize(latestOptions.defaultValue) ?? {};

		updateContext({
			key: {
				'': generateId(),
				...getDefaultKey(defaultValue),
			},
			defaultValue,
			initialValue: defaultValue,
			value: defaultValue,
			error: {},
			validated: {},
			constraint: latestOptions.constraint ?? {},
		});
	}

	function report(result: SubmissionResult<Error>) {
		const formElement = getFormElement();

		if (typeof result.initialValue === 'undefined') {
			formElement.reset();
			return;
		}

		const value = flatten(result.initialValue);
		const error = Object.entries(result.error ?? {}).reduce<
			Record<string, Error>
		>((result, [name, messages]) => {
			const error = messages === null ? context.error[name] : messages;

			if (error) {
				result[name] = error;
			}

			return result;
		}, {});
		const update: FormContext<Error> = {
			...context,
			submissionStatus: result.status,
			value,
			error,
			validated: result.state?.validated ?? {},
		};

		if (result.intents) {
			handleIntents(result.intents, update, true);
		}

		updateContext(update);

		// TODO: An option to configure the validationMessage
		for (const element of formElement.elements) {
			if (isFieldElement(element) && element.name !== '') {
				element.setCustomValidity(context.error[element.name] ? 'Invalid' : '');
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
		id: formId,
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
