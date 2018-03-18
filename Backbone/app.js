(function(){
    // rendering engine
    var Render = function(selector, data){
        var tmpl =  document.querySelector(selector).innerHTML.trim();
        var matches = tmpl.match(/<(\w+)>(.*)<\/(\w+)>/);
        var newItem = document.createElement(matches[1]);
        newItem.innerHTML = matches[2].replace('{this}', data);
        return newItem;
    };


    // Model class
    function Model(conf){
        this.data = {};
        this._listeners = {};

        Object.assign(this, conf);
    }

    Model.prototype.trigger = function(events, data){
        var events = events.split(/\W+/);
        var that = this;
        events.forEach(function(event){
            if (that._listeners[event]){
                that._listeners[event].forEach(function(listener){
                    listener(data);
                });
            }
        });
    };

    Model.prototype.listen = function(events, listener){
        var events = events.split(/\W+/);
        var that = this;
        events.forEach(function(event){
            if (!that._listeners[event]){
                that._listeners[event] = [listener];
            } else {
                that._listeners[event].push(listener);
            }
        });
    };

    // View class
    function View(conf){
        Object.assign(this, conf);
        this.init();
    };

    View.prototype.clear = function(){
        this.$dom.parentNode.removeChild(this.$dom);
    };

    View.prototype.listenTo = function(model, event, listener){
        model.listen(event, listener);
    };

    // app
    var appModel = new Model({
        data: [],
        add: function(item){
            this.data.push(item);
            this.trigger('add', item);
        },

        remove: function(item){
            var index = this.data.indexOf(item);
            this.data.splice(index, 1);
            this.trigger('delete', index);
        }
    });

    var appView = new View({
        $dom: document.querySelector('#view'),
        init: function(){
            this.$count = this.$dom.querySelector('.jsCount');
            this.$list = this.$dom.querySelector('.jsList');
            this.$listEmpty = this.$dom.querySelector('.jsListEmpty');
            this.$input = this.$dom.querySelector('.jsInput');
            this.$add = this.$dom.querySelector('.jsAdd');

            this.$add.addEventListener('click', this._onClickAdd.bind(this), false);

            this.listenTo(appModel, 'add', this.add.bind(this));
            this.listenTo(appModel, 'delete', this.delete.bind(this));
            this.listenTo(appModel, 'add delete', this.update.bind(this));
        },

        add: function(item){
            var newItem = Render('#js-tmpl-item', item);
            newItem.querySelector('.jsDelete').addEventListener('click', function(){
                appModel.remove(item);
            }, false);
            this.$list.appendChild(newItem);
        },

        delete: function(index){
            this.$list.removeChild(this.$list.querySelectorAll('li')[index + 1]);
        },

        update: function(){
           this.$count.innerHTML = appModel.data.length;

            if (appModel.data.length > 0){
                this.$listEmpty.style.display = 'none';
            } else {
                this.$listEmpty.style.display = 'block';
            }
        },

        _onClickAdd: function(){
             var input = this.$input.value.trim();
            if (input.length === 0){
                return;
            }
            appModel.add(input);
            this.$input.value = '';
        }
    });
})();