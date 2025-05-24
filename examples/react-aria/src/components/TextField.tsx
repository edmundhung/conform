import {
	FieldError,
	Input,
	Label,
	Text,
	TextField as AriaTextField,
	TextFieldProps as AriaTextFieldProps,
} from 'react-aria-components';

import './TextField.css';
import { useControl } from '@conform-to/react/future';
import { useRef } from 'react';

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
	const inputRef = useRef<HTMLInputElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			inputRef.current?.focus();
		},
	});

	return (
		<>
			{/* The base input is used to make sure the TextField could reset to the latest default value */}
			<input ref={control.register} name={name} hidden />
			<AriaTextField
				{...props}
				value={control.value ?? ''}
				onChange={(value) => control.change(value)}
				onBlur={() => control.blur()}
			>
				<Label>{label}</Label>
				<Input ref={inputRef} />

				{description && <Text slot="description">{description}</Text>}
				<FieldError>{errors}</FieldError>
			</AriaTextField>
		</>
	);
}
