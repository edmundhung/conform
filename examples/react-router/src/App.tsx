import {
	createBrowserRouter,
	createRoutesFromElements,
	Route,
	RouterProvider,
	redirect,
} from 'react-router-dom';
import * as login from './login';

const router = createBrowserRouter(
	createRoutesFromElements(
		<Route path="/">
			<Route index loader={() => redirect('/login')} />
			<Route path="login" action={login.action} element={<login.default />} />
		</Route>,
	),
);

export default function App() {
	return <RouterProvider router={router} />;
}
