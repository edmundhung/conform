import type {
	HTMLAttributes,
	FormEventHandler,
	FormHTMLAttributes,
	InputHTMLAttributes,
	ClassAttributes,
	FocusEventHandler,
	ButtonHTMLAttributes,
	SelectHTMLAttributes,
	TextareaHTMLAttributes,
	FormEvent,
} from 'react';
import { useEffect, useMemo, useState, useRef } from 'react';
import type { FieldType, FieldConfig } from 'form-validity';
import {
	checkCustomValidity,
	refineConfig,
	draftUpdate,
	revalidate,
	checkValidity,
	shouldSkipValidate,
} from 'form-validity';

export { process } from 'form-validity';

export interface FieldsetOptions {
	name: string;
	value?: Record<string, any>;
	error?: Record<string, any>;
}

type FieldAttributes<Type extends FieldType> = Type extends 'textarea'
	? Attributes<
			TextareaHTMLAttributes<HTMLTextAreaElement>,
			'name' | 'onInput' | 'onInvalid',
			'required' | 'minLength' | 'maxLength' | 'defaultValue'
	  >
	: Type extends 'select'
	? Attributes<
			SelectHTMLAttributes<HTMLSelectElement>,
			'name' | 'onInput' | 'onInvalid',
			'required' | 'multiple' | 'defaultValue'
	  >
	: Type extends 'fieldset'
	? FieldsetOptions
	: Type extends 'fieldset-array'
	? Array<FieldsetOptions>
	: Type extends 'radio' | 'checkbox'
	? Array<
			Attributes<
				InputHTMLAttributes<HTMLInputElement>,
				'name' | 'type' | 'onInput' | 'onInvalid' | 'value',
				'required' | 'defaultChecked'
			>
	  >
	: Attributes<
			InputHTMLAttributes<HTMLInputElement>,
			'name' | 'type' | 'onInput' | 'onInvalid',
			| 'required'
			| 'multiple'
			| 'minLength'
			| 'maxLength'
			| 'min'
			| 'max'
			| 'step'
			| 'pattern'
			| 'defaultValue'
	  >;

type Attributes<
	OriginalAttributes extends HTMLAttributes<Element>,
	Provided extends keyof OriginalAttributes,
	Optional extends keyof OriginalAttributes,
> = (OriginalAttributes extends HTMLAttributes<infer Element>
	? ClassAttributes<Element>
	: never) &
	Required<Pick<OriginalAttributes, Provided>> &
	Partial<Pick<OriginalAttributes, Optional>>;

type FieldProps<Type> = {
	[Property in keyof Type]: Type[Property] extends FieldConfig<infer Type>
		? FieldAttributes<Type>
		: never;
};

type Error<Type> = {
	[Property in keyof Type]: string;
};

type FormValidityProps = Pick<
	FormHTMLAttributes<HTMLFormElement>,
	'noValidate' | 'onChange' | 'onBlur' | 'onSubmit'
>;

export function useFormValidity({
	noValidate,
	onChange,
	onBlur,
	onSubmit,
}: FormValidityProps): FormValidityProps {
	const ref = useRef<{
		submitted: boolean;
		touched: Record<string, boolean | undefined>;
	}>({ submitted: false, touched: {} });
	const [noBrowserValidate, setNoBrowserValidate] = useState(
		noValidate ?? false,
	);
	const handleBlur: FocusEventHandler<HTMLFormElement> = (event) => {
		ref.current.touched[event.target.name] = true;
		checkValidity(event.target);

		onBlur?.(event);
	};
	const handleChange: FormEventHandler<HTMLFormElement> = (event) => {
		if (
			ref.current.submitted ||
			ref.current.touched[(event.target as any)?.name ?? '']
		) {
			checkValidity(event.target);
		}

		onChange?.(event);
	};
	const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
		ref.current.submitted = true;

		if (
			!shouldSkipValidate((event.nativeEvent as SubmitEvent).submitter) &&
			!checkValidity(event.currentTarget)
		) {
			event.preventDefault();
		} else {
			onSubmit?.(event);
		}
	};

	useEffect(() => {
		setNoBrowserValidate(true);
	}, []);

	return {
		onBlur: handleBlur,
		onChange: handleChange,
		onSubmit: handleSubmit,
		noValidate: noBrowserValidate,
	};
}

