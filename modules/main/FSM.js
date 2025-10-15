class FSM {
  constructor() {
    this.userStates = new Map();
    this.data = {};
  }

  setState(userID, state) {
    this.userStates.set(userID, state);
  }

  getState(userID) {
    return this.userStates.get(userID);
  }

  clearState(userID) {
    this.userStates.delete(userID);
    if (this.data[userID]) delete this.data[userID];
  }

  hasState(userID) {
    return this.userStates.has(userID);
  }
}

export default new FSM();
