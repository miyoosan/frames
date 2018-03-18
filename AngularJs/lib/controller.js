/**
 * Controller
 */
class Controller {
  constructor(){
      this.scope = new Scope();
  }

  init(){
      parseDom(document.body, this.scope);
      digest();
  }
}