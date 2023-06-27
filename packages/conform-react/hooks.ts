import {
	type FieldConstraint,
	type FieldElement,
	type FieldsetConstraint,
	type Submission,
	type KeysOf,
	type ResolveType,
	getFormData,
	getFormElement,
	getName,
	getPaths,
	isFieldElement,
	parse,
	updateList,
	validate,
	requestIntent,
	getValidationMessage,
	getErrors,
	getFormAction,
	getFormEncType,
	getFormMethod,
	getFormControls,
	focusFirstInvalidControl,
	isFocusableFormControl,
	parseIntent,
	VALIDATION_SKIPPED,
	VALIDATION_UNDEFINED,
} from '@conform-to/dom';
import {
	type FormEvent,
	type RefObject,
	useRef,
	useState,
	useEffect,
	useLayoutEffect,
	useMemo,
	useCallback,
} from 'react';

export type Primitive = null | undefined | string | number | boolean | Date;

export interface FieldConfig<Schema> extends FieldConstraint<Schema> {
	id?: string;
	name: string;
	defaultValue?: FieldValue<Schema>;
	initialError?: Record<string, string | string[]>;
	form?: string;
	descriptionId?: string;
	errorId?: string;

	/**
	 * The frist error of the field
	 */
	error?: string;

	/**
	 * All of the field errors
	 */
	errors?: string[];
}

export type FieldValue<Schema> = Schema extends Primitive
	? string
	: Schema extends File
	? File
	: Schema extends Array<infer InnerType>
	? Array<FieldValue<InnerType>>
	: unknown extends Schema
	? any
	: Record<string, any> extends Schema
	? { [Key in KeysOf<Schema>]?: FieldValue<ResolveType<Schema, Key>> }
	: any;

type SubmissionResult = {
	intent: Submission['intent'];
	payload: Submission['payload'] | null;
	error: Submission['error'];
};

export interface FormConfig<
	Output extends Record<string, any>,
	Input extends Record<string, any> = Output,
> {
	/**
	 * If the form id is provided, Id for label,
	 * input and error elements will be derived.
	 */
	id?: string;

	/**
	 * A form ref object. Conform will fallback to its own ref object if it is not provided.
	 */
	ref?: RefObject<HTMLFormElement>;

	/**
	 * Define when conform should start validation.
	 * Support "onSubmit", "onChange", "onBlur".
	 *
	 * @default "onSubmit"
	 */
	shouldValidate?: 'onSubmit' | 'onBlur' | 'onInput';

	/**
	 * Define when conform should revalidate again.
	 * Support "onSubmit", "onChange", "onBlur".
	 *
	 * @default shouldValidate, or "onSubmit" if shouldValidate is not provided.
	 */
	shouldRevalidate?: 'onSubmit' | 'onBlur' | 'onInput';

	/**
	 * An object representing the initial value of the form.
	 */
	defaultValue?: FieldValue<Input>;

	/**
	 * An object describing the result of the last submission
	 */
	lastSubmission?: SubmissionResult | null;

	/**
	 * An object describing the constraint of each field
	 */
	constraint?: FieldsetConstraint<Input>;

	/**
	 * Enable native validation before hydation.
	 *
	 * Default to `false`.
	 */
	fallbackNative?: boolean;

	/**
	 * Accept form submission regardless of the form validity.
	 *
	 * Default to `false`.
	 */
	noValidate?: boolean;

	/**
	 * A function to be called when the form should be (re)validated.
	 */
	onValidate?: ({
		form,
		formData,
	}: {
		form: HTMLFormElement;
		formData: FormData;
	}) => Submission | Submission<Output>;

	/**
	 * The submit event handler of the form. It will be called
	 * only when the form is considered valid.
	 */
	onSubmit?: (
		event: FormEvent<HTMLFormElement>,
		context: {
			formData: FormData;
			submission: Submission;
			action: string;
			encType: ReturnType<typeof getFormEncType>;
			method: ReturnType<typeof getFormMethod>;
		},
	) => void;
}

