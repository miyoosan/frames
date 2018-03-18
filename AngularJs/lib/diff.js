/**
 * diff array
 * @param {Array} from
 * @param {Array} to
 * @param {function} add
 * @param {function} remove
 */
const diff = (from, to, add, remove) => {
  console.log('diff', from, to);
  let i = 0;
  let totalFrom = from.length;
  let j = 0;
  let totalTo = to.length;

  while (i < totalFrom && j < totalTo){
      if (from[i] === to[j]){
          i++;
          j++;
      } else {
          let k = from.indexOf(to[j]);
          if (k > i){
              remove(from, i, k - 1);
              i = k + 1;
              j++;
          } else {
              let l = to.indexOf(from[i]);
              if (l > j){
                  add(to, j, l - 1);
                  i++;
                  j = l + 1;
              }
          }
      }
  }

  if (i < totalFrom){
      remove(from, i, totalFrom - 1);
  }

  if (j < totalTo){
      add(to, j, totalTo - 1);
  }
}