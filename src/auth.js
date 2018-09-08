"use strict"

/**
 * 
 */

import xhr  from 'simple-json-xhr'

const USER = 'me';

const auth = {
  _eventHandlers : {},
  _options: { cookies: [] },
  _emit,
  loginByPassword,
  logout,
  isLoggedUser,
  getUser,
  getToken,
  authGet,
  authPost,
  onStateChange
}

auth.use = function({cookie = false}) {
  if (cookie) {
    auth._options.cookies.push(cookie);
  }
  return auth;
}

export function loginByPassword(endPoint, credential, { onSuccess, onFailure }) {
  if (credential && credential.password) {
    xhr.postJSON({
      endPoint, 
      data: credential,
      onSuccess({status, data}) {
        _storeUserData(data);
        _setAuthCookies(data);
        _emit.call(auth, 'onStateChange', 'authenticated');
        onSuccess && onSuccess(data.user);
      },
      onFailure({status, err}) {
        _emit.call(auth, 'onStateChange', 'unauthenticated');
        onFailure && onFailure(status);     
      }
    });
  } else {
    _emit.call(auth, 'onStateChange', 'unauthenticated');
    onFailure({code: 401, err: 'password field is undefined'});
  }
}

export function logout() {
  _clearAuthCookies();
  _unstoreUserData();
  _emit.call(auth, 'onStateChange', 'unauthenticated');
}

export function signup(endPoint, credential, { onSuccess, onFailure }) {
  xhr.postJSON({
    endPoint,
    data: credential,
    onSuccess({status, data}) {
      _storeUserData(data);
      _setAuthCookies(data);
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
    onSuccess({status, data}) {
      onSuccess && onSuccess(data.data);
    },
    onFailure({status, err}) {
      onFailure && onFailure({status, err});
    }
  })
}

export function authPost({ endPoint, service, data, onSuccess, onFailure }) {
  const token = getToken(service);
  const header = { Authorization: `Bearer ${token}` }
  xhr.postJSON({
    endPoint,
    header,
    data,
    onSuccess({status, data}) {
      onSuccess && onSuccess(data.data);
    },
    onFailure({status, err}) {
      onFailure && onFailure({status, err});
    }
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
  const user = _getData('user');
  if (user) {
    user.update = _updateUser;
  }
  return user;
}

function _updateUser(data) {
  const _stored = _getData();
  const user = _stored.user;
  if (data) {
    for (let prop in data) {
      if (user[prop]) {
        user[prop] = {...user[prop], ...data[prop]}
      } else {
        user[prop] = data[prop];
      }
    }
    _storeUserData(_stored);
    // _emit.call(auth, 'onStateChange', 'updated');
  }
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
      return key ? JSON.parse(data)[key] : JSON.parse(data);
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

function _setAuthCookies(data) {
  __updateAuthCookies(data, 'set')
}

function _clearAuthCookies() {
  const data = _getData();
  __updateAuthCookies(data, 'clear')
}

function __updateAuthCookies(data, action) {
  if (!auth._options.cookies) {
    return
  }
  const cookies = auth._options.cookies;
  cookies.forEach( cookie => {
    if (typeof cookie === 'string') {
      if (data && data.tokens && data.tokens[cookie]) {
        if (action === 'set') {
          const value = data.tokens[cookie];
          _setCookie(cookie, value);
        } else {
          const expires = 'Thu, 01 Jan 1970 00:00:00 UTC';
          _setCookie(cookie, '', expires)
        }
      }  
    }
  })
}

function _setCookie(cname, cvalue, exdays) {
  let expires = exdays ? `expires=${exdays}` : '';
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function _getCookie(cname) {
  const name = cname + "=";
  const ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
          c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
      }
  }
  return "";
}

export default auth;