import { openDB, deleteDB as idbDeleteDB } from 'importmap';
import { useEffect, useState, useCallback, useRef } from 'importmap';
//import { downloadFile, convertToCSV, parseCSV, convertToExcelXML } from './utils.js';

let dbPromise = null;
let dbInitError = null;
const listeners = new Map();

// Multi-Tab Sync via BroadcastChannel
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('db_sync_channel') : null;

const hasDataChanged = (prev, next) => {
	if (!prev || !next) return true;
	if (prev.length !== next.length) return true;
	for (let i = 0; i < prev.length; i++) {
		if (prev[i] !== next[i] && JSON.stringify(prev[i]) !== JSON.stringify(next[i])) {
			return true;
		}
	}
	return false;
};

const emit = (storeName, data, notifyOtherTabs = true) => {
	if (!storeName) return;

	listeners.get(storeName)?.forEach(({ setData, prevDataRef }) => {
		try {
			if (hasDataChanged(prevDataRef.current, data)) {
				prevDataRef.current = data;
				setData([...data]);
			}
		} catch (err) {
			console.error(`Error updating subscriber state for store ${storeName}:`, err);
		}
	});

	if (notifyOtherTabs && channel) {
		try {
			channel.postMessage({ type: 'STORE_UPDATED', storeName });
		} catch (err) {
			console.error(`BroadcastChannel failed for store ${storeName}:`, err);
		}
	}
};

if (channel) {
	channel.onmessage = async (event) => {
		if (event.data?.type === 'STORE_UPDATED') {
			const storeName = event.data.storeName;
			if (storeName && listeners.has(storeName) && listeners.get(storeName).size > 0) {
				try {
					if (dbInitError) return;
					const db = await dbPromise;
					if (!db) return;
					const items = await db.getAll(storeName);
					emit(storeName, items || [], false);
				} catch (err) {
					console.error(`Multi-tab sync error [${storeName}]:`, err);
				}
			}
		}
	};
}

const handleStorageError = (err, actionName) => {
	if (err?.name === 'QuotaExceededError') {
		console.error(`[IndexedDB Quota Exceeded] Storage capacity full while executing: ${actionName}.`, err);
	} else {
		console.error(`Failed to execute ${actionName}:`, err);
	}
};

const initDB = (name, version, stores, migrations = {}) => {
	if (dbInitError) return Promise.reject(dbInitError);
	if (dbPromise) return dbPromise;

	dbPromise = openDB(name, version, {
		upgrade(db, oldVersion, newVersion, transaction) {
			stores.forEach((store) => {
				const storeName = typeof store === 'string' ? store : store.name;
				const keyPath = store.keyPath || 'id';
				const autoIncrement = store.autoIncrement ?? true;

				let objectStore;
				if (!db.objectStoreNames.contains(storeName)) {
					objectStore = db.createObjectStore(storeName, { keyPath, autoIncrement });
				} else {
					objectStore = transaction.objectStore(storeName);
				}

				store.indexes?.forEach(idx => {
					if (!objectStore.indexNames.contains(idx.name)) {
						objectStore.createIndex(idx.name, idx.keyPath || idx.name, { unique: idx.unique || false });
					}
				});
			});

			for (let v = oldVersion + 1; v <= newVersion; v++) {
				if (typeof migrations[v] === 'function') {
					try {
						migrations[v](db, transaction, {
							deleteStore: (sName) => db.objectStoreNames.contains(sName) && db.deleteObjectStore(sName),
							deleteIndex: (sName, idxName) => {
								if (db.objectStoreNames.contains(sName)) {
									const st = transaction.objectStore(sName);
									if (st.indexNames.contains(idxName)) st.deleteIndex(idxName);
								}
							}
						});
					} catch (migErr) {
						console.error(`Error applying migration version ${v}:`, migErr);
					}
				}
			}
		},
		blocking(currentVersion, blockedVersion, event) {
			const targetDb = event?.target?.result;
			if (targetDb && typeof targetDb.close === 'function') {
				targetDb.close();
			}
			dbPromise = null;
			window.location.reload();
		}
	});

	dbPromise.then(db => {
		db.onversionchange = () => {
			db.close();
			dbPromise = null;
		};
	}).catch(err => {
		console.error('Failed to initialize IndexedDB:', err);
		dbInitError = err;
		dbPromise = null;
	});

	return dbPromise;
};

