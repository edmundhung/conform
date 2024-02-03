import { type FieldMetadata, useInputControl } from '@conform-to/react';
import * as RadioGroup from '@radix-ui/react-radio-group';
import clsx from 'clsx';
import { type ElementRef, useRef } from 'react';

export function RadioGroupConform({
	meta,
	items,
}: {
	meta: FieldMetadata<string>;
	items: Array<{ value: string; label: string }>;
}) {
	const radioGroupRef = useRef<ElementRef<typeof RadioGroup.Root>>(null);
	const control = useInputControl(meta);
	return (
		<>
			<input
				name={meta.name}
				defaultValue={meta.initialValue}
				tabIndex={-1}
				className="sr-only"
				onFocus={() => {
					radioGroupRef.current?.focus();
				}}
			/>
			<RadioGroup.Root
				ref={radioGroupRef}
				className="flex items-center gap-4"
				value={control.value}
				onValueChange={control.change}
				onBlur={control.blur}
			>
				{items.map((item) => {
					return (
						<div className="flex items-center gap-2" key={item.value}>
							<RadioGroup.Item
								value={item.value}
								id={`${meta.id}-${item.value}`}
								className={clsx(
									'size-5 rounded-full outline-none cursor-default',
									'border hover:bg-amber-50 focus:ring-amber-500 focus:ring-2',
									'flex items-center justify-center',
									'bg-white',
								)}
							>
								<RadioGroup.Indicator className="flex items-center justify-center w-full h-full relative after:content-[''] after:block after:size-2.5 after:rounded-full after:bg-amber-700" />
							</RadioGroup.Item>
							<label htmlFor={`${meta.id}-${item.value}`}>{item.label}</label>
						</div>
					);
				})}
			</RadioGroup.Root>
		</>
	);
}
