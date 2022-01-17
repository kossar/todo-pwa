import { openDB } from "./index.js";
// define alias to sw that is more correct (in TS) what sw actually is inside service worker
const sw = self;
const CVersion = "v1/";
const CApiBaseUrl = "https://taltech.akaver.com/api/" + CVersion;
const CLogin = CApiBaseUrl + "Account/Login";
const CRegister = CApiBaseUrl + "Account/Register";
const CTodoCategories = CApiBaseUrl + "TodoCategories/";
const CTodoPriorities = CApiBaseUrl + "TodoPriorities/";
const CTodoTasks = CApiBaseUrl + "TodoTasks/";
const VERSION = 12;
const CACHE = "cache_" + VERSION;
const openCategoryDb = async () => {
    var result = await openDB('cateogory-db', VERSION, {
        upgrade(db) {
            if (db.objectStoreNames.contains('items')) {
                db.deleteObjectStore('items');
            }
            const store = db.createObjectStore('items', { keyPath: 'id' });
            store.createIndex('by-categoryName', 'categoryName');
            console.log('Category DB updated to version: ' + VERSION);
        }
    });
    return result;
};
const openPriorityDb = async () => {
    var result = await openDB('priority-db', VERSION, {
        upgrade(db) {
            if (db.objectStoreNames.contains('items')) {
                db.deleteObjectStore('items');
            }
            const store = db.createObjectStore('items', { keyPath: 'id' });
            store.createIndex('by-priorityName', 'priorityName');
            console.log('Priority DB updated to version: ' + VERSION);
        }
    });
    return result;
};
const openTaskDb = async () => {
    var result = await openDB('task-db', VERSION, {
        upgrade(db) {
            if (db.objectStoreNames.contains('items')) {
                db.deleteObjectStore('items');
            }
            const store = db.createObjectStore('items', { keyPath: 'id' });
            store.createIndex('by-taskName', 'taskName');
            console.log('Task DB updated to version: ' + VERSION);
        }
    });
    return result;
};
const syncLocalDb = async (request, response) => {
    if (request.method == "GET" && !request.url.includes('id')) {
        if (request.url == CTodoCategories) {
            const db = await openCategoryDb();
            var data = (await response.json());
            data.forEach(async (item) => {
                await db.put('items', item);
            });
            return;
        }
        else if (request.url == CTodoPriorities) {
            const db = await openPriorityDb();
            var dataP = (await response.json());
            dataP.forEach(async (item) => {
                await db.put('items', item);
            });
            return;
        }
        else if (request.url == CTodoTasks) {
            const db = await openTaskDb();
            var dataT = (await response.json());
            dataT.forEach(async (item) => {
                await db.put('items', item);
            });
            return;
        }
    }
};
const PREFETCH = [
    './css/materialize.css',
    './css/materialize.min.css',
    './css/style.css',
    './js/init.js',
    './js/materialize.js',
    './js/materialize.min.js',
];
const installFn = async (event) => {
    try {
        const cache = await caches.open(CACHE);
        console.log('Starting prefetch', cache);
        return await cache.addAll(PREFETCH);
    }
    catch (error) {
        console.error("Error in cache orefetch", error);
        return Promise.reject(error);
    }
};
const activateFn = async (event) => {
    const cacheKeyList = await caches.keys();
    cacheKeyList.map(async (cacheKey) => {
        if (cacheKey != CACHE) {
            console.warn('Deleting from cache: ' + cacheKey);
            await caches.delete(cacheKey);
        }
    });
};
const getCachedResponse = async (request, cache) => {
    const cachedResponse = await cache.match(request);
    console.log('Cache response', cachedResponse);
    if (cachedResponse != undefined)
        return cachedResponse;
    return new Response(undefined, { status: 500, statusText: "Not found in cache!" });
};
const fetchFn = async (event) => {
    const cache = await caches.open(CACHE);
    console.log('fetchFn ' + event.request.method + ':' + event.request.url);
    if (event.request.method !== 'GET') {
        const response = await fetch(event.request);
        await syncLocalDb(event.request, response.clone());
        return response;
    }
    if (navigator.onLine) {
        try {
            // get fresh copy from net 
            const response = await fetch(event.request);
            await syncLocalDb(event.request, response.clone());
            // save it to cache (make a clone!)
            cache.put(event.request, response.clone());
            // return fresh data
            return response;
        }
        catch (error) {
            console.warn('Fetch failed, trying cache', error);
            const cachedResponse = await getCachedResponse(event.request, cache);
            return cachedResponse;
        }
    }
    else {
        console.warn('navigator.onLine', navigator.onLine);
        //TODO: ??? Get stuff from db
        const cachedResponse = await getCachedResponse(event.request, cache);
        return cachedResponse;
    }
};
// ============================ SERVICE WORKER ====================================
sw.addEventListener('install', (event) => {
    console.log('sw install ' + CACHE, event);
    // waitUntil parameter is a Promise, not an function, that returnss a Promise
    event.waitUntil(installFn(event));
    console.log('Install done');
});
sw.addEventListener('activate', (event) => {
    console.log('sw activate ' + CACHE, event);
    // Delete all keys/data from cache not currently ours
    event.waitUntil(activateFn(event));
});
sw.addEventListener('fetch', (event) => {
    console.log('sw fetch ' + CACHE, event);
    event.respondWith(fetchFn(event));
});
self.addEventListener('message', ((event) => {
    if (event.data === 'SKIP_WAITING') {
        sw.skipWaiting();
    }
}));
//# sourceMappingURL=sw.js.map