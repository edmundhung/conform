import { FieldMetadata, useInputControl } from '@conform-to/react';
import * as Slider from '@radix-ui/react-slider';
import { ElementRef, useRef } from 'react';

export function SliderConform({
	meta,
	max = 100,
}: {
	meta: FieldMetadata<number>;
	ariaLabel?: string;
	max?: number;
}) {
	const thumbRef = useRef<ElementRef<typeof Slider.Thumb>>(null);
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
			<Slider.Root
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
				<Slider.Track className="bg-neutral-400 relative grow rounded-full h-1">
					<Slider.Range className="absolute bg-amber-700/40 rounded-full h-full" />
				</Slider.Track>
				<Slider.Thumb
					ref={thumbRef}
					className="block size-5 shadow-md rounded-full bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 border"
				/>
			</Slider.Root>
			<div>{control.value}</div>
		</div>
	);
}