/**
 * Properties to be applied to the form element
 */
interface FormProps {
	id?: string;
	ref: RefObject<HTMLFormElement>;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
	noValidate: boolean;
	'aria-invalid'?: 'true';
	'aria-describedby'?: string;
}

interface Form {
	id?: string;
	errorId?: string;
	error: string;
	errors: string[];
	ref: RefObject<HTMLFormElement>;
	props: FormProps;
}

/**
 * Normalize error to an array of string.
 */
function normalizeError(error: string | string[] | undefined): string[] {
	if (!error) {
		// This treat both empty string and undefined as no error.
		return [];
	}

	return ([] as string[]).concat(error);
}

function useNoValidate(
	defaultNoValidate: boolean | undefined,
	validateBeforeHydrate: boolean | undefined,
): boolean {
	const [noValidate, setNoValidate] = useState(
		defaultNoValidate || !validateBeforeHydrate,
	);

	useEffect(() => {
		setNoValidate(true);
	}, []);

	return noValidate;
}

function useFormRef(userProvidedRef: RefObject<HTMLFormElement> | undefined) {
	const formRef = useRef<HTMLFormElement>(null);

	return userProvidedRef ?? formRef;
}

function useConfigRef<Config>(config: Config) {
	const ref = useRef(config);

	useSafeLayoutEffect(() => {
		ref.current = config;
	});

	return ref;
}

function useFormReporter(
	ref: RefObject<HTMLFormElement>,
	lastSubmission: SubmissionResult | null | undefined,
) {
	const [submission, setSubmission] = useState(lastSubmission);
	const report = useCallback(
		(form: HTMLFormElement, submission: SubmissionResult) => {
			const event = new CustomEvent('conform', { detail: submission.intent });

			form.dispatchEvent(event);
			setSubmission(submission);
		},
		[],
	);

	useEffect(() => {
		const form = ref.current;

		if (!form || typeof lastSubmission === 'undefined') {
			return;
		}

		if (!lastSubmission?.payload) {
			// If the default value is empty, we can safely reset the form.
			// This ensure the behavior is consistent with and without JS.
			form.reset();

			// There is no need to report the submission anymore.
			return;
		}

		report(form, lastSubmission);
	}, [ref, lastSubmission, report]);

	useEffect(() => {
		const form = ref.current;

		if (!form || !submission) {
			return;
		}

		reportSubmission(form, submission);
	}, [ref, submission]);

	return report;
}

function useFormError(
	ref: RefObject<HTMLFormElement | HTMLFieldSetElement>,
	config: {
		initialError: Record<string, string | string[] | undefined> | undefined;
		name?: string;
	},
) {
	const [error, setError] = useState(() => {
		if (!config.initialError) {
			return {};
		}

		const result: Record<string | number, string[] | undefined> = {};

		for (const [name, message] of Object.entries(config.initialError)) {
			const paths = getPaths(name);

			if (paths.length === 1) {
				result[paths[0]] = normalizeError(message);
			}
		}

		return result;
	});

	useEffect(() => {
		const handleInvalid = (event: Event) => {
			const form = getFormElement(ref.current);
			const element = event.target;

			if (
				!isFieldElement(element) ||
				element.form !== form ||
				!element.dataset.conformTouched
			) {
				return;
			}

			let key: string | number = element.name;

			if (config.name) {
				const scopePaths = getPaths(config.name);
				const fieldPaths = getPaths(element.name);

				for (let i = 0; i <= scopePaths.length; i++) {
					const path = fieldPaths[i];

					if (i < scopePaths.length) {
						// Skip if the field is not in the scope
						if (path !== scopePaths[i]) {
							return;
						}
					} else {
						key = path;
					}
				}
			}

			setError((prev) => {
				if (element.validationMessage === getValidationMessage(prev[key])) {
					return prev;
				}

				return {
					...prev,
					[key]: getErrors(element.validationMessage),
				};
			});

			event.preventDefault();
		};
		const handleReset = (event: Event) => {
			const form = getFormElement(ref.current);

			if (form && event.target === form) {
				setError({});
			}
		};

		document.addEventListener('reset', handleReset);
		document.addEventListener('invalid', handleInvalid, true);

		return () => {
			document.removeEventListener('reset', handleReset);
			document.removeEventListener('invalid', handleInvalid, true);
		};
	}, [ref, config.name]);

	return [error, setError] as const;
}

