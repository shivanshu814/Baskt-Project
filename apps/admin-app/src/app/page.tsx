/** @format */

'use client';

import { TestButton } from '../components/TestButton';

export default function Home() {
	return (
		<main className='min-h-screen p-8 bg-gray-100'>
			<h1 className='mb-8 text-3xl font-bold'>Admin App</h1>
			<TestButton />
		</main>
	);
}
