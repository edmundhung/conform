import {
	FieldError,
	Input,
	Label,
	Text,
	TextField as AriaTextField,
} from 'react-aria-components';
import type { TextFieldProps as AriaTextFieldProps } from 'react-aria-components';

import './TextField.css';

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
	return (
		<AriaTextField {...props} name={name} defaultValue={defaultValue}>
			<Label>{label}</Label>
			<Input />

			{description && <Text slot="description">{description}</Text>}
			<FieldError>{errors}</FieldError>
		</AriaTextField>
	);
}
