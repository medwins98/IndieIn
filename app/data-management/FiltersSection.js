import { html, useState, useEffect, useMemo } from 'importmap';
import { BtnIcon, ButtonToggle } from 'importmap';
import { Fragment, SectionHeader, TabComponent, DropdownMenu, DraggableItem, Code } from 'importmap';
import { FormFieldSelect } from 'importmap';
import { useI18n } from 'importmap';

const generateFilter = () => ({
	id: Date.now() + Math.random(),
	field: '',
	type: null,
	value: '',
	min: '',
	max: ''
});

const generateSort = () => ({
	id: Date.now() + Math.random(),
	field: '',
	direction: 'asc'
});

const createNewFilter = (isSort) => isSort ? generateSort() : generateFilter();

const TABS_TABLE_CONTROL = ['search', 'sort', 'columns', 'dx'];
const SORT_OPTIONS = [
	{ value: 'asc', label: 'A-Z' },
	{ value: 'desc', label: 'Z-A' }
];

export function FiltersSection({ columns = [], options, setColumns, onFilter })
{
	const { t } = useI18n();
	const [filters, setFilters] = useState([generateFilter()]);
	const [sorts, setSorts] = useState([generateSort()]);

	useEffect(() => { onFilter(filters, sorts) }, [filters, sorts, onFilter]);

	const filteredColumns = useMemo(() => columns.filter(item => !item?.hidden), [columns]);
	const filterCount = filters.filter(f => f.field !== '').length;
	const sortCount = sorts.filter(s => s.field !== '').length;
	const columnCount = filteredColumns.filter(c => c.visible).length;

	return html`
		<section class="section">
			<${SectionHeader} title=${t('data.search_and_filters')}>
				<${ButtonToggle} targetId="filter" icon="close" class="btn btn-icon" data-tooltip=${t('close')} />
			<//>
			<div class="section-content-wrapper flex-column gap1">
				<${TabComponent} list=${TABS_TABLE_CONTROL} className="full" withContent=${true}>
					<${Fragment}>
						<span>${t('data.search_by')} (${filterCount})</span>
						<span>${t('data.sort_by')} (${sortCount})</span>
						<span>${t('data.columns')} (${columnCount})</span>
						<span>Schema (JSON)</span>
					<//>
					<div className="flex-column px gap0875 mb1">
						<${FilterManager} filters=${filters} onChange=${setFilters} selectOptions=${options} />
						<${FilterManager} filters=${sorts} onChange=${setSorts} selectOptions=${options} isSort=${true} />
						<${ColumnManager} columns=${filteredColumns} setColumns=${setColumns} />
						<${Code} data=${columns} />
					</div>
				<//>
			</div>
		</section>
	`;
}

function FilterManager({ filters, selectOptions = [], onChange, isSort = false })
{
	if(!filters) return null;
	const { t } = useI18n();

	const handleAddFilter = () => {
		onChange([...filters, createNewFilter(isSort)]);
	};

	const handleRemoveFilter = (id) => {
		if(filters.length === 1) return;
		onChange(filters.filter(item => item.id !== id));
	};

	const handleUpdateFilter = (id, key, value) => {
		onChange(filters.map(item => {
			if(item.id === id) {
				return { ...item, [key]: value };
			}
			return item;
		}));
	};

	return html`
		${filters.map((filter, index) => html`
			<fieldset key=${filter.id} aria-label="${isSort ? t('data.sort') : t('data.filter')} ${index + 1}">
				<div class="flex-split mb05">
					<legend class="form-label">
						${isSort ? t('data.sort') : t('data.filter')} ${index + 1}
 					</legend>
 					${!isSort && html`
						<div class="radio-group">
							<label class="radio-label">
								<input type="radio" name="type-${filter.id}" value="date" checked=${filter.type === "date"} onChange=${(e) => handleUpdateFilter(filter.id, 'type', e.target.value)} />
								${t('data.type_date')}
							</label>
							<label class="radio-label">
								<input type="radio" name="type-${filter.id}" value="number" checked=${filter.type === "number"} onChange=${(e) => handleUpdateFilter(filter.id, 'type', e.target.value)} />
								${t('data.type_number')}
							</label>
							<label class="radio-label">
								<input type="radio" name="type-${filter.id}" value="" checked=${!filter.type} onChange=${(e) => handleUpdateFilter(filter.id, 'type', e.target.value)} />
								${t('data.type_basic')}
							</label>
						</div>
					`}
				</div>
				
				<div class="input-group joined flex-nowrap">
					<${FormFieldSelect}
						options=${selectOptions}
						value=${filter.field}
						onChange=${(e) => handleUpdateFilter(filter.id, 'field', e.target.value)}
						aria-label="Select field" >
						
						<option value="" disabled=${true}>${t('data.select_column_placeholder')}</option>
					<//>
					
					${isSort && html`
						<${FormFieldSelect}
							options=${SORT_OPTIONS}
							value=${filter.direction}
							onChange=${(e) => handleUpdateFilter(filter.id, 'direction', e.target.value)}
							aria-label="Select sort direction">
						<//>
					`}
					
					${isSort ? '' : (!filter.type)
							? html`
								<input
									type="search"
									placeholder=${t('data.search_placeholder')}
									value=${filter.value}
									onInput=${(e) => handleUpdateFilter(filter.id, 'value', e.target.value)}
									aria-label="Search field"
								/>`
							: html`
								<input
									type=${filter.type === 'date' ? 'datetime-local' : 'number'}
									placeholder=${t('data.min_placeholder')}
									value=${filter.min}
									onInput=${(e) => handleUpdateFilter(filter.id, 'min', e.target.value)}
									aria-label="Set min range"
								/>
								<input
									type=${filter.type === 'date' ? 'datetime-local' : 'number'}
									placeholder=${t('data.max_placeholder')}
									value=${filter.max}
									onInput=${(e) => handleUpdateFilter(filter.id, 'max', e.target.value)}
									aria-label="Set max range"
								/>`
					}
					
					${filters.length > 1 && html`<${BtnIcon} icon="delete" className="danger" onClick=${() => handleRemoveFilter(filter.id)} />`}
				</div>
			</fieldset>
		`)}

		<button type="button" class="btn-secondary-brand" onClick=${handleAddFilter}>
			${isSort ? t('data.add_sort') : t('data.add_filter')}
		</button>
	`;
}

