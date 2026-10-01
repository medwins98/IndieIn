const LIST_LANGUAGE = [{ value: "af-ZA", label: "Afrikaans (South Africa) - af-ZA" },{ value: "am-ET", label: "Amharic (Ethiopia) - am-ET" },{ value: "ar-SA", label: "Arabic (Saudi Arabia) - ar-SA" },{ value: "ar-AE", label: "Arabic (United Arab Emirates) - ar-AE" },{ value: "ar-EG", label: "Arabic (Egypt) - ar-EG" },{ value: "az-AZ", label: "Azerbaijani (Azerbaijan) - az-AZ" },{ value: "be-BY", label: "Belarusian (Belarus) - be-BY" },{ value: "bg-BG", label: "Bulgarian (Bulgaria) - bg-BG" },{ value: "bn-BD", label: "Bengali (Bangladesh) - bn-BD" },{ value: "bn-IN", label: "Bengali (India) - bn-IN" },{ value: "bs-BA", label: "Bosnian (Bosnia & Herzegovina) - bs-BA" },{ value: "ca-ES", label: "Catalan (Spain) - ca-ES" },{ value: "cs-CZ", label: "Czech (Czechia) - cs-CZ" },{ value: "cy-GB", label: "Welsh (United Kingdom) - cy-GB" },{ value: "da-DK", label: "Danish (Denmark) - da-DK" },{ value: "de-AT", label: "German (Austria) - de-AT" },{ value: "de-CH", label: "German (Switzerland) - de-CH" },{ value: "de-DE", label: "German (Germany) - de-DE" },{ value: "el-GR", label: "Greek (Greece) - el-GR" },{ value: "en-AU", label: "English (Australia) - en-AU" },{ value: "en-CA", label: "English (Canada) - en-CA" },{ value: "en-GB", label: "English (United Kingdom) - en-GB" },{ value: "en-IE", label: "English (Ireland) - en-IE" },{ value: "en-IN", label: "English (India) - en-IN" },{ value: "en-NZ", label: "English (New Zealand) - en-NZ" },{ value: "en-US", label: "English (United States) - en-US" },{ value: "en-ZA", label: "English (South Africa) - en-ZA" },{ value: "es-AR", label: "Spanish (Argentina) - es-AR" },{ value: "es-CL", label: "Spanish (Chile) - es-CL" },{ value: "es-CO", label: "Spanish (Colombia) - es-CO" },{ value: "es-ES", label: "Spanish (Spain) - es-ES" },{ value: "es-MX", label: "Spanish (Mexico) - es-MX" },{ value: "es-US", label: "Spanish (United States) - es-US" },{ value: "et-EE", label: "Estonian (Estonia) - et-EE" },{ value: "eu-ES", label: "Basque (Spain) - eu-ES" },{ value: "fa-IR", label: "Persian (Iran) - fa-IR" },{ value: "fi-FI", label: "Finnish (Finland) - fi-FI" },{ value: "fil-PH", label: "Filipino (Philippines) - fil-PH" },{ value: "fr-BE", label: "French (Belgium) - fr-BE" },{ value: "fr-CA", label: "French (Canada) - fr-CA" },{ value: "fr-CH", label: "French (Switzerland) - fr-CH" },{ value: "fr-FR", label: "French (France) - fr-FR" },{ value: "ga-IE", label: "Irish (Ireland) - ga-IE" },{ value: "gl-ES", label: "Galician (Spain) - gl-ES" },{ value: "gu-IN", label: "Gujarati (India) - gu-IN" },{ value: "he-IL", label: "Hebrew (Israel) - he-IL" },{ value: "hi-IN", label: "Hindi (India) - hi-IN" },{ value: "hr-HR", label: "Croatian (Croatia) - hr-HR" },{ value: "hu-HU", label: "Hungarian (Hungary) - hu-HU" },{ value: "hy-AM", label: "Armenian (Armenia) - hy-AM" },{ value: "id-ID", label: "Indonesian (Indonesia) - id-ID" },{ value: "is-IS", label: "Icelandic (Iceland) - is-IS" },{ value: "it-CH", label: "Italian (Switzerland) - it-CH" },{ value: "it-IT", label: "Italian (Italy) - it-IT" },{ value: "ja-JP", label: "Japanese (Japan) - ja-JP" },{ value: "ka-GE", label: "Georgian (Georgia) - ka-GE" },{ value: "kk-KZ", label: "Kazakh (Kazakhstan) - kk-KZ" },{ value: "km-KH", label: "Khmer (Cambodia) - km-KH" },{ value: "kn-IN", label: "Kannada (India) - kn-IN" },{ value: "ko-KR", label: "Korean (South Korea) - ko-KR" },{ value: "ky-KG", label: "Kyrgyz (Kyrgyzstan) - ky-KG" },{ value: "lo-LA", label: "Lao (Laos) - lo-LA" },{ value: "lt-LT", label: "Lithuanian (Lithuania) - lt-LT" },{ value: "lv-LV", label: "Latvian (Latvia) - lv-LV" },{ value: "mk-MK", label: "Macedonian (North Macedonia) - mk-MK" },{ value: "ml-IN", label: "Malayalam (India) - ml-IN" },{ value: "mn-MN", label: "Mongolian (Mongolia) - mn-MN" },{ value: "mr-IN", label: "Marathi (India) - mr-IN" },{ value: "ms-MY", label: "Malay (Malaysia) - ms-MY" },{ value: "my-MM", label: "Burmese (Myanmar) - my-MM" },{ value: "nb-NO", label: "Norwegian Bokmål (Norway) - nb-NO" },{ value: "ne-NP", label: "Nepali (Nepal) - ne-NP" },{ value: "nl-BE", label: "Dutch (Belgium) - nl-BE" },{ value: "nl-NL", label: "Dutch (Netherlands) - nl-NL" },{ value: "nn-NO", label: "Norwegian Nynorsk (Norway) - nn-NO" },{ value: "or-IN", label: "Odia (India) - or-IN" },{ value: "pa-IN", label: "Punjabi (India) - pa-IN" },{ value: "pl-PL", label: "Polish (Poland) - pl-PL" },{ value: "ps-AF", label: "Pashto (Afghanistan) - ps-AF" },{ value: "pt-BR", label: "Portuguese (Brazil) - pt-BR" },{ value: "pt-PT", label: "Portuguese (Portugal) - pt-PT" },{ value: "ro-RO", label: "Romanian (Romania) - ro-RO" },{ value: "ru-RU", label: "Russian (Russia) - ru-RU" },{ value: "si-LK", label: "Sinhala (Sri Lanka) - si-LK" },{ value: "sk-SK", label: "Slovak (Slovakia) - sk-SK" },{ value: "sl-SI", label: "Slovenian (Slovenia) - sl-SI" },{ value: "sq-AL", label: "Albanian (Albania) - sq-AL" },{ value: "sr-RS", label: "Serbian (Serbia) - sr-RS" },{ value: "sv-SE", label: "Swedish (Sweden) - sv-SE" },{ value: "sw-KE", label: "Swahili (Kenya) - sw-KE" },{ value: "ta-IN", label: "Tamil (India) - ta-IN" },{ value: "te-IN", label: "Telugu (India) - te-IN" },{ value: "th-TH", label: "Thai (Thailand) - th-TH" },{ value: "tr-TR", label: "Turkish (Turkey) - tr-TR" },{ value: "uk-UA", label: "Ukrainian (Ukraine) - uk-UA" },{ value: "ur-PK", label: "Urdu (Pakistan) - ur-PK" },{ value: "uz-UZ", label: "Uzbek (Uzbekistan) - uz-UZ" },{ value: "vi-VN", label: "Vietnamese (Vietnam) - vi-VN" },{ value: "zh-CN", label: "Chinese (Simplified, China) - zh-CN" },{ value: "zh-HK", label: "Chinese (Traditional, Hong Kong) - zh-HK" },{ value: "zh-TW", label: "Chinese (Traditional, Taiwan) - zh-TW" },{ value: "zu-ZA", label: "Zulu (South Africa) - zu-ZA" }];
const LIST_CURRENCY = [{ value: "AED", label: "AED - United Arab Emirates Dirham" },{ value: "AFN", label: "AFN - Afghan Afghani" },{ value: "ALL", label: "ALL - Albanian Lek" },{ value: "AMD", label: "AMD - Armenian Dram" },{ value: "ANG", label: "ANG - Netherlands Antillean Guilder" },{ value: "AOA", label: "AOA - Angolan Kwanza" },{ value: "ARS", label: "ARS - Argentine Peso" },{ value: "AUD", label: "AUD - Australian Dollar" },{ value: "AWG", label: "AWG - Aruban Florin" },{ value: "AZN", label: "AZN - Azerbaijani Manat" },{ value: "BAM", label: "BAM - Bosnia-Herzegovina Convertible Mark" },{ value: "BBD", label: "BBD - Barbadian Dollar" },{ value: "BDT", label: "BDT - Bangladeshi Taka" },{ value: "BGN", label: "BGN - Bulgarian Lev" },{ value: "BHD", label: "BHD - Bahraini Dinar" },{ value: "BIF", label: "BIF - Burundian Franc" },{ value: "BMD", label: "BMD - Bermudian Dollar" },{ value: "BND", label: "BND - Brunei Dollar" },{ value: "BOB", label: "BOB - Bolivian Boliviano" },{ value: "BRL", label: "BRL - Brazilian Real" },{ value: "BSD", label: "BSD - Bahamian Dollar" },{ value: "BTN", label: "BTN - Bhutanese Ngultrum" },{ value: "BWP", label: "BWP - Botswanan Pula" },{ value: "BYN", label: "BYN - Belarusian Ruble" },{ value: "BZD", label: "BZD - Belize Dollar" },{ value: "CAD", label: "CAD - Canadian Dollar" },{ value: "CDF", label: "CDF - Congolese Franc" },{ value: "CHF", label: "CHF - Swiss Franc" },{ value: "CLP", label: "CLP - Chilean Peso" },{ value: "CNY", label: "CNY - Chinese Yuan" },{ value: "COP", label: "COP - Colombian Peso" },{ value: "CRC", label: "CRC - Costa Rican Colón" },{ value: "CUP", label: "CUP - Cuban Peso" },{ value: "CVE", label: "CVE - Cape Verdean Escudo" },{ value: "CZK", label: "CZK - Czech Koruna" },{ value: "DJF", label: "DJF - Djiboutian Franc" },{ value: "DKK", label: "DKK - Danish Krone" },{ value: "DOP", label: "DOP - Dominican Peso" },{ value: "DZD", label: "DZD - Algerian Dinar" },{ value: "EGP", label: "EGP - Egyptian Pound" },{ value: "ERN", label: "ERN - Eritrean Nakfa" },{ value: "ETB", label: "ETB - Ethiopian Birr" },{ value: "EUR", label: "EUR - Euro" },{ value: "FJD", label: "FJD - Fijian Dollar" },{ value: "FKP", label: "FKP - Falkland Islands Pound" },{ value: "FOK", label: "FOK - Faroese Króna" },{ value: "GBP", label: "GBP - British Pound Sterling" },{ value: "GEL", label: "GEL - Georgian Lari" },{ value: "GGP", label: "GGP - Guernsey Pound" },{ value: "GHS", label: "GHS - Ghanaian Cedi" },{ value: "GIP", label: "GIP - Gibraltar Pound" },{ value: "GMD", label: "GMD - Gambian Dalasi" },{ value: "GNF", label: "GNF - Guinean Franc" },{ value: "GTQ", label: "GTQ - Guatemalan Quetzal" },{ value: "GYD", label: "GYD - Guyanaese Dollar" },{ value: "HKD", label: "HKD - Hong Kong Dollar" },{ value: "HNL", label: "HNL - Honduran Lempira" },{ value: "HRK", label: "HRK - Croatian Kuna" },{ value: "HTG", label: "HTG - Haitian Gourde" },{ value: "HUF", label: "HUF - Hungarian Forint" },{ value: "IDR", label: "IDR - Indonesian Rupiah" },{ value: "ILS", label: "ILS - Israeli New Shekel" },{ value: "IMP", label: "IMP - Isle of Man Pound" },{ value: "INR", label: "INR - Indian Rupee" },{ value: "IQD", label: "IQD - Iraqi Dinar" },{ value: "IRR", label: "IRR - Iranian Rial" },{ value: "ISK", label: "ISK - Icelandic Króna" },{ value: "JEP", label: "JEP - Jersey Pound" },{ value: "JMD", label: "JMD - Jamaican Dollar" },{ value: "JOD", label: "JOD - Jordanian Dinar" },{ value: "JPY", label: "JPY - Japanese Yen" },{ value: "KES", label: "KES - Kenyan Shilling" },{ value: "KGS", label: "KGS - Kyrgystani Som" },{ value: "KHR", label: "KHR - Cambodian Riel" },{ value: "KID", label: "KID - Kiribati Dollar" },{ value: "KMF", label: "KMF - Comorian Franc" },{ value: "KRW", label: "KRW - South Korean Won" },{ value: "KWD", label: "KWD - Kuwaiti Dinar" },{ value: "KYD", label: "KYD - Cayman Islands Dollar" },{ value: "KZT", label: "KZT - Kazakhstani Tenge" },{ value: "LAK", label: "LAK - Laotian Kip" },{ value: "LBP", label: "LBP - Lebanese Pound" },{ value: "LKR", label: "LKR - Sri Lankan Rupee" },{ value: "LRD", label: "LRD - Liberian Dollar" },{ value: "LSL", label: "LSL - Lesotho Loti" },{ value: "LYD", label: "LYD - Libyan Dinar" },{ value: "MAD", label: "MAD - Moroccan Dirham" },{ value: "MDL", label: "MDL - Moldovan Leu" },{ value: "MGA", label: "MGA - Malagasy Ariary" },{ value: "MKD", label: "MKD - Macedonian Denar" },{ value: "MMK", label: "MMK - Myanmar Kyat" },{ value: "MNT", label: "MNT - Mongolian Tugrik" },{ value: "MOP", label: "MOP - Macanese Pataca" },{ value: "MRU", label: "MRU - Mauritanian Ouguiya" },{ value: "MUR", label: "MUR - Mauritian Rupee" },{ value: "MVR", label: "MVR - Maldivian Rufiyaa" },{ value: "MWK", label: "MWK - Malawian Kwacha" },{ value: "MXN", label: "MXN - Mexican Peso" },{ value: "MYR", label: "MYR - Malaysian Ringgit" },{ value: "MZN", label: "MZN - Mozambican Metical" },{ value: "NAD", label: "NAD - Namibian Dollar" },{ value: "NZD", label: "NZD - New Zealand Dollar" },{ value: "PHP", label: "PHP - Philippine Peso" },{ value: "SGD", label: "SGD - Singapore Dollar" },{ value: "THB", label: "THB - Thai Baht" },{ value: "USD", label: "USD - United States Dollar" },{ value: "VND", label: "VND - Vietnamese Dong" }];
const CURRENT_SUPPORT_LANG = ['id-ID', 'en-US', 'ms-MY', 'th-TH', 'hi-IN'];
const SUPPORT_LANG_SET = new Set(CURRENT_SUPPORT_LANG);
const USED_LIST_LANG = LIST_LANGUAGE.filter(item => SUPPORT_LANG_SET.has(item.value));

