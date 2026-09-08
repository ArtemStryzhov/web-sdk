import type { paths } from './schema';
import { fetcher } from 'utils-fetcher';

/**
 * The RGS does not always answer with JSON: a rejected request (e.g. an empty
 * sessionID) comes back as a plain-text body like 'Bad Request'. Parsing that
 * blindly used to surface as 'SyntaxError: Unexpected token B', which hides the
 * actual status, so the body is read as text first and any failure is turned
 * into the { error, message } shape every caller already checks for.
 */
const parseResponse = async (response: Response, endpoint: string) => {
	const text = await response.text();

	let data: unknown = null;
	try {
		data = text ? JSON.parse(text) : null;
	} catch {
		data = null;
	}

	if (response.status !== 200) {
		const errorData = {
			error: `${response.status} ${response.statusText || 'Request failed'}`,
			message: text || `No response body from ${endpoint}`,
			endpoint,
		};
		console.error('error', errorData);
		// a JSON error body from the RGS is more specific, so let it win
		return data && typeof data === 'object' ? { ...errorData, ...data } : errorData;
	}

	if (data === null && text) {
		const errorData = {
			error: 'Invalid JSON in response',
			message: text,
			endpoint,
		};
		console.error('error', errorData);
		return errorData;
	}

	return data;
};

export const rgsFetcher = {
	post: async function post<
		T extends keyof paths,
		TResponse = paths[T]['post']['responses'][200]['content']['application/json'],
	>(options: {
		url: T;
		rgsUrl: string;
		variables?: paths[T]['post']['requestBody']['content']['application/json'];
	}): Promise<TResponse> {
		const endpoint = `https://${options.rgsUrl}${options.url}`;

		const response = await fetcher({
			method: 'POST',
			variables: options.variables,
			endpoint,
		});

		const data = await parseResponse(response, endpoint);
		return data as TResponse;
	},
	get: async function get<
		T extends keyof paths,
		TResponse = paths[T]['get']['responses'][200]['content']['application/json'],
	>(options: { url: T; rgsUrl: string }): Promise<TResponse> {
		const endpoint = `https://${options.rgsUrl}${options.url}`;

		const response = await fetcher({
			method: 'GET',
			endpoint,
		});

		const data = await parseResponse(response, endpoint);
		return data as TResponse;
	},
};
