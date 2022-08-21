import {
	type FieldConfig,
	type FieldError,
	type FieldValue,
	type FieldElement,
	type FieldsetConstraint,
	type ListCommand,
	type Primitive,
	isFieldElement,
	getKey,
	listCommandKey,
	serializeListCommand,
	parseListCommand,
	updateList,
	getFormElement,
} from '@conform-to/dom';
import {
	type InputHTMLAttributes,
	type FormEvent,
	type FormHTMLAttributes,
	type RefObject,
	useRef,
	useState,
	useEffect,
} from 'react';
import { input } from './helpers';

export interface FormConfig {
	/**
	 * Define when the error should be reported initially.
	 * Support "onSubmit", "onChange", "onBlur".
	 *
	 * Default to `onSubmit`
	 */
	initialReport?: 'onSubmit' | 'onChange' | 'onBlur';

	/**
	 * Enable native validation before hydation.
	 */
	fallbackNative?: boolean;

	/**
	 * Allow the form to be submitted regardless of the form validity.
	 */
	noValidate?: boolean;

	/**
	 * A function to be called when the form should be (re)validated.
	 */
	validate?: (
		form: HTMLFormElement,
		submitter?: HTMLInputElement | HTMLButtonElement | null,
	) => void;

	/**
	 * The submit event handler of the form. It will be called
	 * only when the form is considered valid.
	 */
	onSubmit?: FormHTMLAttributes<HTMLFormElement>['onSubmit'];
}

interface FormProps {
	ref: RefObject<HTMLFormElement>;
	onSubmit: Required<FormHTMLAttributes<HTMLFormElement>>['onSubmit'];
	noValidate: Required<FormHTMLAttributes<HTMLFormElement>>['noValidate'];
}

export function useForm(config: FormConfig = {}): FormProps {
	const { validate } = config;

	const ref = useRef<HTMLFormElement>(null);
	const [noValidate, setNoValidate] = useState(
		config.noValidate || !config.fallbackNative,
	);

	useEffect(() => {
		setNoValidate(true);
	}, []);

	useEffect(() => {
		if (config.noValidate) {
			return;
		}

		if (ref.current) {
			validate?.(ref.current);
		}

		const handleInput = (event: Event) => {
			const field = event.target;
			const form = ref.current;

			if (!form || !isFieldElement(field) || field.form !== form) {
				return;
			}

			validate?.(form);

			if (config.initialReport === 'onChange') {
				field.dataset.conformTouched = 'true';
			}

			for (const field of form.elements) {
				if (isFieldElement(field) && field.dataset.conformTouched) {
					field.reportValidity();
				}
			}
		};
		const handleFocusout = (event: FocusEvent) => {
			const field = event.target;
			const form = ref.current;

			if (
				!form ||
				!isFieldElement(field) ||
				field.form !== form ||
				config.initialReport !== 'onBlur'
			) {
				return;
			}

			field.dataset.conformTouched = 'true';
			field.reportValidity();
		};
		const handleReset = (event: Event) => {
			const form = ref.current;

			if (!form || event.target !== form) {
				return;
			}

			for (const field of form.elements) {
				if (isFieldElement(field)) {
					delete field.dataset.conformTouched;
				}
			}

			setTimeout(() => {
				validate?.(form);
			}, 0);
		};

		document.addEventListener('input', handleInput, true);
		document.addEventListener('focusout', handleFocusout);
		document.addEventListener('reset', handleReset);

		return () => {
			document.removeEventListener('input', handleInput, true);
			document.removeEventListener('focusout', handleFocusout);
			document.removeEventListener('reset', handleReset);
		};
	}, [validate, config.initialReport, config.noValidate]);

	return {
		ref,
		noValidate,
		onSubmit(event) {
			const form = event.currentTarget;
			const nativeEvent = event.nativeEvent as SubmitEvent;
			const submitter =
				nativeEvent.submitter instanceof HTMLButtonElement ||
				nativeEvent.submitter instanceof HTMLInputElement
					? nativeEvent.submitter
					: null;

			validate?.(form, submitter);

			if (!config.noValidate && !event.defaultPrevented) {
				for (const field of form.elements) {
					if (isFieldElement(field)) {
						field.dataset.conformTouched = 'true';
					}
				}

				if (
					!submitter?.formNoValidate &&
					!event.currentTarget.reportValidity()
				) {
					event.preventDefault();
					return;
				}
			}

			config.onSubmit?.(event);
		},
	};
}

export type Field<Schema> = {
	config: FieldConfig<Schema>;
	error?: string;
};