const IS_DARK_MODE = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

const STORES = {
	PRODUCT: 'product',
	TRANSACTION: 'transaction',
	SETTINGS: 'pos_settings'
};

const STORE_CONFIGS = [
	{
		name: STORES.PRODUCT,
		indexes: [
			{ name: 'by_name', keyPath: 'name' },
			{ name: 'by_sku', keyPath: 'sku', options: { unique: true } },
			{ name: 'by_barcode', keyPath: 'barcode', options: { unique: true } },
			{ name: 'by_category', keyPath: 'category' }
		]
	},
	{
		name: STORES.TRANSACTION,
		indexes: [
			{ name: 'by_datetime', keyPath: 'datetime' },
			{ name: 'by_receiptNo', keyPath: 'receiptNo', options: { unique: true } },
			{ name: 'by_customer', keyPath: 'customer' },
			{ name: 'by_status', keyPath: 'isPaid' },
		]
	},
	{ name: STORES.POS_SETTINGS }
];

const IDB_CONFIG = {
	name: 'POS',
	version: 1,
	stores: [
		...STORE_CONFIGS
	]
};

function loadGeneralSettings()
{
	const DEFAULT_SETTINGS = {
			hue: 210,
			darkMode: IS_DARK_MODE,
			fontSize: 16,
			locale: navigator.language || 'en-US',
			dateStyle: Intl.DateTimeFormat().resolvedOptions().dateStyle || 'medium',
			timeStyle: Intl.DateTimeFormat().resolvedOptions().timeStyle || 'short',
			timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
			timeZoneOffset: new Date().getTimezoneOffset() || 0,
			currencyStyle: 'USD'
	};

	if(typeof localStorage === 'undefined') return DEFAULT_SETTINGS;
	const saved = localStorage.getItem('general_settings');
	if(!saved) return DEFAULT_SETTINGS;

	try {
		return JSON.parse(saved);
	}
	catch (e) {
		return DEFAULT_SETTINGS; 
	}
}

