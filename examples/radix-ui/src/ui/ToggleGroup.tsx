import { type FieldMetadata, useInputControl } from '@conform-to/react';
import * as RadixToggleGroup from '@radix-ui/react-toggle-group';
import { type ElementRef, useRef } from 'react';

export function ToggleGroup({
	meta,
	items,
}: {
	meta: FieldMetadata<string>;
	items: Array<{ label: string; value: string }>;
}) {
	const toggleGroupRef = useRef<ElementRef<typeof RadixToggleGroup.Root>>(null);
	const control = useInputControl(meta);

	return (
		<>
			<input
				name={meta.name}
				className="sr-only"
				tabIndex={-1}
				defaultValue={meta.initialValue}
				onFocus={() => {
					toggleGroupRef.current?.focus();
				}}
			/>
			<RadixToggleGroup.Root
				type="single"
				value={control.value}
				ref={toggleGroupRef}
				className={
					'flex flex-row items-center p-1 gap-0 bg-neutral-200 rounded-lg max-w-md'
				}
				onValueChange={control.change}
				onBlur={control.blur}
			>
				{items.map((item) => (
					<RadixToggleGroup.Item
						key={item.value}
						className="p-1 hover:bg-amber-700/30 color-amber-100 data-[state=on]:bg-amber-800 data-[state=on]:text-white flex grow items-center justify-center bg-transparent first:rounded-l-lg last:rounded-r-lg focus:z-10 focus:ring-2 focus:outline-none  focus:ring-amber-500"
						value={item.value}
						aria-label={item.label}
					>
						{item.label}
					</RadixToggleGroup.Item>
				))}
			</RadixToggleGroup.Root>
		</>
	);
}
