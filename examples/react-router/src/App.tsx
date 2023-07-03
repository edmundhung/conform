import {
	createBrowserRouter,
	createRoutesFromElements,
	Route,
	RouterProvider,
	Link,
	Outlet,
} from 'react-router-dom';

const router = createBrowserRouter(
	createRoutesFromElements(
		<Route path="/" Component={Example}>
			<Route path="login" lazy={() => import('./login')} />
			<Route
				path="login_useFetcher"
				lazy={() => import('./login_useFetcher')}
			/>
			<Route path="todos" lazy={() => import('./todos')} />
			<Route
				path="todos_useFetcher"
				lazy={() => import('./todos_useFetcher')}
			/>
			<Route path="signup" lazy={() => import('./signup')} />
			<Route
				path="signup_useFetcher"
				lazy={() => import('./signup_useFetcher')}
			/>
		</Route>,
	),
);

function Example() {
	return (
		<main>
			<h1>React Router Example</h1>

			<p>
				This example demonstrates some of the features of Conform including{' '}
				<strong>constraint validation</strong>, <strong>nested list</strong>,
				and <strong>async validation with zod</strong>.
			</p>

			<ul>
				<li>
					<Link to="login">Login</Link> (
					<Link to="login_useFetcher">with useFetcher</Link>)
				</li>
				<li>
					<Link to="todos">Todo list</Link> (
					<Link to="todos_useFetcher">with useFetcher</Link>)
				</li>
				<li>
					<Link to="signup">Signup</Link> (
					<Link to="signup_useFetcher">with useFetcher</Link>)
				</li>
			</ul>

			<hr />

			<Outlet />
		</main>
	);
}

export default function App() {
	return <RouterProvider router={router} />;
}
