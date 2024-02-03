import { type FieldMetadata, useInputControl } from '@conform-to/react';
import * as Checkbox from '@radix-ui/react-checkbox';
import { CheckIcon } from '@radix-ui/react-icons';
import { type ElementRef, useRef } from 'react';

export function CheckboxConform({
	meta,
}: {
	meta: FieldMetadata<string | boolean | undefined>;
}) {
	const checkboxRef = useRef<ElementRef<typeof Checkbox.Root>>(null);
	const control = useInputControl(meta);

	return (
		<>
			<input
				className="sr-only"
				name={meta.name}
				tabIndex={-1}
				defaultValue={meta.initialValue}
				onFocus={() => checkboxRef.current?.focus()}
			/>
			<Checkbox.Root
				ref={checkboxRef}
				id={meta.id}
				checked={control.value === 'on'}
				onCheckedChange={(checked) => {
					control.change(checked ? 'on' : '');
				}}
				onBlur={control.blur}
				className="hover:bg-amber-50 flex size-5 appearance-none items-center justify-center rounded-md bg-white outline-none border focus:ring-amber-500 focus:ring-2"
			>
				<Checkbox.Indicator className="text-amber-900">
					<CheckIcon />
				</Checkbox.Indicator>
			</Checkbox.Root>
		</>
	);
}
