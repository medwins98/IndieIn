import { useEffect, useState, useCallback, useRef } from 'importmap';
import { useIDB } from 'importmap';

/**
 * Universal Data Provider
 * Modes: 'offline' (IDB) | 'api' | 'supabase' | 'sheets' | 'hybrid'
 */
export function useData(storeName, config = {}, MODE = 'offline') {
	switch (MODE) {
		case 'supabase':
			return useSupabase(storeName, config);
		case 'sheets':
			return useGoogleSheets(config);
		case 'api':
			return useAPI(config);
		case 'hybrid':
			return useHybridData(storeName, config);
		case 'offline':
		default:
			return useIDB(storeName);
	}
}

/* ==========================================================================
   SUPABASE DRIVER (Full CRUD + Real-time Sync)
   ========================================================================== */
/**
 * Helper to build composite equality matches for Supabase client & local state
 */
const getCompositeKeyFilter = (item, primaryKey) => {
	const keys = Array.isArray(primaryKey) ? primaryKey : [primaryKey];
	return keys.map((k) => ({ key: k, value: item[k] }));
};

const isSameCompositeKey = (itemA, itemB, primaryKey) => {
	const keys = Array.isArray(primaryKey) ? primaryKey : [primaryKey];
	return keys.every((k) => itemA?.[k] === itemB?.[k]);
};

export function useSupabase(tableName, {
	client,
	primaryKey = 'id',
	select = '*',
	enableRealtime = true,
	queryBuilder = null // Optional function: (query) => query.eq('status', 'active').range(0, 50)
}) {
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Normalize key config
	const keys = Array.isArray(primaryKey) ? primaryKey : [primaryKey];

	// Fetch Initial / Paginated Data
	const refresh = useCallback(async () => {
		if (!client || !tableName) {
			setLoading(false);
			return;
		}
		try {
			setLoading(true);
			let query = client.from(tableName).select(select);

			// Apply custom filters/pagination if provided
			if (typeof queryBuilder === 'function') {
				query = queryBuilder(query);
			}

			const { data: rows, error: sbError } = await query;

			if (sbError) throw sbError;
			setData(rows || []);
			setError(null);
		} catch (err) {
			console.error(`[useSupabase] Fetch error (${tableName}):`, err);
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}, [tableName, client, select, queryBuilder]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	// Real-time Subscriptions (Supports Composite Keys)
	useEffect(() => {
		if (!enableRealtime || !client || !tableName) return;

		const channel = client
			.channel(`public:${tableName}:${keys.join('_')}`)
			.on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
				const { eventType, new: newRow, old: oldRow } = payload;

				setData((prevData) => {
					if (eventType === 'INSERT') {
						const exists = prevData.some((item) => isSameCompositeKey(item, newRow, keys));
						if (exists) return prevData;
						return [newRow, ...prevData];
					}

					if (eventType === 'UPDATE') {
						return prevData.map((item) => 
							isSameCompositeKey(item, newRow, keys) ? { ...item, ...newRow } : item
						);
					}

					if (eventType === 'DELETE') {
						return prevData.filter((item) => !isSameCompositeKey(item, oldRow, keys));
					}

					return prevData;
				});
			})
			.subscribe();

		return () => {
			client.removeChannel(channel);
		};
	}, [tableName, client, enableRealtime, keys.join(',')]);

	// Add Single / Bulk
	const add = useCallback(async (item) => {
		try {
			const { data: created, error: err } = await client
				.from(tableName)
				.insert(item)
				.select();

			if (err) throw err;
			return created?.[0];
		} catch (err) {
			console.error(`[useSupabase] Add error (${tableName}):`, err);
			throw err;
		}
	}, [tableName, client]);

	// Update (Single or Composite Primary Keys)
	const update = useCallback(async (item) => {
		try {
			let query = client.from(tableName).update(item);

			// Apply equality filters for all key columns
			keys.forEach((k) => {
				if (item[k] === undefined || item[k] === null) {
					throw new Error(`Missing key field '${k}' for update on store '${tableName}'`);
				}
				query = query.eq(k, item[k]);
			});

			const { data: updated, error: err } = await query.select();

			if (err) throw err;
			return updated?.[0];
		} catch (err) {
			console.error(`[useSupabase] Update error (${tableName}):`, err);
			throw err;
		}
	}, [tableName, client, keys.join(',')]);

	// Remove (Accepts Primitive Key or Composite Object)
	const remove = useCallback(async (keyOrObject) => {
		try {
			let query = client.from(tableName).delete();

			if (typeof keyOrObject === 'object' && keyOrObject !== null) {
				keys.forEach((k) => {
					query = query.eq(k, keyOrObject[k]);
				});
			} else {
				query = query.eq(keys[0], keyOrObject);
			}

			const { error: err } = await query;
			if (err) throw err;
		} catch (err) {
			console.error(`[useSupabase] Delete error (${tableName}):`, err);
			throw err;
		}
	}, [tableName, client, keys.join(',')]);

	// Upsert (Insert or Update on Key Conflict)
	const upsert = useCallback(async (items) => {
		try {
			const payload = Array.isArray(items) ? items : [items];
			const { data: result, error: err } = await client
				.from(tableName)
				.upsert(payload, { onConflict: keys.join(',') })
				.select();

			if (err) throw err;
			return result;
		} catch (err) {
			console.error(`[useSupabase] Upsert error (${tableName}):`, err);
			throw err;
		}
	}, [tableName, client, keys.join(',')]);

	return {
		data,
		loading,
		error,
		refresh,
		add,
		update,
		upsert,
		remove
	};
}

