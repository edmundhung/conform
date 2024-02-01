import { FieldMetadata, useInputControl } from '@conform-to/react';
import * as Switch from '@radix-ui/react-switch';
import { ElementRef, useRef } from 'react';

export function SwitchConform({ config }: { config: FieldMetadata<string> }) {
	const switchRef = useRef<ElementRef<typeof Switch.Root>>(null);
	const control = useInputControl(config);
	return (
		<>
			<input
				name={config.name}
				defaultValue={config.initialValue ? 'on' : 'off'}
				className="sr-only"
				tabIndex={-1}
				onFocus={() => {
					switchRef.current?.focus();
				}}
			/>
			<Switch.Root
				checked={config.value == 'on'}
				ref={switchRef}
				id={config.id}
				onCheckedChange={(value) => {
					control.change(value ? 'on' : 'off');
				}}
				onBlur={control.blur}
				className="w-[42px] h-[25px] bg-amber-700/30 rounded-full relative focus:ring-2 focus:ring-amber-500 data-[state=checked]:bg-amber-700 outline-none cursor-default"
			>
				<Switch.Thumb className="block size-5 bg-white rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px]" />
			</Switch.Root>
		</>
	);
}
