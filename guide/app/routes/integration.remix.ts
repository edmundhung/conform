import { redirect } from 'react-router';
import type { Route } from './+types/integration.remix';

export function loader({ request }: Route.LoaderArgs) {
	const { search } = new URL(request.url);

	// Temporary so this path can host a Remix integration guide again later
	return redirect(`/integration/react-router${search}`, 302);
}
