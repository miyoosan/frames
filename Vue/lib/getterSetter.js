//override Array.prototype.push
['push', 'pop', 'shift', 'unshift', 'splice'].forEach(function (method) {
    let originalMethod = Array.prototype[method];
    Array.prototype[method] = function () {
        if (this.__parent) {
            defineGetterSetter(arguments, this.__parent, this.__key);
            originalMethod.apply(this, arguments);
            // trigger watchers
            this.__parent[this.__key] = this;
        } else {
            originalMethod.apply(this, arguments);
        }
    }
});


// change all properties to getter/setter
function defineGetterSetter(data, __parent, __key) {
    let val = data;
    let type = typeof data;
    let watchersToBind = new Set();

    if (['object'].includes(type) && data !== null && !data.__isGetterSetter) {
        if (Array.isArray(data)) {
            data.forEach((item, i) => {
                defineGetterSetter(item);
            });
        } else {
            Object.keys(data).forEach(key => {
                let val = data[key];
                Object.defineProperty(data, key, {
                    get() {
                        if (Watchers.currentWatcherStack.length) {
                            let currWatcher = Watchers.currentWatcherStack[0];
                            let closestArrayWatcher = currWatcher.closestArrayWatcher;

                            // if data is array, then closestArrayWatcher must be the For
                            // and prevent gettersetter under For
                            if (Array.isArray(val) && closestArrayWatcher && closestArrayWatcher !== currWatcher) {
                            } else {
                                console.log(`bind ${currWatcher.expression} to ${key}`);
                                bindWatcherOnSetter(currWatcher, watchersToBind);
                            }
                        }

                        return val;
                    },
                    set(newV) {
                        // when setting new value, have to transform & pass __parent & __key
                        defineGetterSetter(newV, val.__parent, val.__key);
                        val = newV;
                        let iter = watchersToBind[Symbol.iterator]();
                        let watcher = null;
                        while (watcher = iter.next().value) {
                            triggerWatcher(watcher);
                        }
                    },
                    enumerable: true,
                    configurable: true
                });


                if (typeof val === 'object' && data !== null) {
                    defineGetterSetter(val, data, key);
                }
            });
        }

        if (__parent) {
            data.__parent = __parent;
            data.__key = __key;
        }

        Object.defineProperty(data, '__isGetterSetter', { get: () => true, enumerable: false });
    }
}