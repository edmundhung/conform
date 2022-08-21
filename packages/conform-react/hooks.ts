import {
	type FieldProps,
	type FieldElement,
	type FieldsetData,
	type ListCommand,
	type Primitive,
	type Schema,
	isFieldElement,
	setFieldState,
	reportValidity,
	shouldSkipValidate,
	getFieldProps,
	getFieldElements,
	getName,
	listCommandKey,
	serializeListCommand,
	parseListCommand,
	updateList,
	getFormElement,
} from '@conform-to/dom';
import {
	type InputHTMLAttributes,
	type FormEvent,
	type FormEventHandler,
	type FormHTMLAttributes,
	type RefObject,
	useRef,
	useState,
	useEffect,
	useReducer,
} from 'react';
import { input } from './helpers';

export interface FormConfig {
	/**
	 * Decide when the error should be reported initially.
	 * Default to `onSubmit`
	 */
	initialReport?: 'onSubmit' | 'onChange' | 'onBlur';

	/**
	 * Native browser report will be used before hydation if it is set to `true`.
	 * Default to `false`
	 */
	fallbackNative?: boolean;

	/**
	 * The form could be submitted even if there is invalid input control if it is set to `true`.
	 * Default to `false`
	 */
	noValidate?: boolean;

	/**
	 * The submit handler will be triggered only when the form is valid.
	 * Or when noValidate is set to `true`
	 */
	onSubmit?: FormHTMLAttributes<HTMLFormElement>['onSubmit'];
	onReset?: FormHTMLAttributes<HTMLFormElement>['onReset'];
}

interface FormProps {
	ref: RefObject<HTMLFormElement>;
	onSubmit: Required<FormHTMLAttributes<HTMLFormElement>>['onSubmit'];
	onReset: Required<FormHTMLAttributes<HTMLFormElement>>['onReset'];
	noValidate: Required<FormHTMLAttributes<HTMLFormElement>>['noValidate'];
}

export function useForm({
	onReset,
	onSubmit,
	noValidate = false,
	fallbackNative = false,
	initialReport = 'onSubmit',
}: FormConfig = {}): FormProps {
	const ref = useRef<HTMLFormElement>(null);
	const [formNoValidate, setFormNoValidate] = useState(
		noValidate || !fallbackNative,
	);
	const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
		const form = event.currentTarget;
		const nativeEvent = event.nativeEvent as SubmitEvent;

		if (!noValidate && !event.defaultPrevented) {
			for (let element of form.elements) {
				setFieldState(element, { touched: true });
			}

			if (!shouldSkipValidate(nativeEvent) && !form.reportValidity()) {
				return event.preventDefault();
			}
		}

		onSubmit?.(event);
	};
	const handleReset: FormEventHandler<HTMLFormElement> = (event) => {
		for (let element of event.currentTarget.elements) {
			setFieldState(element, { touched: false });
		}

		onReset?.(event);
	};

	useEffect(() => {
		setFormNoValidate(true);
	}, []);

	useEffect(() => {
		if (noValidate) {
			return;
		}

		const handleChange = (event: Event) => {
			if (
				!ref.current ||
				!isFieldElement(event.target) ||
				event.target?.form !== ref.current
			) {
				return;
			}

			if (initialReport === 'onChange') {
				setFieldState(event.target, { touched: true });
			}

			reportValidity(ref.current);
		};
		const handleBlur = (event: FocusEvent) => {
			if (
				!ref.current ||
				!isFieldElement(event.target) ||
				event.target?.form !== ref.current
			) {
				return;
			}

			if (initialReport === 'onBlur') {
				setFieldState(event.target, { touched: true });
			}

			reportValidity(ref.current);
		};

		document.addEventListener('input', handleChange);
		document.addEventListener('focusout', handleBlur);

		return () => {
			document.removeEventListener('input', handleChange);
			document.removeEventListener('focusout', handleBlur);
		};
	}, [noValidate, initialReport]);

	return {
		ref,
		onSubmit: handleSubmit,
		onReset: handleReset,
		noValidate: formNoValidate,
	};
}

export type FieldsetConfig<Type> = Partial<
	Pick<FieldProps<Type>, 'name' | 'form' | 'defaultValue' | 'error'>
>;

interface FieldsetProps {
	ref: RefObject<HTMLFieldSetElement>;
	name?: string;
	form?: string;
	onInput: FormEventHandler<HTMLFieldSetElement>;
	onInvalid: FormEventHandler<HTMLFieldSetElement>;
}

