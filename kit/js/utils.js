const logg = (log) => console.log(JSON.stringify(log, "", 2));
const alertt = (log) => alert(JSON.stringify(log, "", 2));

function loadCSS(href) {
	return new Promise((resolve, reject) => {
		let link = document.querySelector(`link[href="${href}"]`);
		if (link) return resolve(link);

		link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = href;
		link.onload = () => resolve(link);
		link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
		document.head.appendChild(link);
	});
}

const clipboard = {
	async copy(source) {
		let text = '';
		if(typeof source === 'string') {
			// direct
			text = source;
		}
		else if(source?.value !== undefined) {
			// input and textarea
			text = source.value.substring(source.selectionStart, source.selectionEnd) || source.value;
		}
		else if(source?.innerText !== undefined) {
			// element
			text = window.getSelection().toString() || source.innerText;
		}
	
		if(navigator.clipboard?.writeText) {
			try { await navigator.clipboard.writeText(text); return true; }
			catch {}
		}
		return this.copyLegacy(text);
	},

	async pasteTo(el) {
		let text = '';
		if(navigator.clipboard?.readText) {
			try { text = await navigator.clipboard.readText(); }
			catch {}
		}
		if(!text) text = this.pasteLegacy();

		if(!el) return false;

		if(el.value !== undefined) {
			const start = el.selectionStart;
			const end = el.selectionEnd;
			el.value = el.value.slice(0, start) + text + el.value.slice(end);
			el.selectionStart = el.selectionEnd = start + text.length;
			el.dispatchEvent(new Event('input', { bubbles: true }));
		}
		else if (el.isContentEditable || el.tagName === 'DIV' || el.tagName === 'PRE') {
			el.focus();
			document.execCommand('insertText', false, text); 
		}
		return true;
	},

	async paste() {
		if(navigator.clipboard?.readText) {
			try { return await navigator.clipboard.readText(); }
			catch {}
		}
		return this.pasteLegacy();
	},

	copyLegacy(text) {
		const ta = document.createElement('textarea');
		ta.value = text;
		ta.style.position = 'fixed'; ta.style.left = '-9999px';
		document.body.appendChild(ta); ta.select();
		const ok = document.execCommand('copy');
		document.body.removeChild(ta);
		return ok;
	},
	
	pasteLegacy() {
		const ta = document.createElement('textarea');
		ta.style.position = 'fixed'; ta.style.left = '-9999px';
		document.body.appendChild(ta); ta.focus();
		document.execCommand('paste');
		const val = ta.value;
		document.body.removeChild(ta);
		return val;
	}
};

/**
 * Universal browser-compatible file downloader.
 * 
 * @param {string|Blob} content - The file content (String, Blob, or Data URI)
 * @param {string} fileName - The default file name for the download
 * @param {string} [mimeType="application/octet-stream"] - Optional MIME type for raw string content (text/plain, text/html, application/json, text/csv;charset=utf-8;)
 */
