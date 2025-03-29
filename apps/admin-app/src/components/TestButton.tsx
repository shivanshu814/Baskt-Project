/** @format */

import { useState } from 'react';
import { trpc } from '../utils/trpc';

export const TestButton = () => {
	const [showUsers, setShowUsers] = useState(false);
	const { data, isLoading } = trpc.getUsers.useQuery(undefined, {
		enabled: showUsers,
	});

	return (
		<div className='p-4'>
			<button
				onClick={() => setShowUsers(true)}
				className='bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded'>
				Load Users (Admin App)
			</button>

			{isLoading && <div className='mt-4'>Loading...</div>}

			{data && (
				<div className='mt-4'>
					<h2 className='text-xl font-bold mb-2'>Users:</h2>
					<div className='space-y-2'>
						{data.users.map((user) => (
							<div key={user.id} className='p-2 border rounded bg-gray-50'>
								<p className='font-semibold'>{user.name}</p>
								<p className='text-gray-600'>{user.role}</p>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};
