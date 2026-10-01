/* Preact Core */ import { render, h, html, useEffect, useState } from 'importmap';
/* UI */ import { Spinner, InteractiveContainer } from 'importmap';
/* Navigation */ import { initRoutesMap, NavigationProvider, useNavigationState, Link } from 'importmap';
/* DB */ import { setupDB } from 'importmap';
/* Form */ import { initFormBlueprint } from 'importmap';
/* I18n */ import { I18nProvider } from 'importmap';
import { PortalApp } from './portal.js';

await setupDB(IDB_CONFIG);
initRoutesMap(ROUTES_MAP);
initFormBlueprint(FORM_BLUEPRINT);
const elapp = document.getElementById('app');
render(html`<${DocumentRoot} elroot=${elapp} />`, elapp);

function AppProvider({ children })
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

function App()
{
	const pageInfo = useNavigationState();
	const [service, setService] = useState(pageInfo?.params?.service || null);
	
	useEffect(() => {
		setService(pageInfo?.params?.service || null);
	}, [pageInfo]);
	
	return html`<${PortalApp} ...${pageInfo} />`;
}

export function POSApp()
{
	const [posModule, setPosModule] = useState(null);

	useEffect(() => {
		let isMounted = true;
		let injectedLink = null;

		Promise.all([
			import('pos'),
			loadCSS('./pos/pos.css').then(link => { injectedLink = link; })
		])
			.then(([mod]) => {
				if (isMounted) setPosModule(mod);
			})
			.catch((err) => {
				console.error("Failed to lazy load POS module:", err);
			});

		return () => {
			isMounted = false;
			if (injectedLink && injectedLink.parentNode) {
				injectedLink.parentNode.removeChild(injectedLink);
			}
		};
	}, []);

	if (!posModule) {
		return html`
			<div class="flex-center w-full h-full p2" style="min-height: 50vh;">
				<${Spinner} />
				<span class="ml05 text-sm text-secondary">Loading POS...</span>
			</div>
		`;
	}

	const { POSProvider, TransactionSection, CatalogSection, CartSection } = posModule;

	return html`
		<${POSProvider}>
			<main class="pos-container">
				<${InteractiveContainer} id="transaction" className="sidebar" keepMounted=${true}>
					<${TransactionSection} />
				<//>
				<${CatalogSection} />
				<${CartSection} />
			</main>
		<//>
	`;
}