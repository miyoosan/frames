1.新增todo item的时候需要定义个模版，可以写死在js中，但是感觉定义在模版中更加直观。
思考：
  dom初始化比较烦人，var $count; var $list; var $listEmpty这一些有没有办法省略。
  事件绑定也比较繁琐，添加todo的按钮，已经后续js声称的item中的event都要js中手动进行绑定，如果能在模版中定义自动完成就好了。
  updateCount被调用了多次，能否处理成自动的。
  html中出现了<script>模版，感觉有点不好看。

  目前app感觉各种复杂，首先在html里面需要定义各种标记class，然后在整改js里面操作数组同步显示。我们能不能把掌管数组的data和显示分开呢？
我们在addItem方法里面实际上进行了dom操作，感觉耦合不是太好，我们尝试把dom操作和view操作分开。


2.通过model和view的关系，我们可以写出更加整洁易于理解的代码，此外model view部分我们也可以拆分成不同的文件，方便进行管理。这跟Backbone差不多，Backbone的思想还是停留在原生的基础上。
思考：
  事件需要js进行绑定，我们看到为了绑定时间我们需要定义专门的js class名。（虽然BackBone允许我们直接用mapping的方式直观定义事件绑定，但是没有逃脱出js绑定的本质）。如果能在html中直接定义就好了。
  我们的html非常简单一个list，对于list这种很规整的数据，html能不能自己关注Model自动更新？而不需要js手动添加add, delete方法进行操作。简单的说，这个app能不能再聪明一些？我添加・删除了一个item，你能不能自觉的反应到html中？


3.我们把js代码中的数据和表现部分进行了分离。完成是完成了，但是总感觉不是很顺畅，我们尝试进行优化。
思考：
  因为模版中已经有了{count}这个特殊标记，所以通过class名标记目标dom的方法可以去掉，模版能够自己完成。如何实现呢？
    当检测到{attribute}的时候，我们将这个dom和对应的attribute绑定。我们的例子中是 count
    当model中的list增减的时候，count的变化我们并不知道，所以在更新model的时候，我们需要高速模版count发生了变化。这个过程我们可以复用model已有的event处理系统，响应的event以'set:'打头以是区分。
  根据以上分析，传入给Render的data不能再是单纯的data，而只能是model。

  虽然根据上述的优化，count的显示已经自动bind了，但是空列表文案 no item的显示还是由view中的update方法进行控制的
  这部分我们也想办法融合到模版中好了。如何实现呢？比如如果我们要实现下面这种直观的代码:
    <li style={'display': count > 0 ? 'block' : 'none'}>no item</li>

  在我们的view中，我们还用了一个.jsList来引用列表元素的dom来删减todo item，这部分我们也想写到模版中，比如这样:
    <li for="item in todos">{item.name}/li>
  这样我们就不需要手动进行dom操作了，更新model中的数组，view自动会为我们更新。

  我们提出了一个也许更理想的方案－－一个更强大的模版解释器，让我们可以更专注于数据Model层而不需要关心显示层View的相关东西

4.数组的本身所有的属性，但是parse的时候并不知道这一点，只能统统按照可能变动的属性进行处理，能否自动bind??
思考：
  listener不再监听事件，而是等着expression值发生变化的时候才被触发，所以appModel的trigger/listen方法，以及event相关的可以删掉了。 数据更新的时候，我们需要检测所有listener对应的expression，这个方法我们命名为digest()好了。

  相信有Angular经验的同学已经发现了，这正是angular中的digest思想。其中检测各个expression的值变化的行为就叫做 dirty-check

  bindNode中将parsed.expression和bind过后的update做一个watcher存在全局数组中，这个数组我们命名为watchers。

  而appModel.data出现了add和remove方法，所以不纯粹是个data了，我们改名为 scope。 然后去掉相关event的触发，并在add、remove的方法中调用digest()，digest稍后再写。

  appModel也不仅仅是model了，改名为controller，而Model Class已经没有用了。删掉。

