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

export type FormValue<Schema> = Schema extends
	| string
	| number
	| boolean
	| Date
	| null
	| undefined
	? Schema | string | undefined
	: Schema extends File
	? string | undefined
	: Schema extends Array<infer Item>
	? Array<FormValue<Item>> | string | undefined
	: Schema extends Record<string, any>
	?
			| { [Key in UnionKeyof<Schema>]?: FormValue<UnionKeyType<Schema, Key>> }
			| string
			| undefined
	: unknown | string | undefined;

export type FieldName<Schema> = string & { __type?: Schema };

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

export type FormContext = {
	defaultValue: Record<string, unknown>;
	initialValue: Record<string, unknown>;
	value: Record<string, unknown>;
	error: Record<string, string[]>;
	constraint: Record<string, Constraint>;
	key: Record<string, string>;
	validated: Record<string, boolean>;
};

export type FormState = {
	defaultValue: Record<string, unknown>;
	initialValue: Record<string, unknown>;
	value: Record<string, unknown>;
	error: Record<string, string[]>;
	constraint: Record<string, Constraint>;
	key: Record<string, string>;
	valid: Record<string, boolean>;
	dirty: Record<string, boolean>;
};

export type FormOptions<Schema> = {
	/**
	 * An object representing the initial value of the form.
	 */
	defaultValue?: FormValue<Schema>;

	/**
	 * An object describing the constraint of each field
	 */
	constraint?: Record<string, Constraint>;

	/**
	 * An object describing the result of the last submission
	 */
	lastResult?: SubmissionResult;

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
	}) => Submission<Schema, any>;
};

export type SubscriptionSubject = {
	[key in
		| 'error'
		| 'initialValue'
		| 'value'
		| 'key'
		| 'valid'
		| 'dirty']?: SubscriptionScope;
};

export type SubscriptionScope = {
	prefix?: string[];
	name?: string[];
};

export type Form<Schema extends Record<string, any> = any> = {
	id: string;
	submit(event: SubmitEvent): {
		formData: FormData;
		action: ReturnType<typeof getFormAction>;
		encType: ReturnType<typeof getFormEncType>;
		method: ReturnType<typeof getFormMethod>;
		submission?: Submission<Schema>;
	};
	reset(event: Event): void;
	input(event: Event): void;
	blur(event: Event): void;
	report(result: SubmissionResult): void;
	update(options: Omit<FormOptions<Schema>, 'lastResult'>): void;
	subscribe(
		callback: () => void,
		getSubject?: () => SubscriptionSubject | undefined,
	): () => void;
	getState(): FormState;
	getSerializedState(): string;
};

export const VALIDATION_UNDEFINED = '__undefined__';

export const VALIDATION_SKIPPED = '__skipped__';

export function createForm<Schema extends Record<string, any> = any>(
	formId: string,
	options: FormOptions<Schema>,
): Form<Schema> {
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

	function initializeFormContext(): FormContext {
		const defaultValue = options.defaultValue ?? {};
		const value = options.lastResult?.initialValue ?? defaultValue;
		const result: FormContext = {
			constraint: options.constraint ?? {},
			defaultValue,
			initialValue: value,
			validated: options.lastResult?.state?.validated ?? {},
			key: getDefaultKey(defaultValue),
			value,
			error: options.lastResult?.error ?? {},
		};

		if (options.lastResult?.intents) {
			handleIntents(options.lastResult.intents, result);
		}

		return result;
	}

	function initializeFormState(context: FormContext): FormState {
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
		context: FormContext,
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
		}

		context.key[name] = generateId();
	}

	function handleIntents(
		intents: Array<Intent>,
		context: FormContext,
		initialized?: boolean,
	): void {
		for (const intent of intents) {
			switch (intent.type) {
				case 'replace': {
					if (typeof intent.payload.value !== 'undefined') {
						const name = intent.payload.name ?? '';
						const value = intent.payload.value;

						updateValue(context, name, value);
					}
					break;
				}
				case 'reset': {
					if (intent.payload.value ?? true) {
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
		error: Record<string, string[]>,
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
		compareFn: (prev: Schema | undefined, next: Schema | undefined) => boolean;
		cache: Record<string, boolean>;
		scope?: SubscriptionScope;
	}): boolean {
		if (config.scope) {
			const prefixes = config.scope.prefix ?? [];
			const names = config.scope.name ?? [];
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
					config.cache[name] ??= config.compareFn(
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

	function updateContext(next: FormContext) {
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

	function updateFormState(next: FormState) {
		const diff: Record<keyof SubscriptionSubject, Record<string, boolean>> = {
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
				shouldNotify({
					prev: prev.error,
					next: next.error,
					compareFn: (prev, next) =>
						JSON.stringify(prev) !== JSON.stringify(next),
					cache: diff.error,
					scope: subject.error,
				}) ||
				shouldNotify({
					prev: prev.initialValue,
					next: next.initialValue,
					compareFn: (prev, next) =>
						JSON.stringify(prev) !== JSON.stringify(next),
					cache: diff.initialValue,
					scope: subject.initialValue,
				}) ||
				shouldNotify({
					prev: prev.key,
					next: next.key,
					compareFn: (prev, next) => prev !== next,
					cache: diff.key,
					scope: subject.key,
				}) ||
				shouldNotify({
					prev: prev.valid,
					next: next.valid,
					compareFn: (prev, next) => prev !== next,
					cache: diff.valid,
					scope: subject.valid,
				}) ||
				shouldNotify({
					prev: prev.dirty,
					next: next.dirty,
					compareFn: (prev, next) => prev !== next,
					cache: diff.dirty,
					scope: subject.dirty,
				}) ||
				shouldNotify({
					prev: prev.value,
					next: next.value,
					compareFn: (prev, next) =>
						JSON.stringify(prev) !== JSON.stringify(next),
					cache: diff.value,
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
		const result = {
			formData,
			action: getFormAction(event),
			encType: getFormEncType(event),
			method: getFormMethod(event),
		};

		if (typeof latestOptions?.onValidate !== 'undefined') {
			try {
				const submission = latestOptions.onValidate({
					form,
					formData,
					submitter,
				});

				if (!submission.value) {
					const result = submission.reject();

					if (
						!result.error ||
						Object.values(result.error).every(
							(messages) => !messages.includes(VALIDATION_UNDEFINED),
						)
					) {
						report(result);
						event.preventDefault();
					}
				}

				return {
					...result,
					submission,
				};
			} catch (error) {
				// eslint-disable-next-line no-console
				console.warn('Client validation failed', error);
			}
		}

		return result;
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

		const defaultValue = latestOptions.defaultValue ?? {};

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

	function report(result: SubmissionResult) {
		const formElement = getFormElement();

		if (typeof result.initialValue === 'undefined') {
			formElement.reset();
			return;
		}

		const value = flatten(result.initialValue);
		const error = Object.entries(result.error ?? {}).reduce<
			Record<string, string[]>
		>((result, [name, messages]) => {
			const error = messages.includes(VALIDATION_SKIPPED)
				? context.error[name]
				: messages;

			if (error) {
				result[name] = error;
			}

			return result;
		}, {});
		const update: FormContext = {
			...context,
			value,
			error,
			validated: result.state?.validated ?? {},
		};

		if (result.intents) {
			handleIntents(result.intents, update, true);
		}

		updateContext(update);

		for (const element of formElement.elements) {
			if (isFieldElement(element) && element.name !== '') {
				element.setCustomValidity(context.error[element.name]?.join(' ') ?? '');
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

	function update(options: Omit<FormOptions<Schema>, 'lastResult'>) {
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

	function getState(): FormState {
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
