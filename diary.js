/* =====================================================
   diary.js — PlantIQ Crop Diary
   Per-user diary stored in localStorage
   ===================================================== */

'use strict';

(function () {

  var Diary = {

    _key: function () {
      var user = window.Auth && Auth.currentUser();
      return 'plantiq_diary_' + (user || 'guest').toLowerCase();
    },

    // ── CRUD ──────────────────────────────────────────
    getAll: function () {
      try { return JSON.parse(localStorage.getItem(this._key()) || '[]'); }
      catch (e) { return []; }
    },

    save: function (entry) {
      var entries  = this.getAll();
      entry.id        = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      entry.timestamp = new Date().toISOString();
      entries.unshift(entry);   // newest first
      localStorage.setItem(this._key(), JSON.stringify(entries));
      return entry;
    },

    deleteEntry: function (id) {
      var entries = this.getAll().filter(function (e) { return e.id !== id; });
      localStorage.setItem(this._key(), JSON.stringify(entries));
    },

    count: function () { return this.getAll().length; },

    // ── RENDER ────────────────────────────────────────
    renderAll: function (container) {
      var entries = this.getAll();
      container.innerHTML = '';

      if (entries.length === 0) {
        container.innerHTML =
          '<div class="diary-empty">' +
            '<div class="diary-empty-icon">📔</div>' +
            '<p>No diary entries yet.</p>' +
            '<p class="diary-empty-sub">Run an analysis and click <strong>Save to Diary</strong> to record today\'s crop conditions.</p>' +
          '</div>';
        return;
      }

      var html = '<div class="diary-timeline">';
      entries.forEach(function (entry, i) {
        html += Diary._entryHTML(entry, i);
      });
      html += '</div>';
      container.innerHTML = html;

      // Bind delete buttons
      container.querySelectorAll('.diary-delete-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          var id = btn.dataset.id;
          if (confirm('Delete this diary entry?')) {
            Diary.deleteEntry(id);
            Diary.renderAll(container);
            Diary._updateBadge();
            if (window.showToast) showToast('📔 Entry deleted', 'info');
          }
        });
      });

      // Bind expand/collapse
      container.querySelectorAll('.diary-card-header').forEach(function (header) {
        header.addEventListener('click', function () {
          var card = header.closest('.diary-card');
          card.classList.toggle('expanded');
        });
      });
    },

    _entryHTML: function (entry, index) {
      var d      = new Date(entry.timestamp);
      var dateStr  = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
      var timeStr  = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      var cropEmoji = entry.cropEmoji || '🌱';
      var alerts    = entry.alerts || [];
      var weather   = entry.weather || {};

      var alertsHTML = alerts.slice(0, 3).map(function (a) {
        return '<span class="diary-alert-tag ' + a.type + '">' + a.icon + ' ' + a.title + '</span>';
      }).join('');

      var weatherHTML = '';
      if (weather.temp != null) {
        weatherHTML =
          '<div class="diary-weather-row">' +
            '<span>🌡️ ' + weather.temp + '°C</span>' +
            '<span>💧 ' + weather.humidity + '%</span>' +
            '<span>🌧️ ' + weather.rain + 'mm</span>' +
            '<span>☀️ UV ' + (weather.uv || 0) + '</span>' +
            '<span>💨 ' + (weather.wind || 0) + 'km/h</span>' +
          '</div>';
      }

      return (
        '<div class="diary-card" data-id="' + entry.id + '">' +
          '<div class="diary-node"></div>' +
          '<div class="diary-card-inner">' +
            '<div class="diary-card-header">' +
              '<div class="diary-card-left">' +
                '<span class="diary-crop-emoji">' + cropEmoji + '</span>' +
                '<div class="diary-meta">' +
                  '<div class="diary-crop-name">' + (entry.cropName || 'Unknown') + ' — ' + (entry.soil || '') + ' Soil</div>' +
                  '<div class="diary-date">' + dateStr + ' · ' + timeStr + '</div>' +
                '</div>' +
              '</div>' +
              '<div class="diary-card-right">' +
                '<span class="diary-moisture-badge">💦 ' + (entry.moisture || '--') + '%</span>' +
                '<button class="diary-delete-btn" data-id="' + entry.id + '" title="Delete entry">🗑️</button>' +
                '<span class="diary-expand-icon">›</span>' +
              '</div>' +
            '</div>' +

            '<div class="diary-card-body">' +
              weatherHTML +
              (alertsHTML ? '<div class="diary-alerts-row">' + alertsHTML + '</div>' : '') +
              (entry.notes ? '<div class="diary-notes"><span class="diary-notes-label">📝 Notes</span><p>' + _escapeHTML(entry.notes) + '</p></div>' : '') +
            '</div>' +
          '</div>' +
        '</div>'
      );
    },

    _updateBadge: function () {
      var badge = document.getElementById('diaryBadge');
      if (!badge) return;
      var n = this.count();
      badge.textContent = n;
      badge.style.display = n > 0 ? 'inline-flex' : 'none';
    }
  };

  function _escapeHTML(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '<br>');
  }

  window.Diary = Diary;

})();