/* ==========================================================================
   REST API DRIVER
   ========================================================================== */

/**
 * Helper to check if two items share the same primary key(s)
 */
const isSameKey = (itemA, itemB, primaryKey) => {
	const keys = Array.isArray(primaryKey) ? primaryKey : [primaryKey];
	return keys.every((k) => {
		const valA = typeof itemA === 'object' && itemA !== null ? itemA[k] : itemA;
		const valB = typeof itemB === 'object' && itemB !== null ? itemB[k] : itemB;
		return valA !== undefined && valA === valB;
	});
};

/**
 * Helper to construct REST resource URL for single or composite keys
 */
const buildResourceUrl = (baseUrl, keyOrItem, primaryKey) => {
	const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
	const keys = Array.isArray(primaryKey) ? primaryKey : [primaryKey];

	// Single key (Primitive or single field in object)
	if (keys.length === 1) {
		const key = keys[0];
		const idValue = (typeof keyOrItem === 'object' && keyOrItem !== null) ? keyOrItem[key] : keyOrItem;
		if (idValue === undefined || idValue === null) return cleanBase;
		return `${cleanBase}/${encodeURIComponent(idValue)}`;
	}

	// Composite keys (e.g., /api/inventory?store_id=JKT&product_id=P01)
	if (typeof keyOrItem === 'object' && keyOrItem !== null) {
		const queryParams = keys
			.map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(keyOrItem[k] ?? '')}`)
			.join('&');
		return `${cleanBase}?${queryParams}`;
	}

	return cleanBase;
};

export function useAPI({
	url,
	primaryKey = 'id',
	headers = { 'Content-Type': 'application/json' },
	usePatch = true // Uses PATCH for partial updates, PUT for full replacements
}) {
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const keys = Array.isArray(primaryKey) ? primaryKey : [primaryKey];

	// 1. FETCH ALL (GET)
	const refresh = useCallback(async () => {
		if (!url) {
			setLoading(false);
			return;
		}
		try {
			setLoading(true);
			const res = await fetch(url, { headers });
			if (!res.ok) throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);

			const json = await res.json();
			setData(Array.isArray(json) ? json : []);
			setError(null);
		} catch (err) {
			console.error(`[useAPI] Fetch error (${url}):`, err);
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}, [url, JSON.stringify(headers)]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	// 2. CREATE (POST)
	const add = useCallback(async (item) => {
		try {
			const res = await fetch(url, {
				method: 'POST',
				headers,
				body: JSON.stringify(item)
			});
			if (!res.ok) throw new Error(`Failed to create item (${res.status})`);

			const createdItem = await res.json();
			const finalItem = createdItem || item;

			// Optimistic state update
			setData((prev) => [...prev, finalItem]);
			return finalItem;
		} catch (err) {
			console.error(`[useAPI] Add error:`, err);
			throw err;
		}
	}, [url, headers]);

	// 3. HYBRID UPDATE (Supports `update(item)` AND `update(id, changes)`)
	const update = useCallback(async (arg1, arg2) => {
		let targetUrl = '';
		let payload = {};
		let keyMatchObj = {};

		// Pattern A: update(id, changes)
		if (arg2 !== undefined) {
			const id = arg1;
			payload = arg2;

			if (typeof id === 'object' && id !== null) {
				keyMatchObj = id; // Composite key object passed as arg1
			} else {
				keyMatchObj = { [keys[0]]: id }; // Primitive key
			}

			targetUrl = buildResourceUrl(url, keyMatchObj, keys);
		}
		// Pattern B: update(item)
		else if (typeof arg1 === 'object' && arg1 !== null) {
			payload = arg1;
			keyMatchObj = arg1;
			targetUrl = buildResourceUrl(url, arg1, keys);
		} else {
			throw new Error('Invalid arguments passed to update(). Expected update(item) or update(id, changes).');
		}

		try {
			const method = usePatch ? 'PATCH' : 'PUT';
			const res = await fetch(targetUrl, {
				method,
				headers,
				body: JSON.stringify(payload)
			});

			if (!res.ok) throw new Error(`Failed to update item (${res.status})`);

			let updatedItem = null;
			try {
				updatedItem = await res.json();
			} catch {
				// Server returned 204 No Content
			}

			// Optimistically merge changes into local UI state
			setData((prev) =>
				prev.map((existing) => {
					if (isSameKey(existing, keyMatchObj, keys)) {
						return { ...existing, ...(updatedItem || payload) };
					}
					return existing;
				})
			);

			return updatedItem || payload;
		} catch (err) {
			console.error(`[useAPI] Update error:`, err);
			throw err;
		}
	}, [url, headers, keys.join(','), usePatch]);

	// 4. DELETE (DELETE)
	const remove = useCallback(async (keyOrObject) => {
		try {
			const targetUrl = buildResourceUrl(url, keyOrObject, keys);
			const res = await fetch(targetUrl, {
				method: 'DELETE',
				headers
			});

			if (!res.ok) throw new Error(`Failed to delete item (${res.status})`);

			// Optimistically remove from state
			setData((prev) => prev.filter((item) => !isSameKey(item, keyOrObject, keys)));
		} catch (err) {
			console.error(`[useAPI] Remove error:`, err);
			throw err;
		}
	}, [url, headers, keys.join(',')]);

	// 5. BULK CREATE / UPSERT
	const bulkAdd = useCallback(async (items) => {
		try {
			const res = await fetch(`${url}/bulk`, {
				method: 'POST',
				headers,
				body: JSON.stringify(items)
			});
			if (!res.ok) throw new Error(`Failed bulk add (${res.status})`);

			await refresh();
		} catch (err) {
			console.error(`[useAPI] BulkAdd error:`, err);
			throw err;
		}
	}, [url, headers, refresh]);

	// 6. CLEAR ALL
	const clear = useCallback(async () => {
		try {
			const res = await fetch(url, {
				method: 'DELETE',
				headers
			});
			if (!res.ok) throw new Error(`Failed clear store (${res.status})`);
			setData([]);
		} catch (err) {
			console.error(`[useAPI] Clear error:`, err);
			throw err;
		}
	}, [url, headers]);

	return {
		data,
		loading,
		error,
		refresh,
		add,
		update,
		remove,
		bulkAdd,
		clear
	};
}

/* ==========================================================================
   HYBRID DRIVER (IDB + Remote Sync)
   ========================================================================== */

export function useHybridData(storeName, config = {}) {
	const idb = useIDB(storeName);
	const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
	const [syncing, setSyncing] = useState(false);
	const [syncError, setSyncError] = useState(null);

	const {
		provider = 'api', // 'api' | 'sheets' | 'supabase'
		apiUrl,
		webAppUrl,
		sheetName,
		client: supabaseClient,
		primaryKey = 'id',
		select = '*'
	} = config;

	// Track Online/Offline Status
	useEffect(() => {
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	}, []);

	// ----------------------------------------------------------------------
	// PULL / REFRESH FROM REMOTE TO IDB
	// ----------------------------------------------------------------------
	const syncWithRemote = useCallback(async () => {
		if (!isOnline || !storeName) return;

		try {
			setSyncing(true);
			let remoteData = [];

			// A. Hybrid REST
			if (provider === 'api' && apiUrl) {
				const res = await fetch(apiUrl);
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				remoteData = await res.json();
			} 
			// B. Hybrid Google Sheets
			else if (provider === 'sheets' && webAppUrl) {
				const fetchUrl = `${webAppUrl}?sheet=${encodeURIComponent(sheetName || storeName)}`;
				const res = await fetch(fetchUrl);
				if (!res.ok) throw new Error(`Google Sheets HTTP ${res.status}`);
				const json = await res.json();
				if (json.error) throw new Error(json.error);
				remoteData = json;
			} 
			// C. Hybrid Supabase
			else if (provider === 'supabase' && supabaseClient) {
				const { data: rows, error: sbError } = await supabaseClient
					.from(storeName)
					.select(select);
				if (sbError) throw sbError;
				remoteData = rows;
			}

			// Upsert remote items into local IndexedDB
			if (Array.isArray(remoteData) && remoteData.length > 0) {
				await idb.importStore(remoteData, 'json', false); // false = upsert mode
			}

			setSyncError(null);
		} catch (err) {
			console.error(`[useHybridData] Pull sync failed for ${storeName}:`, err);
			setSyncError(err.message);
		} finally {
			setSyncing(false);
		}
	}, [isOnline, storeName, provider, apiUrl, webAppUrl, sheetName, supabaseClient, select, idb.importStore]);

	useEffect(() => {
		syncWithRemote();
	}, [isOnline, storeName, provider]);

	// ----------------------------------------------------------------------
	// SUPABASE REALTIME SYNC TO IDB (WebSockets)
	// ----------------------------------------------------------------------
	useEffect(() => {
		if (provider !== 'supabase' || !supabaseClient || !isOnline || !storeName) return;

		const keys = Array.isArray(primaryKey) ? primaryKey : [primaryKey];
		const channel = supabaseClient
			.channel(`hybrid:${storeName}:${keys.join('_')}`)
			.on('postgres_changes', { event: '*', schema: 'public', table: storeName }, async (payload) => {
				const { eventType, new: newRow, old: oldRow } = payload;

				try {
					if (eventType === 'INSERT' || eventType === 'UPDATE') {
						await idb.update(newRow);
					} else if (eventType === 'DELETE') {
						const deleteKey = keys.length === 1 ? oldRow[keys[0]] : oldRow;
						await idb.remove(deleteKey);
					}
				} catch (err) {
					console.error(`[useHybridData] Realtime local sync error:`, err);
				}
			})
			.subscribe();

		return () => {
			supabaseClient.removeChannel(channel);
		};
	}, [provider, supabaseClient, isOnline, storeName, primaryKey, idb.update, idb.remove]);

	// ----------------------------------------------------------------------
	// HYBRID WRITE METHODS (Write to IDB First, then Sync Cloud)
	// ----------------------------------------------------------------------
	
	// Add / Insert Item
	const add = useCallback(async (item) => {
		// 1. Instant local write to IDB
		const key = await idb.add(item);
		
		// 2. Background push to Remote if online
		if (isOnline) {
			try {
				if (provider === 'api' && apiUrl) {
					await fetch(apiUrl, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(item)
					});
				} else if (provider === 'sheets' && webAppUrl) {
					await fetch(webAppUrl, {
						method: 'POST',
						headers: { 'Content-Type': 'text/plain;charset=utf-8' },
						body: JSON.stringify({ sheet: sheetName || storeName, action: 'append', data: item })
					});
				} else if (provider === 'supabase' && supabaseClient) {
					await supabaseClient.from(storeName).insert(item);
				}
			} catch (remoteErr) {
				console.warn(`[useHybridData] Remote background push failed. Item saved locally.`, remoteErr);
			}
		}
		return key;
	}, [idb, isOnline, provider, apiUrl, webAppUrl, sheetName, storeName, supabaseClient]);

	// Update Item
	const update = useCallback(async (item) => {
		// 1. Instant local update in IDB
		const key = await idb.update(item);

		// 2. Background update to Remote
		if (isOnline) {
			try {
				if (provider === 'api' && apiUrl) {
					const id = item[primaryKey];
					await fetch(`${apiUrl}/${id}`, {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(item)
					});
				} else if (provider === 'supabase' && supabaseClient) {
					const keys = Array.isArray(primaryKey) ? primaryKey : [primaryKey];
					let query = supabaseClient.from(storeName).update(item);
					keys.forEach(k => { query = query.eq(k, item[k]); });
					await query;
				}
			} catch (remoteErr) {
				console.warn(`[useHybridData] Remote update failed. Updated locally.`, remoteErr);
			}
		}
		return key;
	}, [idb, isOnline, provider, apiUrl, storeName, supabaseClient, primaryKey]);

	// Remove Item
	const remove = useCallback(async (keyOrObject) => {
		// 1. Instant local delete from IDB
		await idb.remove(keyOrObject);

		// 2. Background delete from Remote
		if (isOnline) {
			try {
				if (provider === 'api' && apiUrl) {
					const id = typeof keyOrObject === 'object' ? keyOrObject[primaryKey] : keyOrObject;
					await fetch(`${apiUrl}/${id}`, { method: 'DELETE' });
				} else if (provider === 'supabase' && supabaseClient) {
					const keys = Array.isArray(primaryKey) ? primaryKey : [primaryKey];
					let query = supabaseClient.from(storeName).delete();
					if (typeof keyOrObject === 'object') {
						keys.forEach(k => { query = query.eq(k, keyOrObject[k]); });
					} else {
						query = query.eq(keys[0], keyOrObject);
					}
					await query;
				}
			} catch (remoteErr) {
				console.warn(`[useHybridData] Remote delete failed. Removed locally.`, remoteErr);
			}
		}
	}, [idb, isOnline, provider, apiUrl, storeName, supabaseClient, primaryKey]);

	return {
		...idb,
		add,
		update,
		remove,
		isOnline,
		syncing,
		syncError,
		syncWithRemote
	};
}
