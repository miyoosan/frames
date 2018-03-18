(function(){
    /**
     * enable fetching object consequential peroperties
     * example:
     * var foo = {bar: {foo: 3}}
     * foo.get('bar.foo') === 3
     */

    Object.prototype.get = function(prop){
        const segs = prop.split('.');
        let result = this;
        let i = 0;

        while(result && i < segs.length){
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
    Object.prototype.set = function(prop, val){
        const segs = prop.split('.');
        let target = this;
        let i = 0;
        while(i < segs.length){
            if (typeof target[segs[i]] === 'undefined'){
                target[segs[i]] = i === segs.length - 1 ? val : {};
            } else if (i === segs.length - 1){
                target[segs[i]] = val;
            }

            target = target[segs[i]];
            i++;
        }

        if (this.constructor.name === 'Model'){
            this.trigger('set:' + prop, val);
        }
    }



    let parseConfig = {
        replacement: undefined
    };
    /**
     * parse an expression
     * @param {expression} expression - expression
     * @desc
     * if can be valued, return the value,
     * if not, return keys & update function, used in data biding
     */
    const parse = (expression) => {
        if (typeof parseConfig.replacement !== 'undefined'){
            expression = expression.replace(parseConfig.replacement.from, parseConfig.replacement.to);
        }
        // expression example:
        //    length
        //    todos.length
        //    todos.length + 1
        //    todos.length > 0 ? 'empty' : todos.length
        let keys = new Set();
        let newExpression = expression.replace(/([^a-zA-Z0-9\._\$\[\]]|^)([a-zA-Z_\$][a-zA-Z0-9\._\$\[\]]+)(?!\s*:|'|")(?=[^a-zA-Z0-9\._\$\[\]]|$)/g, function(a,b,c){
            // for something like foo[1].bar, change it to foo.1.bar
            keys.add(c.replace(/\[|(\]\.?)/g, '.'));

            return b + 'model.data.' + c;
        });

        if (newExpression === expression){
            return eval(expression);
        }


        return newExpression === expression ? eval(expression) : {
            keys,
            expression: newExpression,
            update: new Function('model', 'return ' + newExpression)
        };
    };

    /**
     * parse string with {expression}
     */
    const parseInterpolation = (str) => {
        var i = j = 0;
        var segs = [];
        var hasInterpolation = false;

        while (j < str.length){
            if (str[j] === '{'){
                hasInterpolation = true;
                if (j > i){
                    segs.push(str.slice(i, j));
                }
                i = j + 1;
            } else if (str[j] === '}'){
                if (j > i){
                    segs.push(parse(str.slice(i, j)));
                }
                i = j + 1;
            }
            j++;
        }

        if (j > i){
            segs.push(str.slice(i, j));
        }

        if (hasInterpolation){
            let keys = new Set();
            segs.forEach((seg) => {
                if (typeof seg === 'object'){
                    seg.keys.forEach(keys.add.bind(keys));
                }
            });

            if (keys.size === 0){
                return segs.reduce((pre, curr) => {
                        return pre + curr;
                    }, '');
            }

            return {
                keys,
                update(data){
                    return segs.reduce((pre, curr) => {
                        if (typeof curr !== 'string'){
                            return pre + curr.update(data);
                        }
                        return pre + curr;
                    }, '');
                }
            }
        } else {
            return str;
        }
    }

    /**
     * update style attribute of a node, by an obj
     */
    const setStyle = (node, styleObj) => {
        Object.assign(node.style, styleObj);
    }

    /**
     * bind update function to a node & model
     * @param {Node} node - target node
     * @param {String} type - text, attr, style, for
     * @param {Object} model - data model
     * @param {Set} evts - event list
     * @param {func} func - callback
     * @param {extra} extra - any other info
     */
    const bindNode = (node, type, model, evts, func, extra) => {
        console.log('bindNode:', node, type, model, evts, func, extra);
        switch (type) {
        case 'text':
            node.textContent = func(model);
            evts.forEach((key) => model.listen('set:data.' + key, () => node.textContent = func(model)));
            break;
        case 'attr':
            node.setAttribute(extra.name, func(model));
            evts.forEach((key) => model.listen('set:data.' + key, () => node.setAttribute(extra.name, func(model))));
            break;
        case 'style':
            setStyle(node, func(model));
            evts.forEach((key) => model.listen('set:data.' + key, () => setStyle(node, func(model))));
            break;
        case 'value':
            evts.forEach((key) => model.listen('set:data.' + key, () => node.value = func(model)));
            break;
        case 'for':
            evts.forEach((key) => {
                // add data.items to cetain data.index
                model.listen('add:data.' + key, (data) => {
                    let list = func(model);

                    // update listeners
                    let i = data.index;
                    while(i < list.length - data.length){
                        model.trigger('set:data.' + key + '.' + i);
                        i++;
                    }

                    // add data.length dom, before the endAnchor
                    let endAnchor = extra.forAnchorEnd;
                    let parentNode = endAnchor.parentNode;
                    let tmpl = extra.tmpl;
                    while(i < list.length){
                        let newNode = tmpl.cloneNode('deep');
                        parseConfig.replacement = {
                            from: extra.itemExpression,
                            to: key + '[' + i + ']'
                        };
                        parseDom(newNode, model);
                        parentNode.insertBefore(newNode, endAnchor);
                        i++;
                    }
                    parseConfig.replacement = undefined;
                });

                // remove data.length items at data.index
                model.listen('delete:data.' + key, (data) => {
                    let list = func(model);
                    let endAnchor = extra.forAnchorEnd;
                    let parentNode = endAnchor.parentNode;

                    let i = list.length - 1 + data.length;
                    while(i > list.length - 1){
                        // remove listeners
                        model.unlisten('set:data.' + key + '.' + i);
                        parentNode.removeChild(endAnchor.previousSibling);
                        i--;
                    }

                    // update rest listeners
                    while(i > data.index - 1){
                        model.trigger('set:data.' + key + '.' + i);
                        i--;
                    }
                });

                let list = func(model);
                model.trigger('add:data.' + key, {length: list.length, index: 0});
            });

            break;
        default:
            break;
        }
    };

    /**
     * traverse a dom, parse the attribute/text {expressions}
     */
    const parseDom = ($dom, model) => {
        var hasForAttr = false;
        // if textNode then
        if ($dom.attributes){
            Array.prototype.forEach.call($dom.attributes, (attr) => {
                let name = attr.nodeName;
                let str = attr.nodeValue;

                // for style, if it is object expression
                if (name === 'style'){
                    if (str[0] === '{'){
                        let parsed = parse(str);
                        if (typeof parsed.update === 'undefined'){
                            $dom.setStyle($dom, parsed);
                        } else {
                            bindNode($dom, 'style', model, parsed.keys, parsed.update);
                        }
                    }
                } else if (name === 'for'){
                    // add comment anchor
                    let forAnchorStart = document.createComment('for');
                    $dom.parentNode.insertBefore(forAnchorStart, $dom);

                    let forAnchorEnd = document.createComment('end');
                    if ($dom.nextSibling){
                        $dom.parentNode.insertBefore(forAnchorEnd, $dom.nextSibling);
                    } else {
                        $dom.parentNode.appendChild(forAnchorEnd);
                    }

                    let tmpl = $dom.parentNode.removeChild($dom);
                    tmpl.removeAttribute('for');
                    let match = /(.*)(\s+)in(\s+)(.*)/.exec(str);
                    let itemExpression = match[1];
                    let listExpression = match[4];

                    let parseListExpression = parse(listExpression);
                    bindNode(forAnchorStart, 'for', model, parseListExpression.keys, parseListExpression.update, {
                        itemExpression,
                        forAnchorEnd,
                        tmpl
                    });
                    hasForAttr = true;
                } else if (name === 'click'){
                    let parsed = parse(str);
                    $dom.addEventListener('click', ()=>{
                        parsed.update(model);
                    }, false);

                } else if (name === 'model'){
                    let parsed = parse(str);
                    $dom.addEventListener('input', ()=>{
                        model.set(parsed.expression.replace('model.', ''), $dom.value);
                    });
                    bindNode($dom, 'value', model, parsed.keys, parsed.update);
                } else {
                    let parsed = parseInterpolation(str);
                    if (typeof parsed !== 'object'){
                        $dom.setAttribute(name, parsed);
                    } else {
                        bindNode($dom, 'attr', model, parsed.keys, parsed.update)
                    }
                }
            });
        }

        // if it is text node
        if ($dom.nodeType === 3){
            let text = $dom.nodeValue.trim();
            if (text.length){
                let parsed = parseInterpolation($dom.nodeValue);
                if (typeof parsed !== 'object'){
                    $dom.textContent = parsed;
                } else {
                    bindNode($dom, 'text', model, parsed.keys, parsed.update);
                }
            }
        }

        if (!hasForAttr){
            let start = $dom.childNodes[0];
            while(start){
                parseDom(start, model);
                start = start.nextSibling;
            }
        }
    }

    /**
     * data model class
     * @class
     */
    class Model {
        constructor(conf){
            this.data = {};
            this._listeners = {};

            Object.assign(this, conf);
        }

        /**
         * trigger events
         * @param {String} evts - multiple events seperated by space
         * @param {Object} data - event data
         */
        trigger(evts, data){
            console.log('Model.trigger:', evts);
            let events = evts.split(/\s+/);
            events.forEach((event) => {
                let target = this._listeners.get(event);
                Model.triggerListener(target, data);
            });
        }
        /**
         * trigger events
         * @param {String} evts - multiple events seperated by space
         * @param {Object} data - event data
         */
        static triggerListener(target, data){
            for(let attr in target){
                if (target.hasOwnProperty(attr)){
                    if (attr === 'listeners'){
                        target[attr].forEach(listener => listener(data));
                    } else {
                        Model.triggerListener(target[attr]);
                    }
                }
            }
        }

        /**
         * add listeners to events
         * @param {String} evts - multiple events seperated by space
         * @param {Function} listener - callback
         */
        listen(evts, listener){
            let events = evts.split(/\s+/);
            events.forEach((event) => {
                let key = event + '.listeners';
                let target = this._listeners.get(key);
                if (typeof target === 'undefined'){
                    this._listeners.set(key, [listener]);
                } else {

                    target.push(listener);
                }
            });
        }

        /**
         * remove listener to events
         * @param {String} evts - multiple events seperated by space
         * @param {Function}
         */
        unlisten(evts, listener){
            let events = evts.split(/\s+/);
            events.forEach((event) => {
                let key = event;
                let target = this._listeners.get(key);
                if (typeof target !== 'undefined' && typeof target.listeners !== 'undefined'){
                    if (typeof listener !== 'undefined'){
                        target.listeners.splice(target.listeners.indexOf(listener), 1);
                    } else {
                        this._listeners.set(key, undefined);
                    }
                }
            });
        }
    }


    // app
    let appModel = new Model({
        data: {
            todos: [],

        }
    });


    appModel.data.add = function(){
        let item = {
            name: appModel.data.newItemName
        };
        appModel.data.todos.push(item);
        appModel.set('data.newItemName', '');
        appModel.trigger('set:data.todos.length', appModel.data.todos.length);
        appModel.trigger('add:data.todos', {index: appModel.data.todos.length - 1, length: 1});
    }

    appModel.data.remove = function(item){
        let index = appModel.data.todos.indexOf(item);
        appModel.data.todos.splice(index, 1);
        appModel.trigger('set:data.todos.length', appModel.data.todos.length);
        appModel.trigger('delete:data.todos', {index:index, length: 1});
    }

    // start app
    parseDom(document.body, appModel);
})();