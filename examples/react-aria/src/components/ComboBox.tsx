import { BaseControl, useControl } from '@conform-to/react/future';
import {
	Button,
	ComboBox as AriaComboBox,
	ComboBoxValue,
	FieldError,
	Input,
	Label,
	ListBox,
	ListBoxItem,
	Popover,
	Text,
} from 'react-aria-components';
import type {
	ComboBoxProps as AriaComboBoxProps,
	ListBoxItemProps,
} from 'react-aria-components';

import './ComboBox.css';
import { useRef } from 'react';

export interface ComboBoxProps<T extends object> extends Omit<
	AriaComboBoxProps<T, 'single'>,
	| 'children'
	| 'defaultValue'
	| 'value'
	| 'onChange'
	| 'inputValue'
	| 'onInputChange'
> {
	label?: string;
	description?: string | null;
	defaultValue?: string;
	errors?: string[];
	children: AriaComboBoxProps<T, 'single'>['children'];
}

export function ComboBox<T extends object>({
	label,
	name,
	defaultValue,
	description,
	errors,
	children,
	...props
}: ComboBoxProps<T>) {
	const ref = useRef<HTMLInputElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			ref.current?.focus();
		},
	});

	return (
		<>
			<BaseControl
				name={name ?? ''}
				ref={control.register}
				defaultValue={control.defaultValue ?? ''}
			/>
			<AriaComboBox
				{...props}
				value={control.value || null}
				inputValue={control.value ?? ''}
				onChange={(value) => control.change(value?.toString() ?? '')}
				onInputChange={(value) => control.change(value)}
				onBlur={() => control.blur()}
			>
				<Label>{label}</Label>
				<div className="my-combobox-container">
					<Input ref={ref} />
					<Button>▼</Button>
				</div>
				{description && <Text slot="description">{description}</Text>}
				<FieldError>{errors}</FieldError>
				<Popover>
					<ListBox>{children}</ListBox>
				</Popover>
			</AriaComboBox>
		</>
	);
}

export interface MultiSelectComboBoxProps<T extends object> extends Omit<
	AriaComboBoxProps<T, 'multiple'>,
	'children' | 'defaultValue' | 'value' | 'onChange' | 'selectionMode'
> {
	label?: string;
	description?: string;
	defaultValue?: string[];
	errors?: string[];
	children: AriaComboBoxProps<T, 'multiple'>['children'];
}

export function MultiSelectComboBox<T extends object>({
	label,
	name,
	defaultValue,
	description,
	errors,
	children,
	...props
}: MultiSelectComboBoxProps<T>) {
	const ref = useRef<HTMLInputElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			ref.current?.focus();
		},
	});

	return (
		<>
			<BaseControl
				type="select"
				name={name ?? ''}
				ref={control.register}
				defaultValue={control.defaultValue ?? []}
				multiple
			/>
			<AriaComboBox
				{...props}
				selectionMode="multiple"
				value={control.options ?? []}
				onChange={(value) => control.change(value.map((key) => key.toString()))}
				onBlur={() => control.blur()}
			>
				<Label>{label}</Label>
				<div className="my-combobox-container">
					<Input ref={ref} />
					<Button>▼</Button>
				</div>
				<ComboBoxValue<T> className="selected-values" placeholder="None" />
				{description ? <Text slot="description">{description}</Text> : null}
				<FieldError>{errors}</FieldError>
				<Popover>
					<ListBox>{children}</ListBox>
				</Popover>
			</AriaComboBox>
		</>
	);
}

export function ComboBoxItem(props: ListBoxItemProps) {
	return <ListBoxItem {...props} />;
}
