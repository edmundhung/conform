import { FieldMetadata, useInputControl } from '@conform-to/react';
import * as Checkbox from '@radix-ui/react-checkbox';
import { CheckIcon } from '@radix-ui/react-icons';
import { ElementRef, useRef } from 'react';

export function CheckboxConform({
	config,
}: {
	config: FieldMetadata<string | undefined>;
}) {
	const checkboxRef = useRef<ElementRef<typeof Checkbox.Root>>(null);
	const control = useInputControl(config);

	return (
		<>
			<input
				className="sr-only"
				name={config.name}
				tabIndex={-1}
				defaultValue={config.initialValue}
				onFocus={() => checkboxRef.current?.focus()}
			/>
			<Checkbox.Root
				ref={checkboxRef}
				id={config.id}
				onCheckedChange={(e) => {
					control.change(e ? 'on' : 'off');
				}}
				onBlur={control.blur}
				defaultChecked={config.initialValue == 'on'}
				className="hover:bg-amber-50 flex size-5 appearance-none items-center justify-center rounded-md bg-white outline-none border focus:ring-amber-500 focus:ring-2"
			>
				<Checkbox.Indicator className="text-amber-900">
					<CheckIcon />
				</Checkbox.Indicator>
			</Checkbox.Root>
		</>
	);
}
