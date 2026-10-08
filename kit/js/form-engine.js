import { html, useState, useEffect, useRef } from 'importmap';
import { ToggleScanner } from 'importmap';

let FORM_BLUEPRINT = null;

export function initFormBlueprint(blueprint) {
	FORM_BLUEPRINT = blueprint;
}

function onFieldChangeFactory(formName)
{
	return async (val, target, setValues) => {
		const handler =
			fieldChangeFormHandlers[formName]?.[target?.name] ||
			fieldChangeGlobalHandlers[target?.name];

		if(!handler) return;
		const result = await handler(val);
		if(result) setValues(result);
	}
}

function onFormSubmitFactory(formName)
{
	return async (formData, context) => {
		const handler = formSubmitHandlers?.[formName];

		if(!handler) return;
		return handler(formData, context);
	}
}

export function getFormSchema(moduleKey, action, initialData = null, uiOverrides = {}, sampleData = [])
{
	if (!FORM_BLUEPRINT) {
		console.warn('FORM_BLUEPRINT is not initialized. Call initFormBlueprint(FORM_BLUEPRINT) first.');
		return null;
	}

	const schema = FORM_BLUEPRINT.FORM_SCHEMAS?.[moduleKey];
	let config = schema?.[action];
	
	if (!config) {
		if (!Array.isArray(sampleData) || !sampleData.length) return null;
		config = FORM_BLUEPRINT.FORM_SCHEMAS?.base?.default || { fields: {} };
		config.fields = Object.fromEntries(sampleData.map(k => [String(k), null]));
	}
	
	const defaultMethod = action === 'update' ? 'PUT' : 'POST';
	const finalMethod = config.method || defaultMethod;
	
	const rawFields = Array.isArray(config.fields) 
		? config.fields 
		: Object.keys(config.fields || schema?.create?.fields || {});

	const processedFields = rawFields
		.filter(key => !(config.filterFields || []).includes(key))
		.map(key => {
			const base = FORM_BLUEPRINT.FIELD_DEFINITIONS?.[key] || {};
			const finalValue = initialData?.[key] ?? (typeof config.fields === 'object' ? config.fields?.[key] : null) ?? base.defaultValue ?? "";

			const resolvedType = getFieldType(key, moduleKey, base.type || 'text');
			const isRequired = base.required || (config.fieldsRequired || []).includes(key);

			const rules = {};
			if (isRequired) rules.required = `${base.placeholder || key} is required`;
			if (base.minLength) rules.minLength = base.minLength;
			if (base.maxLength) rules.maxLength = base.maxLength;
			if (base.pattern) rules.pattern = { value: base.pattern, message: 'Invalid format' };
			if (base.min !== undefined) rules.min = base.min;
			if (base.max !== undefined) rules.max = base.max;

			const fieldOverride = uiOverrides.fields?.[key] || {};

			return {
				...base,
				name: key,
				label: fieldOverride.label || base.label || base.placeholder || key,
				type: fieldOverride.type || resolvedType,
				defaultValue: finalValue,
				required: isRequired,
				disabled: base?.disabled || false,
				readonly: base?.readonly || false,
				inputmode: base?.inputmode || null,
				rules: rules,
				floating: fieldOverride.floating ?? uiOverrides.floating ?? false,
				split: fieldOverride.split ?? uiOverrides.split ?? false,
				layout: fieldOverride.layout ?? uiOverrides.layout ?? 'vertical',
				helperText: fieldOverride.helperText || base.helperText,
				prefixIcon: fieldOverride.prefixIcon || base.prefixIcon,
				suffixIcon: fieldOverride.suffixIcon || base.suffixIcon,
				...fieldOverride
			};
		});

	return {
		...config,
		formTitle: config.formTitle || '',
		fields: processedFields,
		method: finalMethod,
		endpoint: config.endpoint || "",
		dynamicRules: config.dynamicRules || [],
		onFieldChange: onFieldChangeFactory(`${moduleKey}.${action}`),
		onFormSubmit: onFormSubmitFactory(`${moduleKey}.${action}`)
	};
}

function getFieldType(fieldKey, moduleKey, originalType) {
	if (!FORM_BLUEPRINT?.FIELD_TYPE_TRANSFORMER) return originalType;
	
	const transformer = FORM_BLUEPRINT.FIELD_TYPE_TRANSFORMER;
	if (transformer[fieldKey] && transformer[fieldKey][moduleKey]) {
		return transformer[fieldKey][moduleKey];
	}
	
	return originalType;
}

