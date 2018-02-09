"use strict"

/**
 * 
 */

import xhr  from 'simple-json-xhr'

const USER = 'me';

const auth = {
  _eventHandlers : {},
  _emit,
  loginByPassword,
  logout,
  isLoggedUser,
  getUser,
  getToken,
  onStateChange
}

export function loginByPassword(endPoint, credential, { onSuccess, onFailure }) {
  if (credential && credential.password) {
    xhr.postJSON(endPoint, credential,
      {
        onSuccess(data) {
          _storeUserData(data);
          _emit.call(auth, 'onStateChange', 'authenticated');
          onSuccess && onSuccess(data.user);
        },
        onFailure(err) {
          _emit.call(auth, 'onStateChange', 'unauthenticated');
          onFailure && onFailure(err);
        }
      }
    );
  } else {
    _emit.call(auth, 'onStateChange', 'unauthenticated');
    onFailure('password field is undefined');
  }
}

export function logout() {
  _unstoreUserData();
  _emit.call(auth, 'onStateChange', 'unauthenticated');
}

export function isLoggedUser() { // not tested
  if (localStorage.getItem(USER)) {
    return true;
  } else {
    return false;
  }
}

export function getUser() {
  return _getData('user');
}

export function getToken(service) {
  return _getData('tokens')[service];
}

function onStateChange(callback) {

  const stateChangeFn = (state) => {
    callback.call(this, state, getUser());
  }

  if (this._eventHandlers['onStateChange']) {
    this._eventHandlers['onStateChange'].push(stateChangeFn);
  } else {
    this._eventHandlers['onStateChange'] = [stateChangeFn];
  }

  /* if user logged status is stored invoke callback */
  if (isLoggedUser()) {
    callback.call(this, 'authenticated', getUser());
  }

}

function _storeUserData(data) {
  if (typeof(Storage) !== "undefined") {
    localStorage.setItem(USER, JSON.stringify(data));
  } else {
    // Sorry! No Web Storage support..
    throw new Error("No Web Storage support") 
  }
}

function _emit(event, ...args) {
  if (this._eventHandlers[event]) {
    this._eventHandlers[event].forEach(handler => handler.call(this, args));
  }
  return this;
}

function _getData(key) {
  if (typeof(Storage) !== "undefined") {
    const data = localStorage.getItem(USER);
    if (data) {
      return JSON.parse(data)[key];
    } else {
      return undefined;
    }
  } else {
    // Sorry! No Web Storage support..
    throw new Error("No Web Storage support") 
  }
}

function _unstoreUserData() {
  if (typeof(Storage) !== "undefined") {
    localStorage.removeItem(USER);
  } else {
    // Sorry! No Web Storage support..
    throw new Error("No Web Storage support") 
  }
}

export default auth;