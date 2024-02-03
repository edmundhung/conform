import { type FieldMetadata, useInputControl } from '@conform-to/react';
import * as RadixSwitch from '@radix-ui/react-switch';
import { type ElementRef, useRef } from 'react';

export function Switch({ meta }: { meta: FieldMetadata<boolean> }) {
	const switchRef = useRef<ElementRef<typeof RadixSwitch.Root>>(null);
	const control = useInputControl(meta);

	return (
		<>
			<input
				name={meta.name}
				defaultValue={meta.initialValue}
				className="sr-only"
				tabIndex={-1}
				onFocus={() => {
					switchRef.current?.focus();
				}}
			/>
			<RadixSwitch.Root
				ref={switchRef}
				id={meta.id}
				checked={meta.value === 'on'}
				onCheckedChange={(checked) => {
					control.change(checked ? 'on' : '');
				}}
				onBlur={control.blur}
				className="w-[42px] h-[25px] bg-amber-700/30 rounded-full relative focus:ring-2 focus:ring-amber-500 data-[state=checked]:bg-amber-700 outline-none cursor-default"
			>
				<RadixSwitch.Thumb className="block size-5 bg-white rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px]" />
			</RadixSwitch.Root>
		</>
	);
}
