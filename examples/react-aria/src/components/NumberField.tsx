import { BaseControl, useControl } from '@conform-to/react/future';
import { useRef } from 'react';
import {
	Button,
	FieldError,
	Group,
	Input,
	Label,
	NumberField as AriaNumberField,
	Text,
} from 'react-aria-components';
import type { NumberFieldProps as AriaNumberFieldProps } from 'react-aria-components';

import './NumberField.css';

export interface NumberFieldProps extends Omit<
	AriaNumberFieldProps,
	'defaultValue' | 'value' | 'onChange'
> {
	label?: string;
	description?: string;
	defaultValue?: string;
	errors?: string[];
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
			<BaseControl
				name={name ?? ''}
				ref={control.register}
				defaultValue={control.defaultValue ?? ''}
			/>
			<AriaNumberField
				{...props}
				value={control.value ? Number(control.value) : Number.NaN}
				onChange={(number) =>
					control.change(Number.isNaN(number) ? '' : number.toString())
				}
				onBlur={(event) => {
					if (!event.currentTarget.contains(event.relatedTarget)) {
						control.blur();
					}
				}}
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
