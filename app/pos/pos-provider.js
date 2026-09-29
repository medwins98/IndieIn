import { html, createContext, useContext, useState, useCallback, useMemo } from 'importmap';
import { useDevice, getCurrentLocation, useData, useUI } from 'importmap';

export const POS_SETTINGS = loadPOSSettings();

export function createNewTransaction() {
	return {
		id: null,
		receiptNo: null,
		datetime: Date.now(),
		customer: 'Pelanggan Umum',
		cart: [],
		payment: "Cash",
		paymentProvider: null,
		taxRate: POS_SETTINGS.taxRate,
		tax: 0,
		total: 0,
		location: null,
		isPaid: false,
		isSync: false
	};
}

export function calculateCart(data)
{
	const cartItems = data?.cart || [];
	const subtotal = cartItems.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.qty) || 0)), 0);
	const taxRate = data?.taxRate || POS_SETTINGS.taxRate;
	const tax = Math.round(subtotal * taxRate);
	const total = subtotal + tax;
	
	return { subtotal, tax, total };
}

const StateContext = createContext(null);
const DispatcherContext = createContext(null);

export function POSProvider({ children })
{
	const transaction = useData("transaction");
	const { toggle } = useUI();
	const { isMobile } = useDevice();
	
	const [activeBill, setActiveBill] = useState(() => createNewTransaction());
	
	// Add Cart Item
	const addToCart = useCallback((selected) => {
		if (!selected || !selected.id) return;
		setActiveBill((prev) => {
			if (prev.isPaid) return prev;
			const existingItem = prev.cart.find((item) => item.id === selected.id);
			
			const updatedCart = existingItem
				? prev.cart.map((item) => item.id === selected.id ? { ...item, qty: item.qty + 1 } : item)
				: [...prev.cart, { ...selected, qty: 1 }];
				
			return { ...prev, cart: updatedCart };
		});
		if (!isMobile) toggle('cart', true);
	}, []);
	
	// Update Cart Item Quantity
	const updateCartQty = useCallback((id, delta) => {
		setActiveBill((prev) => {
			if (prev.isPaid) return prev;
			return {
				...prev,
				cart: prev.cart
					.map((item) => item.id === id ? { ...item, qty: item.qty + delta } : item)
					.filter((item) => item.qty > 0)
			};
		});
	}, []);
	
	// Clear Cart
	const clearCart = useCallback(() => {
		setActiveBill((prev) => ({ ...prev, cart: [] }));
		if (isMobile) toggle('cart', false);
	}, [isMobile, toggle]);
	
	// Select Payment Method
	const selectPayment = useCallback((selected) => {
		setActiveBill((prev) => ({ ...prev, payment: selected, paymentProvider: null }));
	}, []);
	
	// Select Payment Provider
	const selectPaymentProvider = useCallback((selected) => {
		setActiveBill((prev) => ({ ...prev, paymentProvider: selected }));
	}, []);
	
	// Add Customer / Member Info
	const addCustomer = useCallback((customer) => {
		setActiveBill((prev) => ({ ...prev, customer: customer }));
	}, []);
	
	// Confirm Cart / Trigger Payment Modal
	const confirmCart = useCallback(() => {
		toggle('payment', true);
	}, [toggle]);
	
	// Save Bill / Commit Transaction
	const saveBill = useCallback(async (bill, isPaid = false) =>
	{
		if (!bill) return;
		const isNew = !bill.id;
		const { tax, total } = calculateCart(bill);
		
		let locationData = bill.location || null;
		if (POS_SETTINGS.enableGeolocation && typeof getCurrentLocation === 'function') {
			try {
				locationData = await getCurrentLocation();
			} catch (err) {
				console.warn('Failed to retrieve location:', err);
			}
		}
	
		const updatedBill = {
			...bill,
			id: bill.id ?? generateUUIDv7(),
			datetime: Date.now(),
			receiptNo: bill.receiptNo ?? generateReceiptNo(),
			taxRate: POS_SETTINGS.taxRate,
			tax: tax,
			total: total,
			location: locationData,
			isPaid: bill.isPaid ? bill.isPaid : isPaid
		};
		
		if (isNew) {
			transaction.add(updatedBill);
		} else {
			transaction.update(updatedBill);
		}
		
		setActiveBill(isPaid ? createNewTransaction() : updatedBill);
		
		toggle('payment', false);
		if (isMobile) toggle('cart', false);
	}, [transaction, isMobile, toggle]);
	
	// Select Active Bill / Transaction
	const selectBill = useCallback((id = null, list = []) => {
		const currentBill = list.find((item) => item.id === id);
		setActiveBill(currentBill ? { ...currentBill } : createNewTransaction());
		
		if (currentBill?.isPaid) {
			toggle('cart', true);
		} else {
			if (isMobile) toggle('transaction', false);
		}
	}, [isMobile, toggle]);
	
	const valDispatcher = useMemo(() => ({
		addToCart,
		updateCartQty,
		clearCart,
		selectPayment,
		selectPaymentProvider,
		addCustomer,
		confirmCart,
		saveBill,
		selectBill,
		setActiveBill
	}), [
		addToCart,
		updateCartQty,
		clearCart,
		selectPayment,
		selectPaymentProvider,
		addCustomer,
		confirmCart,
		saveBill,
		selectBill
	]);
	
	return html`
		<${DispatcherContext.Provider} value=${valDispatcher}>
			<${StateContext.Provider} value=${activeBill}>
				${children}
			<//>
		<//>`;
}

export const useTransactionState = () => useContext(StateContext);
export const useTransactionActions = () => useContext(DispatcherContext);
