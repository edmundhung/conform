import { Form as RemixForm } from '@remix-run/react';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';
import type { UseFormValidationOptions } from 'react-form-validity';
import { useFormValidation } from 'react-form-validity';

export { useFieldset, f } from 'react-form-validity';

export type FormProps = UseFormValidationOptions & ComponentProps<typeof RemixForm>;

export const Form = forwardRef<HTMLFormElement, FormProps>(
	({ reportValidity, noValidate, onChange, onSubmit, ...props }, ref) => {
		const formProps = useFormValidation({
			reportValidity,
			noValidate,
			onChange,
			onSubmit,
		});

		return <RemixForm ref={ref} {...props} {...formProps} />;
	},
);

Form.displayName = 'Form';