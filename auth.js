/* =====================================================
   auth.js — PlantIQ Client-Side Authentication
   Persistent session (stays logged in until logout)
   Storage: localStorage
   ===================================================== */

'use strict';

(function () {

  var USERS_KEY   = 'plantiq_users';
  var SESSION_KEY = 'plantiq_session';

  // djb2 hash — lightweight, not cryptographic (fine for a local personal app)
  function hashPassword(str) {
    var hash = 5381;
    for (var i = 0; i < str.length; i++) {
      hash = (((hash << 5) + hash) + str.charCodeAt(i)) | 0;
    }
    return (hash >>> 0).toString(16);
  }

  var Auth = {

    _getUsers: function () {
      try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); }
      catch (e) { return {}; }
    },

    _saveUsers: function (users) {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    },

    register: function (username, password) {
      var u = username.trim().toLowerCase();
      if (!u || u.length < 3)        return { ok: false, msg: 'Username must be at least 3 characters' };
      if (!/^[a-z0-9_]+$/.test(u))   return { ok: false, msg: 'Username: letters, numbers, underscore only' };
      if (!password || password.length < 6) return { ok: false, msg: 'Password must be at least 6 characters' };

      var users = this._getUsers();
      if (users[u])                   return { ok: false, msg: 'Username already taken' };

      users[u] = {
        username:  username.trim(),
        password:  hashPassword(password),
        createdAt: new Date().toISOString()
      };
      this._saveUsers(users);

      // Auto-login after register
      this._setSession(username.trim());
      return { ok: true, username: username.trim() };
    },

    login: function (username, password) {
      var u     = username.trim().toLowerCase();
      var users = this._getUsers();
      var user  = users[u];

      if (!user)                            return { ok: false, msg: 'Username not found' };
      if (user.password !== hashPassword(password))
                                             return { ok: false, msg: 'Incorrect password' };

      this._setSession(user.username);
      return { ok: true, username: user.username };
    },

    _setSession: function (username) {
      // Store in localStorage → persists across browser restarts until explicit logout
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        username:  username,
        loginTime: new Date().toISOString()
      }));
    },

    logout: function () {
      localStorage.removeItem(SESSION_KEY);
      window.location.replace('login.html');
    },

    isLoggedIn: function () {
      return !!localStorage.getItem(SESSION_KEY);
    },

    currentUser: function () {
      try {
        var s = localStorage.getItem(SESSION_KEY);
        return s ? JSON.parse(s).username : null;
      } catch (e) { return null; }
    },

    // Call on dashboard pages — redirects to login.html if not authenticated
    requireAuth: function () {
      if (!this.isLoggedIn()) {
        window.location.replace('login.html');
        return false;
      }
      return true;
    }
  };

  window.Auth = Auth;

})();
