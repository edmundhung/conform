import { Form as RemixForm } from '@remix-run/react';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';
import type { FormValidityOptions } from 'react-form-validity';
import {
	useFormValidity,
	useField,
	useValidationMessage,
} from 'react-form-validity';

export type FormProps = FormValidityOptions & ComponentProps<typeof RemixForm>;

const Form = forwardRef<HTMLFormElement, FormProps>(
	({ reportValidity, noValidate, onChange, onSubmit, ...props }, ref) => {
		const formProps = useFormValidity({
			reportValidity,
			noValidate,
			onChange,
			onSubmit,
		});

		return <RemixForm ref={ref} {...props} {...formProps} />;
	},
);

Form.displayName = 'Form';

export { Form, useField, useValidationMessage };
