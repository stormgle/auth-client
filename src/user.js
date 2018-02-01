"use strict"

const xhr = require('simple-json-xhr');

const USER = 'me';


function login(endPoint, credential, { onSuccess, onFailure }) {
  xhr.postJSON(endPoint, credential,
    {
      onSuccess(data) {
        storeUserData(data);
        onSuccess(data.user);
      },
      onFailure(err) {
        onFailure(err);
      }
    }
  );
}

function logout() {
  unstoreUserData();
}


function storeUserData(data) {
  if (typeof(Storage) !== "undefined") {
    localStorage.setItem(USER, JSON.stringify(data));
  } else {
    // Sorry! No Web Storage support..
    throw new Error("No Web Storage support") 
  }
}

function getUser() {
  return getData('user');
}

function getToken(service) {
  return getData('tokens')[service];
}


function getData(key) {
  if (typeof(Storage) !== "undefined") {
    const data = localStorage.getItem(USER);
    if (data) {
      return JSON.parse(data)[key];
    } else {
      return false;
    }
  } else {
    // Sorry! No Web Storage support..
    throw new Error("No Web Storage support") 
  }
}


function unstoreUserData() {
  if (typeof(Storage) !== "undefined") {
    localStorage.removeItem(USER);
  } else {
    // Sorry! No Web Storage support..
    throw new Error("No Web Storage support") 
  }
}


module.exports = { login, logout, getUser, getToken }