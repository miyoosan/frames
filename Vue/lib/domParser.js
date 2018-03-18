/**
 * traverse a dom, parse the attribute/text {expressions}
 */
const parseDom = ($dom, component, parentWatcher) => {
    var hasForAttr = false;
    // if textNode then
    if ($dom.attributes) {
        Array.prototype.forEach.call($dom.attributes, (attr) => {
            let name = attr.nodeName;
            let str = attr.nodeValue;

            // for style, if it is object expression
            if (name === 'style') {
                if (str[0] === '{') {
                    let parsed = parse(str);
                    if (typeof parsed.update === 'undefined') {
                        $dom.setStyle($dom, parsed);
                    } else {
                        bindNode($dom, 'style', component, parsed, {
                            parentWatcher
                        });
                    }
                }
            } else if (name === 'for') {
                // add comment anchor
                let forAnchorStart = document.createComment('for');
                $dom.parentNode.insertBefore(forAnchorStart, $dom);

                let forAnchorEnd = document.createComment('end');
                if ($dom.nextSibling) {
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
                bindNode(forAnchorStart, 'for', component, parseListExpression, {
                    itemExpression,
                    forAnchorStart,
                    forAnchorEnd,
                    tmpl,
                    parentWatcher
                });
                hasForAttr = true;
            } else if (name === 'click') {
                let parsed = parse(str);
                $dom.addEventListener('click', () => {
                    parsed.update.call(component);
                }, false);

            } else if (name === 'model') {
                let parsed = parse(str);
                $dom.addEventListener('input', () => {
                    component.set(parsed.expression.replace('component.', ''), $dom.value);
                });
                bindNode($dom, 'value', component, parsed, { parentWatcher });
            } else {
                let parsed = parseInterpolation(str);
                if (typeof parsed !== 'object') {
                    $dom.setAttribute(name, parsed);
                } else {
                    bindNode($dom, 'attr', component, parsed, { parentWatcher });
                }
            }
        });
    }

    // if it is text node
    if ($dom.nodeType === 3) {
        let text = $dom.nodeValue.trim();
        if (text.length) {
            let parsed = parseInterpolation($dom.nodeValue);
            if (typeof parsed !== 'object') {
                $dom.textContent = parsed;
            } else {
                bindNode($dom, 'text', component, parsed, { parentWatcher });
            }
        }
    }

    // if there are custom directives
    if ($dom.nodeType === 1) {
        let component = Component.list[$dom.tagName.toLowerCase()];
        if (component) {
            if (component.tmpl) {
                $dom.innerHTML = component.tmpl;
            }
        }
    }

    // only traverse childnodes when not under for
    if (!hasForAttr) {
        let nextComponent = component;
        // if there are custom directives
        if ($dom.nodeType === 1) {
            let nextComponentClass = Component.list[$dom.tagName.toLowerCase()];
            if (nextComponentClass) {
                nextComponent = new nextComponentClass();
                if (nextComponent.tmpl) {
                    $dom.innerHTML = nextComponent.tmpl;
                }

                if (nextComponent.props) {
                    // have to bridge props
                    let props = {};

                    nextComponent.props.forEach(key => {
                        Object.defineProperty(props, key, {
                            get() {
                                let val = component[$dom.getAttribute(key)];
                                if (typeof val === 'function') {
                                    return val.bind(component)
                                } else {
                                    return component[$dom.getAttribute(key)];
                                }
                            },
                            set(newValue) { console.error('direct modify parents\' data') },
                            enumerable: true,
                            configurable: true
                        }
                        );
                    });

                    nextComponent.props = props;
                    // if component is intermediate component, pass down the index
                    if (component.isIntermediate) {
                        nextComponent.__parent = component;
                    }
                }
            }
        }

        let start = $dom.childNodes[0];
        while (start) {
            parseDom(start, nextComponent, parentWatcher);
            start = start.nextSibling;
        }
    }
}