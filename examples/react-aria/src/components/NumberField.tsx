import { useControl } from '@conform-to/react';
import { useRef } from 'react';
import {
	Button,
	FieldError,
	Group,
	Input,
	Label,
	NumberField as AriaNumberField,
	NumberFieldProps as AriaNumberFieldProps,
	Text,
} from 'react-aria-components';

import './NumberField.css';

export interface NumberFieldProps
	extends Omit<AriaNumberFieldProps, 'defaultValue' | 'value' | 'onChange'> {
	label?: string;
	description?: string;
	defaultValue?: string;
	errors?: string[];
	inputRef?: React.Ref<HTMLInputElement>;
}

export function NumberField({
	label,
	name,
	description,
	defaultValue,
	errors,
	...props
}: NumberFieldProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			inputRef.current?.focus();
		},
	});

	return (
		<>
			{/* The base input is used to make sure the NumberField could reset to the latest default value */}
			<input ref={control.register} name={name} hidden />
			<AriaNumberField
				{...props}
				value={control.value ? Number(control.value) : undefined}
				onChange={(number) => control.change(number.toString())}
				onBlur={() => control.blur()}
			>
				<Label>{label}</Label>
				<Group>
					<Button slot="decrement">-</Button>
					<Input ref={inputRef} />
					<Button slot="increment">+</Button>
				</Group>
				{description && <Text slot="description">{description}</Text>}
				<FieldError>{errors}</FieldError>
			</AriaNumberField>
		</>
	);
}
