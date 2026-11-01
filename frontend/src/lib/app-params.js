const isNode = typeof window === 'undefined';

const isClearAccessTokenRequested = () =>
	!isNode && new URLSearchParams(window.location.search).get("clear_access_token") === 'true';

const clearStoredAccessToken = () => {
	window.localStorage.removeItem('base44_access_token');
	window.localStorage.removeItem('token');
	window.localStorage.removeItem('auth_token');
}

const getAccessToken = () => {
	if (isNode) return null;
	return window.localStorage.getItem('auth_token') || 
	       window.localStorage.getItem('token') || 
	       window.localStorage.getItem('base44_access_token');
}

const getAppParams = () => {
	if (isClearAccessTokenRequested()) {
		clearStoredAccessToken();
	}
	return {
		appId: import.meta.env.VITE_BASE44_APP_ID,
		token: getAccessToken(),
		functionsVersion: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION,
		appBaseUrl: import.meta.env.VITE_BASE44_APP_BASE_URL,
	}
}

export const appParams = {
	...getAppParams()
}

// Also export as APP_PARAMS for compatibility
export const APP_PARAMS = appParams;

