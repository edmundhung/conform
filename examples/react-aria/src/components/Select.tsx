import { useControl } from '@conform-to/react';
import {
	Button,
	FieldError,
	Label,
	ListBox,
	ListBoxItem,
	ListBoxItemProps,
	Popover,
	Select as AriaSelect,
	SelectProps as AriaSelectProps,
	SelectValue,
	Text,
} from 'react-aria-components';

import './Select.css';
import { useRef } from 'react';

export interface SelectProps<T extends object>
	extends Omit<
		AriaSelectProps<T>,
		'children' | 'defaultSelectedKey' | 'selectedKey'
	> {
	label?: string;
	description?: string;
	defaultValue?: string;
	errors?: string[];
	items?: Iterable<T>;
	children: React.ReactNode | ((item: T) => React.ReactNode);
}

export function Select<T extends object>({
	label,
	name,
	defaultValue,
	description,
	errors,
	children,
	items,
	...props
}: SelectProps<T>) {
	const labelRef = useRef<HTMLLabelElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			labelRef.current?.click();
		},
	});

	return (
		<>
			<select name={name} ref={control.register} hidden>
				<option />
			</select>
			<AriaSelect
				{...props}
				selectedKey={control.value ?? null}
				onSelectionChange={(key) => control.change(key?.toString() ?? '')}
				onBlur={() => control.blur()}
			>
				<Label ref={labelRef}>{label}</Label>
				<Button>
					<SelectValue />
					<span aria-hidden="true">▼</span>
				</Button>
				{description && <Text slot="description">{description}</Text>}
				<FieldError>{errors}</FieldError>
				<Popover>
					<ListBox items={items}>{children}</ListBox>
				</Popover>
			</AriaSelect>
		</>
	);
}

export function SelectItem(props: ListBoxItemProps) {
	return <ListBoxItem {...props} />;
}
