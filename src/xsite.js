"use strict"

const xsite = {

  onReceivedToken: null,

  getUserData: null,

  listen() {
    if (window) {
      window.addEventListener('message', (evt) => {
        const origin = evt.origin || evt.originalEvent.origin;
        const msg = evt.data;

        if (window.opener) {

          if (msg.type === 'ping') {
            const _pong = {
              trigger: 'auth',
              type: 'pong',
              data: null
            }
            window.opener.postMessage(_pong, origin);
            return
          }  
          
          if (msg.type === 'token') {
            // login by token
            const data = msg.data;
            this.onReceivedToken && this.onReceivedToken(data);
          }
          
        }
      })
    }
  },

  open(url, done) {

    if (window) {
      const targetOrigin = _extractOrigin(url)
      const _handler = window.open(url);
      const _ping = {
        trigger: 'auth',
        type: 'ping',
        data: null
      }
      const t = setInterval(() => {
        _handler.postMessage(_ping, targetOrigin) // should parse url to get origin
      })

      window.addEventListener('message', (evt) => {
        const origin = evt.origin || evt.originalEvent.origin;
        const msg = evt.data;

        if (msg.type === 'pong' && origin === targetOrigin) {
          clearInterval(t);
          // send token
          const data = this.getUserData();
          const _token = {
            trigger: 'auth',
            type: 'token',
            data
          }
          _handler.postMessage(_token, targetOrigin)
          done && done()
        }
      })
    }
  }

}

function _extractOrigin(url) {
  const _url = url.split('/');
  if ( /(^http:$|^https:$)/.test(_url[0]) ) {
    return `${_url[0]}//${_url[2]}`
  } else {
    return _url[0]
  }
}

module.exports = xsite;

