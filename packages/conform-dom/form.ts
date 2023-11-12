import {
	flatten,
	formatPaths,
	getFormData,
	getPaths,
	isSubpath,
	isPlainObject,
	setValue,
} from './formdata';
import {
	type FieldElement,
	isFieldElement,
	getFormAction,
	getFormEncType,
	getFormMethod,
} from './dom';
import { invariant } from './util';
import {
	type Submission,
	type SubmissionResult,
	requestIntent,
	resolve,
	validate,
	STATE,
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
	? Schema | string
	: Schema extends File
	? undefined
	: Schema extends Array<infer InnerType>
	? Array<DefaultValue<InnerType>>
	: Schema extends Record<string, any>
	? { [Key in UnionKeyof<Schema>]?: DefaultValue<UnionKeyType<Schema, Key>> }
	: any;

export type FieldName<Type> = string & { __type?: Type };

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

export type FormMetadata = {
	defaultValue: Record<string, unknown>;
	constraint: Record<string, Constraint>;
};

export type FormState = {
	key: Record<string, string>;
	validated: Record<string, boolean>;
	valid: Record<string, boolean>;
	dirty: Record<string, boolean>;
};

export interface FormContext {
	metadata: FormMetadata;
	initialValue: Record<string, unknown>;
	value: Record<string, unknown>;
	error: Record<string, string[]>;
	state: FormState;
}

export interface FormOptions<Type> {
	defaultValue?: DefaultValue<Type>;
	constraint?: Record<string, Constraint>;
	lastResult?: SubmissionResult;
	shouldValidate?: 'onSubmit' | 'onBlur' | 'onInput';
	shouldRevalidate?: 'onSubmit' | 'onBlur' | 'onInput';
	onValidate?: (context: {
		form: HTMLFormElement;
		submitter: HTMLInputElement | HTMLButtonElement | null;
		formData: FormData;
	}) => Submission<Type>;
}

export type SubscriptionSubject = {
	[key in
		| 'error'
		| 'defaultValue'
		| 'value'
		| 'key'
		| 'validated'
		| 'valid'
		| 'dirty']?: SubscriptionScope;
};

export type SubscriptionScope = {
	parent?: string[];
	name?: string[];
};

export interface Form<Type extends Record<string, unknown> = any> {
	id: string;
	submit(event: SubmitEvent): {
		formData: FormData;
		action: ReturnType<typeof getFormAction>;
		encType: ReturnType<typeof getFormEncType>;
		method: ReturnType<typeof getFormMethod>;
		submission?: Submission<Type>;
	};
	reset(event: Event): void;
	input(event: Event): void;
	blur(event: Event): void;
	report(result: SubmissionResult): void;
	update(options: Omit<FormOptions<Type>, 'lastResult'>): void;
	subscribe(
		callback: () => void,
		getSubject?: () => SubscriptionSubject | undefined,
	): () => void;
	getContext(): FormContext;
}

export const VALIDATION_UNDEFINED = '__undefined__';

export const VALIDATION_SKIPPED = '__skipped__';

export function createForm<Type extends Record<string, unknown> = any>(
	formId: string,
	options: FormOptions<Type>,
): Form<Type> {
	let subscribers: Array<{
		callback: () => void;
		getSubject?: () => SubscriptionSubject | undefined;
	}> = [];
	let latestOptions = options;
	let context = initializeFormContext();

	function getFormElement(): HTMLFormElement {
		const element = document.forms.namedItem(formId);
		invariant(element !== null, `Form#${formId} does not exist`);
		return element;
	}

	function initializeFormContext(): FormContext {
		const metadata: FormMetadata = initializeMetadata(options);
		const value = options.lastResult?.initialValue
			? flatten(options.lastResult.initialValue)
			: metadata.defaultValue;
		const error = options.lastResult?.error ?? {};

		return {
			metadata,
			initialValue: value,
			value,
			error,
			state: {
				validated: options.lastResult?.state?.validated ?? {},
				key: createKeyProxy(
					options.lastResult?.state?.key ?? getDefaultKey(metadata),
				),
				valid: createValidProxy(error),
				dirty: createDirtyProxy(metadata.defaultValue, value),
			},
		};
	}

	function getDefaultKey(metadata: FormMetadata): Record<string, string> {
		return Object.entries(metadata.defaultValue).reduce<Record<string, string>>(
			(result, [key, value]) => {
				if (Array.isArray(value)) {
					for (let i = 0; i < value.length; i++) {
						result[formatPaths([...getPaths(key), i])] = (
							Date.now() * Math.random()
						).toString(36);
					}
				}

				return result;
			},
			{},
		);
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
							  }${currentKey}`;

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

	function initializeMetadata(options: FormOptions<Type>): FormMetadata {
		return {
			defaultValue: flatten(options.defaultValue),
			constraint: options.constraint ?? {},
		};
	}

	function shouldNotify<Type>(config: {
		prev: Record<string, Type>;
		next: Record<string, Type>;
		compareFn: (prev: Type | undefined, next: Type | undefined) => boolean;
		cache: Record<string, boolean>;
		scope?: SubscriptionScope;
	}): boolean {
		if (config.scope) {
			const parents = config.scope.parent ?? [];
			const names = config.scope.name ?? [];
			const list =
				parents.length === 0
					? names
					: Array.from(
							new Set([
								...Object.keys(config.prev),
								...Object.keys(config.next),
							]),
					  );

			for (const name of list) {
				if (
					parents.length === 0 ||
					names.includes(name) ||
					parents.some((parent) => isSubpath(name, parent))
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
		const diff: Record<keyof SubscriptionSubject, Record<string, boolean>> = {
			value: {},
			error: {},
			defaultValue: {},
			key: {},
			validated: {},
			valid: {},
			dirty: {},
		};
		const prev = context;

		// Apply change before notifying subscribers
		context = next;

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
					cache: diff.defaultValue,
					scope: subject.defaultValue,
				}) ||
				shouldNotify({
					prev: prev.state.key,
					next: next.state.key,
					compareFn: (prev, next) => prev !== next,
					cache: diff.key,
					scope: subject.key,
				}) ||
				shouldNotify({
					prev: prev.state.valid,
					next: next.state.valid,
					compareFn: (prev, next) => prev !== next,
					cache: diff.valid,
					scope: subject.valid,
				}) ||
				shouldNotify({
					prev: prev.state.dirty,
					next: next.state.dirty,
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
				}) ||
				shouldNotify({
					prev: prev.state.validated,
					next: next.state.validated,
					compareFn: (prev = false, next = false) => prev !== next,
					cache: diff.validated,
					scope: subject.validated,
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
		input.value = JSON.stringify({
			key: context.state.key,
			validated: context.state.validated,
		});

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
		const validated = context.state.validated[element.name];

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
			const result = resolve(formData);
			const value = flatten(result.data);

			updateContext({
				...context,
				value,
				state: {
					...context.state,
					dirty: createDirtyProxy(context.metadata.defaultValue, value),
				},
			});
		} else {
			requestIntent(element.form, validate.serialize(element.name));
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

		requestIntent(element.form, validate.serialize(element.name));
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

		const metadata = initializeMetadata(latestOptions);

		updateContext({
			metadata,
			initialValue: metadata.defaultValue,
			value: metadata.defaultValue,
			error: {},
			state: {
				validated: {},
				key: createKeyProxy(getDefaultKey(metadata)),
				valid: createValidProxy({}),
				dirty: createDirtyProxy(metadata.defaultValue, metadata.defaultValue),
			},
		});
	}

	function report(result: SubmissionResult) {
		const formElement = getFormElement();

		if (typeof result.initialValue === 'undefined') {
			formElement.reset();
			return;
		}

		const key = createKeyProxy(result.state?.key ?? {});
		const value = flatten(result.initialValue);
		const keyToName = Object.fromEntries(
			Object.entries(context.state.key).map(([key, value]) => [value, key]),
		);
		const initialValue = flatten(
			Array.from(
				new Set([...Object.keys(context.initialValue), ...Object.keys(value)]),
			).reduce<Record<string, unknown>>((result, name) => {
				let data: unknown;

				if (
					!isPlainObject(context.initialValue[name]) &&
					!Array.isArray(context.initialValue[name])
				) {
					if (context.state.key[name] === key[name]) {
						data = context.initialValue[name];
					} else {
						data =
							context.initialValue[keyToName[key[name] as string] as string] ??
							value[name];
					}

					if (typeof data !== 'undefined') {
						setValue(result, name, () => data);
					}
				}

				return result;
			}, {}),
		);
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

		updateContext({
			...context,
			initialValue,
			value,
			error,
			state: {
				...context.state,
				validated: result.state?.validated ?? {},
				key,
				valid: createValidProxy(error),
				dirty: createDirtyProxy(context.metadata.defaultValue, value),
			},
		});

		for (const element of formElement.elements) {
			if (isFieldElement(element) && element.name !== '') {
				element.setCustomValidity(
					context.error[element.name]?.join(', ') ?? '',
				);
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

	function update(options: Omit<FormOptions<Type>, 'lastResult'>) {
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

	function getContext(): FormContext {
		return context;
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
		getContext,
	};
}
