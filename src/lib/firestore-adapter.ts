export const db = { _type: 'db' };

export function getFirestore() {
  return db;
}

export function collection(dbRef: any, path: string) {
  return {
    _type: 'collection',
    path
  };
}

export function doc(collectionOrDb: any, pathOrId: string, ...more: string[]) {
  if (collectionOrDb && collectionOrDb._type === 'collection') {
    return {
      _type: 'doc',
      collectionPath: collectionOrDb.path,
      id: pathOrId,
      path: `${collectionOrDb.path}/${pathOrId}`
    };
  } else {
    // It's db Ref or raw. doc(db, 'collectionName', 'id')
    const fullPath = more.length > 0 ? `${pathOrId}/${more[0]}` : pathOrId;
    return {
      _type: 'doc',
      collectionPath: pathOrId,
      id: more[0] || pathOrId,
      path: fullPath
    };
  }
}

export function query(collectionRef: any, ...constraints: any[]) {
  return {
    _type: 'query',
    collection: collectionRef,
    constraints
  };
}

export function where(field: string, op: string, value: any) {
  return { type: 'where', field, op, value };
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
  return { type: 'orderBy', field, direction };
}

export function limit(value: number) {
  return { type: 'limit', value };
}

// Helper to make AJAX API calls to Express server
async function apiCall(method: string, url: string, body?: any) {
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.error("Firestore-adapter API call failed:", err);
    throw err;
  }
}

// Custom FieldValue implementation
class CustomFieldValue {
  _type = 'FieldValue';
  constructor(public op: string, public value: any) {}
}

export const arrayUnion = (...elements: any[]) => new CustomFieldValue('arrayUnion', elements);
export const arrayRemove = (...elements: any[]) => new CustomFieldValue('arrayRemove', elements);
export const increment = (amount: number) => new CustomFieldValue('increment', amount);

export const serverTimestamp = () => new Date().toISOString();

// To support setDoc/updateDoc/addDoc: fetch existing, resolve operators, then put/patch
async function resolveAndSave(path: string, id: string, data: any, isUpdate: boolean) {
  let existing: any = null;
  if (isUpdate) {
    try {
      existing = await apiCall('GET', `/api/db?path=${encodeURIComponent(path)}&id=${encodeURIComponent(id)}`);
    } catch {
      existing = {};
    }
  } else {
    existing = {};
  }

  const resolved = { ...existing };
  for (const k of Object.keys(data)) {
    const val = data[k];
    if (val && typeof val === 'object' && val._type === 'FieldValue') {
      const fieldVal = val as CustomFieldValue;
      if (fieldVal.op === 'arrayUnion') {
        const arr = Array.isArray(resolved[k]) ? resolved[k] : [];
        // Flatten values
        const valsToUnion = Array.isArray(fieldVal.value) ? fieldVal.value : [fieldVal.value];
        resolved[k] = [...new Set([...arr, ...valsToUnion])];
      } else if (fieldVal.op === 'arrayRemove') {
        const arr = Array.isArray(resolved[k]) ? resolved[k] : [];
        const valsToRemove = Array.isArray(fieldVal.value) ? fieldVal.value : [fieldVal.value];
        resolved[k] = arr.filter((x: any) => !valsToRemove.includes(x));
      } else if (fieldVal.op === 'increment') {
        resolved[k] = (typeof resolved[k] === 'number' ? resolved[k] : 0) + fieldVal.value;
      }
    } else {
      resolved[k] = val;
    }
  }

  // Ensure id and path matches correctly
  resolved.id = id;

  await apiCall('PUT', `/api/db?path=${encodeURIComponent(path)}&id=${encodeURIComponent(id)}`, resolved);
}

export async function addDoc(collectionRef: any, data: any) {
  const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 11);
  await resolveAndSave(collectionRef.path, id, data, false);
  return { id };
}

