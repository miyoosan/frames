/**
 * parse an expression to function
 * @param {expression} expression - expression
 */
const parse = (expression) => {
    // [TODO] handle unchanged expressions
    return {
        expression: expression,
        update: new Function('', 'with(this){ return ' + expression + '}')
    }
};

/**
 * parse string with {expression}
 */
const parseInterpolation = (str) => {
    var i = j = 0;
    var segs = [];
    var hasInterpolation = false;

    while (j < str.length) {
        if (str[j] === '{') {
            hasInterpolation = true;
            if (j > i) {
                segs.push(str.slice(i, j));
            }
            i = j + 1;
        } else if (str[j] === '}') {
            if (j > i) {
                segs.push(parse(str.slice(i, j)));
            }
            i = j + 1;
        }
        j++;
    }

    if (j > i) {
        segs.push(str.slice(i, j));
    }

    if (hasInterpolation) {
        let keys = new Set();

        return {
            expression: segs.reduce((pre, curr) => {
                if (typeof curr !== 'string') {
                    return pre + ' ' + curr.expression
                }
                return pre + ' ' + curr;
            }, ''),

            update() {
                return segs.reduce((pre, curr) => {
                    if (typeof curr !== 'string') {
                        return pre + curr.update.call(this);
                    }
                    return pre + curr;
                }, '');
            }
        }
    } else {
        return str;
    }
}