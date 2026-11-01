import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
	index('routes/_index.tsx'),
	route('examples/:name', 'routes/examples.$name.tsx'),
	route('integration/remix', 'routes/integration.remix.ts'),
	route('*', 'routes/$.tsx'),
] satisfies RouteConfig;
