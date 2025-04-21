import {
	FieldError,
	Input,
	Label,
	Text,
	TextField as AriaTextField,
	TextFieldProps as AriaTextFieldProps,
} from 'react-aria-components';

import './TextField.css';

export interface TextFieldProps extends AriaTextFieldProps {
	label?: string;
	description?: string;
	errors?: string[];
}

export function TextField({
	label,
	description,
	errors,
	...props
}: TextFieldProps) {
	return (
		<AriaTextField {...props}>
			<Label>{label}</Label>
			<Input />
			{description && <Text slot="description">{description}</Text>}
			<FieldError>{errors}</FieldError>
		</AriaTextField>
	);
}
