import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

export function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url);
	const value = url.searchParams.get('value');

	return json({
		value: value ? JSON.parse(value) : undefined,
	});
}

export default function Index() {
	const { value } = useLoaderData<typeof loader>();

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
