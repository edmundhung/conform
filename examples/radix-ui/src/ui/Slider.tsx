import { FieldMetadata, useInputControl } from '@conform-to/react';
import * as RadixSlider from '@radix-ui/react-slider';
import { ElementRef, useRef } from 'react';

export function Slider({
	meta,
	max = 100,
}: {
	meta: FieldMetadata<number>;
	ariaLabel?: string;
	max?: number;
}) {
	const thumbRef = useRef<ElementRef<typeof RadixSlider.Thumb>>(null);
	const control = useInputControl(meta);

	return (
		<div className="flex items-center gap-4">
			<input
				name={meta.name}
				defaultValue={meta.initialValue}
				className="sr-only"
				tabIndex={-1}
				onFocus={() => {
					thumbRef.current?.focus();
				}}
			/>
			<RadixSlider.Root
				value={[parseFloat(control.value ?? '0')]}
				className="relative flex items-center select-none touch-none w-full h-5"
				aria-invalid={!!meta.errors}
				max={max}
				onValueChange={(value) => {
					control.change(value[0].toString());
				}}
				onBlur={control.blur}
				step={1}
			>
				<RadixSlider.Track className="bg-neutral-400 relative grow rounded-full h-1">
					<RadixSlider.Range className="absolute bg-amber-700/40 rounded-full h-full" />
				</RadixSlider.Track>
				<RadixSlider.Thumb
					ref={thumbRef}
					className="block size-5 shadow-md rounded-full bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 border"
				/>
			</RadixSlider.Root>
			<div>{control.value}</div>
		</div>
	);
}
