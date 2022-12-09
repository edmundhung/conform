import { useSearchParams } from '@remix-run/react';
import { useReducer, useRef, useState } from 'react';
import { BaseInput } from 'react-base-input';

/**
 * Format event phase number
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Event/eventPhase
 */
function getEventPhaseName(phase: number) {
	switch (phase) {
		case 0:
			return 'None';
		case 1:
			return 'Capturing';
		case 2:
			return 'At target';
		case 3:
			return 'Bubbling';
		default:
			throw new Error('Unknown event phase');
	}
}

export default function BaseInputText() {
	const [searchParams] = useSearchParams();
	const baseRef = useRef<HTMLInputElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const [value, setValue] = useState(searchParams.get('defaultValue') ?? '');
	const [logsByName, log] = useReducer(
		(
			logsByName: Record<string, string[]>,
			event: { target: { name: string }; type: string; eventPhase: number },
		) => ({
			...logsByName,
			[event.target.name]: [
				...(logsByName[event.target.name] ?? []),
				`${getEventPhaseName(event.eventPhase)}: ${event.type}`,
			],
		}),
		{},
	);

	return (
		<form
			onChange={(e: any) => log(e)}
			onFocusCapture={(e: any) => log(e)}
			onFocus={(e: any) => log(e)}
			onBlurCapture={(e: any) => log(e)}
			onBlur={(e: any) => log(e)}
		>
			<div className="sticky top-0 pt-4 pb-8 bg-gray-100 border-b">
				<label>Type here</label>
				<BaseInput
					ref={baseRef}
					name="base-input"
					value={value}
					onReset={() => setValue(searchParams.get('defaultValue') ?? '')}
				/>
				<div className="flex flex-row gap-4">
					<input
						className="p-2 flex-1"
						name="native-input"
						value={value}
						ref={inputRef}
						onChange={(e) => {
							setValue(e.target.value);
						}}
						onFocus={(e) => {
							baseRef.current?.focus();
						}}
						onBlur={(e) => {
							baseRef.current?.blur();
						}}
					/>
					<button
						type="reset"
						className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					>
						Reset
					</button>
				</div>
			</div>
			<div className="my-4 flex flex-row">
				<div className="flex-1">
					native-input logs
					<ul id="native-input">
						{logsByName['native-input']?.map((log, i) => (
							<li key={i}>{log}</li>
						))}
					</ul>
				</div>
				<div className="flex-1">
					base-input logs
					<ul id="base-input">
						{logsByName['base-input']?.map((log, i) => (
							<li key={i}>{log}</li>
						))}
					</ul>
				</div>
			</div>
		</form>
	);
}
