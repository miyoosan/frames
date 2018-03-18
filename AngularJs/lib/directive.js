/**
 * directive class
 * @param string - tmpl string
 * @param number - priority
 * @param object - scope config
 */
class Directive {
	constructor({tmpl = null, priority = 0, scope = null}){
	    this.tmpl = tmpl;
	    this.priority = priority;
	    this.scope = scope;
	}

    static create(name, options){
        Directive.instances[name] = new Directive(options);
    }
}

Directive.instances = {};