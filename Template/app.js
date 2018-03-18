(function(){
    // rendering engine
    var Render = function(selector, data){
        var tmpl =  document.querySelector(selector).innerHTML.trim();
        var matches = tmpl.match(/<(\w+)>(.*)<\/(\w+)>/);
        var newItem = document.createElement(matches[1]);
        newItem.innerHTML = matches[2].replace('{this}', data);
        return newItem;
    };


    // app
    var $count = document.querySelector('.jsCount');
    var $list = document.querySelector('.jsList');
    var $listEmpty = document.querySelector('.jsListEmpty');
    var $input = document.querySelector('.jsInput');
    var $add = document.querySelector('.jsAdd');

    var data = [];

    var addItem = function(item){
        data.push(item);
        var newItem = Render('#js-tmpl-item', item);
        newItem.querySelector('.jsDelete').addEventListener('click', function(){
            removeItem(item);
            $list.removeChild(newItem);
        }, false);
        $list.appendChild(newItem);
    };

    var removeItem = function(item){
        data.splice(data.indexOf(item), 1);
        updateCount();
    };

    var updateCount = function(){
        $count.innerHTML = data.length;

        if (data.length > 0){
            $listEmpty.style.display = 'none';
        } else {
            $listEmpty.style.display = 'block';
        }
    };

    var addHandler = function(){
        var input = $input.value.trim();
        if (input.length === 0){
            return;
        }
        addItem(input);
        $input.value = '';
        updateCount();
    };

    $add.addEventListener('click', addHandler, false);
})();