/**
 * Returns properties required to hook into form events.
 * Applied custom validation and define when error should be reported.
 *
 * @see https://conform.guide/api/react#useform
 */
export function useForm<
	Output extends Record<string, any>,
	Input extends Record<string, any> = Output,
>(config: FormConfig<Output, Input> = {}): [Form, Fieldset<Input>] {
	const configRef = useConfigRef(config);
	const ref = useFormRef(config.ref);
	const noValidate = useNoValidate(config.noValidate, config.fallbackNative);
	const report = useFormReporter(ref, config.lastSubmission);
	const [errors, setErrors] = useState<string[]>(() =>
		normalizeError(config.lastSubmission?.error['']),
	);
	const initialError = useMemo(() => {
		const submission = config.lastSubmission;

		if (!submission) {
			return {};
		}

		const intent = parseIntent(submission.intent);
		const scope = getScope(intent);

		return scope === null
			? submission.error
			: { [scope]: submission.error[scope] };
	}, [config.lastSubmission]);
	// This payload from lastSubmission is only useful before hydration
	// After hydration, any new payload on lastSubmission will be ignored
	const [defaultValueFromLastSubmission, setDefaultValueFromLastSubmission] =
		useState<FieldValue<Input> | null>(
			// @ts-expect-error defaultValue is not in Submission type
			config.lastSubmission?.payload ?? null,
		);
	const fieldset = useFieldset(ref, {
		defaultValue: defaultValueFromLastSubmission ?? config.defaultValue,
		initialError,
		constraint: config.constraint,
		form: config.id,
	});

	useEffect(() => {
		// custom validate handler
		const createValidateHandler = (type: string) => (event: Event) => {
			const field = event.target;
			const form = ref.current;
			const { shouldValidate = 'onSubmit', shouldRevalidate = shouldValidate } =
				configRef.current;

			if (
				!form ||
				!isFocusableFormControl(field) ||
				field.form !== form ||
				!field.name
			) {
				return;
			}

			if (
				field.dataset.conformTouched
					? shouldRevalidate === type
					: shouldValidate === type
			) {
				requestIntent(form, validate(field.name));
			}
		};
		const handleInvalid = (event: Event) => {
			const form = ref.current;
			const field = event.target;

			if (
				!form ||
				!isFieldElement(field) ||
				field.form !== form ||
				field.name !== FORM_ERROR_ELEMENT_NAME
			) {
				return;
			}

			event.preventDefault();

			if (field.dataset.conformTouched) {
				setErrors(getErrors(field.validationMessage));
			}
		};
		const handleReset = (event: Event) => {
			const form = ref.current;

			if (!form || event.target !== form) {
				return;
			}

			// Reset all field state
			for (const element of getFormControls(form)) {
				delete element.dataset.conformTouched;
				element.setCustomValidity('');
			}

			setErrors([]);
			setDefaultValueFromLastSubmission(null);
		};

		const handleInput = createValidateHandler('onInput');
		const handleBlur = createValidateHandler('onBlur');

		document.addEventListener('input', handleInput, true);
		document.addEventListener('blur', handleBlur, true);
		document.addEventListener('invalid', handleInvalid, true);
		document.addEventListener('reset', handleReset);

		return () => {
			document.removeEventListener('input', handleInput, true);
			document.removeEventListener('blur', handleBlur, true);
			document.removeEventListener('invalid', handleInvalid, true);
			document.removeEventListener('reset', handleReset);
		};
	}, [ref, configRef]);

	const form: Form = {
		ref,
		error: errors[0],
		errors,
		props: {
			ref,
			noValidate,
			onSubmit(event) {
				const form = event.currentTarget;
				const nativeEvent = event.nativeEvent as SubmitEvent;
				const submitter = nativeEvent.submitter as
					| HTMLButtonElement
					| HTMLInputElement
					| null;

				if (event.defaultPrevented) {
					return;
				}

				try {
					const formData = getFormData(form, submitter);
					const submission =
						config.onValidate?.({ form, formData }) ?? parse(formData);
					const { errors, shouldServerValidate } = Object.entries(
						submission.error,
					).reduce<{ errors: string[]; shouldServerValidate: boolean }>(
						(result, [, error]) => {
							for (const message of normalizeError(error)) {
								if (message === VALIDATION_UNDEFINED) {
									result.shouldServerValidate = true;
								} else if (message !== VALIDATION_SKIPPED) {
									result.errors.push(message);
								}
							}

							return result;
						},
						{
							errors: [],
							shouldServerValidate: false,
						},
					);

					if (
						// has client validation
						typeof config.onValidate !== 'undefined' &&
						// not necessary to validate on the server
						!shouldServerValidate &&
						// client validation failed or non submit intent
						((!config.noValidate &&
							!submitter?.formNoValidate &&
							errors.length > 0) ||
							parseIntent(submission.intent) !== null)
					) {
						report(form, submission);
						event.preventDefault();
					} else {
						config.onSubmit?.(event, {
							formData,
							submission,
							action: getFormAction(nativeEvent),
							encType: getFormEncType(nativeEvent),
							method: getFormMethod(nativeEvent),
						});
					}
				} catch (error) {
					// eslint-disable-next-line no-console
					console.warn('Client validation failed', error);
				}
			},
		},
	};

	if (config.id) {
		form.id = config.id;
		form.errorId = `${config.id}-error`;
		form.props.id = form.id;
	}

	if (form.errorId && form.errors.length > 0) {
		form.props['aria-invalid'] = 'true';
		form.props['aria-describedby'] = form.errorId;
	}

	return [form, fieldset];
}

