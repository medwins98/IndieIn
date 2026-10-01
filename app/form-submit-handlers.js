const formSubmitHandlers = {
	'settings.general': (formData, { setLang }) => {
		localStorage.setItem('general_settings', JSON.stringify(formData));
		USER_SETTINGS_GENERAL = formData;
		applyGeneralSettings();
		setLang(formData.locale);
	},
	'payment.default': (formData) => {
		formData.taxRate = parseFloat(formData.taxRate) || 0;
		localStorage.setItem('pos_settings', JSON.stringify(formData));
	}
};
