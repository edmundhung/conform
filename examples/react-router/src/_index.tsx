import type { LoaderFunctionArgs } from 'react-router-dom';
import { useLoaderData, json } from 'react-router-dom';

export function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url);
	const value = url.searchParams.get('value');

	return json({
		value: value ? JSON.parse(value) : undefined,
	});
}

export function Component() {
	const { value } = useLoaderData() as any;

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
