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
import type { Field } from 'form-validity';
import {
	checkCustomValidity,
	draftUpdate,
	shouldSkipValidate,
	isDirty,
	isValidationConstraintSupported,
} from 'form-validity';

export { f, parse } from 'form-validity';

export interface FieldsetOptions {
	name: string;
	value?: Record<string, any>;
	error?: Record<string, any>;
}

type FieldAttributes<Tag, Type = string> = Tag extends 'input'
	? Type extends 'radio' | 'checkbox'
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
		  >
	: Tag extends 'textarea'
	? Attributes<
			TextareaHTMLAttributes<HTMLTextAreaElement>,
			'name' | 'onInput' | 'onInvalid',
			'required' | 'minLength' | 'maxLength' | 'defaultValue'
	  >
	: Tag extends 'select'
	? Attributes<
			SelectHTMLAttributes<HTMLSelectElement>,
			'name' | 'onInput' | 'onInvalid',
			'required' | 'multiple' | 'defaultValue'
	  >
	: Tag extends 'fieldset'
	? Type extends 'array'
		? Array<FieldsetOptions>
		: FieldsetOptions
	: {};

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
	[Property in keyof Type]: Type[Property] extends Field<infer Tag, infer Type>
		? FieldAttributes<Tag, Type>
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
		if (
			isValidationConstraintSupported(event.target) &&
			isDirty(event.target)
		) {
			ref.current.touched[event.target.name] = true;
			event.target.checkValidity();
		}

		onBlur?.(event);
	};
	const handleChange: FormEventHandler<HTMLFormElement> = (event) => {
		if (
			isValidationConstraintSupported(event.target) &&
			(ref.current.submitted || ref.current.touched[event.target.name])
		) {
			event.target.checkValidity();
		}

		onChange?.(event);
	};
	const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
		ref.current.submitted = true;

		if (
			!shouldSkipValidate((event.nativeEvent as SubmitEvent).submitter) &&
			!event.currentTarget.checkValidity()
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

function getKey(element: HTMLInputElement): string {
	return element.name.slice(element.name.lastIndexOf('.') + 1);
}

export function useFieldset<Fieldset extends Record<string, Field>>(
	fieldset: Fieldset,
	{ name, value, error }: Partial<FieldsetOptions> = {},
): [FieldProps<Fieldset>, Error<Fieldset>] {
	const ref = useRef({
		element: {} as Record<string, HTMLInputElement | null>,
		fieldset,
		props: {
			onInput(e: FormEvent<HTMLInputElement>) {
				if (!e.currentTarget.validity.valid) {
					return;
				}

				const key = getKey(e.currentTarget);

				setErrorMessage((error) =>
					error[key] === '' ? error : { ...error, [key]: '' },
				);
			},
			onInvalid(e: FormEvent<HTMLInputElement>) {
				const element = e.currentTarget;
				const key = getKey(element);
				const config = ref.current.fieldset[key]?.getConfig();

				if (!config) {
					return;
				}

				const message =
					checkCustomValidity(element.value, element.validity, config) ??
					element.validationMessage;

				setErrorMessage((error) =>
					error[key] === message ? error : { ...error, [key]: message },
				);
			},
		},
	});
	const [errorMessage, setErrorMessage] = useState(() =>
		Object.fromEntries(
			Object.keys(fieldset).map((name) => [name, error?.[name] ?? '']),
		),
	);
	const field = useMemo(() => {
		const entries = Object.entries(fieldset).map(([key, field]) => {
			return [
				key,
				getFieldProps(field, {
					key,
					name,
					value,
					error,
					props: {
						...ref.current.props,
						ref(element: HTMLInputElement | null) {
							ref.current.element[key] = element;
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

		setErrorMessage((errorMessage) => {
			let result = errorMessage;

			for (let [key, field] of Object.entries(fieldset)) {
				const element = ref.current.element[key];
				let message = errorMessage[key];

				if (!message || !element) {
					continue;
				}

				const config = field.getConfig();
				const customMessage =
					checkCustomValidity(element.value, element.validity, config) ??
					element.validationMessage;

				if (message !== customMessage) {
					result = {
						...result,
						[key]: customMessage,
					};
				}
			}

			return result;
		});
	}, [fieldset]);

	return [
		field,
		// @ts-expect-error
		errorMessage,
	];
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

function getFieldProps(field: Field, options: FieldPropsOptions) {
	const config = field.getConfig();
	const name = options.name ? `${options.name}.${options.key}` : options.key;

	if (typeof config.count !== 'undefined') {
		return [...Array(config.count).keys()].map((index) => ({
			name: `${name}[${index}]`,
			value: options.value?.[options.key]?.[index],
			error: options.error?.[options.key]?.[index],
		}));
	} else if (config.tag === 'fieldset') {
		return {
			name,
			value: options.value?.[options.key],
			error: options.error?.[options.key],
		};
	} else {
		const attributes = {
			name,
			type: config.type?.value as string,
			required: Boolean(config.required),
			multiple: Boolean(config.multiple),
			minLength: config.minLength?.value,
			maxLength: config.maxLength?.value,
			min: config.min
				? config.min.value instanceof Date
					? config.min.value.toISOString()
					: config.min.value
				: undefined,
			max: config.max
				? config.max.value instanceof Date
					? config.max.value.toISOString()
					: config.max.value
				: undefined,
			step: config.step?.value,
			pattern: config.pattern?.map((pattern) => pattern.value.source).join('|'),
			value: config.value,
			defaultValue: options.value?.[options.key],
			defaultChecked: config.value === options.value?.[options.key],
			...options.props,
		};

		return attributes;
	}
}