export function evaluateDynamicRules(dynamicRules = [], currentValues = {}) {
	const hiddenFields = new Set();
	const requiredFields = new Set();

	dynamicRules.forEach((rule) => {
		const { conditions, action, fields } = rule;

		const isMatched = Object.entries(conditions).every(([key, expectedValue]) => {
			const actualValue = currentValues[key];
			if (typeof expectedValue === 'boolean') {
				return Boolean(actualValue) === expectedValue;
			}
			return actualValue === expectedValue;
		});

		if (isMatched) {
			if (action === 'SHOW_AND_REQUIRE' || action === 'REQUIRE') {
				fields.forEach(f => requiredFields.add(f));
			}
			if (action === 'HIDE') {
				fields.forEach(f => hiddenFields.add(f));
			}
		}
		else {
			if (action === 'SHOW_AND_REQUIRE' || action === 'SHOW') {
				fields.forEach(f => hiddenFields.add(f));
			}
		}
	});

	return { hiddenFields, requiredFields };
}

export function useForm(initialValues = {}) {
	const fieldsRef = useRef({});
	const [errors, setErrors] = useState({});

	const register = (name, ref) => {
		if (!ref) {
			delete fieldsRef.current[name];
		} else {
			fieldsRef.current[name] = ref;
			if (initialValues[name] !== undefined && ref.setValue) {
				ref.setValue(initialValues[name]);
			}
		}
	};

	const getValue = (name) => {
		return fieldsRef.current[name] ? fieldsRef.current[name].getValue() : undefined;
	};

	const getValues = () => {
		const data = {};
		Object.keys(fieldsRef.current).forEach((key) => {
			data[key] = fieldsRef.current[key].getValue();
		});
		return data;
	};

	const setValue = (name, value) => {
		if (fieldsRef.current[name] && fieldsRef.current[name].setValue) {
			fieldsRef.current[name].setValue(value);
		}
	};

	const setValues = (values = {}) => {
		Object.keys(values).forEach((key) => {
			setValue(key, values[key]);
		});
	};

	const setError = (name, message) => {
		setErrors((prev) => ({ ...prev, [name]: message }));
	};

	const clearErrors = (name) => {
		if (name) {
			setErrors((prev) => {
				const updated = { ...prev };
				delete updated[name];
				return updated;
			});
		} else {
			setErrors({});
		}
	};

	const reset = () => {
		setValues(initialValues);
		clearErrors();
		Object.keys(fieldsRef.current).forEach((key) => {
			if (typeof fieldsRef.current[key]?.resetDOM === 'function') {
				fieldsRef.current[key].resetDOM();
			}
		});
	};

	const validateForm = (fieldsSchema = [], dynamicRules = []) => {
		const currentValues = getValues();
		const { hiddenFields, requiredFields } = evaluateDynamicRules(dynamicRules, currentValues);
		const newErrors = {};
		let isValid = true;

		fieldsSchema.forEach((field) => {
			if (hiddenFields.has(field.name)) return;

			const isDynamicallyRequired = requiredFields.has(field.name) || field.required;
			const effectiveRules = {
				...field.rules,
				...(isDynamicallyRequired ? { required: `${field.label} is required` } : {})
			};

			if (effectiveRules && field.name) {
				const val = currentValues[field.name];
				const error = validateField(val, effectiveRules);
				if (error) {
					newErrors[field.name] = error;
					isValid = false;
				}
			}
		});

		setErrors(newErrors);
		return isValid;
	};

	return {
		register,
		getValue,
		getValues,
		setValue,
		setValues,
		errors,
		setError,
		clearErrors,
		reset,
		validateForm
	};
}

export function validateField(value, rules = {}) {
	if (!rules) return null;

	if (rules.required) {
		const isEmpty = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
		if (isEmpty) return typeof rules.required === 'string' ? rules.required : 'This field is required';
	}

	if (value === undefined || value === null || value === '') return null;

	if (rules.minLength) {
		const min = rules.minLength.value ?? rules.minLength;
		if (String(value).length < min) return rules.minLength.message || `Minimum length is ${min} characters`;
	}

	if (rules.maxLength) {
		const max = rules.maxLength.value ?? rules.maxLength;
		if (String(value).length > max) return rules.maxLength.message || `Maximum length is ${max} characters`;
	}

	if (rules.pattern) {
		const regex = new RegExp(rules.pattern.value || rules.pattern);
		if (!regex.test(String(value))) return rules.pattern.message || 'Invalid format';
	}

	return null;
}

