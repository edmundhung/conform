import { type FieldMetadata, useInputControl } from '@conform-to/react';
import {
	CheckIcon,
	ChevronDownIcon,
	ChevronUpIcon,
} from '@radix-ui/react-icons';
import * as RadixSelect from '@radix-ui/react-select';
import { type ElementRef, useRef } from 'react';

export const Select = ({
	meta,
	items,
	placeholder = '',
}: {
	meta: FieldMetadata<string>;
	items: Array<{ name: string; value: string }>;
	placeholder?: string;
}) => {
	const selectRef = useRef<ElementRef<typeof RadixSelect.Trigger>>(null);
	const control = useInputControl(meta);

	return (
		<>
			<input
				name={meta.name}
				defaultValue={meta.initialValue}
				className="sr-only"
				tabIndex={-1}
				onFocus={() => {
					selectRef.current?.focus();
				}}
			/>

			<RadixSelect.Root
				value={control.value ?? ''}
				onValueChange={control.change}
				onOpenChange={(open) => {
					if (!open) {
						control.blur();
					}
				}}
			>
				<RadixSelect.Trigger
					ref={selectRef}
					className="w-1/2 inline-flex items-center justify-between rounded-md px-4 py-2 gap-1 bg-white hover:bg-amber-700/30 focus:ring-2 focus:ring-amber-500 data-[placeholder]:text-neutral-400 outline-none"
				>
					<RadixSelect.Value placeholder={placeholder} />
					<RadixSelect.Icon>
						<ChevronDownIcon />
					</RadixSelect.Icon>
				</RadixSelect.Trigger>
				<RadixSelect.Portal>
					<RadixSelect.Content
						position="popper"
						side="bottom"
						sideOffset={5}
						className="overflow-hidden bg-white rounded-md shadow-md w-[--radix-select-trigger-width]"
					>
						<RadixSelect.ScrollUpButton className="flex items-center justify-center h-6 bg-white text-amber-700 cursor-default">
							<ChevronUpIcon />
						</RadixSelect.ScrollUpButton>
						<RadixSelect.Viewport className="p-1">
							<RadixSelect.Group>
								{items.map((item) => {
									return (
										<RadixSelect.Item
											value={item.value}
											id={`${meta.id}-${item.value}`}
											key={item.value}
											className="rounded-md flex items-center h-8 pr-4 pl-6 relative select-none data-[highlighted]:outline-none data-[highlighted]:bg-amber-100"
										>
											<RadixSelect.ItemText>{item.name}</RadixSelect.ItemText>
											<RadixSelect.ItemIndicator className="absolute left-0 w-6 inline-flex items-center justify-center">
												<CheckIcon />
											</RadixSelect.ItemIndicator>
										</RadixSelect.Item>
									);
								})}
							</RadixSelect.Group>
						</RadixSelect.Viewport>
						<RadixSelect.ScrollDownButton className="flex items-center justify-center h-6 bg-white text-amber-700 cursor-default">
							<ChevronDownIcon />
						</RadixSelect.ScrollDownButton>
					</RadixSelect.Content>
				</RadixSelect.Portal>
			</RadixSelect.Root>
		</>
	);
};
