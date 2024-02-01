import { FieldMetadata, useInputControl } from '@conform-to/react';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { ElementRef, useRef } from 'react';

export function ToggleGroupConform({
	config,
	items,
}: {
	config: FieldMetadata<string>;
	items: Array<{ label: string; value: string }>;
}) {
	const toggleGroupRef = useRef<ElementRef<typeof ToggleGroup.Root>>(null);
	const control = useInputControl(config);
	return (
		<>
			<input
				name={config.name}
				className="sr-only"
				tabIndex={-1}
				defaultValue={config.initialValue}
				onFocus={() => {
					toggleGroupRef.current?.focus();
				}}
			/>
			<ToggleGroup.Root
				type="single"
				value={control.value}
				ref={toggleGroupRef}
				defaultValue={config.initialValue}
				className={
					'flex flex-row items-center p-1 gap-0 bg-neutral-200 rounded-lg max-w-md'
				}
				onValueChange={(value) => {
					control.change(value);
				}}
				onBlur={() => control.blur()}
			>
				{items.map((item) => (
					<ToggleGroup.Item
						key={item.value}
						className="p-1 hover:bg-amber-700/30 color-amber-100 data-[state=on]:bg-amber-800 data-[state=on]:text-white flex grow items-center justify-center bg-transparent first:rounded-l-lg last:rounded-r-lg focus:z-10 focus:ring-2 focus:outline-none  focus:ring-amber-500"
						value={item.value}
						aria-label={item.label}
					>
						{item.label}
					</ToggleGroup.Item>
				))}
			</ToggleGroup.Root>
		</>
	);
}
