import {
	createBrowserRouter,
	createRoutesFromElements,
	Route,
	RouterProvider,
	redirect,
} from 'react-router-dom';

const router = createBrowserRouter(
	createRoutesFromElements(
		<Route path="/">
			<Route index loader={() => redirect('/login')} />
			<Route path="login" lazy={() => import('./login')} />
		</Route>,
	),
);

export default function App() {
	return <RouterProvider router={router} />;
}
