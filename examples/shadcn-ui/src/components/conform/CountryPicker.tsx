import { Check, ChevronsUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
} from '@/components/ui/command';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
	FieldMetadata,
	unstable_useControl as useControl,
} from '@conform-to/react';
import React from 'react';

const countries = [
	{ label: 'Afghanistan', value: 'AF' },
	{ label: 'Åland Islands', value: 'AX' },
	{ label: 'Albania', value: 'AL' },
	{ label: 'Algeria', value: 'DZ' },
	{ label: 'Italy', value: 'IT' },
	{ label: 'Jamaica', value: 'JM' },
	{ label: 'Japan', value: 'JP' },
	{ label: 'United States', value: 'US' },
	{ label: 'Uruguay', value: 'UY' },
];

export function CountryPickerConform({
	meta,
}: {
	meta: FieldMetadata<string>;
}) {
	const triggerRef = React.useRef<HTMLButtonElement>(null);
	const control = useControl(meta);

	return (
		<div>
			<input
				className="sr-only"
				aria-hidden
				tabIndex={-1}
				ref={control.register}
				name={meta.name}
				defaultValue={meta.initialValue}
				onFocus={() => {
					triggerRef.current?.focus();
				}}
			/>
			<Popover>
				<PopoverTrigger asChild>
					<Button
						ref={triggerRef}
						variant="outline"
						role="combobox"
						className={cn(
							'w-[200px] justify-between',
							!control.value && 'text-muted-foreground',
							'focus:ring-2 focus:ring-stone-950 focus:ring-offset-2',
						)}
					>
						{control.value
							? countries.find((language) => language.value === control.value)
									?.label
							: 'Select language'}
						<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[200px] p-0">
					<Command>
						<CommandInput placeholder="Search language..." />
						<CommandEmpty>No language found.</CommandEmpty>
						<CommandGroup>
							{countries.map((country) => (
								<CommandItem
									value={country.label}
									key={country.value}
									onSelect={() => {
										control.change(country.value);
									}}
								>
									<Check
										className={cn(
											'mr-2 h-4 w-4',
											country.value === control.value
												? 'opacity-100'
												: 'opacity-0',
										)}
									/>
									{country.label}
								</CommandItem>
							))}
						</CommandGroup>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
}
