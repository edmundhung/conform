import { Suspense } from 'react';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default function Index({
	searchParams,
}: {
	searchParams: SearchParams;
}) {
	return (
		<Suspense>
			<SubmittedValue searchParams={searchParams} />
		</Suspense>
	);
}

async function SubmittedValue({
	searchParams,
}: {
	searchParams: SearchParams;
}) {
	const { value } = await searchParams;

	if (typeof value === 'undefined') {
		return null;
	}

	return (
		<div>
			Submitted the following value:
			<pre>{JSON.stringify(JSON.parse(value.toString()), null, 2)}</pre>
		</div>
	);
}
