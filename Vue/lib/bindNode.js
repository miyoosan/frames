/**
 * bind update function to a node & component
 * @param {Node} node - target node
 * @param {String} type - text, attr, style, for
 * @param {Object} component - component
 * @param {Object} parsed - parsed expression: expression & update
 * @param {extra} extra - any other info
 */
const bindNode = (node, type, component, parsed, extra) => {
    let parentWatcher = extra.parentWatcher || Watchers.root;
    let closestArrayWatcher = extra.parentWatcher && extra.parentWatcher.isArray ? extra.parentWatcher : extra.closestArrayWatcher;
    let newWatcher = null;
    switch (type) {
    case 'text':
        newWatcher = {
            node,
            component,
            closestArrayWatcher,
            expression: parsed.expression,
            val: parsed.update.bind(component),
            update(oldV, newV){
                this.node.textContent = newV
            }
        };
        break;
    case 'attr':
        newWatcher = {
            node,
            component,
            closestArrayWatcher,
            expression: parsed.expression,
            val: parsed.update.bind(component),
            update(oldV, newV){
                this.node.setAttribute(extra.name, newV);
            }
        };
        break;
    case 'style':
        newWatcher = {
            node,
            component,
            closestArrayWatcher,
            expression: parsed.expression,
            val: parsed.update.bind(component),
            update(oldV, newV){
                setStyle(this.node, newV)
            }
        };
        break;
    case 'value':
        newWatcher = {
            node,
            component,
            closestArrayWatcher,
            expression: parsed.expression,
            val: parsed.update.bind(component),
            update(oldV, newV){
                this.node.value = newV;
            },
            isModel: true
        };
        break;
    case 'for':
        newWatcher = {
            expression: parsed.expression,
            closestArrayWatcher,
            isArray: true,
            component,
            val: parsed.update.bind(component),
            update: {
                add: (arr, from, to) => {
                    console.log(`for:add ${from} to ${to}`);
                    let endAnchor = extra.forAnchorEnd;
                    let startAnchor = extra.forAnchorStart;
                    let parentNode = endAnchor.parentNode;
                    let tmpl = extra.tmpl;

                    let i = 0;
                    let start = startAnchor;
                    while (i <= to){
                        if (i >= from){
                            let newNode = tmpl.cloneNode('deep');
                            let intermediate = Object.create(component);
                            intermediate.__index = i;
                            Object.defineProperty(intermediate, 'item', {
                                get(){
                                    var result = parsed.update.call(component)[this.__index];
                                    return result;
                                },
                                set(newValue){ console.error('direct modify parents\' data')},
                                enumerable : true,
                                configurable : true}
                                );
                            intermediate.isIntermediate = true;

                            parseDom(newNode, intermediate, newWatcher);
                            parentNode.insertBefore(newNode, start.nextSibling || endAnchor);
                        }
                        start = start.nextSibling;
                        i++;
                    }
                },

                remove: (arr, from, to) => {
                    console.group(`for:remove ${from} to ${to}`);
                    let endAnchor = extra.forAnchorEnd;
                    let parentNode = endAnchor.parentNode;
                    let i = from;
                    let target = endAnchor.parentNode.childNodes[i];
                    let total =  newWatcher.childs.length

                    // update child watchers
                    while(i < total - to + from - 1){
                        console.log('set index', i + to - from + 1, 'to', i);
                        newWatcher.childs[i + to - from + 1].component.__parent.__index = i;
                        i++;
                    }

                    // delete dom & unwatch
                    i = arr.length;
                    let start = endAnchor;
                    while (i >= from - 1){
                        if (i <= to - 1){
                            console.log('remove dom', i);
                            parentNode.removeChild(start.nextSibling);
                            console.log('unwatch', i);
                            unwatch(newWatcher.childs[i + 1]);
                        }
                        start = start.previousSibling;
                        i--;
                    }
                    console.groupEnd();
                }
            }
        };
        break;
    default:
        break;
    }

    if (!parentWatcher.childs){
        parentWatcher.childs = [];
    }

    newWatcher.parent = parentWatcher;
    parentWatcher.childs.push(newWatcher);

    // run watcher the first time
    Watchers.currentWatcherStack.unshift(newWatcher);

    triggerWatcher(newWatcher);

    Watchers.currentWatcherStack.shift();
};