export function FormWrapper({ schema, context, submitText = 'Save', showTitle = true, forceRerender = false })
{
	if(!schema) return null;
	const { register, validateForm, getValues, setValues, errors } = useForm();
	const [t, setTick] = useState(0);
	
	useEffect(() => { setTick(1) }, [schema]);

	useEffect(() => {
		if(t === 1) {
			for(const [key, value] of Object.entries(getValues())) {
				handleFieldChange(value, { name: key });
			}
		}
		validateForm(schema?.fields || [], schema?.dynamicRules || []);
	}, [t]);

	const handleFieldChange = (val, target) => {
		schema?.onFieldChange && schema.onFieldChange(val, target, setValues);
		setTick(t => t + Number(forceRerender));
	}
	
	const handleSubmit = (e) => {
		e.preventDefault();
		const isValid = validateForm(schema?.fields || [], schema?.dynamicRules || []);
		if(!isValid) {
			console.log('Validation errors:', errors);
			return;
		}
		const formData = getValues();
		schema?.onFormSubmit && schema.onFormSubmit(formData, context);
	};

	return html`
		<form onSubmit=${handleSubmit}>
			<${FormRenderer}
				schema=${schema}
				register=${register}
				errors=${errors}
				getValues=${getValues}
				onFieldChange=${handleFieldChange}
				showTitle=${showTitle}
			/>
			<div class="form-log"></div>
			<button class="btn-primary-brand w-full" type="submit">${submitText}</button>
		</form>
	`;
}

export function FormRenderer({ schema, register, errors = {}, getValues, onFieldChange, showTitle = true })
{
	if (!schema || !Array.isArray(schema.fields)) return null;

	const currentValues = typeof getValues === 'function' ? getValues() : {};
	const { hiddenFields, requiredFields } = evaluateDynamicRules(schema.dynamicRules, currentValues);

	return html`
		<div class="form-renderer-wrapper">
			${(showTitle && schema.formTitle) && html`<div class="form-title" style="margin-bottom: 1rem;">${schema.formTitle}</div>`}
			
			<div class="form-basic">
				${schema.fields.map((field) => {
					if (hiddenFields.has(field.name)) return null;

					const isDynamicallyRequired = requiredFields.has(field.name) || field.required;

					return html`
						<${FormField}
							key=${field.name}
							type=${field.type}
							name=${field.name}
							label=${field.label}
							placeholder=${field.placeholder}
							floating=${field.floating}
							split=${field.split}
							className=${field.layout === 'horizontal' ? 'horizontal' : ''}
							options=${field.options}
							accept=${field.accept}
							defaultValue=${field.defaultValue}
							min=${field.min}
							max=${field.max}
							required=${isDynamicallyRequired}
							disabled=${field.disabled}
							readonly=${field.readonly}
							inputmode=${field.inputmode}
							errorMessage=${errors[field.name]}
							helperText=${field.helperText}
							prefixIcon=${field.prefixIcon}
							suffixIcon=${field.suffixIcon}
							register=${register}
							onChange=${(val, target) => onFieldChange && onFieldChange(val, target)}
						/>
					`;
				})}
			</div>
		</div>
	`;
}

