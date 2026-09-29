import { html, useState, useEffect, useCallback, useRef } from 'importmap';

export const Fragment = (props) => props.children;

export function Conditional({ val, children })
{
	if(!children) return null;
	
	if(!Array.isArray(children)) {
		return (val) ? children : null;
	}
	
	return val ? children[0] : children[1]
}

export function SectionHeader({ title = "Title", subtitle = null, children })
{
	return html`
		<div class="section-header">
			<div>
				<div class="section-title">${title}</div>
				${subtitle && html`<span class="section-subtitle">${subtitle}</span>`}
			</div>
			${children && html`<div class="section-action">${children}</div>`}
		</div>`;
}

export function NavSidebar({ list = null, Link, translate = (val) => val })
{
	if(!Array.isArray(list)) return null;

	return html`
		<nav class="section sidebar">
			<ul class="section-content-wrapper nav-list">
				${list.map(l => html`<${NavSidebarList} list=${l} Link=${Link} translate=${translate} />`)}
			</ul>
		</nav>`;
}

function NavSidebarList({ list = null, Link, translate = (val) => val })
{
	if(!list.child) {
		return html`
			<li class="nav-item">
				<${Link} href=${list.href} class="nav-link">${translate(list.label)}<//>
			</li>`
	}
	else {
		return html`
			<li class="nav-item">
				<details>
					<summary>${translate(list.label)} <span className="arrow">▼</span></summary>
					<ul class="nav-sub-list">
						${list?.child.map(l => html`
							<li class="nav-item">
								<${Link} href=${l.href}>${translate(l.label)}<//>
							</li>
						`)}
					</ul>
				</details>
			</li>
		`
	}
}

export function DropdownMenu({ children })
{
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const isArray = Array.isArray(children);

	// Dropdown close on outside click
	useEffect(() => {
		const handleDocumentClick = () => setIsMenuOpen(false);
		document.addEventListener('click', handleDocumentClick);
		return () => document.removeEventListener('click', handleDocumentClick);
	}, []);

	(isArray ? children[0] : children).props.onClick = useCallback((e) => {
		e.stopPropagation();
		setIsMenuOpen(prev => !prev);
	}, []);

	children[1].props.children.forEach(child => child.props.class += ' menu-dropdown-item');

	return html`
		<div class="menu-dropdown-container ${isMenuOpen ? 'is-active' : ''}">
			${isArray ? children[0] : children}
			<div class="menu-dropdown-wrapper">
				${children[1]}
			</div>
		</div>`;
}

export function TabComponent({ list = [], selected = list[0], onChange = null, baseClass = "btn-primary", activeClass="active btn-secondary-brand", children, withContent = false, className, ...attributes })
{
	const [activeTab, setActiveTab] = useState(selected);

	useEffect(() => { setActiveTab(selected) }, [selected]);
	useEffect(() => { onChange && onChange(activeTab) }, [activeTab, onChange]);

	return html`
		<div class="tab-container ${className}" ...${attributes}>
			${list.map((item, i) => html`
				<button
					key=${item}
					onClick=${() => setActiveTab(item)}
					class="btn ${activeTab === item ? activeClass : baseClass}"
					type="button" >

					${children ? children[0].props.children[i] : item}
				</button>
			`)}
		</div>
		<${TabContent} selected=${list.indexOf(activeTab)}>
			${withContent && children[1]}
		<//>`;
}

function TabContent({ children, selected })
{
	if(!children) return null;
	const outerProps = { ...children.props };
	const innerList = outerProps.children;
	delete outerProps.children;
	const selectedInner = Array.isArray(innerList) ? innerList[selected] : innerList;
	
	return html`<${children.type} ...${outerProps}>${selectedInner}<//>`;
}

export function ImageWrapper({ imgSrc = null, imgText = "No Image", imgClass = '', statusIndicator = null, labelText = null, children, className = '', ...attributes })
{
	return html`
		<div class="img-wrapper ${className}" ...${attributes}>
			<img src=${imgSrc ? imgSrc : generateSVGImage(imgText, 160, 160)} class="img ${imgClass}" />
			${statusIndicator ? html`<span class="status-indicator ${statusIndicator}"></span>` : null}
			${labelText ? html`<span class="img-label">${labelText}</span>` : null}
			${children}
		</div>`;
}

export function ListItem({ children, className, ...attributes })
{
	let prefix = null
	let suffix = null
	let content = null

	const childs = Array.isArray(children) ? children : [children]

	childs.forEach(c => {
		if(!c || !c.type) return
		if(c.type === ListItemPrefix) prefix = c
		else if(c.type === ListItemSuffix) suffix = c
		else if(c.type === ListItemContent) content = c
	})

	return html`
		<div class="list-item-container ${className} ${attributes.onClick ? 'clickable' : ''}" ...${attributes}>
			${prefix}
			${content}
			${suffix}
		</div>
	`
}

