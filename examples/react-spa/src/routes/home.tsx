import { useSearchParams } from 'react-router';

export default function Index() {
	const [searchParams] = useSearchParams();

	if (!searchParams.has('value')) {
		return null;
	}

	return (
		<div>
			Submitted the following value:
			<pre>{searchParams.get('value')}</pre>
		</div>
	);
}
