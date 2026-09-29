const fieldChangeGlobalHandlers = {
	hue: (val) => {
		document.documentElement.style.setProperty('--hue-preview', val);
	},
	taxRate: (val) => ({
		taxRate: String(val).replace(',', '.')
	}),
	qrisImg: async (val) => {
		if(!val) return;
		const data = await handleQrisUpload(val);
		return {
			qrisCode: data?.raw || 'error',
			qrisNmid: data?.nmid || null,
			qrisName: data?.name || null,
			qrisCity: data?.city || null
		};
	},
	qrisCode: async (val) => {
		if(!val) return;
		const data = parseStaticQRIS(val);
		return {
			qrisNmid: data?.nmid || null,
			qrisName: data?.name || null,
			qrisCity: data?.city || null
		};
	}
};

const fieldChangeFormHandlers = {
	
};