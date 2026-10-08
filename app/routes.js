const ROUTES_MAP = [
	{
		path: '/',
		title: 'Home',
		key: 'home'
	},
	{
		path: '/:service/:serviceName/:module/:submodule',
		title: 'App Sub-module',
		key: 'appSubModule'
	},
	{
		path: '/:service/:serviceName/:module',
		title: 'App Module',
		key: 'appModule'
	},
	{
		path: '/:service/:serviceName',
		title: 'App Service',
		key: 'appService'
	},
	{
		path: '/:service',
		title: 'App',
		key: 'appIndex'
	},
	{
		path: '/app/panel/:section',
		title: 'Panel',
		key: 'appPanelSection'
	},
	{
		path: '/app/:app/',
		title: 'App',
		key: 'appIndex'
	},
	{
		path: '/keluar',
		title: 'Keluar',
		key: 'signOut',
		api: '/auth/signout',
		method: 'DELETE'
	},
	{
		path: '/popup',
		title: 'Tes Popup',
		key: 'popup'
	},
	{
		path: '/quickview',
		title: 'Tes QuickView',
		key: 'quickview'
	},
	{
		path: '/profile-card',
		title: 'Profile Card',
		key: 'profileCard'
	},
	{
		path: '/product-card',
		title: 'Product Card',
		key: 'productCard'
	},
	{
		path: '/pos',
		title: 'POS',
		key: 'pos'
	},
	{
		path: '/transaksi',
		title: 'Riwayat Transaksi',
		key: 'transaction'
	},
];
