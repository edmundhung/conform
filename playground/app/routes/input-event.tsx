import { useInputEvent, conform } from '@conform-to/react';
import { useSearchParams } from '@remix-run/react';
import { type FormEvent, useRef, useState } from 'react';

export default function BaseInputText() {
	const [searchParams] = useSearchParams();
	const [baseRef, control] = useInputEvent({
		onSubmit: (e) => {
			const submitter = e.submitter as HTMLButtonElement | undefined;

			e.preventDefault();

			setLogsByName((prev) => {
				const next: Record<string, string[]> = {};

				if (submitter?.name === 'intent') {
					for (const name of Object.keys(prev)) {
						next[name] = [`--- ${submitter.value} ---`];
					}
				}

				return next;
			});
		},
		onReset: () => setValue(searchParams.get('defaultValue') ?? ''),
	});
	const inputRef = useRef<HTMLInputElement>(null);
	const [value, setValue] = useState(searchParams.get('defaultValue') ?? '');
	const [logsByName, setLogsByName] = useState<Record<string, string[]>>({});
	const log = (event: FormEvent<HTMLFormElement>) => {
		const input = event.target as HTMLInputElement;

		setLogsByName((logsByName) => ({
			...logsByName,
			[input.name]: [
				...(logsByName[input.name] ?? []),
				JSON.stringify({
					eventPhase: event.eventPhase,
					type: event.type,
					bubbles: event.bubbles,
					cancelable: event.cancelable,
				}),
			],
		}));
	};

	return (
		<form
			onChange={log}
			onInput={log}
			onFocusCapture={log}
			onFocus={log}
			onBlurCapture={log}
			onBlur={log}
		>
			<div className="sticky top-0 pt-4 pb-8 bg-gray-100 border-b">
				<label>Type here</label>
				<input
					ref={baseRef}
					{...conform.input(
						{
							name: 'base-input',
							defaultValue: searchParams.get('defaultValue') ?? '',
						},
						{ hidden: true },
					)}
				/>
				<div className="flex flex-row gap-4">
					<input
						className="p-2 flex-1"
						name="native-input"
						value={value}
						ref={inputRef}
						onChange={(e) => {
							control.change(e.target.value);
							setValue(e.target.value);
						}}
						onFocus={control.focus}
						onBlur={control.blur}
					/>
					<button
						className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
						name="intent"
						value="clear"
					>
						Submit
					</button>
					<button
						type="reset"
						className="inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-50 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