export function useFieldset<Fieldset extends Record<string, FieldConfig>>(
	fieldset: Fieldset,
	{ name, value, error }: Partial<FieldsetOptions> = {},
): [FieldProps<Fieldset>, Error<Fieldset>] {
	const ref = useRef({
		element: {} as Record<string, HTMLInputElement | null>,
		fieldset,
	});
	const [errorMessage, setErrorMessage] = useState(
		() =>
			Object.fromEntries(
				Object.keys(fieldset).map((name) => [name, error?.[name] ?? '']),
			) as Error<Fieldset>,
	);
	const field = useMemo(() => {
		const entries = Object.entries(fieldset).map(([key, fieldConfig]) => {
			const config = refineConfig(fieldConfig);

			return [
				key,
				getFieldProps(config, {
					key,
					name,
					value,
					error,
					props: {
						ref(element: HTMLInputElement | null) {
							ref.current.element[key] = element;
						},
						onInvalid(e: FormEvent<HTMLInputElement>) {
							const element = e.currentTarget;

							if (element.validity.valid || element.validity.customError) {
								let hasError = false;

								for (let constraint of config.constraints ?? []) {
									if (constraint.match(element.value)) {
										hasError = true;
										element.setCustomValidity(
											constraint.message ?? 'This field is invalid',
										);
										break;
									}
								}

								if (!hasError) {
									element.setCustomValidity('');
								}
							}

							const message =
								checkCustomValidity(element.validity, config) ??
								element.validationMessage;

							setErrorMessage((error) =>
								error[key] === message ? error : { ...error, [key]: message },
							);
						},
					},
				}),
			];
		});

		return Object.fromEntries(entries);
	}, [fieldset, name, value, error]);

	useEffect(() => {
		if (ref.current.fieldset === fieldset) {
			return;
		}

		ref.current.fieldset = fieldset;

		// Revalidate fields as constraint might be changed
		for (let [key, error] of Object.entries(errorMessage)) {
			const field = ref.current.element[key];

			// Only check against fields with error
			if (field && error !== '') {
				revalidate(field);
			}
		}
	}, [fieldset, errorMessage]);

	return [field, errorMessage];
}

export function useFieldsetControl(options: FieldsetOptions[]): [
	Array<{
		key: number;
		options: FieldsetOptions;
		deleteButton: ButtonHTMLAttributes<HTMLButtonElement>;
	}>,
	ButtonHTMLAttributes<HTMLButtonElement>,
] {
	const [keys, setKeys] = useState(() => [...Array(options.length).keys()]);
	const name = options.reduce((result, option) => {
		const name = option.name.slice(0, option.name.lastIndexOf('['));

		if (result && result !== name) {
			throw new Error(
				'Inconsistent name found; Only nested array fieldset is supported',
			);
		}

		return name;
	}, '');
	const addButton: ButtonHTMLAttributes<HTMLButtonElement> = {
		type: 'submit',
		formNoValidate: true,
		onClick(e) {
			setKeys((keys) => keys.concat(Date.now()));
			e.preventDefault();
		},
		...draftUpdate(name),
	};

	const result = useMemo(
		() =>
			keys.map((key, index) => {
				const deleteButton: ButtonHTMLAttributes<HTMLButtonElement> = {
					...draftUpdate(name, index),
					type: 'submit',
					formNoValidate: true,
					onClick(e) {
						setKeys((keys) => [
							...keys.slice(0, index),
							...keys.slice(index + 1),
						]);
						e.preventDefault();
					},
				};

				return {
					key,
					options: options[key] ?? {
						name: `${name}[${index}]`,
					},
					deleteButton,
				};
			}),
		[keys, name, options],
	);

	useEffect(() => {
		setKeys((keys) => {
			if (keys.length === options.length) {
				return keys;
			}

			return [...Array(options.length).keys()];
		});
	}, [options.length]);

	return [result, addButton];
}

/**
 * Helpers
 */
interface FieldPropsOptions extends Partial<FieldsetOptions> {
	key: string;
	props: any;
}

function getFieldProps<Type extends FieldType>(
	config: FieldConfig<Type>,
	options: FieldPropsOptions,
) {
	const name = options.name ? `${options.name}.${options.key}` : options.key;
	const value = options.value?.[options.key];
	const error = options.error?.[options.key];

	if (config.type === 'fieldset') {
		return {
			name,
			value,
			error,
		};
	} else if (config.type === 'fieldset-array') {
		return [...Array(config.count ?? 1).keys()].map((index) => ({
			name: `${name}[${index}]`,
			value: value?.[index],
			error: error?.[index],
		}));
	} else {
		const attributes: InputHTMLAttributes<HTMLInputElement> = {
			name,
			type: config.type,
			required: config.required,
			minLength: config.minLength,
			maxLength: config.maxLength,
			min: config.min,
			max: config.max,
			step: config.step,
			pattern: config.pattern,
			...options.props,
		};

		if (!config.options) {
			return {
				...attributes,
				defaultValue: value,
			};
		}

		return config.options.map((option) => ({
			...attributes,
			value: option,
			defaultChecked: Array.isArray(option)
				? value.includes(option)
				: value === option,
		}));
	}
}
