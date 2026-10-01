/* Preact Core */ import { html, useState, useCallback, useMemo } from 'importmap';
/* UI */ import { ButtonToggle } from 'importmap';
/* Form */ import { FormFieldSelect } from 'importmap';
/* Reusable */ import { Fragment, SectionHeader, TabComponent } from 'importmap';
/* I18n */ import { useI18n } from 'importmap';
import * as XLSX from 'importmap';

export function ImportSection({ targetColumns = [], onImportData })
{
	const { t } = useI18n();
	const [tab, setTab] = useState(0);
	const [syncMode, setSyncMode] = useState('upsert');
	const [primaryKey, setPrimaryKey] = useState('id');

	const [parsedData, setParsedData] = useState(null);
	const [fieldMapping, setFieldMapping] = useState({});

	const sourceTabList = ['File', 'Clipboard (JSON/CSV)', 'Fetch (API)'];

	const sourceKeys = useMemo(() => {
		if(!parsedData) return [];
		const firstRow = Array.isArray(parsedData) ? parsedData[0] : parsedData;
		return firstRow && typeof firstRow === 'object' ? Object.keys(firstRow) : [];
	}, [parsedData]);

	const handleSourceParse = useCallback(async (e) =>
	{
		e.preventDefault();
		const formData = Object.fromEntries(new FormData(e.target));
		let result = null;

		const parseHelper = typeof parseToJSON === 'function' ? parseToJSON : (data) => typeof data === 'string' ? JSON.parse(data) : data;

		if(tab === 0 && formData?.file) {
			const file = e.target.file?.files[0];
			if(!file) return;
		
			const fileType = file.name.split('.').pop().toLowerCase();
		
			if(fileType === 'json') {
				const text = await file.text();
				result = parseHelper(text);
			}
			else {
				try {
					const arrayBuffer = await file.arrayBuffer();
					const workbook = XLSX.read(arrayBuffer, { type: 'array' });
					const sheetName = workbook.SheetNames[0];
					const worksheet = workbook.Sheets[sheetName];
					const rawSheetData = XLSX.utils.sheet_to_json(worksheet);
					result = parseHelper(rawSheetData);
				}
				catch(err) {
					console.warn('Failed reading spreadsheet file:', err);
				}
			}
		}
		else if(tab === 1 && formData?.clipboard) {
			result = parseHelper(formData.clipboard);
		}
		else if(tab === 2 && formData?.api_url) {
			try {
				const res = await fetch(formData.api_url);
				const json = await res.json();
				result = parseHelper(json);
			}
			catch (err) {
				alert('Failed to fetch data from API');
			}
		}

		if(result) {
			setParsedData(result);
		}
		else {
			alert('Failed to parse input data. Ensure format is valid JSON or CSV.');
		}
	}, [tab]);

	const handleFinalSubmit = useCallback(() => {
		if(!parsedData) return;
		const items = Array.isArray(parsedData) ? parsedData : [parsedData];

		onImportData && onImportData({
			items,
			mode: syncMode,
			primaryKey: primaryKey || 'id',
			fieldMapping
		});
		alert(`Successfully imported and synchronized ${items.length} records.`);

		setParsedData(null);
		setFieldMapping({});
	}, [parsedData, fieldMapping, syncMode, primaryKey, onImportData]);

	return html`
		<section class="section">
			<${SectionHeader} title=${t('import')}>
				<${ButtonToggle} targetId="import" icon="close" data-tooltip=${t('close')} />
			<//>
			
			<div class="section-content-wrapper flex-column gap1">
				<form class="form-basic mb1" onSubmit=${(e) => handleSourceParse(e)}>
					<${TabComponent}
						list=${sourceTabList}
						onChange=${(tabVal) => setTab(sourceTabList.indexOf(tabVal))}
						className="full"
						withContent=${true} >
	
						<${Fragment}>
							<span>${t('file')}</span>
							<span>${t('clipboard')} (JSON/CSV)</span>
							<span>${t('fetch')}</span>
						<//>
						
						<div className="px mt1">
							<div class="form-field-group">
								<label class="form-label" for="file">Upload File</label>
								<input type="file" name="file" accept=".json,.csv,.txt,.xlsx,.xls" />
							</div>
	
							<div class="form-field-group">
								<label class="form-label" for="clipboard">JSON / CSV</label>
								<textarea name="clipboard" placeholder="[\n\t{\n\t\t'id': 1,\n\t\t'name': 'Sample'\n\t}\n]"></textarea>
							</div>
	
							<div class="form-field-group">
								<label class="form-label" for="api_url">API Endpoint URL</label>
								<input type="url" name="api_url" placeholder="https://api.example.com/data" />
							</div>
						</div>
					<//>
	
					<div class="px">
						<button type="submit" class="btn-secondary-brand w-full">
							${t('parse')}
						</button>
					</div>
				</form>

				${parsedData && html`
					<div class="flex-column gap1 px pt1" style="border-top: 1px solid var(--border-color, #eee);">
						<div class="flex gap05">
							<div class="form-field-group" style="flex:1;">
								<label class="form-label" for="importMode">${t('data.import_mode')}</label>
								<select class="form-control" value=${syncMode} onChange=${e => setSyncMode(e.target.value)} name="importMode">
									<option value="upsert">${t('data.upsert')}</option>
									<option value="append">${t('data.append')}</option>
									<option value="update">${t('data.update')}</option>
									<option value="replace">${t('data.replace')}</option>
									<option value="merge">${t('data.merge_fields')}</option>
								</select>
							</div>
							<div class="form-field-group" style="flex:1;">
								<label class="form-label" for="primaryKey">Primary Key</label>
								<input type="text" class="form-control" value=${primaryKey} onInput=${e => setPrimaryKey(e.target.value)} placeholder="e.g. id" name="primaryKey"/>
							</div>
						</div>

						<${FieldMappingManager}
							sourceKeys=${sourceKeys}
							targetColumns=${targetColumns}
							mapping=${fieldMapping}
							setMapping=${setFieldMapping}
						/>

						<button type="button" class="btn-primary-brand w-full mb1" onClick=${handleFinalSubmit}>${t('import')}
						</button>
					</div>
				`}
			</div>
		</section>
	`;
}