export function ListItemContent({ title = 'Title', description = null, badgeText = null, badgeClass = '', metaInfo = null, className = '', children, ...attributes })
{
	return html`
		<div class="flex-column list-item-content ${className}" ...${attributes}>
			<div class="flex-split list-item-header">
				<div class="title">
					${title}
					${badgeText && html` <${Badge} className=${badgeClass} text=${badgeText} />`}
				</div>
				${metaInfo && html`<span class="meta">${metaInfo}</span>`}
			</div>
			${description && html`<p class="description">${description}</p>`}
			${children}
		</div>`;
}

export function ListItemPrefix({ children, className, ...attributes })
{
	return html`
		<div class="list-item-addon ${className}" ...${attributes}>
			${children}
		</div>`
}

export function ListItemSuffix({ children, className, ...attributes })
{
	return html`
		<div class="flex-split list-item-addon ${className}" ...${attributes}>
			${children}
		</div>`
}

export function Badge({ className, text, children, ...attributes})
{
	return html`
		<sup class="badge ${className}" ...${attributes}>
			${text}
			${children}
		</sup>`;
}

export function ReportBar({ title = "Title", description = null, barWidth = 0 })
{
	return html`
		<div class="report-bar">
			<div class="flex-split">
				<div class="fw5 title">${title}</div>
				<div class="fw5 description">${description}</div>
			</div>
			
			<div class="bar-container">
				<div class="bar-fill" style="width:${barWidth};"></div>
			</div>
		</div>`;
}

export function CodeQR({ rawCode = null, qrisInfo })
{
	const refQR = useRef(null);
	const { name, city, nmid } = qrisInfo || {};

	useEffect(() => {
		if(refQR.current) {
			refQR.current.innerHTML = '';
			try {
				new QRCode(refQR.current, {
					text: rawCode,
					width: 240,
					height: 240,
					correctLevel: QRCode.CorrectLevel.M
				});
			}
			catch {
				console.error("QRCode (3rd party) not loaded");
			}
		}
	}, [rawCode]);
	
	return html`
		${name ? html`<div class="text-center text-lg fw7 mb1">${name}</div>` : null}
		<div ref=${refQR} class="qrcode" style="width:240px;margin:auto;"></div>
	`;
}

export function DraggableItem({ items, setItems, renderItem, getKey = (item) => item.id, handleClass = "drag-handle" })
{
	const [draggingKey, setDraggingKey] = useState(null);
	const [dragOverKey, setDragOverKey] = useState(null);
	const dragItem = useRef(null);

	const handleSort = (fromIndex, toIndex) => {
		if(fromIndex === toIndex) return;
		setItems(prev => {
			const newItems = [...prev];
			const [dragged] = newItems.splice(fromIndex, 1);
			newItems.splice(toIndex, 0, dragged);
			return newItems;
		});
	};

	const getIndexByKey = (key) => items.findIndex(i => getKey(i) === key);

	// Mouse props go on the whole row
	const rowProps = (item) => {
		const key = getKey(item);
		return {
			draggable: true,
			'data-key': key,
			onDragStart: (e) => {
				dragItem.current = key;
				setDraggingKey(key);
				e.dataTransfer.effectAllowed = 'move';
			},
			onDragOver: (e) => {
				e.preventDefault();
				setDragOverKey(key);
			},
			onDragLeave: () => setDragOverKey(null),
			onDrop: (e) => {
				e.preventDefault();
				if(dragItem.current!== null) {
					handleSort(getIndexByKey(dragItem.current), getIndexByKey(key));
				}
			},
			onDragEnd: () => {
				dragItem.current = null;
				setDraggingKey(null);
				setDragOverKey(null);
			},
			className: [
				'draggable-row',
				draggingKey === key && 'is-dragging',
				dragOverKey === key && 'drag-over'
			].filter(Boolean).join(' ')
		}
	};

	// Touch props go only on the handle
	const handleProps = (item) => {
		const key = getKey(item);
		return {
			className: handleClass,
			onTouchStart: () => {
				dragItem.current = key;
				setDraggingKey(key);
			},
			onTouchMove: (e) => {
				e.preventDefault();
				const touch = e.touches[0];
				const el = document.elementFromPoint(touch.clientX, touch.clientY);
				const overKey = el?.closest('.draggable-row')?.dataset.key;
				if(overKey) setDragOverKey(overKey);
			},
			onTouchEnd: (e) => {
				const touch = e.changedTouches[0];
				const el = document.elementFromPoint(touch.clientX, touch.clientY);
				const dropKey = el?.closest('.draggable-row')?.dataset.key;
				if(dropKey && dragItem.current!== null) {
					handleSort(getIndexByKey(dragItem.current), getIndexByKey(dropKey));
				}
				dragItem.current = null;
				setDraggingKey(null);
				setDragOverKey(null);
			}
		}
	};

	return html`
		<div class="draggable-container flex-column gap05">
			${items.map(item => renderItem(item, { rowProps: rowProps(item), handleProps: handleProps(item) }))}
		</div>`;
}

