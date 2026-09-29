/* Preact Core */ import { render, h, html, useEffect, useState, useCallback, useMemo, useRef } from 'importmap';
/* UI */ import { useUI, LoadingBar, Spinner, InteractiveContainer, ButtonToggle, BtnIcon, BtnTheme } from 'importmap';
/* Navigation */ import { NavigationProvider, useNavigationState, Link } from 'importmap';
/* Form */ import { initFormBlueprint, getFormSchema, useForm, FormWrapper, FormRenderer, FormField, FormFieldSelect, CreatableSelect } from 'importmap';
/* Reusable Components */ import { DropdownMenu, Fragment, Conditional, NavSidebar, DraggableItem, TabComponent, SectionHeader, CodeQR, ReportBar, Icon, TableContainer, TableRowBody } from 'importmap';
/* Device */ import { useDevice, ToggleScanner, getCurrentLocation, useGeolocation } from 'importmap';
/* I18n */ import { useI18n, getTranslatedFormSchema } from 'importmap';
/* Admin */ import { DataApp, getAllDatabasesAndStores } from 'importmap';

const SIDEBAR_ADMIN = [
	{ label: 'branches', href: '/app/panel/branch' },
	{ label: 'warehouse', href: '/app/panel/warehouse' },
	{ label: 'nav.products', href: '/app/panel/product' },
	{ label: 'nav.payments', href: '/app/panel/payment' },
	{ label: 'nav.pricing', href: '/app/panel/pricing' },
	{ label: 'nav.promos', href: '/app/panel/promos' },
	{ label: 'customers', href: '/app/panel/customer' },
	{ label: 'employees', href: '/app/panel/employee' },
	{ label: 'orders', href: '/app/panel/order' },
	{ label: 'transactions', href: '/app/panel/transaction' },
	{ label: 'access_rights', href: '/app/panel/access' },
	{
		label: 'settings',
		child: [
			{ label: 'general', href: '/app/panel/settings/general' }
		],
	}
];

export function PortalApp({ ...pageInfo })
{
	const { t } = useI18n();
	const { toggle } = useUI();
	const { key, title, params } = pageInfo || {};
	const { serviceName, module, submodule } = params || {};

	useEffect(() => {
		toggle('sidebar', false);
	}, [pageInfo]);

	const CurrentComponent = useMemo(() => {
		if(serviceName === undefined) {
			return html`<${AppIndex} />`;
		}
		else if(serviceName === 'panel')
		{
			if(module === 'settings' || module === 'payment') {
				return html`<${FormCustom} module=${module} submodule=${submodule || 'default'} />`;
			}
			else {
				return html`<${DataApp} title=${title} idbStore=${module} />`;
			}
		}
		else {
			return html`
				<${DataApp} title="Data Playground" standalone=${true} />`;
		}
	}, [serviceName, module, submodule]);
	
	return html`
		<header class="header">
			<nav class="nav-container">
				<${ButtonToggle} icon="menu" targetId="sidebar" aria-label="Menu"/>
				<div class="brand">IndieIn</div>
				<div class="nav-action">
					<${BtnTheme} />
					<${Link} href="/app" title="List App" class="btn btn-icon"><${Icon} iconName="appNineDots" /><//>
				</div>
			</nav>
		</header>
		<div class="app-body">
			<${InteractiveContainer} id="sidebar" keepMounted=${true}>
				<${NavSidebar} list=${SIDEBAR_ADMIN} Link=${Link} translate=${t}/>
			<//>
			${CurrentComponent}
		</div>`;
}

function AppIndex()
{
	return html`
		<div class="grid-small-box-menu">
			<${Link} href="/app/panel" class="item">
				<div class="item-icon">A</div>
				<div class="item-label">Admin</div>
			<//>
			<a href="/webapp/app/pos" class="item">
				<div class="item-icon">P</div>
				<div class="item-label">POS</div>
			</a>
			<${Link} href="/app/data-playground" class="item">
				<div class="item-icon">D</div>
				<div class="item-label">Data</div>
			<//>
		</div>`;
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
