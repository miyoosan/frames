/**
 * traverse a dom, parse the attribute/text {expressions}
 */
const parseDom = ($dom, scope, parentWatcher) => {
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
                      bindNode($dom, 'style', scope, parsed, {
                          parentWatcher
                      });
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
              bindNode(forAnchorStart, 'for', scope, parseListExpression, {
                  itemExpression,
                  forAnchorEnd,
                  tmpl,
                  parentWatcher
              });
              hasForAttr = true;
          } else if (name === 'click'){
              let parsed = parse(str);
              $dom.addEventListener('click', ()=>{
                  parsed.update(scope);
                  digest();
              }, false);

          } else if (name === 'model'){
              let parsed = parse(str);
              $dom.addEventListener('input', ()=>{
                  scope.set(parsed.expression.replace('scope.', ''), $dom.value);
              });
              bindNode($dom, 'value', scope, parsed, {parentWatcher});
          } else {
              let parsed = parseInterpolation(str);
              if (typeof parsed !== 'object'){
                  $dom.setAttribute(name, parsed);
              } else {
                  bindNode($dom, 'attr', scope, parsed, {parentWatcher});
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
              bindNode($dom, 'text', scope, parsed, {parentWatcher});
          }
      }
  }

  // if there are custom directives
  if ($dom.nodeType === 1) {
      let directive = Directive.instances[$dom.tagName.toLowerCase()];
      if (directive){
          if (directive.tmpl){
              $dom.innerHTML = directive.tmpl;
          }
      }
  }

  // only traverse childnodes when not under for
  if (!hasForAttr){
      let nextScope = scope;
      // if there are custom directives
      if ($dom.nodeType === 1) {
          let directive = Directive.instances[$dom.tagName.toLowerCase()];
          if (directive){
              if (directive.tmpl){
                  $dom.innerHTML = directive.tmpl;
              }

              if (directive.scope) {
                  nextScope = scope.$new();
                  for (let key in directive.scope){
                      if (directive.scope[key] === '='){
                          nextScope[key] = parse($dom.getAttribute(key)).update(scope);
                      } else {
                          nextScope[key] = directive.scope[key];
                      }
                  }
              }
          }
      }

      let start = $dom.childNodes[0];
      while(start){
          parseDom(start, nextScope, parentWatcher);
          start = start.nextSibling;
      }
  }
}