import {
	Check as CheckIcon,
	ChevronsUpDown as ChevronsUpDownIcon,
	X as XIcon,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { HiddenInput, useControl } from '@conform-to/react/future';
import { coerceStructure } from '@conform-to/zod/v3/future';
import { z } from 'zod';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from './ui/command';
import { cn } from '../lib/utils';

export const memberSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string(),
	role: z.enum(['developer', 'designer', 'manager']),
});

export type Member = z.infer<typeof memberSchema>;

const teamMembers: Member[] = [
	{
		id: '1',
		name: 'Alice Chen',
		email: 'alice@example.com',
		role: 'developer',
	},
	{ id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'designer' },
	{ id: '3', name: 'Carol Davis', email: 'carol@example.com', role: 'manager' },
	{ id: '4', name: 'Dan Wilson', email: 'dan@example.com', role: 'developer' },
	{ id: '5', name: 'Eva Martinez', email: 'eva@example.com', role: 'designer' },
	{ id: '6', name: 'Frank Lee', email: 'frank@example.com', role: 'developer' },
	{ id: '7', name: 'Grace Kim', email: 'grace@example.com', role: 'manager' },
];

export type TeamMemberSelectProps = {
	name: string;
	defaultPayload?: unknown;
	'aria-labelledby'?: string;
	'aria-describedby'?: string;
};

const membersSchema = z.array(memberSchema);

export function TeamMemberSelect({
	name,
	defaultPayload,
	...props
}: TeamMemberSelectProps) {
	const [open, setOpen] = useState(false);
	const triggerRef = useRef<HTMLDivElement>(null);
	const control = useControl({
		defaultPayload,
		parse(payload) {
			return coerceStructure(membersSchema).parse(payload);
		},
		onFocus() {
			triggerRef.current?.focus();
		},
	});

	const selected: Member[] = control.payload ?? [];

	function toggle(member: Member) {
		const exists = selected.some((m) => m.id === member.id);
		const next = exists
			? selected.filter((m) => m.id !== member.id)
			: [...selected, member];
		control.change(next);
	}

	function remove(memberId: string) {
		control.change(selected.filter((m) => m.id !== memberId));
	}

	return (
		<>
			<HiddenInput
				type="fieldset"
				name={name}
				ref={control.register}
				defaultValue={control.defaultPayload}
			/>
			<Popover
				open={open}
				onOpenChange={(isOpen) => {
					setOpen(isOpen);
					if (!isOpen) {
						control.blur();
					}
				}}
			>
				<PopoverTrigger asChild>
					<div
						{...props}
						ref={triggerRef}
						role="combobox"
						tabIndex={0}
						aria-expanded={open}
						className={cn(
							'flex min-h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer',
							'focus:outline-none focus:ring-2 focus:ring-stone-950 focus:ring-offset-2',
							selected.length === 0 && 'text-muted-foreground',
						)}
					>
						{selected.length === 0 ? (
							<span>Select team members</span>
						) : (
							<div className="flex flex-wrap gap-1">
								{selected.map((member) => (
									<span
										key={member.id}
										className="inline-flex items-center gap-1 rounded bg-stone-100 px-2 py-0.5 text-xs text-foreground"
									>
										{member.name}
										<button
											type="button"
											className="hover:bg-stone-200 rounded-sm"
											onClick={(e) => {
												e.stopPropagation();
												remove(member.id);
											}}
											aria-label={`Remove ${member.name}`}
										>
											<XIcon className="h-3 w-3" />
										</button>
									</span>
								))}
							</div>
						)}
						<ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</div>
				</PopoverTrigger>
				<PopoverContent className="w-[320px] p-0">
					<Command>
						<CommandInput placeholder="Search members..." />
						<CommandList>
							<CommandEmpty>No members found.</CommandEmpty>
							<CommandGroup>
								{teamMembers.map((member) => {
									const isSelected = selected.some((m) => m.id === member.id);
									return (
										<CommandItem
											key={member.id}
											value={member.name}
											onSelect={() => toggle(member)}
										>
											<CheckIcon
												className={cn(
													'mr-2 h-4 w-4',
													isSelected ? 'opacity-100' : 'opacity-0',
												)}
											/>
											<div className="flex flex-col">
												<span>{member.name}</span>
												<span className="text-xs text-muted-foreground">
													{member.email} &middot; {member.role}
												</span>
											</div>
										</CommandItem>
									);
								})}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</>
	);
}
