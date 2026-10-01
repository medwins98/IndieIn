/* Preact Core */ import { html, useEffect, useState, useCallback, useMemo } from 'importmap';
/* UI */ import { InteractiveContainer, ButtonToggle, BtnIcon } from 'importmap';
/* Reusable */ import { Fragment, TableContainer, DropdownMenu } from 'importmap';
/* I18n */ import { useI18n } from 'importmap';
/* DataApp */ import { FiltersSection } from 'importmap';

export function DataView({ 
	data = null, 
	columns = null, 
	setColumns, 
	selection, 
	setSelection, 
	onExport, 
	onDelete, 
	isEditable = true, 
	isDeletable = true, 
	isCreatable = true, 
	children, 
	title = 'Data Playground'
})
{
	const { t } = useI18n();
	const [filteredData, setFilteredData] = useState([]);
	const [isSelectMode, setIsSelectMode] = useState(false);

	const formattedData = useMemo(() => {
		if(!Array.isArray(data)) return [];
		return data.map((row) => {
			const formattedRow = {};
			(columns || []).forEach((col) => {
				formattedRow[col.id] = typeof formatData === 'function' ? formatData(row[col.id], col.format) : row[col.id];
			});
			return formattedRow;
		});
	}, [data, columns]);

	const filterData = useCallback((filters, sorts) => {
		let result = typeof applyFilters === 'function' ? applyFilters(formattedData, filters) : formattedData;
		if(typeof universalMultiSort === 'function') {
			result = universalMultiSort(result, sorts);
		}
		setFilteredData(result);
	}, [formattedData]);

	const filteredColumns = useMemo(() => (columns || []).filter(item => (item.visible && !item?.hidden)), [columns]);

	const handleToggleSelectMode = useCallback(() => {
		setIsSelectMode(prev => {
			const next = !prev;
			if(!next) {
				setSelection(s => ({ ...s, ids: new Set(), id: null, action: null }));
			}
			return next;
		});
	}, [setSelection]);

	const toggleAll = useCallback(() => {
		setSelection(s => ({
		 	...s,
			ids: s.ids.size === filteredData.length
				? new Set()
				: new Set(filteredData.map((d) => d.id)),
			action: null
		}));
	}, [filteredData, setSelection]);

	const toggleRow = useCallback((id) => {
		setSelection(s => {
			const next = new Set(s.ids);
			next.has(id)? next.delete(id) : next.add(id);
			return { ...s, ids: next, action: null };
		});
	}, [setSelection]);
	
	const handleCreate = useCallback(() => {
		setSelection(s => ({ ...s, action: 'create' }));
	}, [setSelection]);

	const handleUpdate = useCallback((id) => {
		setSelection({ id, ids: new Set(), action: 'update' });
	}, [setSelection]);

	const handleBulkUpdate = useCallback(() => {
		if(!selection.ids.size) return;
		setSelection(s => ({ ...s, id: null, action: 'updateBulk' }));
	}, [selection.ids.size, setSelection]);

	const confirmDelete = useCallback(async (idOrSet) => {
		const source = idOrSet;
		const idsSet = source instanceof Set ? source : new Set([source]);

		if(!idsSet.size || idsSet.has(undefined)) return;

		const msg = idsSet.size > 1 ? t('confirm_delete_bulk') : t('confirm_delete');
		if(!confirm(msg)) return;

		await onDelete(idsSet);
	}, [onDelete, t]);

	return html`
		<main class="flex-column gap1 pxy">
			<div class="flex-split">
				<div class="section-title text-ellipsis">${title}</div>
				<${ActionBar}
					isSelectMode=${isSelectMode}
					onToggleSelectMode=${handleToggleSelectMode}
					selectedCount=${selection.ids.size}
					onCreate=${handleCreate}
					onUpdate=${handleBulkUpdate}
					onDelete=${() => confirmDelete(selection.ids)}
					onExport=${(format) => onExport(format, filteredData)}
					showExport=${data && data.length > 0}
					showFilter=${data && data.length > 0}
					showSelect=${filteredData.length > 0}
					showCreate=${columns && columns.length > 0 && isCreatable}
				/>
			</div>

			<${InteractiveContainer} id="import" className="widget quickview" keepMounted=${true}>
				${children}
			<//>

			<${InteractiveContainer} id="filter" className="widget quickview" keepMounted=${true}>
				<${FiltersSection}
					columns=${columns}
					options=${filteredColumns}
					setColumns=${setColumns}
					onFilter=${filterData} />
			<//>

			${(!Array.isArray(filteredData) || filteredData.length === 0) && html`<div class="empty-state">${t('no_records')}</div>`}
			
			<${TableContainer} 
				data=${filteredData}
				columns=${filteredColumns}
				isSelectMode=${isSelectMode}
				selectedIds=${selection.ids}
				onToggleAll=${toggleAll}
				onToggleRow=${toggleRow}
				isEditable=${isEditable}
				isDeletable=${isDeletable}
				onUpdate=${handleUpdate}
				onDelete=${confirmDelete}
			/>
		</main>`;
}

function ActionBar({ isSelectMode, onToggleSelectMode, selectedCount, onCreate, onUpdate, onDelete, onExport, showSelect = false, showExport = true, showImport = true, showFilter = true, showCreate = true })
{
	const { t } = useI18n();

	return html`
		<div class="flex-split gap05">

			${isSelectMode && selectedCount > 0 && html`
				<${BtnIcon} 
					icon="edit" 
					onClick=${onUpdate} 
					className="btn-secondary" 
					data-tooltip=${t('edit')} >
					
					<span class="btn-text hide-text">${t('edit')} (${selectedCount})</span>
				<//>
				<${BtnIcon} 
					icon="delete" 
					className="btn-secondary btn-danger" 
					onClick=${onDelete} 
					data-tooltip=${t('delete')} >
					
					<span class="btn-text hide-text">${t('delete')} (${selectedCount})</span>
				<//>
			`}

			${showSelect && html`
				<${BtnIcon} 
					icon=${isSelectMode ? "close" : "copy"} 
					className="btn-secondary" 
					onClick=${onToggleSelectMode} 
					data-tooltip=${isSelectMode ? t('cancel') : t('select')} >
					
					<span class="btn-text hide-text">${isSelectMode ? t('cancel') : t('select')}</span>
				<//>`
			}

			${showExport && html`
				<${DropdownMenu} >
					<${BtnIcon} icon="export" className="btn-secondary" data-tooltip=${t('export')} >
						<span class="btn-text hide-text">${t('export')}</span>
					<//>
					<${Fragment}>
						<button onClick=${() => onExport('json')} type="button">JSON</button>
						<button onClick=${() => onExport('sheet')} type="button">Excel</button>
					<//>
				<//>
			`}

			${showImport && html`
				<${ButtonToggle}
					targetId="import"
					icon="import"
					className="btn-secondary"
					data-tooltip=${t('import')} >
					
					<span class="btn-text hide-text">${t('import')}</span>
				<//>
			`}

			${showFilter && html`
				<${ButtonToggle}
					targetId="filter"
					icon="filter"
					className="btn-secondary"
					data-tooltip=${t('filters')} >
					
					<span class="btn-text hide-text">${t('filters')}</span>
				<//>
			`}

			${showCreate && html`
				<${BtnIcon}
					icon="plus"
					onClick=${onCreate}
					className="btn-primary-brand"
					data-tooltip=${t('add')} >
					
					<span class="btn-text hide-text">${t('add')}</span>
				<//>`
			}
		</div>`;
}