/**
 * A set of field configuration
 */
export type Fieldset<Schema extends Record<string, any> | undefined> = {
	[Key in KeysOf<Schema>]-?: FieldConfig<ResolveType<Schema, Key>>;
};

export interface FieldsetConfig<
	Schema extends Record<string, any> | undefined,
> {
	/**
	 * The prefix used to generate the name of nested fields.
	 */
	name?: string;

	/**
	 * An object representing the initial value of the fieldset.
	 */
	defaultValue?: FieldValue<Schema>;

	/**
	 * An object describing the initial error of each field
	 */
	initialError?: Record<string, string | string[]>;

	/**
	 * An object describing the constraint of each field
	 */
	constraint?: FieldsetConstraint<Schema>;

	/**
	 * The id of the form, connecting each field to a form remotely
	 */
	form?: string;
}

/**
 * Returns all the information about the fieldset.
 *
 * @see https://conform.guide/api/react#usefieldset
 */
export function useFieldset<Schema extends Record<string, any> | undefined>(
	ref: RefObject<HTMLFormElement | HTMLFieldSetElement>,
	config: FieldsetConfig<Schema>,
): Fieldset<Schema>;
export function useFieldset<Schema extends Record<string, any> | undefined>(
	ref: RefObject<HTMLFormElement | HTMLFieldSetElement>,
	config: FieldConfig<Schema>,
): Fieldset<Schema>;
export function useFieldset<Schema extends Record<string, any> | undefined>(
	ref: RefObject<HTMLFormElement | HTMLFieldSetElement>,
	config: FieldsetConfig<Schema> | FieldConfig<Schema>,
): Fieldset<Schema> {
	const [error] = useFormError(ref, {
		initialError: config.initialError,
		name: config.name,
	});

	/**
	 * This allows us constructing the field at runtime as we have no information
	 * about which fields would be available. The proxy will also help tracking
	 * the usage of each field for optimization in the future.
	 */
	return new Proxy(
		{},
		{
			get(_target, key: KeysOf<Schema>) {
				if (typeof key !== 'string') {
					return;
				}

				const fieldsetConfig = config as FieldsetConfig<Schema>;
				const constraint = fieldsetConfig.constraint?.[key];
				const errors = error?.[key];
				const initialError = Object.entries(
					fieldsetConfig.initialError ?? {},
				).reduce((result, [name, message]) => {
					const [field, ...paths] = getPaths(name);

					if (field === key) {
						result[getName(paths)] = message;
					}

					return result;
				}, {} as Record<string, string | string[]>);
				const field: FieldConfig<any> = {
					...constraint,
					name: fieldsetConfig.name ? `${fieldsetConfig.name}.${key}` : key,
					// @ts-expect-error The FieldValue type might need a rework
					defaultValue: fieldsetConfig.defaultValue?.[key],
					initialError,
					error: errors?.[0],
					errors,
				};

				if (fieldsetConfig.form) {
					field.form = fieldsetConfig.form;
					field.id = `${fieldsetConfig.form}-${field.name}`;
					field.errorId = `${field.id}-error`;
					field.descriptionId = `${field.id}-description`;
				}

				return field;
			},
		},
	) as Fieldset<Schema>;
}

