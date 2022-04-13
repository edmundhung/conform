import type {
	FormEventHandler,
	FormHTMLAttributes,
	InputHTMLAttributes,
	ClassAttributes,
	FocusEventHandler,
	ButtonHTMLAttributes,
	SelectHTMLAttributes,
	TextareaHTMLAttributes,
} from 'react';
import { useEffect, useMemo, useState, useRef } from 'react';
import type { Field } from 'form-validity';
import {
	getConstraint,
	checkCustomValidity,
	draftUpdate,
	shouldSkipValidate,
	isDirty,
	isValidationConstraintSupported,
} from 'form-validity';

export type { Constraint } from 'form-validity';
export { f, parse } from 'form-validity';

export type FormValidationProps = Pick<
	FormHTMLAttributes<HTMLFormElement>,
	'noValidate' | 'onChange' | 'onBlur' | 'onSubmit'
>;

export function useFormValidation({
	noValidate,
	onChange,
	onBlur,
	onSubmit,
}: FormValidationProps): FormValidationProps {
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

export interface FieldsetOptions {
	name?: string;
	value?: Record<string, any>;
	error?: Record<string, any>;
}

export type FieldAttributes<Tag> = Tag extends 'input'
	? ClassAttributes<HTMLInputElement> &
			Required<
				Pick<
					InputHTMLAttributes<HTMLInputElement>,
					'name' | 'type' | 'onInput' | 'onInvalid'
				>
			> &
			Pick<
				InputHTMLAttributes<HTMLInputElement>,
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
	? ClassAttributes<HTMLTextAreaElement> &
			Required<
				Pick<
					TextareaHTMLAttributes<HTMLTextAreaElement>,
					'name' | 'onInput' | 'onInvalid'
				>
			> &
			Pick<
				TextareaHTMLAttributes<HTMLTextAreaElement>,
				'required' | 'minLength' | 'maxLength' | 'defaultValue'
			>
	: Tag extends 'select'
	? ClassAttributes<HTMLSelectElement> &
			Required<
				Pick<
					SelectHTMLAttributes<HTMLSelectElement>,
					'name' | 'onInput' | 'onInvalid'
				>
			> &
			Pick<
				SelectHTMLAttributes<HTMLSelectElement>,
				'required' | 'multiple' | 'defaultValue'
			>
	: Tag extends 'fieldset'
	? {
			list: Array<{
				key: number;
				options: FieldsetOptions;
				deleteButton: Required<
					Pick<
						ButtonHTMLAttributes<HTMLButtonElement>,
						'type' | 'name' | 'value' | 'formNoValidate' | 'onClick'
					>
				>;
			}>;
			addButton: Required<
				Pick<
					ButtonHTMLAttributes<HTMLButtonElement>,
					'type' | 'name' | 'value' | 'formNoValidate' | 'onClick'
				>
			>;
	  }
	: {};

type FieldProps<Type> = {
	[Property in keyof Type]: Type[Property] extends Field<infer FieldTag>
		? FieldAttributes<FieldTag>
		: never;
};

type Error<Type> = {
	[Property in keyof Type]: string;
};

export function useFieldset<Fieldset extends Record<string, Field>>(
	fieldset: Fieldset,
	options: FieldsetOptions = {},
): [FieldProps<Fieldset>, Error<Fieldset>] {
	const fieldsetRef = useRef(fieldset);
	const elementRef = useRef<Record<string, HTMLInputElement | null>>({});
	const [keysByName, setKeysByName] = useState(() => {
		const keysByName = {} as Record<string, number[]>;

		for (let [name, field] of Object.entries(fieldset)) {
			const constraint = getConstraint(field);

			if (constraint.tag !== 'fieldset' || !constraint.multiple) {
				continue;
			}

			keysByName[name] = [...Array(constraint.multiple.value ?? 1).keys()];
		}

		return keysByName;
	});
	const [errorMessage, setErrorMessage] = useState(() =>
		Object.fromEntries(
			Object.keys(fieldset).map((name) => [name, options.error?.[name] ?? '']),
		),
	);
	const field = useMemo(() => {
		const entries = Object.entries(fieldset).map(([key, field]) => {
			const constraint = getConstraint(field);
			const name = options.name ? `${options.name}.${key}` : key;

			if (constraint.tag === 'fieldset') {
				return [
					key,
					{
						name,
						value: options.value?.[key],
						error: options.error?.[key],
					},
				];
			} else {
				const attributes: FieldAttributes<'input'> = {
					name,
					type: constraint.type?.value as string,
					required: Boolean(constraint.required),
					multiple: Boolean(constraint.multiple),
					minLength: constraint.minLength?.value,
					maxLength: constraint.maxLength?.value,
					min: constraint.min
						? constraint.min.value instanceof Date
							? constraint.min.value.toISOString()
							: constraint.min.value
						: undefined,
					max: constraint.max
						? constraint.max.value instanceof Date
							? constraint.max.value.toISOString()
							: constraint.max.value
						: undefined,
					step: constraint.step?.value,
					pattern: constraint.pattern
						?.map((pattern) => pattern.value.source)
						.join('|'),
					defaultValue: options.value?.[key],
					ref(el) {
						elementRef.current[key] = el;
					},
					onInput(e) {
						const customMessage = checkCustomValidity(
							e.currentTarget.value,
							e.currentTarget.validity,
							constraint,
						);
						const message = customMessage ?? e.currentTarget.validationMessage;

						if (message) {
							// Skip: the input is valid
							return;
						}

						setErrorMessage((error) =>
							error[key] === '' ? error : { ...error, [key]: '' },
						);
					},
					onInvalid(e) {
						const customMessage = checkCustomValidity(
							e.currentTarget.value,
							e.currentTarget.validity,
							constraint,
						);
						const message = customMessage ?? e.currentTarget.validationMessage;

						setErrorMessage((error) =>
							error[key] === message ? error : { ...error, [key]: message },
						);
					},
				};

				return [key, attributes];
			}
		});

		return Object.fromEntries(entries);
	}, [fieldset, options.name, options.value, options.error]);

	const enhancedField = useMemo(() => {
		let result = field;

		for (let [name, props] of Object.entries<FieldsetOptions>(field)) {
			const keys = keysByName[name];

			if (!keys) {
				continue;
			}

			const addButton: ButtonHTMLAttributes<HTMLButtonElement> = {
				type: 'submit',
				formNoValidate: true,
				onClick(e) {
					setKeysByName((result) => ({
						...result,
						[name]: (result[name] ?? []).concat(Date.now()),
					}));
					e.preventDefault();
				},
				...draftUpdate(name),
			};

			const list = keys.map<{ key: number; options: FieldsetOptions }>(
				(key, index) => {
					const deleteButton: ButtonHTMLAttributes<HTMLButtonElement> = {
						...draftUpdate(name, index),
						type: 'submit',
						formNoValidate: true,
						onClick(e) {
							setKeysByName((result) => ({
								...result,
								[name]: [
									...(result[name] ?? []).slice(0, index),
									...(result[name] ?? []).slice(index + 1),
								],
							}));
							e.preventDefault();
						},
					};

					return {
						key,
						options: {
							name: `${props.name}[${index}]`,
							value: props.value?.[key],
							error: props.error?.[key],
						},
						deleteButton,
					};
				},
			);

			result = {
				...result,
				[name]: {
					list,
					addButton,
				},
			};
		}

		return result;
	}, [field, keysByName]);

	useEffect(() => {
		if (fieldsetRef.current === fieldset) {
			return;
		}

		fieldsetRef.current = fieldset;

		setKeysByName((keysByName) => {
			let result = keysByName;

			for (let [name, field] of Object.entries(fieldset)) {
				const keys = result[name] ?? [];
				const constraint = getConstraint(field);

				if (
					constraint.tag !== 'fieldset' ||
					!constraint.multiple ||
					keys.length !== constraint.multiple.value
				) {
					continue;
				}

				result = {
					...result,
					[name]: [...Array(constraint.multiple.value ?? 1).keys()],
				};
			}

			return result;
		});

		setErrorMessage((errorMessage) => {
			const entries = Object.entries(fieldset).map(([name, field]) => {
				const element = elementRef.current[name];
				let message = errorMessage[name];

				if (message && element) {
					const constraint = getConstraint(field);
					const customMessage =
						checkCustomValidity(element.value, element.validity, constraint) ??
						element.validationMessage;

					message = customMessage;
				}

				return [name, message];
			});

			return Object.fromEntries(entries);
		});
	}, [fieldset]);

	return [
		enhancedField,
		// @ts-expect-error
		errorMessage,
	];
}