继续优化：
  在我们的app逻辑中，digest被调用了多次。如果我们能预先知道数据可能变化的话，digest的调用可以变为自动的。 这个Todoapp很简单了，数据的变化之可能发生在click事件中，所以digest我们移动到parseDom中。 然后app初始化的时候必然调用parseDom和digest，这个包装在一个controller中好了。

  至此，我们可以看到angular的影子了，其实angular相对于前面的原生js也好backbone也好，它最大的功用就是简化了咱们开发者的思维，目前我们的todo app是定义了html模版（当然有一些特殊的语法），然后在js中按照规定的方法创建controller，然后更新数据，dom会自动地更新不需要我们操心。虽然实际angular中的处理远比我们的要复杂，不过思想上面我觉得就是这样来实现的dirty-check的。

  通过diffing实现更好的digest loop

  有一个想法是，item和input的部分，能不能抽离出来单独处理，尽量拆分成单元有利于维护和重用

  首先再次回顾目前app的运作逻辑:
    parseDom，检测dom中的特殊逻辑(directive)
    将directive中的逻辑和dom进行绑定(bind)
    根据scope中的数据进行一遍 digest
    当scope的数据可能发生了变化的时候, digest
    可以看出要支持<todo-item>的话，有以下事情要做：

      为了在parseDom中可以识别出来，需要有一个包含所有directive的数组。
      directive需要有html模版，由于模版分开了，表达式也跟着需要变化，{item.name} => {todo.name}。
      directive需要支持callback的传递，比如remove(item) 和add()
      directive需要支持传递数据，比如todos="todos"，todo="item"，这导致directive有维护一个scope的需求，scope将出现层级结构。
      <todo-item for="item in todos"></todo-item>这种情况，需要优先识别for，directive 需要有优先级。
      当parseDom遇到自定义directive的时候，如果有模版，需要注入(init)；如果有数据需要传递，需要新建一个scope。
      directive需要单例化，因为directive只是帮助创建watcher，没必要重复创建。

5.试着添加和删除ToDo，可以看见不停的有digest，所谓的dirty-check就是在数据可能发生变化的时候自己进行检测，在最开始angular scope诞生的时候，这一招是为了减少人工操作，避免手动指定dom更新，但是现在有了一个更聪明的办法。

优化：
  props和scope的数据需要全部更换为getter/setter。
  当一个watcherA计算val的时候，调用到所有的getter都是这个watcher的依赖。所以getter中需要绑定watcher和setter的关系。
  当setter被调用时，触发所有和setter绑定的watcher。
  如此一来，digest()就不必要了，模版的parse变得简单了，依赖关系的处理着实非常聪明，好处是只触发了需要的watcher，达到了dom的最小更新。


思考：
  directive是app中的子组件，可以复用的功能单元，scope概念的出现更佳容易理解，相当于模版(view)一一对应的数据源(viewModel)
  对于一个真实的app环境，可以按照如下方法进行模块设计：
    创建一个app controller
    根据模版语法，创建模版
    根据模版显示所需要的数据和方法，定义scope
    数据model的管理，api的调用等在controller中完成，和view无关，可以自由划分模块。

  directive本身的出现，是为了强化模版部分，让其支持扩展，支持本身html不支持的自定义tag等。
  在本例中，并没有看出controller和directive的本质区别，除了controller做了更多的内容， controller做了如下directive中没有做的部分：
    初始化scope
    初始化parseDom
    初始dijest
  注意，这3个部分，directive如果包含的话，也没有啥问题的样子。以目前的代码为例，如果directive可以处理初始化的工作的话，定义个一个<app>的directive可以包括完整的逻辑。
  如果能做到这一步的话，我们的app逻辑就更简单了，但是directive负责的内容将更多，因为它包含了初始化的方法以及需要能够渲染到具体dom的方法等，所以Directive的名字将不再合适，我们为它取一个新名字 - Component。