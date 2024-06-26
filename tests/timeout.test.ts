import { ApiError, InMemory, configure, fs, type BackendConfiguration } from '@zenfs/core';
import { MessageChannel } from 'node:worker_threads';
import { Port } from '../src/fs.js';

/**
 * Tests a mis-configured PortFS using a MessageChannel
 */

describe('Timeout', () => {
	const { port1, port2 } = new MessageChannel();

	afterAll(() => {
		port1.close();
		port2.close();
	});

	test('Misconfiguration', async () => {
		let error: ApiError;
		try {
			await configure({
				'/tmp': { backend: InMemory, name: 'tmp' },
				'/port': <BackendConfiguration>{ backend: Port, port: port1, timeout: 100 },
			});
		} catch (e) {
			error = e;
		}
		expect(error).toBeInstanceOf(ApiError);
		expect(error.code).toBe('EIO');
		expect(error.message).toContain('RPC Failed');
	});

	test('Remote not attached', async () => {
		let error: ApiError;
		try {
			await configure(<BackendConfiguration>{ backend: Port, port: port1, timeout: 100 });
			await fs.promises.writeFile('/test', 'anything');
		} catch (e) {
			error = e;
		}
		expect(error).toBeInstanceOf(ApiError);
		expect(error.code).toBe('EIO');
		expect(error.message).toContain('RPC Failed');
	});
});
