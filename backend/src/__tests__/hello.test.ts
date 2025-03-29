/** @format */

import { expect } from 'chai';
import { appRouter } from '../router/index.js';

describe('hello endpoint', () => {
	it('should return greeting with name', async () => {
		const caller = appRouter.createCaller({});
		const result = await caller.hello({ name: 'Test' });
		expect(result).to.deep.equal({ greeting: 'Hello Test!' });
	});

	it('should return greeting with default name', async () => {
		const caller = appRouter.createCaller({});
		const result = await caller.hello({});
		expect(result).to.deep.equal({ greeting: 'Hello World!' });
	});
});
