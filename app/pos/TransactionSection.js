import { html, useState, useEffect, useCallback, useRef, useMemo } from 'importmap';
import { ListItem, ListItemContent, ListItemPrefix, ListItemSuffix, ImageWrapper, SectionHeader, ReportBar, BtnIcon, Icon, Fragment } from 'importmap';
import { useData, useTransactionState, useTransactionActions } from 'importmap';
import { useI18n } from 'importmap';

export function TransactionSection()
{
	const { t } = useI18n();
	const { data: idb, getByIndex } = useData("transaction");
	const activeBill = useTransactionState();
	const { selectBill } = useTransactionActions();

	const [data, setData] = useState([]);
	const [searchQuery, setSearchQuery] = useState("");
	
	const report = useMemo(() => generateReport(data), [data]);
	const elDialogRef = useRef(null);
	
	useEffect(() => {
		let isMounted = true;
		const loadToday = async () => {
			if (typeof getByIndex !== 'function') return;
			const start = new Date().setHours(0,0,0,0);
			const end = new Date().setHours(23,59,59,999);
			const range = IDBKeyRange.bound(start, end);
			const bills = await getByIndex('by_datetime', range);
			if(isMounted && Array.isArray(bills)) {
				setData(universalSort(bills, "datetime", true));
			}
		};
		loadToday();
		return () => { isMounted = false; };
	}, [idb, getByIndex]);
	
	const onShowReport = useCallback(() => {
		if(elDialogRef.current) elDialogRef.current.showModal();
	}, []);
	
	const filteredBills = useMemo(() => {
		const query = searchQuery.toLowerCase().trim();
		return universalSort(data.filter((bill) => {
			const matchesBill = bill?.receiptNo?.toLowerCase().includes(query);
			const matchesCustomer = bill?.customer?.toLowerCase().includes(query);
			return matchesBill || matchesCustomer;
		}), "datetime", true);
	}, [data, searchQuery]);

	return html`
		<section class='section pos-transaction'>
			<${TransactionSectionHeader} onShowReport=${onShowReport} onSearch=${setSearchQuery} />
			
			<dialog ref=${elDialogRef} class="pos-report">
				<section class="section pos-report">
					<${SectionHeader} title=${t('report')}>
						<${BtnIcon} icon="close" onClick=${() => elDialogRef.current?.close()} />
					<//>
					<div class="section-content-wrapper">
						<${ReportSection} data=${report} type="summary" />
						<${ReportSection} data=${report} type="payment" />
						<${ReportSection} data=${report} type="product" />
					</div>
				</section>
			</dialog>
			
			<div class="section-content-wrapper">
				<${ListItem}
					className="pxy has-border-bottom ${!activeBill?.id ? 'active' : ''}"
					onClick=${() => selectBill(null)} >

					<${ListItemPrefix} className="mr1"><${ImageWrapper} className="avatar" /><//>
					<${ListItemContent} title=${t('transaction.new')} description=${t('transaction.new_desc')} />
					<${ListItemSuffix}><${Icon} iconName="plus" /><//>
				<//>
				
				${filteredBills.map((bill) => html`
					<${ListItem}
						className="pxy has-border-bottom ${bill.id === activeBill?.id ? 'active' : ''}"
						onClick=${() => selectBill(bill.id, data)} >

						<${ListItemContent}
							key="transaction-${bill.id}"
							title=${bill?.customer || 'Pelanggan Umum'}
							description="${formatCurrency(bill.total)} • ${bill.receiptNo}"
							badgeText=${bill.isPaid ? t('transaction.paid') : t('transaction.unpaid')}
							badgeClass=${bill.isPaid ? 'bg-green-dark' : 'bg-red-dark'}
							metaInfo=${formatDate(bill.datetime)}
						/>
					<//>`
				)}
			</div>
		</section>`;
}

function TransactionSectionHeader({ onShowReport, onSearch })
{
	const { t } = useI18n();
	const [isSearch, setSearch] = useState(false);
	
	useEffect(() => {
		if (!isSearch) onSearch("");
	}, [isSearch, onSearch]);
	
	if(!isSearch) {
		return html`
			<${SectionHeader} title=${t('transaction.bill_list')}>
				<${BtnIcon} icon="calendar" iconPos="right" onClick=${onShowReport}>${t('report')}<//>
				<${BtnIcon} icon="search" iconPos="right" onClick=${() => setSearch(true)}>${t('search')}<//>
			<//>`;
	}
	
	return html`
		<div class="section-header">
			<div class="input-group">
				<${BtnIcon} className="prefix-icon clickable" icon="arrowLeft" onClick=${() => setSearch(false)} aria-label=${t('common.close')}/>
				<input type="search" placeholder=${t('transaction.search_bar')} onInput=${(e) => onSearch(e.target.value)} />
			</div>
		</div>`;
}