function loadPOSSettings()
{
	const DEFAULT_SETTINGS = {
		isSupportMultiTransaction: false,
		taxRate: 0.10,
		is_cash: true,
		is_transfer: true,
		is_qris: true,
		enableGeolocation: false,
		qrisCode: "00020101021126610014COM.GO-JEK.WWW01189360091439292967800210G9292967800303UMI51440014ID.CO.QRIS.WWW0215ID10254672728090303UMI5204573453033605802ID5917IndieIn, Software6013JAKARTA PUSAT61051016062070703A0163045B39"
	};

	if(typeof localStorage === 'undefined') return DEFAULT_SETTINGS;
	const saved = localStorage.getItem('pos_settings');
	if(!saved) return DEFAULT_SETTINGS;

	try {
		return JSON.parse(saved);
	}
	catch (e) {
		return DEFAULT_SETTINGS; 
	}
}

function applyGeneralSettings() {
	document.documentElement.style.setProperty('--hue', USER_SETTINGS_GENERAL.hue);
	document.documentElement.style.setProperty('--hue-preview', USER_SETTINGS_GENERAL.hue);
}

let USER_SETTINGS_GENERAL = loadGeneralSettings();
applyGeneralSettings();
document.body.dataset.theme = IS_DARK_MODE ? 'dark' : 'light';

