import { html, useState, useEffect } from 'importmap';
import { POS_SETTINGS, useTransactionState, useTransactionActions, calculateCart } from 'pos';
import { ListItem, ListItemContent, ListItemSuffix, Fragment, SectionHeader, TabComponent, CodeQR, useUI, ButtonToggle, Icon, InteractiveContainer } from 'importmap';
import { useI18n } from 'importmap';

let PAYMENT_METHODS = [];
if(POS_SETTINGS.is_cash) PAYMENT_METHODS.push('Cash');
if(POS_SETTINGS.is_transfer) PAYMENT_METHODS.push('Debit/EDC');
if(POS_SETTINGS.is_qris) PAYMENT_METHODS.push('QRIS');

export function CartSection()
{
	const { t } = useI18n();
	const activeBill = useTransactionState();
	const { cart = [], isPaid, payment, paymentProvider } = activeBill || {};
	const { updateCartQty, clearCart, selectPayment, selectPaymentProvider, addCustomer, confirmCart, saveBill } = useTransactionActions();
	
	// Calculate cart
	const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);
	const { subtotal, tax, total } = calculateCart(activeBill);
	
	const title = (activeBill?.receiptNo) ? activeBill.receiptNo : 'New Order';
	const subtitle = `${activeBill?.customer ? activeBill.customer : 'Pelanggan umum'} • ${formatDate(activeBill?.datetime)}`;
	
	return html`
		${(cart.length > 0 && !isPaid) && html`
			<div class="catalog-to-cart-btn">
				<${ButtonToggle} class="btn-primary-brand btn-big" targetId="cart" forceState=${true}>
					${t('cart.proceed_payment')} ${t('cart.items_summary', { count: itemCount, total: formatCurrency(total) } )}
				<//>
			</div>`
		}
		<${InteractiveContainer} id="cart" className="quickview">
			<section class="section pos-cart">

				<${SectionHeader} title=${title} subtitle=${subtitle} >
					${!isPaid && html`<button class="btn btn-icon btn-primary" onClick=${() => saveBill(activeBill)}>${t('save')}</button>`}
					<${ButtonToggle} icon="close" targetId="cart" forceState=${false} />
				<//>
				
				<div class="section-content-wrapper flex-column">
					${!isPaid && html`<${SearchMember} customer=${activeBill?.customer || ''} onInput=${addCustomer} t=${t} />`}
					<${CartItem} data=${cart} isPaid=${isPaid} handleQty=${updateCartQty} />
				</div>
			
				<div class="cart-footer">
					<div class="flex-split text-sm text-secondary mb05">
						<span>${t('cart.subtotal')}</span>
						<span>${formatCurrency(subtotal)}</span>
					</div>
					<div class="flex-split text-sm text-secondary mb05">
						<span>${t('cart.tax')} (${(activeBill?.taxRate || 0) * 100}%)</span>
						<span>${formatCurrency(tax)}</span>
					</div>
					<div class="flex-split text-sm text-secondary mb05">
						<span>${t('cart.payment')}</span>
						<span>${`${payment || 'Cash'}${paymentProvider ? ` (${paymentProvider})` : ''}`}</span>
					</div>
					
					<div class="flex-split summary-total">
						<span>${t('cart.total')}</span>
						<span>${formatCurrency(total)}</span>
					</div>
					
					${isPaid && html`<button class="btn-primary-brand w-full" onClick=${() => window.print()}>${t('cart.print')}</button>`}
					${!isPaid && html`
						<${TabComponent} list=${PAYMENT_METHODS} selected=${payment} onChange=${selectPayment} className="payment-tab"/>
						<${InteractiveContainer} id="payment" className="modal">
							<${PaymentSection} onChange=${selectPaymentProvider} t=${t} />
						<//>
						<button class="btn-primary-brand w-full"
							onClick=${() => confirmCart(activeBill)}
							disabled=${cart.length === 0}>
							
							${t('cart.confirm_payment')}
						</button>
					`}
				</div>
			</section>
		<//>`;
}