/**
 * Returns a list of key and field config.
 *
 * @see https://conform.guide/api/react#usefieldlist
 */
export function useFieldList<Schema extends Array<any> | undefined>(
	ref: RefObject<HTMLFormElement | HTMLFieldSetElement>,
	config: FieldConfig<Schema>,
): Array<
	{ key: string } & FieldConfig<Schema extends Array<infer Item> ? Item : never>
> {
	const configRef = useConfigRef(config);
	const [error, setError] = useFormError(ref, {
		initialError: config.initialError,
		name: config.name,
	});
	const [entries, setEntries] = useState<
		Array<
			[
				string,
				FieldValue<Schema extends Array<infer Item> ? Item : never> | undefined,
			]
		>
	>(() => Object.entries(config.defaultValue ?? [undefined]));

	useEffect(() => {
		const conformHandler = (event: CustomEvent) => {
			const form = getFormElement(ref.current);

			if (!form || event.target !== form) {
				return;
			}

			const intent = parseIntent<
				FieldValue<Schema extends Array<infer Item> ? Item : never>
			>(event.detail);

			if (
				intent?.type !== 'list' ||
				intent?.payload.name !== configRef.current.name
			) {
				return;
			}

			setEntries((entries) => {
				let list = [...entries];

				switch (intent.payload.operation) {
					case 'append':
					case 'prepend':
					case 'replace':
						return updateList(list, {
							...intent.payload,
							defaultValue: [
								// Generate a random key to avoid conflicts
								crypto.getRandomValues(new Uint32Array(1))[0].toString(36),
								intent.payload.defaultValue,
							],
						});
					default:
						return updateList(list, intent.payload);
				}
			});
			setError((error) => {
				let errorList: Array<string[] | undefined> = [];

				for (const [key, messages] of Object.entries(error)) {
					if (typeof key === 'number') {
						errorList[key] = messages;
					}
				}

				switch (intent.payload.operation) {
					case 'append':
					case 'prepend':
					case 'replace':
						errorList = updateList(errorList, {
							...intent.payload,
							defaultValue: undefined,
						});
						break;
					default:
						errorList = updateList(errorList, intent.payload);
						break;
				}

				return Object.assign({}, errorList) as any;
			});
		};
		const resetHandler = (event: Event) => {
			const form = getFormElement(ref.current);

			if (!form || event.target !== form) {
				return;
			}

			setEntries(Object.entries(configRef.current.defaultValue ?? [undefined]));
		};

		// @ts-expect-error Custom event: conform
		document.addEventListener('conform', conformHandler, true);
		document.addEventListener('reset', resetHandler);

		return () => {
			// @ts-expect-error Custom event: conform
			document.removeEventListener('conform', conformHandler, true);
			document.removeEventListener('reset', resetHandler);
		};
	}, [ref, configRef, setError]);

	return entries.map(([key, defaultValue], index) => {
		const errors = error[index];
		const initialError = Object.entries(config.initialError ?? {}).reduce(
			(result, [name, message]) => {
				const [field, ...paths] = getPaths(name);

				if (field === index) {
					result[getName(paths)] = message;
				}

				return result;
			},
			{} as Record<string, string | string[]>,
		);
		const fieldConfig: FieldConfig<
			Schema extends Array<infer Item> ? Item : never
		> = {
			name: `${config.name}[${index}]`,
			defaultValue: defaultValue ?? config.defaultValue?.[index],
			initialError,
			error: errors?.[0],
			errors,
		};

		if (config.form) {
			fieldConfig.form = config.form;
			fieldConfig.id = `${config.form}-${config.name}`;
			fieldConfig.errorId = `${fieldConfig.id}-error`;
			fieldConfig.descriptionId = `${fieldConfig.id}-description`;
		}

		return {
			key,
			...fieldConfig,
		};
	});
}

