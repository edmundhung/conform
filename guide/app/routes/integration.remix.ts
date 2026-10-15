import { type LoaderFunctionArgs, redirect } from '@remix-run/cloudflare';

export function loader({ request }: LoaderFunctionArgs) {
	const { search } = new URL(request.url);

	return redirect(`/integration/react-router${search}`, 301);
}
