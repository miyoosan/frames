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
const watchers = {};

/**
* digest a watcher, recursively
*/
const _digest = (watcher) => {
  console.log('_digest', watcher.expression);
  if (watcher.val){
      let newV = watcher.val();
      if (watcher.isModel){
          watcher.update(watcher.oldV, newV || '');
          watcher.oldV = newV;
      } else if (!watcher.isArray && (watcher.oldV !== newV)){
          console.log(`digest: ${watcher.expression}, ${watcher.oldV} => ${newV}`);
          watcher.update(watcher.oldV, newV);
          watcher.oldV = newV;
      } else if (watcher.isArray){
          let oldV = watcher.oldV || [];
          diff(oldV, newV, watcher.update.add, watcher.update.remove)
          watcher.oldV = newV.slice(0);
      }
  }

  if (watcher.childs){
      watcher.childs.forEach(_digest);
  }
};

/**
* digest method, if expression changes, un the update
*/
const digest = () => {
  _digest(watchers);
};

/**
* unwatch
*/
const unwatch = (watcher) => {
  let list = watcher.parent.childs;
  list.splice(list.indexOf(watcher), 1);
}