/**
 * useLayoutEffect is client-only.
 * This basically makes it a no-op on server
 */
const useSafeLayoutEffect =
	typeof document === 'undefined' ? useEffect : useLayoutEffect;

interface InputControl {
	change: (
		eventOrValue: { target: { value: string } } | string | boolean,
	) => void;
	focus: () => void;
	blur: () => void;
}

export function useEventListeners(type: string, ref: RefObject<FieldElement>) {
	useSafeLayoutEffect(() => {
		const listener = (event: Event) => {};

		document.addEventListener(type, listener);

		return () => {
			document.removeEventListener(type, listener);
		};
	}, [type, ref]);
}

/**
 * Returns a ref object and a set of helpers that dispatch corresponding dom event.
 *
 * @see https://conform.guide/api/react#useinputevent
 */
export function useInputEvent(options: {
	ref:
		| RefObject<FieldElement>
		| (() => Element | RadioNodeList | FieldElement | null | undefined);
	onInput?: (event: Event) => void;
	onFocus?: (event: FocusEvent) => void;
	onBlur?: (event: FocusEvent) => void;
	onReset?: (event: Event) => void;
}): InputControl {
	const optionsRef = useConfigRef(options);
	const eventDispatched = useRef({
		onInput: false,
		onFocus: false,
		onBlur: false,
	});

	useSafeLayoutEffect(() => {
		const createEventListener = (
			listener: Exclude<keyof typeof options, 'ref'>,
		) => {
			return (event: any) => {
				const element =
					typeof optionsRef.current?.ref === 'function'
						? optionsRef.current?.ref()
						: optionsRef.current?.ref.current;

				if (
					isFieldElement(element) &&
					(listener === 'onReset'
						? event.target === element.form
						: event.target === element)
				) {
					if (listener !== 'onReset') {
						eventDispatched.current[listener] = true;
					}

					optionsRef.current?.[listener]?.(event);
				}
			};
		};
		const inputHandler = createEventListener('onInput');
		const focusHandler = createEventListener('onFocus');
		const blurHandler = createEventListener('onBlur');
		const resetHandler = createEventListener('onReset');

		// focus/blur event does not bubble
		document.addEventListener('input', inputHandler, true);
		document.addEventListener('focus', focusHandler, true);
		document.addEventListener('blur', blurHandler, true);
		document.addEventListener('reset', resetHandler);

		return () => {
			document.removeEventListener('input', inputHandler, true);
			document.removeEventListener('focus', focusHandler, true);
			document.removeEventListener('blur', blurHandler, true);
			document.removeEventListener('reset', resetHandler);
		};
	}, []);

	const control = useMemo<InputControl>(() => {
		const dispatch = (
			listener: Exclude<keyof typeof options, 'ref' | 'onReset'>,
			fn: (element: FieldElement) => void,
		) => {
			if (!eventDispatched.current[listener]) {
				const element =
					typeof optionsRef.current?.ref === 'function'
						? optionsRef.current?.ref()
						: optionsRef.current?.ref.current;

				if (!isFieldElement(element)) {
					// eslint-disable-next-line no-console
					console.warn('Failed to dispatch event; is the input mounted?');
					return;
				}

				// To avoid recursion
				eventDispatched.current[listener] = true;
				fn(element);
			}

			eventDispatched.current[listener] = false;
		};

		return {
			change(eventOrValue) {
				dispatch('onInput', (element) => {
					if (
						element instanceof HTMLInputElement &&
						(element.type === 'checkbox' || element.type === 'radio')
					) {
						if (typeof eventOrValue !== 'boolean') {
							throw new Error(
								'You should pass a boolean when changing a checkbox or radio input',
							);
						}

						element.checked = eventOrValue;
					} else {
						if (typeof eventOrValue === 'boolean') {
							throw new Error(
								'You can pass a boolean only when changing a checkbox or radio input',
							);
						}

						const value =
							typeof eventOrValue === 'string'
								? eventOrValue
								: eventOrValue.target.value;

						// No change event will triggered on React if `element.value` is updated
						// before dispatching the event
						if (element.value !== value) {
							/**
							 * Triggering react custom change event
							 * Solution based on dom-testing-library
							 * @see https://github.com/facebook/react/issues/10135#issuecomment-401496776
							 * @see https://github.com/testing-library/dom-testing-library/blob/main/src/events.js#L104-L123
							 */
							const { set: valueSetter } =
								Object.getOwnPropertyDescriptor(element, 'value') || {};
							const prototype = Object.getPrototypeOf(element);
							const { set: prototypeValueSetter } =
								Object.getOwnPropertyDescriptor(prototype, 'value') || {};

							if (
								prototypeValueSetter &&
								valueSetter !== prototypeValueSetter
							) {
								prototypeValueSetter.call(element, value);
							} else {
								if (valueSetter) {
									valueSetter.call(element, value);
								} else {
									throw new Error(
										'The given element does not have a value setter',
									);
								}
							}
						}
					}

					// Dispatch input event with the updated input value
					element.dispatchEvent(new InputEvent('input', { bubbles: true }));
					// Dispatch change event (necessary for select to update the selected option)
					element.dispatchEvent(new Event('change', { bubbles: true }));
				});
			},
			focus() {
				dispatch('onFocus', (element) => {
					element.dispatchEvent(
						new FocusEvent('focusin', {
							bubbles: true,
						}),
					);
					element.dispatchEvent(new FocusEvent('focus'));
				});
			},
			blur() {
				dispatch('onBlur', (element) => {
					element.dispatchEvent(
						new FocusEvent('focusout', {
							bubbles: true,
						}),
					);
					element.dispatchEvent(new FocusEvent('blur'));
				});
			},
		};
	}, [optionsRef]);

	return control;
}
export const FORM_ERROR_ELEMENT_NAME = '__form__';

