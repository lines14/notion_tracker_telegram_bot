import FSM from './FSM.js';

class StatesGroup {
  constructor(states) {
    this.states = states;
    this.keys = Object.keys(states);
    Object.assign(this, states);
  }

  next(currentState) {
    const index = this.keys.indexOf(currentState);
    if (index === -1 || index + 1 >= this.keys.length) return null;

    return this.states[this.keys[index + 1]];
  }

  first() {
    return this.states[this.keys[0]];
  }

  last() {
    return this.states[this.keys[this.keys.length - 1]];
  }

  start(userID) {
    const first = this.first();
    FSM.setState(userID, first);

    return first;
  }

  nextState(userID) {
    const currentState = FSM.getState(userID);
    const next = this.next(currentState);

    if (!next) {
      FSM.clearState(userID);

      return null;
    }

    FSM.setState(userID, next);

    return next;
  }

  clear(userID) { // eslint-disable-line class-methods-use-this
    FSM.clearState(userID);
  }

  getState(userID) { // eslint-disable-line class-methods-use-this
    return FSM.getState(userID);
  }

  getData(userID) { // eslint-disable-line class-methods-use-this
    if (!FSM.data[userID]) FSM.data[userID] = {};

    return FSM.data[userID];
  }

  setData(userID, key, value) {
    const data = this.getData(userID);
    data[key] = value;
  }

  clearData(userID) { // eslint-disable-line class-methods-use-this
    if (FSM.data[userID]) delete FSM.data[userID];
  }

  static from(...names) {
    const obj = Object.fromEntries(names.map((name) => [name, name]));

    return new StatesGroup(obj);
  }
}

export default StatesGroup;
