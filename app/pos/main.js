import { render, h, html, useEffect, useState, useCallback, useMemo, useRef } from 'importmap';
import { useUI, LoadingBar, Spinner, InteractiveContainer, ButtonToggle } from 'importmap';
import { NavigationProvider, useNavigationState, Link } from 'importmap';
import { setupDB, useIDB } from 'importmap';
import { POSProvider, useTransactionState, useTransactionActions, POS_SETTINGS, calculateCart } from 'importmap';
import { TransactionSection, CatalogSection, CartSection, PaymentSection } from 'importmap'
import { I18nProvider } from 'importmap';

await setupDB(IDB_CONFIG);
const elapp = document.getElementById('app');
render(html`<${DocumentRoot} elroot=${elapp} />`, elapp);

function AppProvider({ children, elroot = null })
{
	return html`
		<${I18nProvider} translation=${TRANSLATION} userLocale=${USER_SETTINGS_GENERAL.locale}>
			<${POSProvider}>
				${children}
			<//>
		<//>`;
}

function DocumentRoot({ elroot })
{
	return html`
		<${AppProvider} elroot=${elroot} >
			<${POSApp} />
		<//>`;
}

function POSApp({ children })
{
	return html`
		<main class="pos-container">
			<${InteractiveContainer} id="transaction" className="sidebar" keepMounted=${true}>
				<${TransactionSection} />
			<//>
			<${CatalogSection} />
			<${CartSection} />
		</main>
	`;
}