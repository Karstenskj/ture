/* NZ-program: kalenderen vælger en dag, de eksisterende kort bevarer deres links. */
(function () {
  'use strict';
  var program = document.getElementById('program');
  if (!program) return;
  var days = Array.from(program.querySelectorAll('.calendar-day-details > .day'));
  var dates = Array.from(program.querySelectorAll('[data-calendar-day]'));
  var label = document.getElementById('calendar-selected-label');
  var steps = Array.from(program.querySelectorAll('[data-calendar-step]'));
  var selected = 0;
  if (!days.length) return;

  function select(index) {
    selected = Math.max(0, Math.min(days.length - 1, index));
    days.forEach(function (day, i) { day.hidden = i !== selected; });
    dates.forEach(function (link, i) {
      if (i === selected) link.setAttribute('aria-current', 'date');
      else link.removeAttribute('aria-current');
    });
    label.textContent = days[selected].querySelector('.dow').textContent + ' ' + days[selected].querySelector('.date').textContent;
    steps.forEach(function (button) {
      var offset = Number(button.dataset.calendarStep);
      button.disabled = selected + offset < 0 || selected + offset >= days.length;
    });
  }

  window.tripCalendar = {
    selectFor: function (element) {
      var day = element && element.closest('.calendar-day-details > .day');
      if (day) select(days.indexOf(day));
      else select(selected);
    }
  };
  steps.forEach(function (button) {
    button.addEventListener('click', function () {
      var next = selected + Number(button.dataset.calendarStep);
      if (next >= 0 && next < days.length) location.hash = days[next].id;
    });
  });
  dates.forEach(function (link, index) {
    link.addEventListener('click', function () { select(index); });
    link.addEventListener('keydown', function (event) {
      var next;
      if (event.key === 'ArrowRight') next = index + 1;
      if (event.key === 'ArrowLeft') next = index - 1;
      if (event.key === 'ArrowDown') next = index + 7;
      if (event.key === 'ArrowUp') next = index - 7;
      if (event.key === 'Home') next = index - index % 7;
      if (event.key === 'End') next = Math.min(index - index % 7 + 6, dates.length - 1);
      if (next !== undefined) {
        event.preventDefault();
        dates[Math.max(0, Math.min(dates.length - 1, next))].focus();
      }
    });
  });
  select(0);
})();
