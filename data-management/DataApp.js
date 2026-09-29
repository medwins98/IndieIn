/* Preact Core */ import { html, useEffect, useState, useCallback, useMemo } from 'importmap';
/* UI */ import { useUI, InteractiveContainer, ButtonToggle, BtnIcon } from 'importmap';
/* DB */ import { useData } from 'importmap';
/* Form */ import { useForm, getFormSchema, FormRenderer } from 'importmap';
/* Reusable */ import { Fragment, SectionHeader, DropdownMenu, TableContainer } from 'importmap';
/* I18n */ import { useI18n } from 'importmap';
/* DataApp */ import { DataView, FiltersSection, ImportSection, BulkUpdateSection } from 'importmap';
import * as XLSX from 'importmap';

export function DataApp({ standalone = false, idbStore = null, apiEndpoint = null, mode = 'offline', title = 'Data Playground' })
{
	const { t } = useI18n();
	const { toggle } = useUI();
	const { data: dataDB, add, update, remove } = useData(idbStore, apiEndpoint, mode);
	
	const [data, setData] = useState([]);
	const [columns, setColumns] = useState([]);
	const [selection, setSelection] = useState({
		id: null,
		ids: new Set(),
		action: null
	});
	const isUpdate = selection.action === 'update';
	const isUpdateBulk = selection.action === 'updateBulk';

	useEffect(() => { if(dataDB) setData(dataDB) }, [dataDB]);

	useEffect(() => {
		if(typeof COLUMNS_CONFIG !== 'undefined' && COLUMNS_CONFIG?.[idbStore]) {
			setColumns(COLUMNS_CONFIG[idbStore]);
			return;
		}
		if(!data || data.length === 0) return;

		const firstRecordKeys = Object.keys(data[0]);
		setColumns(prevCols => {
			if (prevCols.length > 0) return prevCols;
			return firstRecordKeys.map(key => ({
				id: key,
				label: typeof formatText === 'function' ? formatText(key) : key,
				visible: !['id', 'created_at', 'updated_at'].includes(key),
				hidden: false
			}));
		});
	}, [data, idbStore]);

	useEffect(() => {
		if(!selection.action) return;
		toggle('form', true);
	}, [selection, toggle]);

	const handleExport = useCallback((format, filteredData) => {
		if(format === 'sheet') {
			const worksheet = XLSX.utils.json_to_sheet(filteredData);
			const workbook = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(workbook, worksheet, 'DataSheet');
			XLSX.writeFile(workbook, 'ExportedData.xlsx');
		}
		else {
			if(typeof downloadFile === 'function') {
				downloadFile(JSON.stringify(filteredData), 'ExportedData.json', 'application/json');
			}
		}
	}, []);

	const handleImportData = useCallback(async ({ items, mode: importMode, primaryKey, fieldMapping }) => {
		if(!Array.isArray(items) || items.length === 0) return;

		try {
			if(standalone) {
				items = items.map(item => item.id ? item : {
					id: (typeof generateUUIDv7 === 'function' ? generateUUIDv7() : Date.now()),
					...item
				});
				if(Object.keys(fieldMapping).length && !fieldMapping.id) {
					fieldMapping.id = 'id';
				}
				setData(prev => syncImportedData(prev, items, { mode: importMode, primaryKey, fieldMapping }));
			}
			else {
				const prevData = data;
				const merged = syncImportedData(prevData, items, { mode: importMode, primaryKey, fieldMapping });
				
				const promises = merged.map(item => {
					const isExisting = item.id && prevData.some(p => p.id === item.id);
					if(isExisting && update) return update(item);
					if(!isExisting && add) return add(item);
					return Promise.resolve();
				});
				
				await Promise.all(promises);
				setData(merged);
			}
		} catch (err) {
			console.error('Failed to import data:', err);
			alert('Import operation failed.');
		}
	}, [standalone, data, add, update]);

	const handleCreate = useCallback(async (formData) => {
		const newItem = {
			...formData,
			id: !formData.id ? (typeof generateUUIDv7 === 'function' ? generateUUIDv7() : Date.now()) : formData.id,
			created_at: Date.now()
		};

		if(standalone) {
			setData(prev => [...prev, newItem]);
		}
		else if(add) {
			await add(newItem);
		}
		toggle('form', false);
	}, [standalone, add, toggle]);

	const handleSaveUpdate = useCallback(async (formData) => {
		const isBulk = selection.ids.size > 0 && !selection.id;
		const cleanData = isBulk
			? Object.fromEntries(Object.entries(formData).filter(([_, v]) => v !== '' && v != null))
			: formData;
	
		const idsToUpdate = isBulk ? Array.from(selection.ids) : [selection.id];
		if(!idsToUpdate[0]) return;
	
		const payload = idsToUpdate.map(id => ({
			id,
			...cleanData,
			updated_at: Date.now()
		}));
	
		if(standalone) {
			setData(prev => syncImportedData(prev, payload, {
				mode: isBulk ? 'merge' : 'update',
				primaryKey: 'id'
			}));
		}
		else if (update) {
			await Promise.all(payload.map(item => {
				const current = data.find(d => (d.id ?? d) == item.id) || {};
				return update({ ...current, ...item });
			}));
		}
	
		setSelection({ ids: new Set(), id: null, action: null });
		toggle('form', false);
	}, [standalone, data, selection, update, toggle]);

	const handleDelete = useCallback(async (idsSet) => {
		if(!idsSet?.size) return;
		if(standalone) {
			setData(prev => prev.filter(item => !idsSet.has(item.id ?? item)));
		} else if (remove) {
			await Promise.all([...idsSet].map(id => remove(id)));
		}
		setSelection({ ids: new Set(), id: null, action: null });
	}, [standalone, remove]);

	const selectedData = useMemo(() => {
		if(selection.id) {
			return data.find(d => (d.id ?? d) == selection.id) || null;
		}
		if(selection.ids.size > 0) {
			return data.filter(d => selection.ids.has(d.id ?? d));
		}
		return null;
	}, [data, selection]);

	const formSchema = useMemo(() => {
		const tempSchema = getFormSchema(
			idbStore,
			isUpdate ? 'update' : 'create',
			isUpdate ? selectedData : null,
			{},
			Object.keys((isUpdate ? selectedData : data[0]) || [])
		);

		if(tempSchema?.formTitle) {
			tempSchema.formTitle = isUpdate ? t('data.form.title.update') : t('data.form.title.create');
		}

		return tempSchema;
	}, [idbStore, data, selectedData, isUpdate, t]);

	return html`
		<${DataView}
			title=${title}
			data=${data}
			columns=${columns}
			setColumns=${setColumns} 
			selection=${selection}
			setSelection=${setSelection} 
			onExport=${handleExport} 
			onDelete=${handleDelete} 
			translate=${t} >

			<${ImportSection} 
				targetColumns=${columns}
				onImportData=${handleImportData} 
				standalone=${standalone} />
		<//>

		<${InteractiveContainer} id="form" className="quickview">
			<div class="section form">
				<${SectionHeader} title=${isUpdateBulk ? t('data.form.title.update_bulk') : formSchema?.formTitle}>
					<${ButtonToggle} icon="close" targetId="form" forceState=${false} />
				<//>
				<div class="section-content-wrapper">
					${isUpdateBulk
						? html`<${BulkUpdateSection}
							selection=${selection}
							columns=${columns}
							onFormSubmit=${handleSaveUpdate} />`
						: html`<${FormCustom}
							showTitle=${false}
							schema=${formSchema}
							onFormSubmit=${isUpdate ? handleSaveUpdate : handleCreate} />`
					}
				</div>
			</div>
		<//>
	`;
}

function FormCustom({ schema, onFormSubmit, showTitle = true })
{
	const { register, validateForm, getValues, errors } = useForm();
	const [, setTick] = useState(0);
	const [log, setLog] = useState(null);
	const handleFieldChange = () => setTick(t => t + 1);
	
	const handleSubmit = (e) => {
		e.preventDefault();
		const isValid = validateForm(schema?.fields || [], schema?.dynamicRules || []);
		if(!isValid) {
			console.log('Validation errors:', errors);
			return;
		}
		
		const payload = getValues();
		onFormSubmit(payload);
		setLog("Success");
	};

	return html`
		<form onSubmit=${handleSubmit} >
			<${FormRenderer}
				schema=${schema}
				register=${register}
				errors=${errors}
				getValues=${getValues}
				onFieldChange=${handleFieldChange}
				showTitle=${showTitle}
			/>
			<div class="form-log">${log}</div>
			<button type="submit" class="btn-primary-brand w-full">Submit</button>
		</form>
	`;
}