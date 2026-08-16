import { BaseControl, useControl } from '@conform-to/react/future';
import {
	Button,
	FieldError,
	Label,
	ListBox,
	ListBoxItem,
	Popover,
	Select as AriaSelect,
	SelectValue,
	Text,
} from 'react-aria-components';
import type {
	ListBoxProps,
	ListBoxItemProps,
	SelectProps as AriaSelectProps,
} from 'react-aria-components';

import './Select.css';
import { useRef } from 'react';

export interface SelectProps<T extends object> extends Omit<
	AriaSelectProps<T>,
	'children' | 'defaultSelectedKey' | 'selectedKey'
> {
	label?: string;
	description?: string;
	defaultValue?: string;
	errors?: string[];
	items?: ListBoxProps<T>['items'];
	children: ListBoxProps<T>['children'];
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
			<BaseControl
				name={name ?? ''}
				ref={control.register}
				defaultValue={control.defaultValue ?? ''}
			/>
			<AriaSelect
				{...props}
				selectedKey={control.value || null}
				onSelectionChange={(key) => control.change(key?.toString() ?? '')}
				onBlur={(event) => {
					if (!event.currentTarget.contains(event.relatedTarget)) {
						control.blur();
					}
				}}
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