export function FormField({ children, register, errorMessage, helperText, split = false, floating = false, onChange, ...props })
{
	if (!children && !props) return null;
	const {
		style,
		className = '',
		type = 'text',
		prefixIcon,
		icon,
		suffixIcon,
		defaultValue = '',
		label,
		options = [],
		...attributes
	} = props;

	const [value, setValue] = useState(defaultValue);
	const valueRef = useRef(value);
	const domRef = useRef(null);

	const updateValue = (val) => {
		valueRef.current = val;
		setValue(val);
	};

	useEffect(() => {
		if (defaultValue !== undefined) updateValue(defaultValue);
	}, [defaultValue]);

	useEffect(() => {
		if (!register || !attributes.name) return;

		register(attributes.name, {
			setValue: (val) => updateValue(val),
			getValue: () => valueRef.current,
			resetDOM: () => {
				if (domRef.current && typeof domRef.current.reset === 'function') {
					domRef.current.reset();
				}
				updateValue(defaultValue || '');
			}
		});
		return () => register(attributes.name, null);
	}, [attributes.name, register]);

	const handleInputChange = (val, target) => {
		updateValue(val);
		if (onChange) onChange(val, target);
	};

	const fieldId = attributes.id || attributes.name || `field-${Math.random().toString(36).substring(2, 9)}`;
	const isNoBorder = ['range', 'creatable', 'searchable', 'multi-creatable', 'tags'].includes(type);
	const isFloatingEligible = floating && ['text', 'number', 'email', 'password', 'textarea', 'select'].includes(type);
	const containerClass = `form-field-group ${isFloatingEligible ? 'form-floating' : ''} ${split ? 'split' : ''} ${className} ${errorMessage ? 'has-error' : ''} ${attributes.disabled ? 'is-disabled' : ''}`.trim();
	const labelText = label || attributes.placeholder;

	const renderInput = () => {
		const currentPlaceholder = isFloatingEligible ? (attributes.placeholder || ' ') : attributes.placeholder;

		if (type === 'creatable' || type === 'searchable' || type === 'tags' || type === 'multi-creatable') {
			const isMulti = attributes.isMulti || type === 'tags' || type === 'multi-creatable';
			return html`
				<${CreatableSelect}
					...${attributes}
					id=${fieldId}
					initialOptions=${options}
					value=${value}
					onChange=${(val) => handleInputChange(val)}
					creatAble=${type !== 'searchable'}
					isMulti=${isMulti} />
			`;
		}
		if (type === 'select') {
			return html`
				<${FormFieldSelect}
					...${attributes}
					id=${fieldId}
					options=${options}
					value=${value}
					onChange=${(e) => handleInputChange(e.target.value, e.target)} >
					
					${children}
				<//>
			`;
		}

		if (type === 'textarea') {
			return html`
				<textarea
					ref=${domRef}
					id=${fieldId}
					class="form-textarea"
					placeholder=${currentPlaceholder}
					value=${value}
					...${attributes}
					onInput=${(e) => handleInputChange(e.target.value, e.target)}
					onChange=${(e) => handleInputChange(e.target.value, e.target)}
				>${value}</textarea>
			`;
		}

		if (type === 'checkbox') {
			return html`
				<label class="checkbox-label" for=${fieldId}>
					<input
						ref=${domRef}
						type="checkbox"
						id=${fieldId}
						checked=${Boolean(value)}
						...${attributes}
						onChange=${(e) => handleInputChange(e.target.checked, e.target)}
					/>
					${labelText && html`<span>${labelText}</span>`}
				</label>
			`;
		}

		if (type === 'file') {
			return html`
				<input
					ref=${domRef}
					type="file"
					id=${fieldId}
					...${attributes}
					onChange=${(e) => handleInputChange(e.target.files?.[0] || null, e.target)}
				/>
			`;
		}

		return html`
			<input
				ref=${domRef}
				type=${type === 'barcode' ? 'text' : type}
				id=${fieldId}
				placeholder=${currentPlaceholder}
				value=${value}
				...${attributes}
				onInput=${(e) => handleInputChange(e.target.value, e.target)}
			/>
		`;
	};

	const showStandardLabel = type !== 'hidden' && type !== 'checkbox' && labelText;
	const renderLabelElement = () => showStandardLabel ? html`<label for=${fieldId} class="form-label">${labelText}${type === 'range' ? ` (${value})` : ''}</label>` : null;

	if (type === 'checkbox') {
		return html`
			<div class=${containerClass} style=${style}>
				${renderInput()}
				${helperText && !errorMessage && html`<small class="field-helper-text">${helperText}</small>`}
				${errorMessage && html`<span class="field-error-message" role="alert">${errorMessage}</span>`}
			</div>
		`;
	}

	return html`
		<div class=${containerClass} style=${type === 'hidden' ? 'display: none' : style}>
			${!isFloatingEligible && renderLabelElement()}
			
			<div class="input-group ${isNoBorder ? 'noborder' : ''}">
				${prefixIcon && html`<span class="prefix-icon">${prefixIcon}</span>`}
				${renderInput()}
				${isFloatingEligible && renderLabelElement()}
				${suffixIcon && html`<span class="suffix-icon">${suffixIcon}</span>`}
				${type === 'barcode' && html`<${ToggleScanner} onScan=${(barcode) => handleInputChange(barcode)} className="suffix-icon clickable" />`}
			</div>

			${helperText && !errorMessage && html`<small class="field-helper-text">${helperText}</small>`}
			${errorMessage && html`<span class="field-error-message" role="alert">${errorMessage}</span>`}
		</div>
	`;
}

