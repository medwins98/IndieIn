/* Preact Core */ import { render, h, html, useEffect, useState, useMemo } from 'importmap';
/* UI */ import { useUI, Spinner, InteractiveContainer } from 'importmap';
/* Navigation */ import { initRoutesMap, NavigationProvider, useNavigationState, Link } from 'importmap';
/* DB */ import { setupDB } from 'importmap';
/* Form */ import { initFormBlueprint, getFormSchema, FormWrapper } from 'importmap';
/* I18n */ import { I18nProvider, useI18n, getTranslatedFormSchema } from 'importmap';
import { BtnTheme, ButtonToggle, DataApp, Icon, NavSidebar } from 'importmap';

const SIDEBAR_ADMIN = [
	{ label: 'common.pos', href: '/app/pos' },
	{ label: 'nav.products', href: '/app/panel/product' },
	{ label: 'nav.payments', href: '/app/panel/payment' },
	{ label: 'transactions', href: '/app/panel/transaction' },
	{
		label: 'settings',
		child: [
			{ label: 'general', href: '/app/panel/settings/general' }
		],
	}
];

await setupDB(IDB_CONFIG);
initRoutesMap(ROUTES_MAP);
initFormBlueprint(FORM_BLUEPRINT);

const elapp = document.getElementById('app');
render(html`<${DocumentRoot} elroot=${elapp} />`, elapp);

function AppProvider({ children }) {
	return html`
		<${NavigationProvider}>
			<${I18nProvider} translation=${TRANSLATION} userLocale=${USER_SETTINGS_GENERAL.locale}>
				${children}
			<//>
		<//>`;
}

function DocumentRoot({ elroot }) {
	return html`
		<${AppProvider} elroot=${elroot} >
			<${App} />
		<//>`;
}

function App() {
	const pageInfo = useNavigationState();
	const [service, setService] = useState(pageInfo?.params?.service || null);

	useEffect(() => {
		setService(pageInfo?.params?.service || null);
	}, [pageInfo]);

	return html`<${PortalApp} ...${pageInfo} />`;
}

export function PortalApp({ ...pageInfo })
{
	const { t } = useI18n();
	const { toggle } = useUI();
	const { title, params } = pageInfo || {};
	const { serviceName, module, submodule } = params || {};

	useEffect(() => {
		toggle('sidebar', false);
	}, [pageInfo]);

	const CurrentComponent = useMemo(() => {
		if(serviceName === undefined) {
			return html`<${AppIndex} />`;
		}
		else if(serviceName === 'pos') {
			return html`<${POSApp} />`;
		}
		else if(serviceName === 'panel') {
			if(module === 'settings' || module === 'payment') {
				return html`<${FormCustom} module=${module} submodule=${submodule || 'default'} />`;
			}
			else {
				return html`<${DataApp} title=${title} idbStore=${module} />`;
			}
		}
		else {
			return html`<${DataApp} title=${t('data.playground_title', { defaultValue: 'Data Playground' })} standalone=${true} />`;
		}
	}, [serviceName, module, submodule, title, t]);

	if(serviceName === 'pos') {
		return CurrentComponent;
	}

	return html`
		<header class="header">
			<nav class="nav-container">
				<${ButtonToggle} icon="menu" targetId="sidebar" aria-label=${t('menu', { defaultValue: 'Menu' })}/>
				<div class="brand">IndieIn</div>
				<div class="nav-action">
					<${BtnTheme} />
					<${Link} href="/app" title=${t('app_list', { defaultValue: 'List App' })} class="btn btn-icon"><${Icon} iconName="appNineDots" /><//>
				</div>
			</nav>
		</header>
		<div class="app-body flex">
			<${InteractiveContainer} id="sidebar" keepMounted=${true}>
				<${NavSidebar} list=${SIDEBAR_ADMIN} Link=${Link} translate=${t}/>
			<//>
			${CurrentComponent}
		</div>`;
}

function AppIndex() {
	const { t } = useI18n();

	return html`
		<div class="grid-small-box-menu">
			<${Link} href="/app/panel/product" class="item">
				<div class="item-icon">A</div>
				<div class="item-label">${t('nav.admin', { defaultValue: 'Admin' })}</div>
			<//>
			<${Link} href="/app/pos" class="item">
				<div class="item-icon">P</div>
				<div class="item-label">${t('common.pos', { defaultValue: 'POS' })}</div>
			<//>
			<${Link} href="/app/data-playground" class="item">
				<div class="item-icon">D</div>
				<div class="item-label">${t('data.title', { defaultValue: 'Data' })}</div>
			<//>
		</div>`;
}


export function POSApp()
{
	const { t } = useI18n();
	const { setSpinner } = useUI();
	const [posModule, setPosModule] = useState(null);

	useEffect(() => {
		let isMounted = true;
		let injectedLink = null;

		Promise.all([
			import('pos'),
			loadCSS(CDN_MAP.posCSS).then(link => { injectedLink = link; })
		])
		.then(([mod]) => {
			if(isMounted) setPosModule(mod);
			setSpinner(false);
		})
		.catch((err) => {
			console.error("Failed to lazy load POS module:", err);
		});

		return () => {
			isMounted = false;
			if(injectedLink && injectedLink.parentNode) {
				injectedLink.parentNode.removeChild(injectedLink);
			}
		};
	}, []);

	if(!posModule) {
		setSpinner(true);
		return html`<${Spinner} />`;
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

function FormCustom({ module, submodule })
{
	const { t, setLang } = useI18n();
	const defaultValue = (module === 'payment') ? loadPOSSettings() : loadGeneralSettings();
	const schema = getTranslatedFormSchema(t, getFormSchema, module, submodule, defaultValue);

	return html`
		<main class="pxy">
			<${FormWrapper}
				schema=${schema} 
				context=${{ setLang }}
				forceRerender=${true} />
		</main>`;
}