import { useSearchParams } from 'react-router';

export default function Index() {
	const [searchParams] = useSearchParams();

	if (!searchParams.has('value')) {
		return null;
	}

	return (
		<div>
			Submitted the following value:
			<pre>{JSON.stringify(searchParams.get('value'), null, 2)}</pre>
		</div>
	);
}