export const setupDB = (config) => initDB(config.name, config.version, config.stores, config.migrations);

export const deleteDatabase = async (dbName) => {
	try {
		if (dbPromise) {
			const db = await dbPromise;
			if (db && db.name === dbName) {
				db.close();
				dbPromise = null;
			}
		}
		if (typeof idbDeleteDB === 'function') {
			await idbDeleteDB(dbName);
		} else {
			await new Promise((resolve, reject) => {
				const req = indexedDB.deleteDatabase(dbName);
				req.onsuccess = () => resolve(true);
				req.onerror = (e) => reject(e.target.error);
				req.onblocked = () => console.warn(`Delete DB ${dbName} blocked`);
			});
		}
		return true;
	} catch (err) {
		console.error(`Failed to delete database ${dbName}:`, err);
		throw err;
	}
};

export const getDBInfo = async () => {
	try {
		if (dbInitError) throw dbInitError;
		const db = await dbPromise;
		if (!db) throw new Error('Database is not initialized');

		return {
			db,
			name: db.name,
			version: db.version,
			stores: Array.from(db.objectStoreNames)
		};
	} catch (err) {
		console.error('Failed to get database info:', err);
		throw err;
	}
};

export const getAllDatabasesAndStores = async (setter = (val) => val) => {
	try {
		if (typeof indexedDB === 'undefined' || typeof indexedDB.databases !== 'function') {
			throw new Error('indexedDB.databases() API is not supported in this environment.');
		}

		const dbs = await indexedDB.databases();

		const result = await Promise.all(
			dbs.map(async (dbInfo) => {
				if (!dbInfo.name) return null;

				return new Promise((resolve) => {
					const req = indexedDB.open(dbInfo.name);

					req.onsuccess = (event) => {
						const db = event.target.result;
						const stores = Array.from(db.objectStoreNames);
						db.close();

						resolve({
							name: db.name,
							version: db.version,
							stores
						});
					};

					req.onerror = () => {
						resolve({
							name: dbInfo.name,
							version: dbInfo.version,
							stores: [],
							error: req.error
						});
					};

					req.onblocked = () => {
						resolve({
							name: dbInfo.name,
							version: dbInfo.version,
							stores: [],
							error: 'Database connection blocked'
						});
					};
				});
			})
		);

		setter(result);
		return result.filter(Boolean);
	} catch (err) {
		console.error('Failed to fetch all databases and stores:', err);
		throw err;
	}
};

export const inspectStoreSchema = async (storeName) => {
	try {
		if (!storeName) throw new Error('storeName argument is required');
		if (dbInitError) throw dbInitError;
		const db = await dbPromise;
		if (!db) throw new Error('Database is not initialized');

		const tx = db.transaction(storeName, 'readonly');
		const store = tx.store;

		const indexes = Array.from(store.indexNames).map((idxName) => {
			const idx = store.index(idxName);
			return {
				name: idx.name,
				keyPath: idx.keyPath,
				unique: idx.unique,
				multiEntry: idx.multiEntry
			};
		});

		return {
			storeName: store.name,
			keyPath: store.keyPath,
			autoIncrement: store.autoIncrement,
			indexes
		};
	} catch (err) {
		console.error(`Failed to inspect schema for store "${storeName}":`, err);
		throw err;
	}
};

