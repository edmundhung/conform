import {
	FieldMetadata,
	unstable_useControl as useControl,
} from '@conform-to/react';
import { ComponentProps, ElementRef, useRef } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export const ToggleGroupConform = ({
	meta,
	items,
	...props
}: {
	items: Array<{ value: string; label: string }>;
	meta: FieldMetadata<string>;
} & Omit<ComponentProps<typeof ToggleGroup>, 'defaultValue'>) => {
	const toggleGroupRef = useRef<ElementRef<typeof ToggleGroup>>(null);
	const control = useControl(meta);

	return (
		<>
			<input
				name={meta.name}
				ref={control.register}
				className="sr-only"
				tabIndex={-1}
				defaultValue={meta.initialValue}
				onFocus={() => {
					toggleGroupRef.current?.focus();
				}}
			/>
			<ToggleGroup
				{...props}
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
