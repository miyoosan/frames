/**
 * scope class
 */
class Scope {
  /**
   * create a new scope based on this
   * @param Object conf - configuration
   */
  $new(conf){
      return Object.create(this);
  }
}