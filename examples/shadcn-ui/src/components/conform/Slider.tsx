import {
	FieldMetadata,
	unstable_useControl as useControl,
} from '@conform-to/react';
import { ComponentProps, ElementRef, useRef } from 'react';
import { Slider } from '@/components/ui/slider';

export function SliderConform({
	meta,
	...props
}: {
	meta: FieldMetadata<number>;
	ariaLabel?: string;
} & ComponentProps<typeof Slider>) {
	const sliderRef = useRef<ElementRef<typeof Slider>>(null);
	const control = useControl(meta);

	return (
		<>
			<input
				name={meta.name}
				ref={control.register}
				defaultValue={meta.initialValue}
				className="sr-only"
				tabIndex={-1}
				onFocus={() => {
					const sliderSpan =
						sliderRef.current?.querySelector('[role="slider"]');
					if (sliderSpan instanceof HTMLElement) {
						sliderSpan.focus();
					}
				}}
			/>
			<div className="flex items-center gap-4">
				<Slider
					{...props}
					ref={sliderRef}
					aria-invalid={!!meta.errors}
					value={[parseFloat(control.value ?? '0')]}
					onValueChange={(value) => {
						control.change(value[0].toString());
					}}
					onBlur={control.blur}
					className="w-[280px]"
				/>
				<div>{control.value}</div>
			</div>
		</>
	);
}