export function useFieldset<Type extends Record<string, any>>(
	schema: Schema<Type>,
	config: FieldsetConfig<Type> = {},
): [FieldsetProps, { [Key in keyof Type]-?: FieldProps<Type[Key]> }] {
	const ref = useRef<HTMLFieldSetElement>(null);
	const [errorMessage, dispatch] = useReducer(
		(
			state: Record<string, string>,
			action:
				| {
						type: 'migrate';
						payload: {
							keys: string[];
							error: FieldsetData<Type, string> | undefined;
						};
				  }
				| { type: 'cleanup'; payload: { fieldset: HTMLFieldSetElement } }
				| { type: 'report'; payload: { key: string; message: string } }
				| { type: 'reset' },
		) => {
			switch (action.type) {
				case 'report': {
					const { key, message } = action.payload;

					if (state[key] === message) {
						return state;
					}

					return {
						...state,
						[key]: message,
					};
				}
				case 'migrate': {
					let { keys, error } = action.payload;
					let nextState = state;

					for (let key of Object.keys(keys)) {
						const prevError = state[key];
						const nextError = error?.[key];

						if (typeof nextError === 'string' && prevError !== nextError) {
							return {
								...nextState,
								[key]: nextError,
							};
						}
					}

					return nextState;
				}
				case 'cleanup': {
					let { fieldset } = action.payload;
					let updates: Array<[string, string]> = [];

					for (let [key, message] of Object.entries(state)) {
						if (!message) {
							continue;
						}

						const fields = getFieldElements(fieldset, key);

						if (fields.every((field) => field.validity.valid)) {
							updates.push([key, '']);
						}
					}

					if (updates.length === 0) {
						return state;
					}

					return {
						...state,
						...Object.fromEntries(updates),
					};
				}
				case 'reset': {
					return {};
				}
			}
		},
		{},
		() =>
			Object.fromEntries(
				Object.keys(schema.fields).reduce<Array<[string, string]>>(
					(result, name) => {
						const error = config.error?.[name];

						if (typeof error === 'string') {
							result.push([name, error]);
						}

						return result;
					},
					[],
				),
			),
	);

	useEffect(
		() => {
			const fieldset = ref.current;

			if (!fieldset) {
				console.warn(
					'No fieldset ref found; You must pass the fieldsetProps to the fieldset element',
				);
				return;
			}

			if (!fieldset?.form) {
				console.warn(
					'No form element is linked to the fieldset; Do you forgot setting the form attribute?',
				);
			}

			schema.validate?.(fieldset);
			dispatch({ type: 'cleanup', payload: { fieldset } });

			const resetHandler = (e: Event) => {
				if (e.target !== fieldset.form) {
					return;
				}

				dispatch({ type: 'reset' });

				setTimeout(() => {
					// Delay revalidation until reset is completed
					schema.validate?.(fieldset);
				}, 0);
			};

			document.addEventListener('reset', resetHandler);

			return () => {
				document.removeEventListener('reset', resetHandler);
			};
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[schema.validate],
	);

	useEffect(() => {
		dispatch({
			type: 'migrate',
			payload: {
				keys: Object.keys(schema.fields),
				error: config.error,
			},
		});
	}, [config.error, schema.fields]);

	return [
		{
			ref,
			name: config.name,
			form: config.form,
			onInput(e: FormEvent<HTMLFieldSetElement>) {
				const fieldset = e.currentTarget;

				schema.validate?.(fieldset);
				dispatch({ type: 'cleanup', payload: { fieldset } });
			},
			onInvalid(e: FormEvent<HTMLFieldSetElement>) {
				const element = isFieldElement(e.target) ? e.target : null;
				const key = Object.keys(schema.fields).find(
					(key) => element?.name === getName([e.currentTarget.name, key]),
				);

				if (!element || !key) {
					return;
				}

				// Disable browser report
				e.preventDefault();

				dispatch({
					type: 'report',
					payload: { key, message: element.validationMessage },
				});
			},
		},
		getFieldProps(schema, {
			...config,
			error: Object.assign({}, config.error, errorMessage),
		}),
	];
}

interface ControlButtonProps {
	name?: string;
	value?: string;
	form?: string;
	formNoValidate: true;
}

type CommandPayload<
	Schema,
	Type extends ListCommand<FieldsetData<Schema, string>>['type'],
> = Extract<
	ListCommand<FieldsetData<Schema, string>>,
	{ type: Type }
>['payload'];

interface ListControl<Schema> {
	prepend(payload?: CommandPayload<Schema, 'prepend'>): ControlButtonProps;
	append(payload?: CommandPayload<Schema, 'append'>): ControlButtonProps;
	replace(payload: CommandPayload<Schema, 'replace'>): ControlButtonProps;
	remove(payload: CommandPayload<Schema, 'remove'>): ControlButtonProps;
	reorder(payload: CommandPayload<Schema, 'reorder'>): ControlButtonProps;
}

export function useFieldList<Payload = any>(
	ref: RefObject<HTMLFormElement> | RefObject<HTMLFieldSetElement>,
	props: FieldProps<Array<Payload>>,
): [
	Array<{
		key: string;
		props: FieldProps<Payload>;
	}>,
	ListControl<Payload>,
] {
	const [entries, setEntries] = useState<
		Array<[string, FieldsetData<Payload, string> | undefined]>
	>(() => Object.entries(props.defaultValue ?? [undefined]));
	const list = entries.map<{ key: string; props: FieldProps<Payload> }>(
		([key, defaultValue], index) => ({
			key: `${key}`,
			props: {
				...props,
				name: `${props.name}[${index}]`,
				defaultValue: defaultValue ?? props.defaultValue?.[index],
				error: props.error?.[index],
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
						value: serializeListCommand(props.name, { type, payload }),
						form: props.form,
						formNoValidate: true,
					};
				};
			},
		},
	) as ListControl<Payload>;

	useEffect(() => {
		setEntries(Object.entries(props.defaultValue ?? [undefined]));

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

			if (name !== props.name) {
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
					command as ListCommand<
						[string, FieldsetData<Payload, string> | undefined]
					>,
				),
			);
			event.preventDefault();
		};
		const resetHandler = (event: Event) => {
			const form = getFormElement(ref.current);

			if (!form || event.target !== form) {
				return;
			}

			setEntries(Object.entries(props.defaultValue ?? []));
		};

		document.addEventListener('submit', submitHandler, true);
		document.addEventListener('reset', resetHandler);

		return () => {
			document.removeEventListener('submit', submitHandler, true);
			document.removeEventListener('reset', resetHandler);
		};
	}, [ref, props.name, props.defaultValue]);

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
	field: FieldProps<Schema>,
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
