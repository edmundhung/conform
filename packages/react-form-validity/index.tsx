import { FormEventHandler, FormHTMLAttributes, InputHTMLAttributes, useRef } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { Field } from 'form-validity';
import { getFieldAttributes, configureCustomValidity } from 'form-validity';

export { f } from 'form-validity';

function isFormElement(element: any): element is HTMLFormElement {
	return !!element && element.tagName.toLowerCase() === 'form';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isInputElement(element: any): element is HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement {
	return !!element && ['select', 'input' , 'textarea'].includes(element.tagName.toLowerCase())
}

export type BaseFormProps = Pick<
	FormHTMLAttributes<HTMLFormElement>,
	'noValidate' | 'onChange' | 'onBlur' | 'onSubmit'
>;

export interface UseFormValidationOptions extends BaseFormProps {
	reportValidity?: boolean;
}

export function useFormValidation({
	reportValidity,
	noValidate,
	onChange,
	onBlur,
	onSubmit,
}: UseFormValidationOptions): BaseFormProps {
	const ref = useRef<{ submitted: boolean; touched: Record<string, boolean | undefined> }>({ submitted: false, touched: {} });
	const [noBrowserValidate, setNoBrowserValidate] = useState(
		noValidate ?? false,
	);
	const handleBlur: FormEventHandler<HTMLFormElement> | undefined = noValidate
		? onBlur
		: (event) => {
			if (isInputElement(event.target)) {
				ref.current.touched[event.target.name] = true;
				event.target.checkValidity();
			}
		};
	const handleChange: FormEventHandler<HTMLFormElement> | undefined = noValidate
		? onChange
		: (event) => {
			if (isInputElement(event.target) && (ref.current.submitted || ref.current.touched[event.target.name])) {
				event.target.checkValidity();
			}

			onChange?.(event);
		};
	const handleSubmit: FormEventHandler<HTMLFormElement> | undefined = noValidate
		? onSubmit
		: (event) => {
			ref.current.submitted = true;

			if (!event.currentTarget.checkValidity()) {
				event.preventDefault();
			} else {
				onSubmit?.(event);
			}
		};

	useEffect(() => {
		if (!reportValidity) {
			setNoBrowserValidate(true);
		}
	}, [reportValidity]);

	return {
		onBlur: handleBlur,
		onChange: handleChange,
		onSubmit: handleSubmit,
		noValidate: noBrowserValidate,
	};
}

export function useFieldset<T extends string>(fieldset: Record<T, Field>) {
	const [error, setError] = useState(() => Object.fromEntries(Object.keys(fieldset).map(name => [name, ''])));
	const inputs = useMemo(() => {
		const entries = Object.entries<Field>(fieldset).map(([name, field]) => {
			const constraints = field.getConstraints();
			const checkCustomValidity = configureCustomValidity(constraints);
			const fieldAttributes: InputHTMLAttributes<HTMLInputElement> = {
				...getFieldAttributes(constraints),
				type: field.getType(),
				name,
				onInput(e) {
					const customMessage = checkCustomValidity?.(e.currentTarget.validity);
					const message = customMessage ?? e.currentTarget.validationMessage;

					if (message) {
						return;
					}

					setError(error => error[name] === '' ? error : { ...error, [name]: '' });
				},
				onInvalid(e) {
					const customMessage = checkCustomValidity?.(e.currentTarget.validity);
					const message = customMessage ?? e.currentTarget.validationMessage;

					setError(error => error[name] === message ? error : { ...error, [name]: message });
				},
			};

			return [name, fieldAttributes] as [string, InputHTMLAttributes<HTMLInputElement>];
		});

		return Object.fromEntries(entries);
	}, [fieldset]);

	useEffect(() => {
		setError(error => {
			const newKeys = Object.keys(fieldset).sort();

			if (newKeys.join('|') === Object.keys(error).sort().join('|')) {
				return error;
			}

			return Object.fromEntries(newKeys.map(name => [name, error[name] ?? '']));
		});
	}, [fieldset]);

	return [inputs, error];
}