function ReportSection({ data, type })
{
	if (!data || !type) return null;
	const { t } = useI18n();
	const { transaction, payment, product } = data;
	
	let component;
	
	if (type === "summary") {
		component = html`
			<${Fragment}>
				<div class="flex-split mb05 fw5">
					<span>${t('transaction.transaction_count')}</span>
					<span>${transaction?.count}</span>
				</div>
				<div class="flex-split mb05 fw5">
					<span>${t('transaction.total_tax')}</span>
					<span>${formatCurrency(transaction?.tax)}</span>
				</div>
				<div class="flex-split mb05 fw5">
					<span>${t('transaction.total_amount')}</span>
					<span>${formatCurrency(transaction?.amount)}</span>
				</div>
			<//>`;
	} else if (type === "payment") {
		component = payment?.map((item) => html`
			<${ReportBar}
				key=${item.method}
				title="${item.method} (${item.count})"
				description="${formatCurrency(item.value)}"
				barWidth=${item.share} />`);
	} else if (type === "product") {
		const totalItemsSold = product?.reduce((sum, item) => sum + item.qty, 0) || 0;

		component = product?.map((item) => html`
			<${ReportBar}
				key=${item.id}
				title=${item.name}
				description=${t('transaction.items_sold', { qty: item.qty })}
				barWidth="${totalItemsSold > 0 ? (item.qty / totalItemsSold) * 100 : 0}%" />`);
	}
	
	const titleMap = {
		summary: t('transaction.summary'),
		payment: t('payments'),
		product: t('products')
	};
	
	return html`
		<div class="report-section-item ${type}">
			<div class="report-section-item-title">${titleMap[type]}</div>
			${component}
		</div>`;
}

function generateReport(data = [])
{
	let productMap = new Map();
	let payment = {};
	let transaction = { count: 0, tax: 0, amount: 0 };
	
	data.forEach(bill => {
		if (bill.isPaid) {
			transaction.count += 1;
			transaction.tax += (bill.tax || 0);
			transaction.amount += (bill.total || 0);
			
			(bill.cart || []).forEach((item) => {
				if (!productMap.has(item.id)) {
					productMap.set(item.id, { ...item });
				} else {
					const entry = productMap.get(item.id);
					productMap.set(item.id, {
						...entry,
						qty: entry.qty + item.qty
					});
				}
			});
			
			const payMethod = bill.payment || 'Cash';
			if (!payment[payMethod]) {
				payment[payMethod] = { count: 0, value: 0 };
			}
			
			payment[payMethod].count += 1;
			payment[payMethod].value += (bill.total || 0);
		}
	});
	
	const paymentList = Object.keys(payment).map(method => ({
		method,
		value: payment[method].value,
		count: payment[method].count,
		share: transaction.count > 0 ? ((payment[method].count / transaction.count) * 100).toFixed(2) + "%" : "0%"
	}));
	
	return {
		transaction,
		product: Array.from(productMap.values()),
		payment: paymentList
	};
}
