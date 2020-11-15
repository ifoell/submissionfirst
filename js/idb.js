'use strict';

(() => {
    const toArray = (arr) => {
        return Array.prototype.slice.call(arr);
    }

    const promisifyRequest = (request) => {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    const promisifyRequestCall = (obj, method, args) => {
        const request;
        const p = new Promise((resolve, reject) => {
            request = obj[method].apply(obj, args);
            promisifyRequest(request).then(resolve, reject);
        });

        p.request = request;
        return p;
    }

    const promisifyCursorRequestCall = (obj, method, args) => {
        var p = promisifyRequestCall(obj, method, args);
        return p.then((value) => {
            if (!value) return;
            return new Cursor(value, p.request);
        });
    }

    const proxyProperties = (ProxyClass, targetProp, properties) => {
        properties.forEach((prop) => {
            Object.defineProperty(ProxyClass.prototype, prop, {
                get: () => {
                    return this[targetProp][prop];
                },
                set: (val) => {
                    this[targetProp][prop] = val;
                }
            });
        });
    }

    const proxyRequestMethods = (ProxyClass, targetProp, Constructor, properties) => {
        properties.forEach((prop) => {
            if (!(prop in Constructor.prototype)) return;
            ProxyClass.prototype[prop] = () => {
                return promisifyRequestCall(this[targetProp], prop, arguments);
            };
        });
    }

    const proxyMethods = (ProxyClass, targetProp, Constructor, properties) => {
        properties.forEach((prop) => {
            if (!(prop in Constructor.prototype)) return;
            ProxyClass.prototype[prop] = () => {
                return this[targetProp][prop].apply(this[targetProp], arguments);
            };
        });
    }

    const proxyCursorRequestMethods = (ProxyClass, targetProp, Constructor, properties) => {
        properties.forEach((prop) => {
            if (!(prop in Constructor.prototype)) return;
            ProxyClass.prototype[prop] = () => {
                return promisifyCursorRequestCall(this[targetProp], prop, arguments);
            };
        });
    }

    const Index = (index) => {
        this._index = index;
    }

    proxyProperties(Index, '_index', [
        'name',
        'keyPath',
        'multiEntry',
        'unique'
    ]);

    proxyRequestMethods(Index, '_index', IDBIndex, [
        'get',
        'getKey',
        'getAll',
        'getAllKeys',
        'count'
    ]);

    proxyCursorRequestMethods(Index, '_index', IDBIndex, [
        'openCursor',
        'openKeyCursor'
    ]);

    const Cursor = (cursor, request) => {
        this._cursor = cursor;
        this._request = request;
    }

    proxyProperties(Cursor, '_cursor', [
        'direction',
        'key',
        'primaryKey',
        'value'
    ]);

    proxyRequestMethods(Cursor, '_cursor', IDBCursor, [
        'update',
        'delete'
    ]);

    // proxy 'next' methods
    ['advance', 'continue', 'continuePrimaryKey'].forEach((methodName) => {
        if (!(methodName in IDBCursor.prototype)) return;
        Cursor.prototype[methodName] = () => {
            const cursor = this;
            const args = arguments;
            return Promise.resolve().then(() => {
                cursor._cursor[methodName].apply(cursor._cursor, args);
                return promisifyRequest(cursor._request).then((value) => {
                    if (!value) return;
                    return new Cursor(value, cursor._request);
                });
            });
        };
    });

    const ObjectStore = (store) => {
        this._store = store;
    }

    ObjectStore.prototype.createIndex = () => {
        return new Index(this._store.createIndex.apply(this._store, arguments));
    };

    ObjectStore.prototype.index = () => {
        return new Index(this._store.index.apply(this._store, arguments));
    };

    proxyProperties(ObjectStore, '_store', [
        'name',
        'keyPath',
        'indexNames',
        'autoIncrement'
    ]);

    proxyRequestMethods(ObjectStore, '_store', IDBObjectStore, [
        'put',
        'add',
        'delete',
        'clear',
        'get',
        'getAll',
        'getKey',
        'getAllKeys',
        'count'
    ]);

    proxyCursorRequestMethods(ObjectStore, '_store', IDBObjectStore, [
        'openCursor',
        'openKeyCursor'
    ]);

    proxyMethods(ObjectStore, '_store', IDBObjectStore, [
        'deleteIndex'
    ]);

    const Transaction = (idbTransaction) => {
        this._tx = idbTransaction;
        this.complete = new Promise((resolve, reject) => {
            idbTransaction.oncomplete = () => {
                resolve();
            };
            idbTransaction.onerror = () => {
                reject(idbTransaction.error);
            };
            idbTransaction.onabort = () => {
                reject(idbTransaction.error);
            };
        });
    }

    Transaction.prototype.objectStore = () => {
        return new ObjectStore(this._tx.objectStore.apply(this._tx, arguments));
    };

    proxyProperties(Transaction, '_tx', [
        'objectStoreNames',
        'mode'
    ]);

    proxyMethods(Transaction, '_tx', IDBTransaction, [
        'abort'
    ]);

    const UpgradeDB = (db, oldVersion, transaction) => {
        this._db = db;
        this.oldVersion = oldVersion;
        this.transaction = new Transaction(transaction);
    }

    UpgradeDB.prototype.createObjectStore = () => {
        return new ObjectStore(this._db.createObjectStore.apply(this._db, arguments));
    };

    proxyProperties(UpgradeDB, '_db', [
        'name',
        'version',
        'objectStoreNames'
    ]);

    proxyMethods(UpgradeDB, '_db', IDBDatabase, [
        'deleteObjectStore',
        'close'
    ]);

    const DB = (db) => {
        this._db = db;
    }

    DB.prototype.transaction = () => {
        return new Transaction(this._db.transaction.apply(this._db, arguments));
    };

    proxyProperties(DB, '_db', [
        'name',
        'version',
        'objectStoreNames'
    ]);

    proxyMethods(DB, '_db', IDBDatabase, [
        'close'
    ]);

    // Add cursor iterators
    // TODO: remove this once browsers do the right thing with promises
    ['openCursor', 'openKeyCursor'].forEach((funcName) => {
        [ObjectStore, Index].forEach((Constructor) => {
            // Don't create iterateKeyCursor if openKeyCursor doesn't exist.
            if (!(funcName in Constructor.prototype)) return;

            Constructor.prototype[funcName.replace('open', 'iterate')] = () => {
                const args = toArray(arguments);
                const callback = args[args.length - 1];
                const nativeObject = this._store || this._index;
                const request = nativeObject[funcName].apply(nativeObject, args.slice(0, -1));
                request.onsuccess = () => {
                    callback(request.result);
                };
            };
        });
    });

    // polyfill getAll
    [Index, ObjectStore].forEach((Constructor) => {
        if (Constructor.prototype.getAll) return;
        Constructor.prototype.getAll = (query, count) => {
            const instance = this;
            const items = [];

            return new Promise((resolve) => {
                instance.iterateCursor(query, (cursor) => {
                    if (!cursor) {
                        resolve(items);
                        return;
                    }
                    items.push(cursor.value);

                    if (count !== undefined && items.length == count) {
                        resolve(items);
                        return;
                    }
                    cursor.continue();
                });
            });
        };
    });

    const exp = {
        open: (name, version, upgradeCallback) => {
            const p = promisifyRequestCall(indexedDB, 'open', [name, version]);
            const request = p.request;

            if (request) {
                request.onupgradeneeded = (event) => {
                    if (upgradeCallback) {
                        upgradeCallback(new UpgradeDB(request.result, event.oldVersion, request.transaction));
                    }
                };
            }

            return p.then((db) => {
                return new DB(db);
            });
        },
        delete: (name) => {
            return promisifyRequestCall(indexedDB, 'deleteDatabase', [name]);
        }
    };

    if (typeof module !== 'undefined') {
        module.exports = exp;
        module.exports.default = module.exports;
    } else {
        self.idb = exp;
    }
}());