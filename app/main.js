/* Preact Core */ import { render, h, html, useEffect, useState, useCallback, useMemo, useRef } from 'importmap';
/* UI */ import { useUI, LoadingBar, Spinner, InteractiveContainer, ButtonToggle } from 'importmap';
/* Navigation */ import { initRoutesMap, NavigationProvider, useNavigationState, Link } from 'importmap';
/* DB */ import { setupDB, useIDB } from 'importmap';
/* Form */ import { initFormBlueprint } from 'importmap';
/* I18n */ import { I18nProvider } from 'importmap';
import { ROUTES_MAP } from 'importmap';
import { PortalApp } from 'https://cdn.jsdelivr.net/gh/medwins98/IndieIn@880fc1c7320a8c68de3f3f84f5cc07af415357ab/app/portal.js';

await setupDB(IDB_CONFIG);
initRoutesMap(ROUTES_MAP);
initFormBlueprint(FORM_BLUEPRINT);
const elapp = document.getElementById('app');
render(html`<${DocumentRoot} elroot=${elapp} />`, elapp);

function AppProvider({ children, elroot = null })
{
	return html`
		<${NavigationProvider}>
			<${I18nProvider} translation=${TRANSLATION} userLocale=${USER_SETTINGS_GENERAL.locale}>
				${children}
			<//>
		<//>`;
}

function DocumentRoot({ elroot })
{
	return html`
		<${AppProvider} elroot=${elroot} >
			<${App} />
		<//>`;
}

function App({ children })
{
	const pageInfo = useNavigationState();
	const [service, setService] = useState(pageInfo?.params?.service || null);
	const [AppComponent, setAppComponent] = useState(null);
	
	useEffect(() => {
		setService(pageInfo?.params?.service || null);
	}, [pageInfo]);
	
	useEffect(() => {
		if(!service) return setAppComponent(null);
		/*
		import(`./${app}/${app}.js`).then(mod => {
			setAppComponent(() => mod.default);
		})
		*/
	}, [service]);
	
	if(!service || service === 'app') {
		return html`<${PortalApp} ...${pageInfo} />`;
	}
	else {
		
	}
	
	if(!AppComponent) return html`<p>Loading...</p>`;
	
	return html`<${AppComponent} />`;
}

export function POSApp({ children })
{
	const { toggle } = useUI();
	
	return html`
		<main class="pos-container">
			<${InteractiveContainer} id="transaction" keepMounted=${true}>
				<${TransactionSection} />
			<//>
			<${CatalogSection} />
			<${CartSection} />
		</main>
		<${InteractiveContainer} id="payment">
			<${PaymentSection}/>
		<//>`;
}
