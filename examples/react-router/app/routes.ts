import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
	index('routes/home.tsx'),
	route('login', 'routes/login.tsx'),
	route('login-fetcher', 'routes/login-fetcher.tsx'),
	route('signup', 'routes/signup.tsx'),
	route('signup-async-schema', 'routes/signup-async-schema.tsx'),
	route('signup-server-validation', 'routes/signup-server-validation.tsx'),
	route('todos', 'routes/todos.tsx'),
	route('file-upload', 'routes/file-upload.tsx'),
] satisfies RouteConfig;
