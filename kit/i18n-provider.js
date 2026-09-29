import { html, createContext, useContext, useState, useMemo } from 'importmap';

const I18nContext = createContext({
	lang: 'en-US',
	setLang: () => {},
	t: (key) => key
});

/**
 * Lightweight I18n Provider supporting flat keys, array fallbacks, and variable interpolation.
 */
export function I18nProvider({ children, translation = {}, userLocale = 'en-US' }) {
	const [lang, setLang] = useState(userLocale);

	const value = useMemo(() => {
		const dict = translation[lang] || translation['en-US'] || {};
		const fallbackDict = translation['en-US'] || {};

		const t = (key, params = {}) => {
			const keys = Array.isArray(key) ? key : [key];
			let raw = null;

			// Check active language dictionary first
			for(const k of keys) {
				if(dict[k] !== undefined) { raw = dict[k]; break; }
			}

			// Fallback to en-US dictionary
			if(raw === null) {
				for(const k of keys) {
					if (fallbackDict[k] !== undefined) { raw = fallbackDict[k]; break; }
				}
			}

			// Final fallback: return fallback string if provided in params or the first key string
			if(raw === null) {
				return typeof params === 'string' ? params : (params?.defaultValue || keys[0]);
			}

			// Simple interpolation for {{param}} placeholders
			return typeof raw === 'string'
				? raw.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, p) => params[p] ?? `{{${p}}}`)
				: raw;
		};

		return { t, lang, setLang };
	}, [lang, translation]);

	return html`<${I18nContext.Provider} value=${value}>${children}<//>`;
}

export function useI18n() {
	const context = useContext(I18nContext);
	if(!context) {
		throw new Error('useI18n must be used within an I18nProvider');
	}
	return context;
}

/**
 * Translates a form blueprint schema using module-first key lookup:
 * 1. Module key fallback: forms.[moduleKey].[field].[label|placeholder]
 * 2. Field key fallback: forms.[field].[label|placeholder]
 * 3. Raw blueprint fallback value
 *
 * @param {Function} t - Translation function from useI18n()
 * @param {String} moduleKey - Target module key (e.g., 'user', 'employee')
 * @param {String} action - Target action key (e.g., 'signIn', 'create')
 * @param {Object|null} initialData - Default initial values for form fields
 * @param {Object} uiOverrides - UI layout overrides
 */
export function getTranslatedFormSchema(t, getFormSchema, moduleKey, action, initialData = null, uiOverrides = {}, sampleData = {})
{
	const schema = getFormSchema(moduleKey, action, initialData, uiOverrides, sampleData = {});
	if (!schema) return null;

	return {
		...schema,
		formTitle: t([
			`forms.${moduleKey}.${action}.title`,
			`forms.${moduleKey}.title.${action}`,
			`forms.${action}.title`
		], schema.formTitle),

		fields: schema.fields.map((field) => {
			const key = field.name;

			const label = t([
				`forms.${moduleKey}.${key}.label`,
				`forms.${moduleKey}.${key}`,
				`forms.${key}.label`,
				`forms.${key}.placeholder`,
				`forms.${key}`
			], field.label);

			const placeholder = t([
				`forms.${moduleKey}.${key}.placeholder`,
				`forms.${key}.placeholder`,
				`forms.${key}.label`,
				`forms.${key}`
			], field.placeholder);

			const rules = { ...field.rules };
			if(rules.required) {
				rules.required = t([
					`forms.${moduleKey}.${key}.error.required`,
					`forms.${key}.error.required`,
					`forms.error.required`
				], `${label} is required`);
			}

			let options = field.options;
			if(Array.isArray(field.options)) {
				options = field.options.map((opt) => {
					if (typeof opt === 'object' && opt !== null) {
						const val = opt.value ?? opt.id;
						const rawText = opt.label || opt.text || val;
						const optLabel = t([
							`forms.${moduleKey}.${key}.options.${val}`,
							`forms.${key}.options.${val}`,
							`common.${val}`
						], rawText);

						return { ...opt, label: optLabel, text: optLabel };
					}
					return opt;
				});
			}

			return {
				...field,
				label,
				placeholder,
				rules,
				options
			};
		})
	};
}