function SearchMember({ customer, onInput, t })
{
	return html`
		<div class="input-group">
			<input type="search" placeholder=${t('cart.customer_placeholder')} onInput=${(e) => onInput(e.target.value)} value=${customer} />
			<span class="suffix-icon"><${Icon} iconName="userPlus"/></span>
		</div>`;
}

function CartItem({ data, isPaid, handleQty })
{
	if(data.length === 0) {
		return html`<p style="text-align: center; color: var(--text-muted); font-size: 0.85rem; margin-top: 2rem;">Keranjang Kosong</p>`;
	}
	
	return data.map(item => html`
		<${ListItem} className="pt075 pb075 has-border-bottom">
			<${ListItemContent}
				key=${item.id}
				title=${item.name}
				description="${isPaid ? `x${item.qty} •` : ''} ${formatCurrency(item.price)}" />
				
			<${ListItemSuffix} >
				${!isPaid
					? html`
						<div class="flex-split">
							<button class="btn btn-icon btn-unicode btn-primary" onClick=${() => handleQty(item.id, -1)}>-</button>
							<div class="text-center text-sm fw5" style="width: 36px">${item.qty}</div>
							<button class="btn btn-icon btn-unicode btn-primary" onClick=${() => handleQty(item.id, 1)}>+</button>
						</div>`
					: html`<span class="fw7">${formatCurrency(item.qty * item.price)}</span>`
				}
			<//>
		<//>
	`);
}

export function PaymentSection({ onChange, t = (val) => val })
{
	const activeBill = useTransactionState();
	const { saveBill } = useTransactionActions();
	const { toggle } = useUI();
	const [codeQR, setCodeQR] = useState(null);

	useEffect(() => {
		if(activeBill) {
			const { total } = calculateCart(activeBill);
			setCodeQR(generateDynamicQRIS(POS_SETTINGS?.qrisCode, total));
		}
	}, [activeBill]);

	const isCash = activeBill.payment === "Cash";
	const isQRIS = activeBill.payment === "QRIS";

	return html`
		<${Modal} title="Bayar (${activeBill.payment})" showTitle=${!isQRIS} className=${isQRIS ? 'flex-center' : ''} >
			<${Fragment}>
				${isCash && html`<p>${t('cart.confirm_payment_prompt')}</p>`}
				${isQRIS && html`<${CodeQR} rawCode=${codeQR?.finalQRIS} qrisInfo=${codeQR?.qrisInfo}/>`}
				${(!isCash && !isQRIS) && html`<${ListBank}
					list=${POS_SETTINGS?.listTransfer || []}
					selected=${activeBill.paymentProvider || POS_SETTINGS?.listTransfer[0]}
					onChange=${onChange} />
				`}
			<//>
			<${Fragment}>
				<button onClick=${() => toggle('payment', false)} class="btn btn-secondary-brand">${t('cancel')}</button>
				<button onClick=${() => saveBill(activeBill, true)} class="btn btn-primary-brand">${t('process')}</button>
			<//>
		<//>`;
}

function ListBank({ list = [], selected = list[0], onChange })
{
	const [active, setActive] = useState(selected);
	
	useEffect(() => { onChange && onChange(active) }, [active]);

	return list.map(item => html`
		<${ListItem}
			className="pxy has-border-bottom ${item === selected ? 'active' : null}"
			onClick=${() => setActive(item)} >

			<${ListItemContent} key=${item} title=${item} />
		<//>`
	);
}

function Modal({ title = "Title", showTitle = true, children, className, ...attributes })
{
	return html`
		<div class="overlay active">
			<div class="section modal ${className}" ...${attributes}>
				${showTitle && html`
					<${SectionHeader} title=${title}>
						<${ButtonToggle} targetId="payment" forceState=${false} class="btn btn-icon">
							<${Icon} iconName="close" />
						<//>
					<//>
				`}
				<div class="section-content-wrapper">
					${Array.isArray(children) ? children[0] : children}
				</div>
				${Array.isArray(children) && children[1] ? html`<div class="section-footer">${children[1]}</div>` : null}
			</div>
		</div>`;
}