import { FieldMetadata, useInputControl } from '@conform-to/react';
import * as RadioGroup from '@radix-ui/react-radio-group';
import clsx from 'clsx';
import { ElementRef, useRef } from 'react';

export function RadioGroupConform({
	config,
	items,
}: {
	config: FieldMetadata<string>;
	items: Array<{ value: string; label: string }>;
}) {
	const radioGroupRef = useRef<ElementRef<typeof RadioGroup.Root>>(null);
	const control = useInputControl(config);
	return (
		<>
			<input
				name={config.name}
				defaultValue={config.initialValue}
				tabIndex={-1}
				className="sr-only"
				onFocus={() => {
					radioGroupRef.current?.focus();
				}}
			/>
			<RadioGroup.Root
				value={control.value}
				ref={radioGroupRef}
				className="flex items-center gap-4"
				onValueChange={(value) => {
					control.change(value);
				}}
				onBlur={() => control.blur()}
				defaultValue={config.initialValue}
			>
				{items.map((item) => {
					return (
						<div className="flex items-center gap-2" key={item.value}>
							<RadioGroup.Item
								value={item.value}
								id={`${item.label}Id`}
								className={clsx(
									'size-5 rounded-full outline-none cursor-default',
									'border hover:bg-amber-50 focus:ring-amber-500 focus:ring-2',
									'flex items-center justify-center',
									'bg-white',
								)}
							>
								<RadioGroup.Indicator className="flex items-center justify-center w-full h-full relative after:content-[''] after:block after:size-2.5 after:rounded-full after:bg-amber-700" />
							</RadioGroup.Item>
							<label htmlFor={`${item.label}Id`}>{item.label}</label>
						</div>
					);
				})}
			</RadioGroup.Root>
		</>
	);
}
