import { html, createContext, useContext, useState, useRef, useCallback, useEffect } from 'importmap';

let ROUTES_MAP;

export function initRoutesMap(routesMap) {
	if(!routesMap) return;
	ROUTES_MAP = compileRoutes(routesMap);
}

/* Compiler */
function compileRoutes(routesMap)
{
	return routesMap.map(route => {
		let regex = null;
		
		if(typeof route.path === 'string')
		{
			if(route.path.includes(':')) {
				const pattern = route.path.replace(/:(\w+)/g, '(?<$1>[^\\/]+)');
				regex = new RegExp(`^${pattern}$`);
			}
			else {
				// /path === /path/
				regex = new RegExp(`^${route.path.replace(/\//g, '\\/')}\\/?$`);
			}
		} 
		else if (route.path instanceof RegExp) {
			regex = route.path;
		}
		
		return { ...route, regex };
	});
}

/* Route helper */
function getMatchedRoute(url)
{
	if(!ROUTES_MAP) return null;
	
	let params = {};

	const matchedRoute = ROUTES_MAP.find(route =>
	{
		if(Array.isArray(route.path)) {
			return route.path.includes(url);
		}

		if(typeof route.path === 'string' && !route.regex) {
			return route.path === url;
		}

		if(route.regex)
		{
			const match = url.match(route.regex);
			if(match) {
				params = match.groups || {};
				return true;
			}
		}

		return false;
	});
	
	if(!matchedRoute) return null;
	
	let resolvedApi = matchedRoute?.api || null;
	if(resolvedApi) {
		Object.keys(params).forEach(key => {
			resolvedApi = resolvedApi.replace(`:${key}`, params[key]);
		});
	}
	
	return { ...matchedRoute, api: resolvedApi, params };
}

/* Core */
const NavigationContext = createContext();
const NavigationStateContext = createContext();

export function NavigationProvider({ children })
{
	const firstLoad = useRef(true);
	const pageUrl = useRef(window.location.pathname);
	const [pageInfo, setPageInfo] = useState(null);
	
	// Core function
	const routing = useCallback((url) =>
	{
		if(url === pageUrl.current) return;
		const route = getMatchedRoute(url);
		const pageInfo = {
			...route,
			url: url,
			firstLoad: firstLoad.current
		};
		
		if(!route) {
			pageInfo.key = '404';
			pageInfo.title = '404 - Not found';
		}
		
		window.history.pushState(pageInfo?.title || 'No Title', '', url);
		pageUrl.current = url;
		setPageInfo(pageInfo);
	}, [firstLoad]);
	
	useEffect(() => {
		const timer = setTimeout(() => routing('/'), 10);
		if(firstLoad.current) return;
		return () => clearTimeout(timer);
	}, []);
	
	useEffect(() => {
		firstLoad.current = false;
		
		// Sync with browser back/forward button
		const onHistoryChange = () => routing(window.location.pathname);
		window.addEventListener('popstate', onHistoryChange);
		return () => window.removeEventListener('popstate', onHistoryChange);
	}, []);
	
	useEffect(() => {
		document.title = pageInfo?.title || 'No Title';
	}, [pageInfo]);
	
	return html`
		<${NavigationContext.Provider} value=${routing}>
			<${NavigationStateContext.Provider} value=${pageInfo}>
				${children}
			<//>
		<//>`;
}

const useNavigation = () => useContext(NavigationContext);
export const useNavigationState = () => useContext(NavigationStateContext);

/* Link Component */
export function Link({ children, ...props })
{
	const routing = useNavigation();
	
	const handleLinkClick = useCallback((e) => {
		e.preventDefault();
		routing(e.currentTarget.getAttribute('href'));
	}, [routing]);
	
	return html`<a onClick=${handleLinkClick} ...${props}>${children}</a>`;
}