// Reusable Base Field Definitions to avoid prototype getter issues
const BASE_DATE_FIELD = {
	type: 'datetime-local',
	placeholder: 'Tanggal'
};

const BASE_PASSWORD_FIELD = {
	type: 'password',
	placeholder: 'Kata sandi',
	pattern: '(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&]).{8,}',
	required: true
};

const BASE_USERNAME_FIELD = {
	type: 'text',
	placeholder: 'Nama pengguna',
	minLength: 3,
	maxLength: 64,
	required: true
};

const BASE_UID_FIELD = {
	type: 'text',
	placeholder: 'Kode unik',
	maxLength: 20
};

const FORM_BLUEPRINT = {
	FIELD_DEFINITIONS: {
		id: {
			type: 'hidden',
			placeholder: 'ID'
		},
		user_id: {
			type: 'number',
			placeholder: 'ID pengguna'
		},
		business_id: {
			type: 'number',
			placeholder: 'ID bisnis',
			required: true
		},
		branch_id: {
			type: 'number',
			placeholder: 'ID cabang'
		},
		warehouse_id: {
			type: 'number',
			placeholder: 'ID gudang'
		},
		name: {
			type: 'text',
			placeholder: 'Nama',
			maxLength: 128
		},
		email: {
			type: 'email',
			placeholder: 'Email'
		},
		address: {
			type: 'text',
			placeholder: 'Alamat',
			maxLength: 128
		},
		phone: {
			type: 'text',
			placeholder: 'Nomor handphone',
			maxLength: 20
		},
		photo: {
			type: 'text',
			placeholder: 'URL gambar'
		},
		imgFile: {
			type: "file",
			label: "Image",
			placeholder: "Gambar",
			accept: "image/*"
		},
		imgUrl: {
			type: "url",
			label: "Image",
			placeholder: "URL gambar",
		},
		barcode: {
			type: 'barcode',
			placeholder: 'Barcode'
		},
		price: {
			type: 'number',
			placeholder: 'Harga'
		},
		status: {
			type: 'select',
			placeholder: 'Status',
			options: [
				{ value: true, text: 'Active' },
				{ value: false, text: 'Nonactive' }
			]
		},
		category: {
			type: 'tags',
			placeholder: 'Kategori'
		},
		date: BASE_DATE_FIELD,
		created_at: { ...BASE_DATE_FIELD, placeholder: 'Tanggal dibuat' },
		updated_at: { ...BASE_DATE_FIELD, placeholder: 'Tanggal diubah' },
		has_account: {
			type: 'checkbox',
			placeholder: 'Has account?'
		},
		login: {
			type: 'text',
			placeholder: 'Email atau nama pengguna',
			required: true
		},
		email_login: {
			type: 'email',
			placeholder: 'Email akun',
			required: true
		},
		password: BASE_PASSWORD_FIELD,
		oldpassword: { ...BASE_PASSWORD_FIELD, placeholder: 'Kata sandi lama' },
		newpassword: { ...BASE_PASSWORD_FIELD, placeholder: 'Kata sandi baru' },
		confirmpassword: { ...BASE_PASSWORD_FIELD, placeholder: 'Konfirmasi kata sandi' },
		username: BASE_USERNAME_FIELD,
		slug: { ...BASE_USERNAME_FIELD, placeholder: 'Slug' },
		uid: BASE_UID_FIELD,
		sku: { ...BASE_UID_FIELD, placeholder: 'SKU' },
		taxRate: {
			type: 'text',
			label: 'Tax Rate',
			placeholder: '0.01 = 1% - 0.10 = 10%',
			pattern: /^\d+(\.\d+)?$/,
			inputmode: 'decimal'
		},
		is_cash: {
			type: 'checkbox',
			placeholder: 'Cash'
		},
		is_transfer: {
			type: 'checkbox',
			placeholder: 'Transfer'
		},
		is_qris: {
			type: 'checkbox',
			placeholder: 'QRIS'
		},
		listTransfer: {
			type: 'multi-creatable',
			placeholder: 'Transfer Label'
		},
		qrisImg: {
			type: 'file',
			label: 'Upload QRIS'
		},
		qrisCode: {
			type: 'textarea',
			placeholder: 'String QRIS',
			required: true
		},
		qrisNmid: {
			type: 'text',
			placeholder: 'NMID',
			disabled: true
		},
		qrisName: {
			type: 'text',
			placeholder: 'Name',
			disabled: true
		},
		qrisCity: {
			type: 'text',
			placeholder: 'City',
			disabled: true
		},
		isSupportMultiTransaction: {
			type: 'checkbox',
			placeholder: 'Support Multi Transaction (Open-bill)'
		},
		enableGeolocation: {
			type: 'checkbox',
			placeholder: 'Enable Geolocation'
		},
		hue: {
			type: 'range',
			label: 'Change Color',
			min: 0,
			max: 360,
			defaultValue: 210
		},
		locale: {
			type: 'searchable',
			label: 'Language',
			options: USED_LIST_LANG || []
		},
		currencyStyle: {
			type: 'searchable',
			label: 'Format Currency',
			options: LIST_CURRENCY || []
		},
		dateStyle: {
			type: 'select',
			label: 'Format Date',
			options: [
				{ value: 'full', label: 'Full' },
				{ value: 'long', label: 'Long' },
				{ value: 'medium', label: 'Medium' },
				{ value: 'short', label: 'Short' }
			]
		},
		timeStyle: {
			type: 'select',
			label: 'Format Time',
			options: [
				{ value: 'full', label: 'Full' },
				{ value: 'long', label: 'Long' },
				{ value: 'medium', label: 'Medium' },
				{ value: 'short', label: 'Short' }
			]
		}
	},
	FORM_SCHEMAS: {
		base: {
			default: {
				formTitle: 'Generated Form',
				fields: {}
			}
		},
		settings: {
			general: {
				formTitle: 'Pengaturan',
				fields: {
					hue: 210,
					locale: USER_SETTINGS_GENERAL?.locale || 'en-US',
					dateStyle: USER_SETTINGS_GENERAL?.dateStyle || 'medium',
					timeStyle: USER_SETTINGS_GENERAL?.timeStyle || 'short',
					currencyStyle: USER_SETTINGS_GENERAL?.currencyStyle || 'USD'
				}
			},
			app_pos: {
				formTitle: 'POS Settings',
				fields: {
					isSupportMultiTransaction: false,
					enableLocation: false
				}
			}
		},
		payment: {
			default: {
				formTitle: 'Payments & Tax',
				fields: {
					taxRate: 0.0,
					is_cash: null,
					is_transfer: null,
					listTransfer: null,
					is_qris: null,
					qrisImg: null,
					qrisCode: null,
					qrisName: null,
					qrisCity: null,
					qrisNmid: null
				},
				dynamicRules: [
					{
						id: 'list-transfer',
						conditions: { is_transfer: true },
						action: 'SHOW_AND_REQUIRE',
						fields: ['listTransfer']
					},
					{
						id: 'get-qris',
						conditions: { is_qris: true },
						action: 'SHOW',
						fields: ['qrisImg', 'qrisCode', 'qrisNmid', 'qrisName', 'qrisCity']
					}
				]
			}
		},
		user: {
			signIn: {
				formTitle: 'Masuk',
				fields: {
					login: null,
					password: null
				},
				fieldsRequired: ['login', 'password'],
				endpoint: '/auth/signin'
			},
			signUp: {
				formTitle: 'Daftar',
				fields: {
					name: null,
					username: null,
					email: null,
					password: null
				},
				fieldsRequired: ['username', 'email', 'password'],
				endpoint: '/auth/signup'
			},
			changeProfile: {
				formTitle: 'Profile',
				fields: {
					photo: null,
					name: null,
					username: null
				},
				fieldsRequired: ['username'],
				filterFields: ['id', 'email', 'created_at']
			},
			changeEmail: {
				formTitle: 'Change Email',
				fields: {
					email: null,
				},
				fieldsRequired: ['email'],
			},
			changePassword: {
				formTitle: 'Change Password',
				fields: {
					oldpassword: null,
					newpassword: null,
					confirmpassword: null
				},
				fieldsRequired: ['oldpassword', 'newpassword', 'confirmpassword']
			},
		},
		business: {
			create: {
				formTitle: 'Add Business',
				fields: {
					id: null,
					name: null,
					slug: null
				},
				filterFields: ['id'],
				fieldsRequired: ['slug'],
				endpoint: '/api/business'
			},
			update: {
				formTitle: 'Update Business',
				fieldsRequired: ['id', 'slug'],
				endpoint: '/api/business'
			}
		},
		branch: {
			create: {
				formTitle: 'Add Branch',
				fields: {
					id: null,
					business_id: null,
					name: null,
					address: null
				},
				filterFields: ['id'],
				fieldsRequired: ['business_id'],
				endpoint: '/api/business/:id/branch'
			},
			update: {
				formTitle: 'Update Branch',
				fieldsRequired: ['id', 'business_id'],
				endpoint: '/api/business/:id/branch'
			}
		},
		warehouse: {
			create: {
				formTitle: 'Add Warehouse',
				fields: {
					id: null,
					business_id: null,
					branch_id: null,
					name: null,
					address: null
				},
				filterFields: ['id'],
				fieldsRequired: ['business_id'],
				endpoint: '/api/business/:id/warehouse'
			},
			update: {
				formTitle: 'Update Warehouse',
				fieldsRequired: ['id', 'business_id'],
				endpoint: '/api/business/:id/warehouse'
			}
		},
		employee: {
			create: {
				formTitle: 'Add Employee',
				fields: {
					id: null,
					business_id: null,
					name: null,
					email: null,
					phone: null,
					address: null,
					photo: null,
					branch_id: null,
					warehouse_id: null,
					status: true,
					has_account: false,
					email_login: null,
					username: null
				},
				dynamicRules: [
					{
						id: 'create-account-rule',
						conditions: { has_account: true },
						action: 'SHOW_AND_REQUIRE',
						fields: ['email_login', 'username']
					}
				],
				filterFields: ['id'],
				fieldsRequired: ['business_id', 'name'],
				endpoint: '/api/business/:id/employee'
			},
			update: {
				formTitle: 'Update Employee',
				filterFields: ['email_login', 'username', 'password'],
				fieldsRequired: ['id', 'business_id', 'name'],
				endpoint: '/api/business/:id/employee'
			}
		},
		customer: {
			create: {
				formTitle: 'Add Customer',
				fields: {
					id: null,
					business_id: null,
					name: null,
					email: null,
					phone: null,
					address: null,
					photo: null,
					status: true
				},
				filterFields: ['id'],
				fieldsRequired: ['business_id', 'name', 'email', 'username', 'password'],
				endpoint: '/api/business/:id/customer'
			},
			update: {
				formTitle: 'Update Customer',
				fieldsRequired: ['id', 'business_id', 'name'],
				endpoint: '/api/business/:id/customer'
			}
		},
		product: {
			create: {
				formTitle: 'Add Product',
				fields: {
					id: null,
					imgFile: null,
					sku: null,
					name: null,
					barcode: null,
					price: null,
					category: null
				},
				filterFields: ['id'],
				fieldsRequired: ['name', 'price'],
				endpoint: '/api/business/:id/product'
			},
			update: {
				formTitle: 'Update Product',
				fieldsRequired: ['id', 'name', 'price'],
				endpoint: '/api/business/:id/product'
			}
		}
	},
	FIELD_TYPE_TRANSFORMER: {
		branch_id: {
			warehouse: 'select',
			employee: 'select'
		},
		warehouse_id: {
			employee: 'select'
		}
	}
};

