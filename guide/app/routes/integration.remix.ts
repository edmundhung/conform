import { type LoaderFunctionArgs, redirect } from '@remix-run/cloudflare';

export function loader({ request }: LoaderFunctionArgs) {
	const { search } = new URL(request.url);

	// Temporary so this path can host a Remix integration guide again later
	return redirect(`/integration/react-router${search}`, 302);
}