export type Fieldset<Schema extends Record<string, any>> = {
	[Key in keyof Schema]-?: Field<Schema[Key]>;
};

export interface FieldsetConfig<Schema extends Record<string, any>> {
	name?: string;
	defaultValue?: FieldValue<Schema>;
	initialError?: FieldError<Schema>['details'];
	constraint?: FieldsetConstraint<Schema>;
	form?: string;
}

export function useFieldset<Schema extends Record<string, any>>(
	ref: RefObject<HTMLFormElement> | RefObject<HTMLFieldSetElement>,
	config?: FieldsetConfig<Schema>,
): Fieldset<Schema>;
export function useFieldset<Schema extends Record<string, any>>(
	ref: RefObject<HTMLFormElement> | RefObject<HTMLFieldSetElement>,
	config?: FieldConfig<Schema>,
): Fieldset<Schema>;
export function useFieldset<Schema extends Record<string, any>>(
	ref: RefObject<HTMLFormElement> | RefObject<HTMLFieldSetElement>,
	config?: FieldsetConfig<Schema> | FieldConfig<Schema>,
): Fieldset<Schema> {
	const [error, setError] = useState<Record<string, string | undefined>>(() => {
		const result: Record<string, string> = {};

		for (const [key, error] of Object.entries(config?.initialError ?? {})) {
			if (error?.message) {
				result[key] = error.message;
			}
		}

		return result;
	});

	useEffect(() => {
		const resetError = (form: HTMLFormElement) => {
			setError((prev) => {
				let next = prev;

				for (const field of form.elements) {
					if (isFieldElement(field)) {
						const key = getKey(field.name, config?.name);

						if (key) {
							const prevMessage = next?.[key] ?? '';
							const nextMessage = field.validationMessage;

							if (prevMessage !== '' && prevMessage !== nextMessage) {
								next = {
									...next,
									[key]: nextMessage,
								};
							}
						}
					}
				}

				return next;
			});
		};
		const handleInput = (event: Event) => {
			const form = getFormElement(ref.current);
			const field = event.target;

			if (!form || !isFieldElement(field) || field.form !== form) {
				return;
			}

			resetError(form);
		};
		const invalidHandler = (event: Event) => {
			const form = getFormElement(ref.current);
			const field = event.target;

			if (!form || !isFieldElement(field) || field.form !== form) {
				return;
			}

			const key = getKey(field.name, config?.name);

			if (key) {
				setError((prev) => {
					const prevMessage = prev?.[key] ?? '';

					if (prevMessage === field.validationMessage) {
						return prev;
					}

					return {
						...prev,
						[key]: field.validationMessage,
					};
				});

				event.preventDefault();
			}
		};
		const submitHandler = (event: SubmitEvent) => {
			const form = getFormElement(ref.current);

			if (!form || event.target !== form) {
				return;
			}

			resetError(form);
		};
		const resetHandler = (event: Event) => {
			const form = getFormElement(ref.current);

			if (!form || event.target !== form) {
				return;
			}

			setError({});
		};

		document.addEventListener('input', handleInput);
		document.addEventListener('invalid', invalidHandler, true);
		document.addEventListener('submit', submitHandler);
		document.addEventListener('reset', resetHandler);

		return () => {
			document.removeEventListener('input', handleInput);
			document.removeEventListener('invalid', invalidHandler, true);
			document.removeEventListener('submit', submitHandler);
			document.removeEventListener('reset', resetHandler);
		};
	}, [ref, config?.name]);

	useEffect(() => {
		setError((prev) => {
			let next = prev;

			for (const [key, error] of Object.entries(config?.initialError ?? {})) {
				if (next[key] !== error?.message) {
					next = {
						...next,
						[key]: error?.message ?? '',
					};
				}
			}

			return next;
		});
	}, [config?.name, config?.initialError]);

	return new Proxy(
		{},
		{
			get(_target, key) {
				if (typeof key !== 'string') {
					return;
				}

				const constraint = (config as FieldsetConfig<Schema>)?.constraint?.[
					key
				];
				const field: Field<unknown> = {
					config: {
						name: config?.name ? `${config.name}.${key}` : key,
						form: config?.form,
						defaultValue: config?.defaultValue?.[key],
						initialError: config?.initialError?.[key]?.details,
						...constraint,
					},
					error: error?.[key] ?? '',
				};

				return field;
			},
		},
	) as Fieldset<Schema>;
}

interface ControlButtonProps {
	name?: string;
	value?: string;
	form?: string;
	formNoValidate: true;
}

type CommandPayload<
	Schema,
	Type extends ListCommand<FieldValue<Schema>>['type'],