export function FormFieldSelect({ children, options = [], value, className = '', id, onChange, ...attributes })
{
	return html`
		<select id=${id} class=${`form-select ${className}`.trim()} onChange=${onChange} value=${value} ...${attributes}>
			${children}
			${options.map((item, idx) => {
				const val = item?.value ?? item?.id ?? item;
				const itemLabel = item?.text ?? item?.label ?? item?.value ?? item?.id ?? item;
				return html`<option key=${`${val}-${idx}`} value=${val} selected=${val === value}>${itemLabel}</option>`;
			})}
		</select>
	`;
}

export function CreatableSelect({ initialOptions = [], value = [], label, placeholder, onChange, id, disabled, creatAble = true, isMulti = false }) {
	if (!isMulti) {
		return html`<${CreatableSelectSingle} ...${{ initialOptions, value, label, placeholder, onChange, id, disabled, creatAble }} />`;
	}

	const [options, setOptions] = useState(initialOptions);
	const [selectedItems, setSelectedItems] = useState(() => {
		if (Array.isArray(value)) return value;
		if (typeof value === 'string' && value.trim()) return value.split(',').map(s => s.trim());
		return [];
	});
	const [query, setQuery] = useState('');
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef(null);
	const inputRef = useRef(null);

	useEffect(() => {
		if (Array.isArray(value)) setSelectedItems(value);
		else if (typeof value === 'string' && value.trim()) setSelectedItems(value.split(',').map(s => s.trim()));
		else setSelectedItems([]);
	}, [value]);

	const cleanQuery = String(query || '').trim().toLowerCase();
	
	const filteredOptions = options.filter(item => {
		const val = item?.value ?? item?.id ?? item;
		const lbl = item?.label ?? item?.text ?? val;
		const isSelected = selectedItems.some(s => (s?.value ?? s) === val);
		return !isSelected && String(lbl).toLowerCase().includes(cleanQuery);
	});

	const isExactMatch = options.some(item => {
		const val = item?.value ?? item?.id ?? item;
		const lbl = item?.label ?? item?.text ?? val;
		return String(lbl).toLowerCase() === cleanQuery || String(val).toLowerCase() === cleanQuery;
	});

	const canCreate = creatAble && cleanQuery !== '' && !isExactMatch;

	const handleAdd = (itemToAdd) => {
		const val = itemToAdd?.value ?? itemToAdd?.id ?? itemToAdd;
		if (!val || selectedItems.some(s => (s?.value ?? s) === val)) return;

		const updated = [...selectedItems, itemToAdd];
		setSelectedItems(updated);
		setQuery('');
		setIsOpen(false);
		if (onChange) onChange(updated);
	};

	const handleRemove = (itemToRemove, e) => {
		e?.stopPropagation();
		const valToRemove = itemToRemove?.value ?? itemToRemove?.id ?? itemToRemove;
		const updated = selectedItems.filter(item => (item?.value ?? item) !== valToRemove);
		setSelectedItems(updated);
		if (onChange) onChange(updated);
	};

	const handleCreateNew = () => {
		const newVal = query.trim();
		if (!newVal) return;
		setOptions(prev => [...prev, newVal]);
		handleAdd(newVal);
	};

	const handleKeyDown = (e) => {
		if (disabled) return;

		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			if (canCreate) {
				handleCreateNew();
			} else if (filteredOptions.length > 0 && cleanQuery) {
				handleAdd(filteredOptions[0]);
			}
		} else if (e.key === 'Backspace' && !query && selectedItems.length > 0) {
			handleRemove(selectedItems[selectedItems.length - 1]);
		}
	};

	useEffect(() => {
		const handleClickOutside = (e) => {
			if (containerRef.current && !containerRef.current.contains(e.target)) {
				setIsOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	return html`
		<div class="custom-select-container ${disabled ? 'disabled' : ''}" ref=${containerRef} style="width: 100%;">
			<div class="input-group" style="padding: 0.25rem 0.375rem; min-height: 2.375rem;" onClick=${() => inputRef.current?.focus()}>
				${selectedItems.map((item, idx) => {
					const val = item?.value ?? item?.id ?? item;
					const lbl = item?.label ?? item?.text ?? val;
					return html`
						<span key=${`${val}-${idx}`} class="input-tag">
							${lbl}${!disabled && html`
								<button type="button" class="tag-remove-btn" onClick=${(e) => handleRemove(item, e)}>×</button>
							`}
						</span>
					`;
				})}
				
				<input
					ref=${inputRef}
					id=${id || 'creatable-multi-input'}
					type="text"
					style="flex: 1 1 80px; min-width: 60px; padding: 0.125rem 0.25rem; border: none !important;"
					placeholder=${selectedItems.length === 0 ? (placeholder || 'Select or create multiple...') : ''}
					value=${query}
					disabled=${disabled}
					onFocus=${() => !disabled && setIsOpen(true)}
					onInput=${(e) => {
						setQuery(e.target.value);
						setIsOpen(true);
					}}
					onKeyDown=${handleKeyDown}
					autocomplete="off"
				/>

				<button
					type="button"
					class="suffix-icon clickable"
					disabled=${disabled}
					style="background: transparent; border: none;"
					onClick=${(e) => {
						e.stopPropagation();
						if (!disabled) setIsOpen(!isOpen);
					}}>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
					</svg>
				</button>
			</div>

			${isOpen && !disabled && html`
				<ul class="combobox-dropdown">
					${canCreate && html`
						<li class="combobox-option create-new" onClick=${handleCreateNew}>
							+ Create "${query.trim()}"
						</li>
					`}
					${filteredOptions.map((item, idx) => {
						const optionVal = item?.value ?? item?.id ?? item;
						const optionLabel = item?.label ?? item?.text ?? optionVal;
						return html`
							<li key=${`${optionVal}-${idx}`} class="combobox-option" onClick=${() => handleAdd(item)}>
								${optionLabel}
							</li>
						`;
					})}
					${filteredOptions.length === 0 && !canCreate && html`
						<li class="combobox-option disabled">No results found</li>
					`}
				</ul>
			`}
		</div>
	`;
}

function CreatableSelectSingle({ initialOptions = [], value = '', label, placeholder, onChange, id, disabled, creatAble = true }) {
	const [options, setOptions] = useState(initialOptions);
	const [query, setQuery] = useState(value || '');
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef(null);

	useEffect(() => { setQuery(value || ''); }, [value]);

	const cleanQuery = String(query || '').trim().toLowerCase();
	const filteredOptions = options.filter(item => String(item?.label || item?.text || item).toLowerCase().includes(cleanQuery));
	const isExactMatch = options.some(item => String(item?.label || item?.text || item).toLowerCase() === cleanQuery);
	const canCreate = creatAble ? (cleanQuery !== '' && !isExactMatch) : false;

	const handleSelect = (val) => {
		setQuery(val);
		setIsOpen(false);
		if (onChange) onChange(val);
	};

	const handleCreateNew = () => {
		const newVal = query.trim();
		if (!newVal) return;
		setOptions(prev => [...prev, newVal]);
		handleSelect(newVal);
	};

	useEffect(() => {
		const handleClickOutside = (e) => {
			if (containerRef.current && !containerRef.current.contains(e.target)) {
				setIsOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	return html`
		<div class="custom-select-container ${disabled ? 'disabled' : ''}" ref=${containerRef} style="width: 100%;">
			<div class="input-group">
				<input
					id=${id || 'creatable-input'}
					type="text"
					placeholder=${placeholder || 'Select or create new...'}
					value=${query}
					disabled=${disabled}
					onFocus=${() => !disabled && setIsOpen(true)}
					onInput=${(e) => {
						setQuery(e.target.value);
						setIsOpen(true);
					}}
					autocomplete="off"
				/>
				<button
					type="button"
					class="suffix-icon clickable"
					disabled=${disabled}
					style="background: transparent; border: none;"
					onClick=${() => !disabled && setIsOpen(!isOpen)}>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
					</svg>
				</button>
			</div>

			${isOpen && !disabled && html`
				<ul class="combobox-dropdown">
					${canCreate && html`
						<li class="combobox-option create-new" onClick=${handleCreateNew}>
							+ Create "${query.trim()}"
						</li>
					`}
					${filteredOptions.map((item, idx) => {
						const optionVal = item?.value ?? item?.id ?? item;
						const optionLabel = item?.label ?? item?.text ?? optionVal;
						return html`
							<li key=${`${optionVal}-${idx}`} class="combobox-option" onClick=${() => handleSelect(optionVal)}>
								${optionLabel}
							</li>
						`;
					})}
					${filteredOptions.length === 0 && !canCreate && html`
						<li class="combobox-option disabled">No results found</li>
					`}
				</ul>
			`}
		</div>
	`;
}
