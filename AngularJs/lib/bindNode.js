/**
 * bind update function to a node & scope
 * @param {Node} node - target node
 * @param {String} type - text, attr, style, for
 * @param {Object} scope - scope
 * @param {Object} parsed - parsed expression: expression & update
 * @param {extra} extra - any other info
 */
const bindNode = (node, type, scope, parsed, extra) => {
  let parentWatcher = extra.parentWatcher || watchers;
  let newWatcher = null;
  switch (type) {
  case 'text':
      newWatcher = {
          node,
          expression: parsed.expression,
          val: parsed.update.bind(null, scope),
          update(oldV, newV){
              this.node.textContent = newV
          }
      };
      break;
  case 'attr':
      newWatcher = {
          node,
          expression: parsed.expression,
          val: parsed.update.bind(null, scope),
          update(oldV, newV){
              this.node.setAttribute(extra.name, newV);
          }
      };
      break;
  case 'style':
      newWatcher = {
          node,
          expression: parsed.expression,
          val: parsed.update.bind(null, scope),
          update(oldV, newV){
              setStyle(this.node, newV)
          }
      };
      break;
  case 'value':
      newWatcher = {
          node,
          expression: parsed.expression,
          val: parsed.update.bind(null, scope),
          update(oldV, newV){
              this.node.value = newV;
          },
          isModel: true
      };
      break;
  case 'for':
      newWatcher = {
          expression: parsed.expression,
          isArray: true,
          val: parsed.update.bind(null, scope),
          update: {
              add: (arr, from, to) => {
                  console.log('update add', from, to);
                  let endAnchor = extra.forAnchorEnd;
                  let parentNode = endAnchor.parentNode;
                  let tmpl = extra.tmpl;
                  let i = from;
                  while (i <= to){
                      let newNode = tmpl.cloneNode('deep');
                      parseConfig.replacement = {
                          from: extra.itemExpression,
                          to: parsed.expression.replace('scope.', '') + '[' + i + ']'
                      };
                      parseDom(newNode, scope, newWatcher);
                      parentNode.insertBefore(newNode, parentNode.childNodes[to]);
                      i++;
                  }
              },

              remove: (arr, from, to) => {
                  console.log('update remove', from, to);
                  let endAnchor = extra.forAnchorEnd;
                  let parentNode = endAnchor.parentNode;
                  let i = from;
                  let target = endAnchor.parentNode.childNodes[i];
                  let total =  newWatcher.childs.length

                  // update child watchers
                  while(i < total - to + from - 1){
                      Object.assign(newWatcher.childs[i], newWatcher.childs[i + to - from + 1]);
                      i++;
                  }

                  // delete dom
                  i = from;
                  while (i <= to){
                      parentNode.removeChild(target);
                      target = target.nextSibling;
                      i++;
                  }

                  // unwatch child watchers
                  i = 0;
                  let childWatchers = newWatcher.childs;
                  while (i < to - from + 1){
                      unwatch(childWatchers[childWatchers.length - 1]);
                      i++;
                  }
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
};