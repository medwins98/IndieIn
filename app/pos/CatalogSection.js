import { html, useState, useCallback, useEffect, useMemo } from 'importmap';
import { useTransactionActions } from 'pos';
import { ListItem, ListItemPrefix, ListItemContent, ListItemSuffix, ImageWrapper, Badge, Link, Fragment, DropdownMenu, TabComponent, ToggleScanner, ButtonToggle, BtnIcon, Icon } from 'importmap';
import { useData, useI18n } from 'importmap';

export function CatalogSection({ cardSettings }) {
    const { t } = useI18n();
    const { data = [] } = useData('product');
    const { addToCart } = useTransactionActions();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelected] = useState(t('all'));

    // Scanner Handler
    const onScan = useCallback((barcode) => {
        if (!barcode) return;
        const match = data.find((item) => String(item.barcode) === String(barcode));
        if (!match) return;

        addToCart(match);
        setSearchQuery('');
    }, [data, addToCart]);

    useEffect(() => { searchQuery && onScan(searchQuery) }, [searchQuery, onScan]);

    // Filter Data
    const filteredData = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        return data.filter((product) => {
            const catArray = Array.isArray(product.category)
                ? product.category
                : (product.category ? [product.category] : []);

            const matchesCategory = selectedCategory === null || selectedCategory === t('all') || catArray.includes(selectedCategory);
            const matchesSearch = !query || product.name?.toLowerCase().includes(query) || String(product.barcode || '').includes(query);

            return matchesCategory && matchesSearch;
        });
    }, [data, searchQuery, selectedCategory, t]);

    // Get Categories
    const CATEGORIES = useMemo(() => [t('all'), ...new Set(data.flatMap(p => Array.isArray(p.category) ? p.category : [p.category]).filter(Boolean))], [data, t]);

    return html`
        <section class="section pos-catalog">
            <div class="header">
                <nav class="nav-container">
                    <div class="input-group">
                        <input
                            type="search"
                            value=${searchQuery}
                            onInput=${(e) => setSearchQuery(e.target.value)}
                            placeholder=${t('catalog.search_placeholder')}
                            aria-label=${t('catalog.search_placeholder')} />
                            
                        <${ToggleScanner} onScan=${onScan} className="suffix-icon clickable"/>
                    </div>
                    
                    <div class="nav-action">
                        <${ButtonToggle} icon="invoice" targetId="transaction" aria-label=${t('transaction.bill_list')} className="btn btn-icon has-notif">
                            <${BadgeNotif} />
                        <//>
                        <${DropdownMenu}>
                            <${BtnIcon} icon="threeDotsHorizontal" />
                            <${Fragment}>
                                <${Link} href="/app/panel/" class="menu-item">
                                    <${Icon} iconName="user"/>
                                    ${t('nav.admin')}
                                <//>
                                <${ButtonToggle} class="menu-item" targetId="payment" forceState=${true}>
                                    <${Icon} iconName="love"/>
                                    ${t('donate')}
                                <//>
                                <a href="https://wa.me/+6283871544720" class="menu-item" target="_blank">
                                    <${Icon} iconName="whatsapp"/>
                                    ${t('support')}
                                </a>
                            <//>
                        <//>
                    </div>
                </nav>
            </div>
            
            <${TabComponent}
                list=${CATEGORIES}
                selected=${selectedCategory}
                onChange=${setSelected}
                baseClass="btn-secondary-brand"
                activeClass="btn-primary-brand"
                className="pos-category" />

            ${filteredData.length === 0
            ? html`
                    <div class="empty-state">
                        <p class="mb1">${t('no_records')}</p>
                        <${Link} href="/app/panel/product" class="btn btn-primary-brand">${t('forms.product.title.create')}<//>
                    </div>`
            : html`
                <${MultiViews}>${filteredData?.map((prod) => html`
                        <${ListItem}
                            key=${prod.id}
                            className="card md"
                            onClick=${() => addToCart(prod)} >

                            <${ListItemPrefix}>
                                <${ImageWrapper} imgSrc=${prod?.imgFile} imgText=${prod.name} />
                            <//>

                            <${ListItemContent} 
                                productId=${prod.id}
                                title=${prod.name}
                                description=${formatCurrency(prod.price, USER_SETTINGS_GENERAL.locale, USER_SETTINGS_GENERAL.currencyStyle)}
                                className="pxy" >
                            <//>
                        <//>
                    `)}
                <//>`
        }
        </section > `;
}

function MultiViews({ children }) {
    const { t } = useI18n();
    const [view, setView] = useState(true);

    return html`
    <div class="section-content-wrapper px">
            <div class="flex-split mt075 mb1">
                <span class="text-muted">${t('layout_view')}</span>
                <button class="btn btn-icon btn-secondary" onClick=${() => setView(!view)}>
                    <${Icon} iconName=${!view ? "displayGrid" : "displayList"} aria-label=${t('layout_view')}/>
                </button>
            </div>
            
            <div class="multiviews-container mb1 ${view ? 'grid-view' : ''}">
                ${children}
            </div>
        </div>`;
}

function BadgeNotif() {
    const { data, getByIndex } = useData("transaction");
    const [dataToday, setDataToday] = useState([]);

    useEffect(() => {
        let isMounted = true;
        const loadToday = async () => {
            if (typeof getByIndex !== 'function') return;
            const start = new Date().setHours(0, 0, 0, 0);
            const end = new Date().setHours(23, 59, 59, 999);
            const range = IDBKeyRange.bound(start, end);
            const bills = await getByIndex('by_datetime', range);
            if (isMounted && Array.isArray(bills)) {
                setDataToday(bills);
            }
        };
        loadToday();
        return () => { isMounted = false; };
    }, [data, getByIndex]);

    const notifCount = dataToday.reduce((sum, item) => sum + (!item.isPaid ? 1 : 0), 0);
    return (notifCount > 0) ? html`<${Badge} className="badge-notif-circle">${notifCount}<//>` : null;
}