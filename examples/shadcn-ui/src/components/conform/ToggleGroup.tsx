import {
	FieldMetadata,
	unstable_useControl as useControl,
} from '@conform-to/react';
import { ComponentProps, ElementRef, useRef } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export const ToggleGroupConform = ({
	type = 'single',
	meta,
	items,
	...props
}: {
	items: Array<{ value: string; label: string }>;
	meta: FieldMetadata<string | string[]>;
} & Omit<ComponentProps<typeof ToggleGroup>, 'defaultValue'>) => {
	const toggleGroupRef = useRef<ElementRef<typeof ToggleGroup>>(null);
	const control = useControl<string | string[]>(meta);

	return (
		<>
			{type === 'single' ? <input
				name={meta.name}
				ref={control.register}
				className="sr-only"
				tabIndex={-1}
				defaultValue={meta.initialValue}
				onFocus={() => {
					toggleGroupRef.current?.focus();
				}}
			/> : control.value ? (control.value as string[]).map(v => <input
				// use the same name as the field, html form will handle the rest
				name={meta.name} 
				className="sr-only"
				tabIndex={-1}
				value={v}
				// we just care the value to be submitted
				onChange={() => { }}
				onFocus={() => {
					toggleGroupRef.current?.focus();
				}}
			/>) : null}

			<ToggleGroup
				{...props}
				type={type}
				ref={toggleGroupRef}
				value={control.value}
				onValueChange={(value) => {
					props.onValueChange?.(value);
					control.change(value);
				}}
			>
				{items.map((item) => (
					<ToggleGroupItem key={item.value} value={item.value}>
						{item.label}
					</ToggleGroupItem>
				))}
			</ToggleGroup>
		</>
	);
};