/**
 * Validate the form with the Constraint Validation API
 * @see https://conform.guide/api/react#validateconstraint
 */
export function validateConstraint(options: {
	form: HTMLFormElement;
	formData?: FormData;
	constraint?: Record<
		Lowercase<string>,
		(
			value: string,
			context: { formData: FormData; attributeValue: string },
		) => boolean
	>;
	acceptMultipleErrors?: ({
		name,
		intent,
		payload,
	}: {
		name: string;
		intent: string;
		payload: Record<string, any>;
	}) => boolean;
	formatMessages?: ({
		name,
		validity,
		constraint,
		defaultErrors,
	}: {
		name: string;
		validity: ValidityState;
		constraint: Record<string, boolean>;
		defaultErrors: string[];
	}) => string[];
}): Submission {
	const formData = options?.formData ?? new FormData(options.form);
	const getDefaultErrors = (
		validity: ValidityState,
		result: Record<string, boolean>,
	) => {
		const errors: Array<string> = [];

		if (validity.valueMissing) errors.push('required');
		if (validity.typeMismatch || validity.badInput) errors.push('type');
		if (validity.tooShort) errors.push('minLength');
		if (validity.rangeUnderflow) errors.push('min');
		if (validity.stepMismatch) errors.push('step');
		if (validity.tooLong) errors.push('maxLength');
		if (validity.rangeOverflow) errors.push('max');
		if (validity.patternMismatch) errors.push('pattern');

		for (const [constraintName, valid] of Object.entries(result)) {
			if (!valid) {
				errors.push(constraintName);
			}
		}

		return errors;
	};
	const formatMessages =
		options?.formatMessages ?? (({ defaultErrors }) => defaultErrors);

	return parse(formData, {
		resolve(payload, intent) {
			const error: Record<string, string | string[]> = {};
			const constraintPattern = /^constraint[A-Z][^A-Z]*$/;
			for (const element of options.form.elements) {
				if (isFieldElement(element)) {
					const name =
						element.name !== FORM_ERROR_ELEMENT_NAME ? element.name : '';
					const constraint = Object.entries(element.dataset).reduce<
						Record<string, boolean>
					>((result, [name, attributeValue = '']) => {
						if (constraintPattern.test(name)) {
							const constraintName = name
								.slice(10)
								.toLowerCase() as Lowercase<string>;
							const validate = options.constraint?.[constraintName];

							if (typeof validate === 'function') {
								result[constraintName] = validate(element.value, {
									formData,
									attributeValue,
								});
							} else {
								// eslint-disable-next-line no-console
								console.warn(
									`Found an "${constraintName}" constraint with undefined definition; Please specify it on the validateConstraint API.`,
								);
							}
						}

						return result;
					}, {});
					const errors = formatMessages({
						name,
						validity: element.validity,
						constraint,
						defaultErrors: getDefaultErrors(element.validity, constraint),
					});
					const shouldAcceptMultipleErrors =
						options?.acceptMultipleErrors?.({
							name,
							payload,
							intent,
						}) ?? false;

					if (errors.length > 0) {
						error[name] = shouldAcceptMultipleErrors ? errors : errors[0];
					}
				}
			}

			return { error };
		},
	});
}

