import type {
	FormEventHandler,
	FormHTMLAttributes,
	InputHTMLAttributes,
	ClassAttributes,
	FocusEventHandler,
	MouseEventHandler,
} from 'react';
import { useEffect, useMemo, useState, useRef } from 'react';
import type { Constraint, Field } from 'form-validity';
import {
	getConstraint,
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

export interface FieldsetOptions<T extends string = string> {
	name?: string;
	value?: Record<T, any>;
	error?: Record<T, any>;
}

export function useFieldset<T extends string>(
	fieldset: Record<T, Field>,
	options: FieldsetOptions<T> = {},
): [Record<T, any>, Record<T, string>] {
	const fieldsetRef = useRef(fieldset);
	const fieldRef = useRef<Record<string, HTMLInputElement | null>>({});
	const [errorMessage, setErrorMessage] = useState(
		() =>
			Object.fromEntries(
				Object.keys(fieldset).map((name) => [
					name,
					options.error?.[name as T] ?? '',
				]),
			) as Record<T, string>,
	);
	const field = useMemo(() => {
		const entries = Object.entries<Field>(fieldset).map<[T, any]>(
			([key, field]) => {
				const constraint = getConstraint(field);
				const name = options.name ? `${options.name}.${key}` : key;

				if (constraint.type.value === 'fieldset') {
					return [
						key as T,
						{
							name,
							value: options.value?.[key as T],
							error: options.error?.[key as T],
						},
					];
				} else {
					const attributes: InputHTMLAttributes<HTMLInputElement> &
						ClassAttributes<HTMLInputElement> = {
						name,
						type:
							constraint.type.value !== 'textarea' &&
							constraint.type.value !== 'select'
								? constraint.type.value
								: undefined,
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
						pattern: (constraint as Constraint).pattern
							?.map((pattern) => pattern.value.source)
							.join('|'),
						defaultValue: options.value?.[key as T],
						ref(el) {
							fieldRef.current[key] = el;
						},
						onInput(e) {
							const customMessage = checkCustomValidity(
								e.currentTarget,
								constraint,
							);
							const message =
								customMessage ?? e.currentTarget.validationMessage;

							if (message) {
								// Skip: the input is valid
								return;
							}

							setErrorMessage((error) =>
								error[key as T] === '' ? error : { ...error, [key]: '' },
							);
						},
						onInvalid(e) {
							const customMessage = checkCustomValidity(
								e.currentTarget,
								constraint,
							);
							const message =
								customMessage ?? e.currentTarget.validationMessage;

							setErrorMessage((error) =>
								error[key as T] === message
									? error
									: { ...error, [key]: message },
							);
						},
					};

					return [key as T, attributes];
				}
			},
		);

		return Object.fromEntries(entries) as Record<T, any>;
	}, [fieldset, options.name, options.value, options.error]);

	useEffect(() => {
		if (fieldsetRef.current === fieldset) {
			return;
		}

		fieldsetRef.current = fieldset;

		setErrorMessage((errorMessage) => {
			const entries = Object.entries<Field>(fieldset).map(([name, field]) => {
				const element = fieldRef.current[name];
				let message = errorMessage[name as T];

				if (message && element) {
					const constraint = getConstraint(field);
					const customMessage =
						checkCustomValidity(element, constraint) ??
						element.validationMessage;

					message = customMessage;
				}

				return [name, message];
			});

			return Object.fromEntries(entries) as Record<T, string>;
		});
	}, [fieldset]);

	return [field, errorMessage];
}

export function useMultipleFieldset(
	options: FieldsetOptions,
	count: number,
): [
	any[],
	MouseEventHandler<HTMLButtonElement>,
	MouseEventHandler<HTMLButtonElement>,
] {
	const [keys, setKeys] = useState(() => [...Array(count).keys()]);
	const handleAdd: MouseEventHandler<HTMLButtonElement> = (e) => {
		setKeys((keys) => keys.concat(Date.now()));

		e.preventDefault();
	};
	const handleDelete: MouseEventHandler<HTMLButtonElement> = (e) => {
		const index = Number(e.currentTarget.value);

		if (!isNaN(index)) {
			setKeys((keys) => [...keys.slice(0, index), ...keys.slice(index + 1)]);
			e.preventDefault();
		}
	};
	const result = useMemo(
		() =>
			keys.map((key, i) => ({
				key,
				options: {
					name: `${options.name}[${i}]`,
					value: options.value?.[key],
					error: options.error?.[key],
				},
			})),
		[keys, options],
	);

	useEffect(() => {
		setKeys((keys) => {
			if (keys.length === count) {
				return keys;
			}

			return [...Array(count).keys()];
		});
	}, [count]);

	return [result, handleAdd, handleDelete];
}

function checkCustomValidity(
	element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
	constraint: Constraint,
): string | null {
	if (element.validity.valueMissing) {
		return constraint.required?.message ?? null;
	} else if (element.validity.tooShort) {
		return constraint.minLength?.message ?? null;
	} else if (element.validity.tooLong) {
		return constraint.maxLength?.message ?? null;
	} else if (element.validity.stepMismatch) {
		return constraint.step?.message ?? null;
	} else if (element.validity.rangeUnderflow) {
		return constraint.min?.message ?? null;
	} else if (element.validity.rangeOverflow) {
		return constraint.max?.message ?? null;
	} else if (element.validity.typeMismatch || element.validity.badInput) {
		return constraint.type?.message ?? null;
	} else if (element.validity.patternMismatch) {
		if (!constraint.pattern) {
			return null;
		} else if (constraint.pattern.length === 1) {
			return constraint.pattern[0].message ?? null;
		} else {
			return (
				constraint.pattern.find((pattern) => pattern.value.test(element.value))
					?.message ?? null
			);
		}
	} else {
		return '';
	}
}