> = Extract<ListCommand<FieldValue<Schema>>, { type: Type }>['payload'];

interface ListControl<Schema> {
	prepend(payload?: CommandPayload<Schema, 'prepend'>): ControlButtonProps;
	append(payload?: CommandPayload<Schema, 'append'>): ControlButtonProps;
	replace(payload: CommandPayload<Schema, 'replace'>): ControlButtonProps;
	remove(payload: CommandPayload<Schema, 'remove'>): ControlButtonProps;
	reorder(payload: CommandPayload<Schema, 'reorder'>): ControlButtonProps;
}

export function useFieldList<Payload = any>(
	ref: RefObject<HTMLFormElement> | RefObject<HTMLFieldSetElement>,
	config: FieldConfig<Array<Payload>>,
): [
	Array<{
		key: string;
		config: FieldConfig<Payload>;
	}>,
	ListControl<Payload>,
] {
	const [entries, setEntries] = useState<
		Array<[string, FieldValue<Payload> | undefined]>
	>(() => Object.entries(config.defaultValue ?? [undefined]));
	const list = entries.map<{ key: string; config: FieldConfig<Payload> }>(
		([key, defaultValue], index) => ({
			key: `${key}`,
			config: {
				...config,
				name: `${config.name}[${index}]`,
				defaultValue: defaultValue ?? config.defaultValue?.[index],
				initialError: config.initialError?.[index]?.details,
			},
		}),
	);
	const control = new Proxy(
		{},
		{
			get(_target, type: any) {
				return (payload: any = {}) => {
					return {
						name: listCommandKey,
						value: serializeListCommand(config.name, { type, payload }),
						form: config.form,
						formNoValidate: true,
					};
				};
			},
		},
	) as ListControl<Payload>;

	useEffect(() => {
		setEntries(Object.entries(config.defaultValue ?? [undefined]));

		const submitHandler = (event: SubmitEvent) => {
			const form = getFormElement(ref.current);

			if (
				!form ||
				event.target !== form ||
				!(event.submitter instanceof HTMLButtonElement) ||
				event.submitter.name !== listCommandKey
			) {
				return;
			}

			const [name, command] = parseListCommand(event.submitter.value);

			if (name !== config.name) {
				return;
			}

			switch (command.type) {
				case 'append':
				case 'prepend':
				case 'replace':
					command.payload.defaultValue = [
						`${Date.now()}`,
						command.payload.defaultValue,
					];
					break;
			}

			setEntries((entries) =>
				updateList(
					[...entries],
					command as ListCommand<[string, FieldValue<Payload> | undefined]>,
				),
			);
			event.preventDefault();
		};
		const resetHandler = (event: Event) => {
			const form = getFormElement(ref.current);

			if (!form || event.target !== form) {
				return;
			}

			setEntries(Object.entries(config.defaultValue ?? []));
		};

		document.addEventListener('submit', submitHandler, true);
		document.addEventListener('reset', resetHandler);

		return () => {
			document.removeEventListener('submit', submitHandler, true);
			document.removeEventListener('reset', resetHandler);
		};
	}, [ref, config.name, config.defaultValue]);

	return [list, control];
}

interface ShadowInputProps extends InputHTMLAttributes<HTMLInputElement> {
	ref: RefObject<HTMLInputElement>;
}

interface InputControl {
	value: string;
	onChange: (eventOrValue: { target: { value: string } } | string) => void;
	onBlur: () => void;
	onInvalid: (event: FormEvent<FieldElement>) => void;
}

export function useControlledInput<Schema extends Primitive = Primitive>(
	field: FieldConfig<Schema>,
): [ShadowInputProps, InputControl] {
	const ref = useRef<HTMLInputElement>(null);
	const [value, setValue] = useState<string>(`${field.defaultValue ?? ''}`);
	const handleChange: InputControl['onChange'] = (eventOrValue) => {
		if (!ref.current) {
			return;
		}

		const newValue =
			typeof eventOrValue === 'string'
				? eventOrValue
				: eventOrValue.target.value;

		ref.current.value = newValue;
		ref.current.dispatchEvent(new InputEvent('input', { bubbles: true }));
		setValue(newValue);
	};
	const handleBlur: InputControl['onBlur'] = () => {
		ref.current?.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
	};
	const handleInvalid: InputControl['onInvalid'] = (event) => {
		event.preventDefault();
	};

	return [
		{
			ref,
			hidden: true,
			...input(field, { type: 'text' }),
		},
		{
			value,
			onChange: handleChange,
			onBlur: handleBlur,
			onInvalid: handleInvalid,
		},
	];
}