function FieldMappingManager({ sourceKeys = [], targetColumns = [], mapping = {}, setMapping })
{
	const { t } = useI18n();

	const handleMapChange = (sourceKey, targetKey) => {
		setMapping(prev => {
			const next = { ...prev };
			if(!targetKey) {
				delete next[sourceKey];
			}
			else {
				next[sourceKey] = targetKey;
			}
			return next;
		});
	};

	const autoMap = () => {
		const newMap = {};
		sourceKeys.forEach(src => {
			const match = targetColumns.find(col => 
				col.id.toLowerCase() === src.toLowerCase() || 
				col.label.toLowerCase() === src.toLowerCase()
			);
			if(match) newMap[src] = match.id;
		});
		setMapping(newMap);
	};

	const targetOptions = useMemo(() => {
		return [
			{ value: '', label: t('data.skip_map') },
			...targetColumns.map(col => ({ value: col.id, label: `${col.label} (${col.id})` }))
		];
	}, [targetColumns, t]);

	return html`
		<div class="flex-column gap05">
			<div class="flex-split gap05 mb05">
				<span class="form-label mb0">Field Mapping (${Object.keys(mapping).length}/${sourceKeys.length} Mapped)</span>
				<button type="button" class="btn-secondary" onClick=${autoMap}>Auto Map Keys</button>
			</div>

			<div class="flex-column gap025">
				${sourceKeys.map(sourceKey => {
					const mappedTarget = mapping[sourceKey] || '';
					return html`
						<div key=${sourceKey} class="draggable-row flex-split gap05">
							<div class="import-source-key text-ellipsis fw5" style="flex: 1">
								${sourceKey}
							</div>
							<div style="flex-shrink: 0; padding: 0 4px;">➔</div>
							<div class="import-target-select" style="flex: 1.2;">
								<${FormFieldSelect}
									options=${targetOptions}
									value=${mappedTarget}
									onChange=${(e) => handleMapChange(sourceKey, e.target.value)}
									aria-label="Map ${sourceKey} to target field"
								/>
							</div>
						</div>
					`;
				})}
			</div>
		</div>
	`;
}