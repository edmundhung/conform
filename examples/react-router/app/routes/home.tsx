import { useSearchParams } from 'react-router';

function parseJson(value: string | null): unknown {
	try {
		return value ? JSON.parse(value) : null;
	} catch {
		return null;
	}
}

export default function Index() {
	const [searchParams] = useSearchParams();
	const value = parseJson(searchParams.get('value'));

	if (!value) {
		return null;
	}

	return (
		<div>
			Submitted the following value:
			<pre>{JSON.stringify(value, null, 2)}</pre>
		</div>
	);
}