function ColumnManager({ columns = [], setColumns })
{
	const { t } = useI18n();
	const [query, setQuery] = useState('');

	const toggle = (id) => setColumns(cols => cols.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
	const setAll = (val) => setColumns(cols => cols.map(c => ({ ...c, visible: val })));
	const changeLabel = (id, val) => setColumns(cols => cols.map(c => c.id === id ? { ...c, label: val } : c));
	const changeFormat = (id, format) => setColumns(cols => cols.map(c => c.id === id ? { ...c, format: format } : c));

	const renderColumn = (col, { rowProps, handleProps }) => {
		const matches = typeof searchGeneral === 'function' ? searchGeneral(col.label, query) : col.label.toLowerCase().includes(query.toLowerCase());
		if(!matches) return null;

		return html`
			<div key=${col.id} ...${rowProps} class="draggable-row flex-split gap025 mb025">
				<input 
					type="checkbox" 
					checked=${col.visible} 
					onChange=${() => toggle(col.id)} 
					style="flex-shrink: 0;"
					aria-label=${col.label} />
				
				<div class="input-group" style="flex: 1 1 auto; min-width: 0;">
					<input 
						type="text" 
						placeholder=${t('data.label_placeholder')} 
						value=${col.label} 
						onChange=${(e) => changeLabel(col.id, e.target.value)}
						aria-label=${t('data.label_placeholder')} />
				</div>
	
				<div class="flex gap025" style="align-items: center; flex-shrink: 0;">
					<${BtnIcon} icon="sortUp" onClick=${() => move(col.id, -1)} data-tooltip=${t('data.tooltip_move_up')} />
					<${BtnIcon} icon="sortDown" onClick=${() => move(col.id, 1)} data-tooltip=${t('data.tooltip_move_down')} />
					<${DropdownMenu}>
						<${BtnIcon} icon="formatWand" className="btn-icon" data-tooltip=${t('data.tooltip_format')} aria-label="Format data" />
						<${Fragment}>
							<button type="button" class="menu-item ${!col?.format ? 'active' : ''}" onClick=${() => changeFormat(col.id, null)}>${t('data.format_text')}</button>
							<button type="button" class="menu-item ${col?.format === 'date' ? 'active' : ''}" onClick=${() => changeFormat(col.id, "date")}>${t('data.format_date')}</button>
							<button type="button" class="menu-item ${col?.format === 'number' ? 'active' : ''}" onClick=${() => changeFormat(col.id, "number")}>${t('data.format_number')}</button>
							<button type="button" class="menu-item ${col?.format === 'currency' ? 'active' : ''}" onClick=${() => changeFormat(col.id, "currency")}>${t('data.format_currency')}</button>
						<//>
					<//>
					<${BtnIcon} icon="draggable" ...${handleProps} className="drag-handle" data-tooltip=${t('data.tooltip_drag')}/>
				</div>
			</div>
		`;
	};

	const move = (id, dir) => {
		setColumns(prev => {
			const index = prev.findIndex(c => c.id === id);
			const target = (index + dir + prev.length) % prev.length;
			const newCols = [...prev];
			[newCols[target], newCols[index]] = [newCols[index], newCols[target]];
			return newCols;
		});
	};

	return html`
		<div class="form-field-group mb0">
			<label for="search-column" class="form-label">${t('data.search_column')}</label>
			<input type="search" id="search-column" name="search-column" placeholder=${t('data.search_placeholder')} value=${query} onInput=${e => setQuery(e.target.value)} aria-label="${t('data.search_column')}" />
		</div>
		
		<div class="flex-split first-fill gap05 w-full">
			<span class="text-muted">${t('data.visible_counter', { visible: columns.filter(c => c.visible).length, total: columns.length })}</span>
			<button type="button" class="btn-primary" onClick=${() => setAll(false)}>${t('data.hide_all')}</button>
			<button type="button" class="btn-primary" onClick=${() => setAll(true)}>${t('data.show_all')}</button>
		</div>
		
		<${DraggableItem} items=${columns} setItems=${setColumns} renderItem=${renderColumn} getKey=${c => c.id} />
	`;
}