export function reportSubmission(
	form: HTMLFormElement,
	submission: SubmissionResult,
): void {
	for (const [name, message] of Object.entries(submission.error)) {
		// There is no need to create a placeholder button if all we want is to reset the error
		if (message === '') {
			continue;
		}

		// We can't use empty string as button name
		// As `form.element.namedItem('')` will always returns null
		const elementName = name ? name : FORM_ERROR_ELEMENT_NAME;
		const item = form.elements.namedItem(elementName);

		if (item instanceof RadioNodeList) {
			for (const field of item) {
				if ((field as FieldElement).type !== 'radio') {
					// eslint-disable-next-line no-console
					console.warn('Repeated field name is not supported.');
					continue;
				}
			}
		}

		if (item === null) {
			// Create placeholder button to keep the error without contributing to the form data
			const button = document.createElement('button');

			button.name = elementName;
			button.hidden = true;
			button.dataset.conformTouched = 'true';

			form.appendChild(button);
		}
	}

	const intent = parseIntent(submission.intent);
	const scope = getScope(intent);

	for (const element of getFormControls(form)) {
		const elementName =
			element.name !== FORM_ERROR_ELEMENT_NAME ? element.name : '';
		const messages = normalizeError(submission.error[elementName]);

		if (scope === null || scope === elementName) {
			element.dataset.conformTouched = 'true';
		}

		if (
			!messages.includes(VALIDATION_SKIPPED) &&
			!messages.includes(VALIDATION_UNDEFINED)
		) {
			const invalidEvent = new Event('invalid', { cancelable: true });

			element.setCustomValidity(getValidationMessage(messages));
			element.dispatchEvent(invalidEvent);
		}
	}

	if (!intent) {
		focusFirstInvalidControl(form);
	}
}

export function getScope(
	intent: ReturnType<typeof parseIntent>,
): string | null {
	switch (intent?.type) {
		case 'validate':
			return intent.payload;
		case 'list':
			return intent.payload.name;
	}

	return null;
}
