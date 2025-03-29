/** @format */

import React from 'react';

export interface ButtonProps {
	children: React.ReactNode;
	onClick?: () => void;
	variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({
	children,
	onClick,
	variant = 'primary',
}) => {
	const baseStyles = 'px-4 py-2 rounded-md font-medium transition-colors';
	const variantStyles = {
		primary: 'bg-blue-500 text-white hover:bg-blue-600',
		secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
	};

	return (
		<button
			onClick={onClick}
			className={`${baseStyles} ${variantStyles[variant]}`}>
			{children}
		</button>
	);
};