function downloadFile(content, fileName = 'Indiein.text', mimeType = "application/octet-stream") {
	// 1. Prepare Blob object
	let blob;
	if(content instanceof Blob) {
		blob = content;
	}
	else if(typeof content === "string" && content.startsWith("data:")) {
		// Convert Data URI to Blob for better browser memory management
		blob = dataURItoBlob(content);
	}
	else {
		blob = new Blob([content], { type: mimeType });
	}

	// 2. Legacy Internet Explorer (IE 10-11) and Edge Legacy support
	if(window.navigator && window.navigator.msSaveOrOpenBlob) {
		window.navigator.msSaveOrOpenBlob(blob, fileName);
		return;
	}

	// 3. Modern Browsers (HTML5 download attribute via Object URL)
	if(window.URL && typeof window.URL.createObjectURL === "function") {
		const objectUrl = window.URL.createObjectURL(blob);
		const link = document.createElement("a");
		
		link.href = objectUrl;
		link.download = fileName;
		link.style.display = "none";
		document.body.appendChild(link);
		
		link.click();
		
		// Clean up memory
		setTimeout(() => {
			document.body.removeChild(link);
			window.URL.revokeObjectURL(objectUrl);
		}, 100);
		return;
	}

	// 4. Very Old Browsers Fallback (Data URI / New Window)
	const reader = new FileReader();
	reader.onload = function (e) {
		const dataUrl = e.target.result;
		// Attempt anchor download first
		const link = document.createElement("a");
		link.href = dataUrl;
		link.download = fileName;
		link.target = "_blank";
		
		if(typeof link.download !== "undefined") {
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
		else {
			// Final fallback: open raw data stream in new tab/window
			window.open(dataUrl, "_blank");
		}
	};
	reader.readAsDataURL(blob);
}

// Helper to convert Data URIs into Blobs
function dataURItoBlob(dataURI) {
	const byteString = atob(dataURI.split(",")[1]);
	const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
	const ab = new ArrayBuffer(byteString.length);
	const ia = new Uint8Array(ab);
	
	for(let i = 0; i < byteString.length; i++) {
		ia[i] = byteString.charCodeAt(i);
	}
	return new Blob([ab], { type: mimeString });
}

/**
 * Universal function to parse CSV or JSON strings/data into a clean JS object or array.
 * 
 * @param {string|object|Array} input - CSV string, JSON string, or already-parsed JS object/array.
 * @param {string} [delimiter=','] - Column delimiter for CSV parsing (e.g., ',', ';', '\t').
 * @returns {Array|object} Parsed JavaScript object or array of objects.
 */
// CSV line parser
function parseCSVLine(line, delimiter = ',') {
	const escapedDelimiter = delimiter.replace(/[-[\]{}()*+?.:\\^$|#\s]/g, '\\$&');
	const regex = new RegExp(`(?:^|${escapedDelimiter})(?:"([^"]*(?:""[^"]*)*)"|([^"${escapedDelimiter}]*))`, 'g');
	
	const result = [];
	let entry;
	while ((entry = regex.exec(line)) !== null) {
		let val = entry[1] !== undefined ? entry[1].replace(/""/g, '"') : entry[2];
		result.push(val ? val.trim() : '');
	}
	return result;
}

function parseToJSON(input, delimiter = ',') {
	if(input == null) return null;
	if(typeof input === 'object') return input;
	if(typeof input !== 'string') return null;

	const trimmed = input.trim();
	if(!trimmed) return null;

	// 1. Try parsing JSON
	try {
		return JSON.parse(trimmed);
	}
	catch (err) {
		/* Fallthrough to CSV */
	}

	// 2. Parse CSV
	const lines = trimmed.split(/\r?\n/).filter(line => line.trim().length > 0);
	if(lines.length === 0) return [];

	const headers = parseCSVLine(lines[0], delimiter);

	return lines.slice(1).map(line => {
		const values = parseCSVLine(line, delimiter);
		return headers.reduce((acc, header, index) => {
			let val = values[index] ?? '';
			
			if(val === 'true') val = true;
			else if(val === 'false') val = false;
			else if(val !== '' && !isNaN(val)) val = Number(val);

			acc[header] = val;
			return acc;
		}, {});
	});
}

function formatText(val)
{
	return val
		.replace(/_/g, ' ') // snake_case to words
		.replace(/([A-Z])/g, ' $1') // camelCase to words
		.replace(/^./, str => str.toUpperCase()) // capitalize
		.trim();
}

function formatData(val, format)
{
	if(format === 'currency' || format === 'number') {
		return Number(val);
	}
	else if(format === 'date') {
		return new Date(val);
	}
	else {
		return String(val);
	}
}

function formatDate(timestamp, locale = 'en-US')
{
	const date = new Date(timestamp);
	const now = new Date();

	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

	const diffTime = today - msgDate;
	const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

	const time = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
	const dayName = date.toLocaleDateString(locale, { weekday: 'long' });
	const shortDate = date.toLocaleDateString(locale, { day: '2-digit', month: 'short' });
	const fullDate = date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });

	if(diffDays === 0) {
		return time;
	}
	if(diffDays === 1) {
		return (locale === 'id-ID') ? 'Kemarin' : 'Yesterday';
	}
	if(diffDays > 1 && diffDays < 7) {
		return dayName;
	}
	if(date.getFullYear() === now.getFullYear()) {
		return shortDate;
	}
	return fullDate;
}

function formatCurrency(value, locale = 'en-US', currency = 'USD', minimumFraction = 0, maximumFraction = 0)
{
	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency: currency,
		minimumFractionDigits: minimumFraction,
		maximumFractionDigits: maximumFraction
	}).format(value);
}

