export default function Index({
	searchParams,
}: {
	searchParams: { [key: string]: string | string[] | undefined };
}) {
	const value = searchParams['value'];

	if (!value) {
		return null;
	}

	return (
		<div>
			Submitted the following value:
			<pre>{JSON.stringify(JSON.parse(value.toString()), null, 2)}</pre>
		</div>
	);
}
