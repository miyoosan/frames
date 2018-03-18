
jq: 2006年1月
AngularJS：2009年
Backbone: 2010年10月
React：2013年5月
Vue：2014年2月
http://todomvc.com/

开场白，自我介绍
简要介绍这些年前端的发展，常见的框架、库（只针对早期，因为都随时间进化）
  【优缺点，改进方面】
  jq: 函数库，方便操作DOM,AJAX
  backbone：数据与视图一定程度分离（网易微博的前端框架类似于它）
    主要提供了3个东西：1、models(模型) 2、collections(集合) 3、views(视图)
    必须依赖于另一个JS文件：underscore.js
    支持第三方模版
    Backbone的Model没有与UI视图数据绑定，而是需要在View中自行操作DOM来更新或读取UI数据，这点很奇怪。AngularJS与此相反
  angularjs：MVVM，数据双向绑定，脏检测，完整的框架
            module、controller、scope、factory、service、watcher、digest
    脏检查（dirty checking）机制
    每一个指令都会有一个对应的用来观测数据的对象，叫做watcher；一个作用域中会有很多个watcher
    每当界面需要更新时，Angular会遍历当前作用域里的所有watcher，对它们一一求值，然后和之前保存的旧值进行比较。如果求值的结果变化了，就触发对应的更新，这个过程叫做digest cycle。
    watcher的数量庞大时，应用的性能就不可避免地受到影响，并且很难优化
    当数据变动时，框架并不能主动侦测到变化的发生，需要手动触发digest cycle才能触发相应的DOM 更新。
    AngularJS只是定义了一个环境和一个数据与视图交互的机制，并提供了若干通用组件和服务，所以AngularJS开发很简单，很高效，很“原生态”。
  react：数据单向绑定，数据与渲染分离，视图库
    特点：
1.声明式设计：React采用声明范式，可以轻松描述应用。
2.高效：React通过对DOM的模拟，最大限度地减少与DOM的交互。
3.灵活：React可以与已知的库或框架很好地配合。

  flux：单向数据流，状态管理库
  redux：更好的单向数据流
  vue：MVVM，依赖检测
    Vue.js采用的则是基于依赖收集的观测机制
    Object.defineProperty方法，将数据对象的属性改造为getter和setter实现依赖的收集和触发
    数据操作的逻辑更为清晰流畅，和第三方数据同步方案的整合也更为方便。
    支持第三方模版
    在模板的编译过程中，Vue.js会为每一处需要动态更新的DOM节点创建一个指令对象。
    每当一个指令对象观测的数据变化时，它便会对所绑定的目标节点执行相应的DOM操作。
    基于指令的数据绑定使得具体的DOM操作都被合理地封装在指令定义中，业务代码只需要涉及模板和对数据状态的操作即可。
    这使得应用的开发效率和可维护性都大大提升。