function applyFilters(data, filters)
{
	if(!data) return [];
	
	/*
	filters: {
		field, // data's key
		type, // format type [null || date || number]
		value, // single search
		min, // range min (for date & number)
		max // range max (for date & number)
	}
	*/

	return data.filter((currentData) => {
		return filters.every((filter) => {
			if(!filter.field || (!filter.value && !filter.min && !filter.max)) {
				return true; 
			}

			const cellValue = currentData[filter.field];
			if(cellValue === null || cellValue === undefined) return false;

			if(filter.type === null) {
				return searchGeneral(cellValue, filter.value);
			} else {
				return searchByRange(filter.type, cellValue, filter.min, filter.max);
			}
		});
	});
}

function searchGeneral(data, query)
{
	if(query.startsWith('!')) {
		const q = query.slice(1).toLowerCase();
		return !String(data)
			.toLowerCase()
			.includes(q.toLowerCase());
	}
	
	return String(data)
		.toLowerCase()
		.includes(query.toLowerCase());
}

function searchByRange(type, data, min, max)
{
	if(type === 'date')
	{
		const toTime = (v) => v ? new Date(v).getTime() : NaN;
		
		const numValue = toTime(data);
		min = min !== '' ? toTime(min) : -Infinity;
		max = max !== '' ? toTime(max) : Infinity;
		
		return numValue >= min && numValue <= max;
	}
	else
	{
		const numValue = Number(data);
		min = min !== '' ? Number(min) : -Infinity;
		max = max !== '' ? Number(max) : Infinity;
		
		return numValue >= min && numValue <= max;
	}
}

/**
 * Generic sort function for arrays of any type.
 * @param {Array} array - The data to sort.
 * @param {string|null} key - The object key to sort by (optional).
 * @param {boolean} desc - Sort in descending order? (default: false).
 */

function universalSort(array, key = null, desc = false)
{
	return [...array].sort((a, b) => {
		let valA = key ? a[key] : a;
		let valB = key ? b[key] : b;

		// Handle null/undefined (push to the end)
		if (valA == null) return 1;
		if (valB == null) return -1;

		// Logic for different types
		let result = 0;
		if(typeof valA === 'number' && typeof valB === 'number') {
			result = valA - valB;
		}
		else if(valA instanceof Date && valB instanceof Date) {
			result = valA - valB;
		}
		else {
			// Fallback for strings and booleans
			valA = valA.toString().toLowerCase();
			valB = valB.toString().toLowerCase();
			result = valA.localeCompare(valB);
		}

		return desc ? result * -1 : result;
	});
}

/**
 * Multi sorts function.
 * @param {Array} array - The data to sort.
 * @param {Array<Object>} key - The object keys and its direction ( [{ key, direction }] )
 */

function universalMultiSort(array, sorts = [])
{
	let result = [...array];
	
	for(let i = sorts.length - 1; i >= 0; i--) {
		const s = sorts[i];
		if(!s.field) continue;
		result = universalSort(result, s.field, s.direction === 'desc');
	}
	
	return result;
}

/**
 * Maps/aligns fields from a source object to the target data structure.
 */
function mapFields(sourceItem, fieldMapping = {}) {
	if(!fieldMapping || Object.keys(fieldMapping).length === 0) {
		return { ...sourceItem };
	}

	const mappedItem = {};
	for(const [sourceKey, targetKey] of Object.entries(fieldMapping)) {
		if (sourceItem.hasOwnProperty(sourceKey)) {
			mappedItem[targetKey] = sourceItem[sourceKey];
		}
	}
	return mappedItem;
}

/**
 * Generates a unique composite key string for a given record.
 * Handles single key string (e.g., 'id') or array of keys (e.g., ['tenant_id', 'user_id']).
 */
function getCompositeKey(item, primaryKey) {
	const keys = Array.isArray(primaryKey) ? primaryKey : [primaryKey];
	return keys.map(k => String(item[k] ?? '')).join('::');
}

/**
 * Main function to execute dataset sync operations with Composite Key support.
 * @param {Array<Object>} targetData - Target dataset to be updated.
 * @param {Array<Object>} sourceData - Incoming source dataset.
 * @param {Object} options - Sync configurations.
 * @param {'append'|'update'|'upsert'|'replace'|'merge'} options.mode - Sync strategy mode.
 * @param {string|Array<string>} [options.primaryKey='id'] - Single key string or array of composite keys.
 * @param {Object} [options.fieldMapping={}] - Column mapping { sourceField: targetField }.
 * @returns {Array<Object>} New array containing synchronized target dataset.
 */

