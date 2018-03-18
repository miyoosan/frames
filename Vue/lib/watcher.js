/**
 * enable fetching object consequential peroperties
 * example:
 * var foo = {bar: {foo: 3}}
 * foo.get('bar.foo') === 3
 */

Object.prototype.get = function (prop) {
    const segs = prop.split('.');
    let result = this;
    let i = 0;

    while (result && i < segs.length) {
        result = result[segs[i]];
        i++;
    }

    return result;
}

/**
* set consequential peroperty a value
* @example:
* var foo = {};
* foo.set('foo.bar', 3);
* foo is now {foo: {bar: 3}}
*/
Object.prototype.set = function (prop, val) {
    const segs = prop.split('.');
    let target = this;
    let i = 0;
    while (i < segs.length) {
        if (typeof target[segs[i]] === 'undefined') {
            target[segs[i]] = i === segs.length - 1 ? val : {};
        } else if (i === segs.length - 1) {
            target[segs[i]] = val;
        }

        target = target[segs[i]];
        i++;
    }
}


/**
* update style attribute of a node, by an obj
*/
const setStyle = (node, styleObj) => {
    Object.assign(node.style, styleObj);
}


/**
* all watchers, to be dirty-checked every time
*/
const Watchers = {
    root: {},
    currentWatcherStack: []
};

/**
* check watcher value change and update
*/
function triggerWatcher(watcher) {
    console.group('triggerWatcher', watcher.expression);
    let newV = watcher.val();
    if (watcher.isModel) {
        watcher.update(undefined, newV || '');
        watcher.oldV = newV;
    } else if (!watcher.isArray && (0 !== newV)) {
        watcher.update(0, newV);
        watcher.oldV = newV;
    } else if (watcher.isArray) {
        let oldV = watcher.oldV || [];
        diff(oldV, newV, watcher.update.add, watcher.update.remove)
        watcher.oldV = newV.slice(0);
    }
    console.groupEnd();
}

/**
* add setter watchers
* @param {Watcher} watcher - watcher to bind
* @param {Array} location - watchers array in setter
*/
function bindWatcherOnSetter(watcher, setterLocation) {
    watcher.locations = watcher.locations || new Set();
    if (!watcher.locations.has(setterLocation)) {
        watcher.locations.add(setterLocation);
    }

    if (!setterLocation.has(watcher)) {
        setterLocation.add(watcher);
    }
}

/**
* remove setter watchers
* @param {Watcher} watcher - watcher to bind
*/
function unwatch(watcher) {
    let list = watcher.parent.childs;
    list.splice(list.indexOf(watcher), 1);

    watcher.locations.forEach(loc => {
        loc.delete(watcher);
    });
}