export function Code({ data })
{
	const elRef = useRef(null);
	const elInputRef = useRef(null);

	return html`
		<div class="code-container">
			<div class="code-header flex-split first-fill">
				<input ref=${elInputRef} type="text" placeholder="Title / Filename" value="Indiein.txt" style="border: none; font-weight: 600" aria-label="Set title or filename"/>
				<div class="code-actions flex-split gap025">
					<button class="btn btn-icon" type="button" onClick=${() => downloadFile(elRef.current.innerText, elInputRef.current.value, 'application/json')}	data-tooltip="Save to file" aria-label="Save to file">
						<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
					</button>
					<button class="btn btn-icon" type="button" onClick=${() => clipboard.pasteTo(elRef.current)} data-tooltip="Paste from clipboard" aria-label="Paste from clipboard">
						<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
					</button>
					<button class="btn btn-icon" type="button" onClick=${() => clipboard.copy(elRef.current)} data-tooltip="Copy to clipboard" aria-label="Copy to clipboard">
						<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
					</button>
				</div>
			</div>
			<pre ref=${elRef} class="code-content" contentEditable="true">${JSON.stringify(data, "", 2)}</pre>
		</div>`;
}

/**
 * TableContainer Component
 * Table wrapper rendering multi-select header checkboxes, dynamic columns, and row items.
 */
export function TableContainer({
	data,
	columns,
	isEditable = true,
	isDeletable = true,
	onUpdate,
	onDelete,
	isSelectMode = false,
	selectedIds = new Set(),
	onToggleAll,
	onToggleRow
})
{
	if ((!data || !Array.isArray(data) || data.length === 0)
	|| (!columns || !Array.isArray(columns) || columns.length === 0)) return null;

	const selectAllRef = useRef(null);
	const isAllSelected = data.length > 0 && selectedIds.size === data.length;
	const isSomeSelected = selectedIds.size > 0 &&!isAllSelected;

	useEffect(() => {
		if(selectAllRef.current) selectAllRef.current.indeterminate = isSomeSelected;
	}, [isSomeSelected]);

	return html`
		<div class="table-container primary-match">
			<table>
				<thead>
					<tr>
						${isSelectMode && html`
							<th class="secondary-match" style="width: 40px; text-align: center;">
								<input
									ref=${selectAllRef}
									type="checkbox"
									checked=${isAllSelected}
									onChange=${onToggleAll}
								/>
							</th>
						`}
						
						${columns.map(item => html`
							<th id=${item?.id || item.label} class="secondary-match">
								${item.label}
							</th>`
						)}
						
						${(isEditable || isDeletable) && html`
							<th class="secondary-match" style="width: 100px; text-align: center;">
								Action
							</th>
						`}
					</tr>
				</thead>
				<tbody>
					${data.map((item, index) => {
						const rowKey = item?.id ?? index;
						const isSelected = selectedIds.has(rowKey);
						return html`
							<${TableRowBody} 
								key=${rowKey} 
								rowId=${rowKey}
								data=${item} 
								columns=${columns} 
								dataIndex=${index} 
								isSelectMode=${isSelectMode}
								isSelected=${isSelected}
								onToggle=${onToggleRow} >
								
								${(isEditable || isDeletable) && html`
									<td class="text-center">
										<div class="flex gap025">
											${isEditable && html`
												<button
													type="button"
													class="btn btn-icon btn-primary"
													onClick=${() => onUpdate(rowKey)}
													aria-label="Edit" >
													<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
												</button>
											`}
											${isDeletable && html`
												<button 
													type="button" 
													class="btn btn-icon btn-primary"
													onClick=${() => onDelete(rowKey)}
													aria-label="Delete">
													<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
												</button>
											`}
										</div>
									</td>
								`}
							<//>
					`})}
				</tbody>
			</table>
		</div>`;
}

/**
 * TableRowBody Component
 * Renders individual table rows, applies row formatting, checkbox controls, and action column children.
 */
export function TableRowBody({ data, columns, dataIndex, rowId, isSelectMode, isSelected, onToggle, children })
{
	const formatCellValue = (val, format = null) =>
	{
		if(val === null || val === undefined || val === '') {
			if(format !== 'currency' && format !== 'number') {
				return '';
			}
			val = 0;
		}
		if(val instanceof Date || format === 'date') {
			val = format === 'date' ? new Date(val) : val;
			return String(val.toLocaleDateString());
		}
		if(Array.isArray(val)) return String(val);
		if(val instanceof Object) return String(val);
		
		if(format === 'currency') {
			val = parseFloat(val.toString().replace(/\./g, '')) || 0;
			val = formatCurrency(val, USER_SETTINGS_GENERAL?.locale, USER_SETTINGS_GENERAL?.currencyStyle);
		}
		
		return val;
	};
	
	return html`
		<tr class=${isSelected ? 'selected-row' : ''}>
			${isSelectMode && html`
				<td style="text-align: center;">
					<input
						type="checkbox"
						checked=${isSelected}
						onChange=${() => onToggle(rowId)}
						aria-label="Select row"
					/>
				</td>
			`}
			${columns.map(item => html`<td>${formatCellValue(data[item.id], item?.format)}</td>`)}
			${children}
		</tr>`;
}