export async function setDoc(docRef: any, data: any, options?: any) {
  const isUpdate = options && options.merge;
  await resolveAndSave(docRef.collectionPath || docRef.path.split('/').slice(0, -1).join('/'), docRef.id, data, isUpdate);
}

export async function updateDoc(docRef: any, data: any) {
  await resolveAndSave(docRef.collectionPath || docRef.path.split('/').slice(0, -1).join('/'), docRef.id, data, true);
}

export async function deleteDoc(docRef: any) {
  const colPath = docRef.collectionPath || docRef.path.split('/').slice(0, -1).join('/');
  await apiCall('DELETE', `/api/db?path=${encodeURIComponent(colPath)}&id=${encodeURIComponent(docRef.id)}`);
}

export async function getDoc(docRef: any) {
  const colPath = docRef.collectionPath || docRef.path.split('/').slice(0, -1).join('/');
  try {
    const data = await apiCall('GET', `/api/db?path=${encodeURIComponent(colPath)}&id=${encodeURIComponent(docRef.id)}`);
    return {
      exists: () => true,
      id: docRef.id,
      data: () => data
    };
  } catch {
    return {
      exists: () => false,
      id: docRef.id,
      data: () => null
    };
  }
}

// Full query resolution and filtering logic locally on client
export async function getDocs(queryOrCollection: any) {
  const queryRef = queryOrCollection && queryOrCollection._type === 'query' 
    ? queryOrCollection 
    : { collection: queryOrCollection, constraints: [] };
    
  const colPath = queryRef.collection.path;

  let docs: any[] = [];
  try {
    docs = await apiCall('GET', `/api/db?path=${encodeURIComponent(colPath)}`);
  } catch (err) {
    console.warn("adapter could not find collection or hit network error:", err);
  }

  let filtered = [...docs];

  for (const constraint of queryRef.constraints || []) {
    if (constraint.type === 'where') {
      const { field, op, value } = constraint;
      if (op === '==') {
        filtered = filtered.filter(doc => doc && doc[field] === value);
      } else if (op === '!=') {
        filtered = filtered.filter(doc => doc && doc[field] !== value);
      } else if (op === '>=') {
        filtered = filtered.filter(doc => doc && doc[field] >= value);
      } else if (op === '<=') {
        filtered = filtered.filter(doc => doc && doc[field] <= value);
      } else if (op === 'in') {
        const setVal = new Set(Array.isArray(value) ? value : []);
        filtered = filtered.filter(doc => doc && setVal.has(doc[field]));
      }
    }
  }

  for (const constraint of queryRef.constraints || []) {
    if (constraint.type === 'orderBy') {
      const { field, direction } = constraint;
      filtered.sort((a, b) => {
        if (!a || !b) return 0;
        const valA = a[field];
        const valB = b[field];
        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        
        let comparison = 0;
        if (typeof valA === 'string' && typeof valB === 'string') {
          comparison = valA.localeCompare(valB);
        } else {
          comparison = valA < valB ? -1 : 1;
        }
        return direction === 'asc' ? comparison : -comparison;
      });
    }
  }

  for (const constraint of queryRef.constraints || []) {
    if (constraint.type === 'limit') {
      filtered = filtered.slice(0, constraint.value);
    }
  }

  return {
    empty: filtered.length === 0,
    size: filtered.length,
    docs: filtered.map(item => ({
      id: item.id,
      data: () => item
    }))
  };
}

export function onSnapshot(queryOrCollection: any, onNext: (snap: any) => void, onError?: (err: any) => void) {
  let active = true;
  let lastHash = '';

  const runPoll = async () => {
    if (!active) return;
    try {
      const snap = await getDocs(queryOrCollection);
      const hash = JSON.stringify(snap.docs.map(d => d.data()));
      if (hash !== lastHash && active) {
        lastHash = hash;
        onNext(snap);
      }
    } catch (err) {
      if (onError && active) {
        onError(err);
      }
    }
    if (active) {
      setTimeout(runPoll, 1500);
    }
  };

  runPoll();

  return () => {
    active = false;
  };
}
