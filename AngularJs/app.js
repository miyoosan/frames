// directive todo-item
Directive.create('todo-item', {
    tmpl: '<li>{todo.name}<button click="remove(todo)">x</button></li>',
    scope: {
        todo: '='
    }
});

// directive add-todo
Directive.create('add-todo', {
    tmpl: '<input type="text" model="newItemName"><button click="add(newIem)">add</button>',
    scope: {
        newItemName: '',
        addItem: '=',
        add() {
            this.addItem({
                name: this.newItemName
            });

            this.newItemName = '';
        }
    }
});

// app
class appController extends Controller {
    constructor(props) {
        super(props);
        Object.assign(this.scope, {
            todos: [],
            remove: this.remove.bind(this),
            addItem: this.add.bind(this)
        });
        this.init();
    }

    remove(item){
        let index = this.scope.todos.indexOf(item);
        this.scope.todos.splice(index, 1);
    }

    add(item){
        this.scope.todos.push(item);
    }
}

window.app = new appController();