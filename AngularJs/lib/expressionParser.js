let parseConfig = {
  replacement: undefined
};
/**
* parse an expression
* @param {expression} expression - expression
* @desc
* if can be valued, return the value,
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
  let newExpression = expression.replace(/([^a-zA-Z0-9\._\$\[\]]|^)([a-zA-Z_\$][a-zA-Z0-9\._\$\[\]]+)(?!\s*:|'|")(?=[^a-zA-Z0-9\._\$\[\]]|$)/g, function(a,b,c){
      // for something like foo[1].bar, change it to foo.1.bar
      return b + 'scope.' + c;
  });

  if (newExpression === expression){
      return eval(expression);
  }


  return newExpression === expression ? eval(expression) : {
      expression: newExpression,
      update: new Function('scope', 'return ' + newExpression)
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

      return {
          expression: segs.reduce((pre, curr) => {
              if (typeof curr !== 'string'){
                  return pre + ' ' + curr.expression
              }
              return pre + ' ' + curr;
          }, ''),
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