const COLUMNS_CONFIG = {
	transaction: [
		{ id: "id", label: "ID", visible: false, hidden: true },
		{ id: "receiptNo", label: "Receipt Number", visible: true },
		{ id: "datetime", label: "Datetime", visible: true, format: "date" },
		{ id: "customer", label: "Customer", visible: true },
		{ id: "cart", label: "Cart", visible: false, hidden: true },
		{ id: "payment", label: "Payment Method", visible: true },
		{ id: "tax", label: "Tax", visible: true, format: "currency" },
		{ id: "taxRate", label: "Tax Rate", visible: true, format: "number" },
		{ id: "total", label: "Total", visible: true, format: "currency" },
		{ id: "location", label: "Location", visible: true },
		{ id: "isPaid", label: "Is Paid", visible: false, hidden: true },
		{ id: "isSync", label: "Is Sync", visible: false, hidden: true }
	],
	product: [
		{ id: "id", label: "ID", visible: true, hidden: false },
		{ id: "name", label: "Name", visible: true, hidden: false },
		{ id: "sku", label: "SKU", visible: true, hidden: false },
		{ id: "barcode", label: "Barcode", visible: true, hidden: false },
		{ id: "price", label: "Price", visible: true, hidden: false, format: "currency" },
		{ id: "category", label: "Category", visible: true, hidden: false },
		{ id: "imgFile", label: "Img File", visible: true, hidden: false },
		{ id: "updated_at", label: "Updated at", visible: false, hidden: true, format: "date" }
	]
};