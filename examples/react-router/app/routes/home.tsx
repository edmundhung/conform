import { useSearchParams } from 'react-router';

function parseJson(value: string | null): unknown {
	if (value === null) {
		return null;
	}

	try {
		return JSON.parse(value);
	} catch {
		return null;
	}
}

export default function Index() {
	const [searchParams] = useSearchParams();
	const value = parseJson(searchParams.get('value'));

	if (value === null) {
		return null;
	}

	return (
		<div>
			Submitted the following value:
			<pre>{JSON.stringify(value, null, 2)}</pre>
		</div>
	);
}