export function useIDB(storeName) {
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(true);
	
	const fetchSequenceRef = useRef(0);
	const prevDataRef = useRef([]);

	const refresh = useCallback(async () => {
		if (!storeName) {
			setLoading(false);
			return;
		}

		const currentSeq = ++fetchSequenceRef.current;
		try {
			if (dbInitError) {
				setLoading(false);
				return;
			}
			const db = await dbPromise;
			if (!db) {
				setLoading(false);
				return;
			}
			const items = await db.getAll(storeName);
			
			if (currentSeq !== fetchSequenceRef.current) return;
			
			emit(storeName, items || []);
		} catch (err) {
			console.error(`Critical: Failed to fetch store ${storeName}:`, err);
		} finally {
			if (currentSeq === fetchSequenceRef.current) {
				setLoading(false);
			}
		}
	}, [storeName]);

	useEffect(() => {
		if (!storeName) {
			setLoading(false);
			return;
		}

		const listenerObj = { setData, prevDataRef };

		if (!listeners.has(storeName)) {
			listeners.set(storeName, new Set());
		}
		listeners.get(storeName).add(listenerObj);

		refresh();

		return () => {
			const storeListeners = listeners.get(storeName);
			if (storeListeners) {
				storeListeners.delete(listenerObj);
				if (storeListeners.size === 0) {
					listeners.delete(storeName);
				}
			}
		};
	}, [storeName, refresh]);

	const getDB = useCallback(async () => {
		return await getDBInfo();
	}, []);

	const getAllDBs = useCallback(async () => {
		return await getAllDatabasesAndStores();
	}, []);

	const deleteCurrentDB = useCallback(async (dbName) => {
		return await deleteDatabase(dbName);
	}, []);

	const inspectSchema = useCallback(async () => {
		if (!storeName) throw new Error('storeName is not specified');
		return await inspectStoreSchema(storeName);
	}, [storeName]);

	const getByKey = useCallback(async (key) => {
		try {
			if (!storeName || dbInitError) return null;
			const db = await dbPromise;
			if (!db) return null;
			const item = await db.get(storeName, key);
			return item || null;
		} catch (err) {
			console.error(`Failed getByKey on ${storeName} for key ${key}:`, err);
			return null;
		}
	}, [storeName]);
	
	const getByIndex = useCallback(async (indexName, query, direction = 'next') => {
		try {
			if (!storeName || dbInitError) return [];
			const db = await dbPromise;
			if (!db) return [];
			const tx = db.transaction(storeName, 'readonly');
			const index = tx.store.index(indexName);

			if (direction === 'prev' || direction === 'prevunique') {
				const items = [];
				let cursor = await index.openCursor(query, direction);
				while (cursor) {
					items.push(cursor.value);
					cursor = await cursor.continue();
				}
				await tx.done;
				return items;
			}

			const items = await index.getAll(query);
			await tx.done;
			return items || [];
		} catch (err) {
			console.error(`Failed getByIndex ${storeName}.${indexName}:`, err);
			return [];
		}
	}, [storeName]);

	const getOneByIndex = useCallback(async (indexName, query) => {
		try {
			if (!storeName || dbInitError) return null;
			const db = await dbPromise;
			if (!db) return null;
			const tx = db.transaction(storeName, 'readonly');
			const index = tx.store.index(indexName);
			const item = await index.get(query);
			await tx.done;
			return item || null;
		} catch (err) {
			console.error(`Failed getOneByIndex ${storeName}.${indexName}:`, err);
			return null;
		}
	}, [storeName]);

	const getByCompoundIndex = useCallback(async (indexName, queryKeys) => {
		try {
			if (!storeName || dbInitError) return [];
			const db = await dbPromise;
			if (!db) return [];
			if (!Array.isArray(queryKeys)) {
				throw new Error('queryKeys for compound index must be an array');
			}
			const tx = db.transaction(storeName, 'readonly');
			const index = tx.store.index(indexName);
			const items = await index.getAll(queryKeys);
			await tx.done;
			return items || [];
		} catch (err) {
			console.error(`Failed getByCompoundIndex ${storeName}.${indexName}:`, err);
			return [];
		}
	}, [storeName]);

	const getByRange = useCallback(async (indexName, lowerBound, upperBound, openLower = false, openUpper = false, direction = 'next') => {
		try {
			if (!storeName || dbInitError) return [];
			const db = await dbPromise;
			if (!db) return [];

			let range = null;
			if (lowerBound !== undefined && upperBound !== undefined) {
				range = IDBKeyRange.bound(lowerBound, upperBound, openLower, openUpper);
			} else if (lowerBound !== undefined) {
				range = IDBKeyRange.lowerBound(lowerBound, openLower);
			} else if (upperBound !== undefined) {
				range = IDBKeyRange.upperBound(upperBound, openUpper);
			}

			const tx = db.transaction(storeName, 'readonly');
			const target = indexName ? tx.store.index(indexName) : tx.store;

			if (direction === 'prev' || direction === 'prevunique') {
				const items = [];
				let cursor = await target.openCursor(range, direction);
				while (cursor) {
					items.push(cursor.value);
					cursor = await cursor.continue();
				}
				await tx.done;
				return items;
			}

			const items = await target.getAll(range);
			await tx.done;
			return items || [];
		} catch (err) {
			console.error(`Failed getByRange on ${storeName}:`, err);
			return [];
		}
	}, [storeName]);

	const getPaginated = useCallback(async ({ 
		page = 1, 
		pageSize = 20, 
		lastKey = null, 
		indexName = null, 
		query = null, 
		direction = 'next' 
	}) => {
		try {
			if (!storeName || dbInitError) return { items: [], total: 0, hasMore: false, lastKey: null };
			const db = await dbPromise;
			if (!db) return { items: [], total: 0, hasMore: false, lastKey: null };

			const tx = db.transaction(storeName, 'readonly');
			const target = indexName ? tx.store.index(indexName) : tx.store;
			
			let cursorRange = query;

			if (lastKey !== null && typeof IDBKeyRange !== 'undefined') {
				cursorRange = direction === 'next' || direction === 'nextunique'
					? IDBKeyRange.lowerBound(lastKey, true)
					: IDBKeyRange.upperBound(lastKey, true);
			}

			let cursor = await target.openCursor(cursorRange, direction);
			
			if (lastKey === null && page > 1 && cursor) {
				const offset = (page - 1) * pageSize;
				cursor = await cursor.advance(offset);
			}

			const items = [];
			let newLastKey = null;

			while (cursor && items.length < pageSize) {
				items.push(cursor.value);
				newLastKey = cursor.key;
				cursor = await cursor.continue();
			}

			const total = await target.count(query);
			await tx.done;

			return {
				items,
				total,
				page,
				pageSize,
				lastKey: newLastKey,
				hasMore: cursor !== null
			};
		} catch (err) {
			console.error(`Failed getPaginated on ${storeName}:`, err);
			return { items: [], total: 0, hasMore: false, lastKey: null };
		}
	}, [storeName]);

	const count = useCallback(async (query = null) => {
		try {
			if (!storeName || dbInitError) return 0;
			const db = await dbPromise;
			if (!db) return 0;
			return await db.count(storeName, query);
		} catch (err) {
			console.error(`Failed count on ${storeName}:`, err);
			return 0;
		}
	}, [storeName]);
	
	const add = useCallback(async (item) => {
		try {
			if (!storeName) throw new Error('storeName is not specified');
			if (dbInitError) throw dbInitError;
			const db = await dbPromise;
			if (!db) throw new Error('Database is not initialized');
			const key = await db.add(storeName, item);
			await refresh();
			return key;
		} catch (err) {
			handleStorageError(err, `add item to ${storeName}`);
			throw err;
		}
	}, [storeName, refresh]);

	const update = useCallback(async (item) => {
		try {
			if (!storeName) throw new Error('storeName is not specified');
			if (dbInitError) throw dbInitError;
			const db = await dbPromise;
			if (!db) throw new Error('Database is not initialized');
			const key = await db.put(storeName, item);
			await refresh();
			return key;
		} catch (err) {
			handleStorageError(err, `update item in ${storeName}`);
			throw err;
		}
	}, [storeName, refresh]);

	const remove = useCallback(async (key) => {
		try {
			if (!storeName) throw new Error('storeName is not specified');
			if (dbInitError) throw dbInitError;
			const db = await dbPromise;
			if (!db) throw new Error('Database is not initialized');
			await db.delete(storeName, key);
			await refresh();
		} catch (err) {
			console.error(`Failed to delete key ${key} from ${storeName}:`, err);
			throw err;
		}
	}, [storeName, refresh]);

	const clear = useCallback(async () => {
		try {
			if (!storeName) throw new Error('storeName is not specified');
			if (dbInitError) throw dbInitError;
			const db = await dbPromise;
			if (!db) throw new Error('Database is not initialized');
			await db.clear(storeName);
			await refresh();
		} catch (err) {
			console.error(`Failed to clear store ${storeName}:`, err);
			throw err;
		}
	}, [storeName, refresh]);

	const bulkAdd = useCallback(async (items) => {
		try {
			if (!storeName) throw new Error('storeName is not specified');
			if (dbInitError) throw dbInitError;
			const db = await dbPromise;
			if (!db) throw new Error('Database is not initialized');
			
			const tx = db.transaction(storeName, 'readwrite');
			for (const item of items) {
				tx.store.add(item);
			}
			await tx.done;
			await refresh();
		} catch (err) {
			handleStorageError(err, `bulk add items to ${storeName}`);
			throw err;
		}
	}, [storeName, refresh]);

	const bulkRemove = useCallback(async (keys) => {
		try {
			if (!storeName) throw new Error('storeName is not specified');
			if (dbInitError) throw dbInitError;
			const db = await dbPromise;
			if (!db) throw new Error('Database is not initialized');

			const tx = db.transaction(storeName, 'readwrite');
			for (const key of keys) {
				tx.store.delete(key);
			}
			await tx.done;
			await refresh();
		} catch (err) {
			console.error(`Failed bulkRemove on ${storeName}:`, err);
			throw err;
		}
	}, [storeName, refresh]);

	const runTransaction = useCallback(async (storeNames, mode = 'readwrite', callback) => {
		const targetStores = Array.isArray(storeNames) ? storeNames : [storeNames];
		try {
			if (dbInitError) throw dbInitError;
			const db = await dbPromise;
			if (!db) throw new Error('Database is not initialized');

			const tx = db.transaction(targetStores, mode);
			const result = await callback(tx);
			await tx.done;

			if (mode === 'readwrite') {
				for (const name of targetStores) {
					if (listeners.has(name) && listeners.get(name).size > 0) {
						const items = await db.getAll(name);
						emit(name, items || [], true);
					}
				}
			}

			return result;
		} catch (err) {
			handleStorageError(err, `transaction for stores [${targetStores.join(', ')}]`);
			throw err;
		}
	}, []);

	const exportStore = useCallback(async (format = 'json', fileName = `${storeName}_export`) => {
		try {
			if (!storeName) throw new Error('storeName is not specified');
			const db = await dbPromise;
			if (!db) throw new Error('Database is not initialized');

			const items = await db.getAll(storeName);
			if (!items || !items.length) {
				console.warn(`Store ${storeName} is empty, nothing to export.`);
				return;
			}

			const fmt = format.toLowerCase();
			if (fmt === 'json') {
				const jsonStr = JSON.stringify(items, null, 2);
				downloadFile(jsonStr, `${fileName}.json`, 'application/json');
			} else if (fmt === 'csv') {
				const csvStr = convertToCSV(items);
				downloadFile(csvStr, `${fileName}.csv`, 'text/csv;charset=utf-8;');
			} else if (fmt === 'excel' || fmt === 'xls') {
				const xmlStr = convertToExcelXML(items, storeName);
				downloadFile(xmlStr, `${fileName}.xls`, 'application/vnd.ms-excel');
			} else {
				throw new Error(`Format "${format}" is not supported.`);
			}
		} catch (err) {
			console.error(`Failed to export store ${storeName}:`, err);
			throw err;
		}
	}, [storeName]);

	const importStore = useCallback(async (content, format = 'json', overwrite = false) => {
		try {
			if (!storeName) throw new Error('storeName is not specified');
			const db = await dbPromise;
			if (!db) throw new Error('Database is not initialized');

			let parsedItems = [];
			const fmt = format.toLowerCase();

			if (fmt === 'json') {
				parsedItems = typeof content === 'string' ? JSON.parse(content) : content;
			} else if (fmt === 'csv') {
				parsedItems = parseCSV(content);
			} else {
				throw new Error(`Import format "${format}" is not supported. Use "json" or "csv".`);
			}

			if (!Array.isArray(parsedItems)) {
				throw new Error('Import data must be an array of objects.');
			}

			const tx = db.transaction(storeName, 'readwrite');
			if (overwrite) {
				tx.store.clear();
			}

			for (const item of parsedItems) {
				tx.store.put(item);
			}
			await tx.done;
			await refresh();

			return parsedItems.length;
		} catch (err) {
			console.error(`Failed to import store ${storeName}:`, err);
			throw err;
		}
	}, [storeName, refresh]);

	return { 
		data, 
		loading, 
		getDB,
		getAllDBs,
		deleteCurrentDB,
		inspectSchema,
		getByKey,
		getByIndex, 
		getOneByIndex, 
		getByCompoundIndex, 
		getByRange,
		getPaginated,
		count,
		add, 
		update, 
		remove, 
		clear, 
		bulkAdd, 
		bulkRemove,
		runTransaction, 
		exportStore,
		importStore,
		refresh 
	};
}