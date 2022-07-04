import { Link } from '@remix-run/react';
import { styles } from '~/helpers';

export default function Home() {
	return (
		<>
			<header className={styles.header}>
				<h1 className="text-xl">conform demo</h1>
				<a
					className="hover:underline"
					href="https://github.com/edmundhung/conform"
					target="_blank"
					rel="noopener noreferrer"
				>
					GitHub: edmundhung/conform
				</a>
			</header>
			<ul className="bg-white border drop-shadow rounded-lg divide-y">
				<li>
					<Link className="block p-8" to="search">
						<div>Basic example</div>
						<div className="text-gray-500">
							Building a simple search form with React
						</div>
					</Link>
				</li>
				<li>
					<Link className="block p-8" to="signup">
						<div>Zod example</div>
						<div className="text-gray-500">
							Validating a signup form end to end using Zod
						</div>
					</Link>
				</li>
				<li>
					<Link className="block p-8" to="order">
						<div>Nested list example</div>
						<div className="text-gray-500">
							Composing nested list using `useFieldset` and `useFieldList`
						</div>
					</Link>
				</li>
				<li>
					<Link className="block p-8" to="material-ui">
						<div>Material-ui example</div>
						<div className="text-gray-500">Integrating with ui libraries</div>
					</Link>
				</li>
			</ul>
		</>
	);
}
