/**
 * component class
 */
class Component {
    constructor(options) {

        Object.assign(this, options);
        // transfer scope to Scope
        defineGetterSetter(this.scope);

        // debug
        Component.instances.push(this);
    }

    /**
     * render to a dom node
     * @param {String} name - component name
     * @param {DOMNode} target - target dom node
     */
    static render(aComponent, target) {
        let component = new aComponent();
        target.innerHTML = component.tmpl;
        parseDom(target, component);
    }
}

Component.instances = [];