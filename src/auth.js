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
  authGet,
  onStateChange
}

export function loginByPassword(endPoint, credential, { onSuccess, onFailure }) {
  if (credential && credential.password) {
    xhr.postJSON({
      endPoint, 
      data: credential,
      onSuccess({status, data}) {
        _storeUserData(data);
        _emit.call(auth, 'onStateChange', 'authenticated');
        onSuccess && onSuccess(data.user);
      },
      onFailure({status, err}) {
        _emit.call(auth, 'onStateChange', 'unauthenticated');
        if (status >= 500) {
          onFailure && onFailure(status);  // indicate server error
        } else {
          onFailure && onFailure(err);
        }          
      }
    });
  } else {
    _emit.call(auth, 'onStateChange', 'unauthenticated');
    onFailure({code: 401, err: 'password field is undefined'});
  }
}

export function logout() {
  _unstoreUserData();
  _emit.call(auth, 'onStateChange', 'unauthenticated');
}

export function signup(endPoint, credential, { onSuccess, onFailure }) {
  xhr.postJSON({
    endPoint,
    data: credential,
    onSuccess({status, data}) {
      _storeUserData(data);
      _emit.call(auth, 'onStateChange', 'authenticated');
      onSuccess && onSuccess(data.user);
    },
    onFailure({status, err}) {
      onFailure && onFailure(err);
    }
  })
}

export function authGet({ endPoint, service, data, onSuccess, onFailure }) {
  const token = getToken(service);
  const header = { Authorization: `Bearer ${token}` }
  xhr.getJSON({
    endPoint,
    header,
    data,
    onSuccess,
    onFailure
  })
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

export function checkUserExist(endPoint, query, { onSuccess, onFailure }) {
  xhr.postJSON({
    endPoint,
    data: query,      
    onSuccess({status, data}) {
      onSuccess && onSuccess(data.user);
    },
    onFailure({status, err}) {
      onFailure && onFailure(err);
    }
  })
}

export function isEmail(str) {
  const emailPatt = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailPatt.test(str);
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
    this._eventHandlers[event].forEach(handler => handler.call(this, ...args));
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