import { useSearchParams } from '@remix-run/react';
import { useReducer, useRef, useState } from 'react';
import { BaseInput } from 'react-base-input';

export default function BaseInputText() {
	const [searchParams] = useSearchParams();
	const ref = useRef<HTMLInputElement>(null);
	const [value, setValue] = useState(searchParams.get('defaultValue') ?? '');
	const [logs, append] = useReducer(
		(list: string[], log: string) => list.concat(log),
		[],
	);

	return (
		<form
			onChange={(e: any) => append(`${e.target.name}: ${e.type}`)}
			onFocus={(e: any) => append(`${e.target.name}: ${e.type}`)}
			onBlur={(e: any) => append(`${e.target.name}: ${e.type}`)}
		>
			<div>
				<label>Type here</label>
				<input
					name="native-input"
					value={value}
					onChange={(e) => {
						setValue(e.target.value);
					}}
					onFocus={(e) => {
						ref.current?.focus();
					}}
					onBlur={(e) => {
						ref.current?.blur();
					}}
				/>
				<BaseInput ref={ref} name="base-input" value={value} />
			</div>
			<ul>
				{logs.map((log, i) => (
					<li key={i}>{log}</li>
				))}
			</ul>
		</form>
	);
}