function syncImportedData(targetData = [], sourceData = [], options = {})
{
	const {
		mode = 'upsert',
		primaryKey = 'id',
		fieldMapping = {}
	} = options;

	// Map fields across all source records
	const mappedSource = sourceData.map(item => mapFields(item, fieldMapping));

	// Mode Replace: Clear target data and substitute entirely with new data
	if(mode === 'replace') {
		return mappedSource.map(item => ({ ...item }));
	}

	// Mode Append: Add all new items directly without deduplication
	if(mode === 'append') {
		return [
			...targetData.map(item => ({ ...item })),
			...mappedSource.map(item => ({ ...item }))
		];
	}

	// Build a Lookup Map from target data using Composite Keys
	const targetMap = new Map();
	targetData.forEach(item => {
		const compositeKey = getCompositeKey(item, primaryKey);
		targetMap.set(compositeKey, { ...item });
	});

	switch (mode) {
		case 'update': {
			// Create quick set of incoming composite keys
			const sourceKeySet = new Set(
				mappedSource.map(src => getCompositeKey(src, primaryKey))
			);

			return targetData.map(targetItem => {
				const key = getCompositeKey(targetItem, primaryKey);
				if(sourceKeySet.has(key)) {
					const match = mappedSource.find(src => getCompositeKey(src, primaryKey) === key);
					return { ...targetItem, ...match };
				}
				return { ...targetItem };
			});
		}

		case 'upsert': {
			mappedSource.forEach(sourceItem => {
				const key = getCompositeKey(sourceItem, primaryKey);
				if(targetMap.has(key)) {
					targetMap.set(key, { ...targetMap.get(key), ...sourceItem });
				}
				else {
					targetMap.set(key, sourceItem);
				}
			});
			return Array.from(targetMap.values());
		}

		case 'merge': {
			mappedSource.forEach(sourceItem => {
				const key = getCompositeKey(sourceItem, primaryKey);
				if(targetMap.has(key)) {
					const existing = targetMap.get(key);
					const merged = { ...existing };
					
					for(const prop in sourceItem) {
						if (sourceItem[prop] !== undefined && sourceItem[prop] !== null) {
							merged[prop] = sourceItem[prop];
						}
					}
					targetMap.set(key, merged);
				}
				else {
					targetMap.set(key, sourceItem);
				}
			});
			return Array.from(targetMap.values());
		}

		default:
			throw new Error(`Unsupported mode: '${mode}'`);
	}
}

function generateUUIDv7()
{
	const value = new Uint8Array(16);
	crypto.getRandomValues(value);

	// Timestamp 48-bit (ms)
	const timestamp = BigInt(Date.now());
	value[0] = Number((timestamp >> 36n) & 0xffn);
	value[1] = Number((timestamp >> 28n) & 0xffn);
	value[2] = Number((timestamp >> 20n) & 0xffn);
	value[3] = Number((timestamp >> 12n) & 0xffn);
	value[4] = Number((timestamp >> 4n) & 0xffn);
	value[5] = Number(((timestamp & 0xfn) << 4n) | BigInt(value[5] & 0x0f));

	// Version 7 (0111) & Variant 10xx
	value[6] = (value[6] & 0x0f) | 0x70;
	value[8] = (value[8] & 0x3f) | 0x80;

	// Format hex string (8-4-4-4-12)
	const hex = Array.from(value).map(b => b.toString(16).padStart(2, '0')).join('');
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function generateReceiptNo(uniqueId = '01', receiptStr = "INV")
{
	const now = new Date();
	const ymd = now.toISOString().slice(0,10).replace(/-/g, '');
	const hms = now.toTimeString().slice(0,8).replace(/:/g, '');

	return `${receiptStr}${uniqueId}${ymd}${hms}`;
}

function generateSVGImage(text, width = 400, height = 300)
{
	const svg = `
		<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
			<rect width="100%" height="100%" fill="#eee"/>
			<text x="50%" y="50%" fill="#999" font-size="24" font-family="sans-serif" dominant-baseline="middle" text-anchor="middle">
				${text}
			</text>
		</svg>
	`;
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
