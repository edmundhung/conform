import {
	FieldError,
	Input,
	Label,
	Text,
	TextField as AriaTextField,
	TextFieldProps as AriaTextFieldProps,
} from 'react-aria-components';

import './TextField.css';
import { useControl } from '@conform-to/react';

export interface TextFieldProps extends AriaTextFieldProps {
	label?: string;
	description?: string;
	errors?: string[];
}

export function TextField({
	label,
	name,
	defaultValue,
	description,
	errors,
	...props
}: TextFieldProps) {
	const control = useControl({
		defaultValue,
	});

	return (
		<>
			{/* The base input is used to make sure the TextField could reset to the latest default value */}
			<input ref={control.register} name={name} hidden />
			<AriaTextField
				{...props}
				value={control.value ?? ''}
				onChange={(value) => control.change(value)}
			>
				<Label>{label}</Label>
				<Input />

				{description && <Text slot="description">{description}</Text>}
				<FieldError>{errors}</FieldError>
			</AriaTextField>
		</>
	);
}
