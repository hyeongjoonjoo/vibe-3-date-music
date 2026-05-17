import { isMonthDayInRange, parseSelectedDate, toISODate, toMonthDay } from "./dateUtils.js";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function renderCalendarGrid({ selectedDate, events }) {
  const date = parseSelectedDate(selectedDate);
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstOfMonth = new Date(year, month, 1, 12);
  const start = new Date(year, month, 1 - firstOfMonth.getDay(), 12);
  const cells = [];

  for (let index = 0; index < 42; index += 1) {
    const current = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index, 12);
    const markers = getMarkersForDate(current, events);
    cells.push({
      date: current,
      iso: toISODate(current),
      label: String(current.getDate()),
      inMonth: current.getMonth() === month,
      selected: toISODate(current) === toISODate(date),
      publicHoliday: markers.publicHoliday,
      eventDay: markers.eventDay,
      seasonal: markers.seasonal,
      labelText: markers.labelText
    });
  }

  return {
    monthLabel: new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric"
    }).format(date),
    weekdayLabels: WEEKDAY_LABELS,
    cells
  };
}

function getMarkersForDate(date, events) {
  const iso = toISODate(date);
  const monthDay = toMonthDay(date);
  const year = String(date.getFullYear());
  const labels = [];
  let publicHoliday = false;
  let eventDay = false;
  let seasonal = false;

  for (const item of events) {
    const rule = item.dateRule || {};
    const label = item.labels?.ko || item.id;

    if (rule.kind === "month-day" && rule.monthDay === monthDay) {
      if (item.publicHoliday) {
        publicHoliday = true;
      } else {
        eventDay = true;
      }
      labels.push(label);
    }

    if (rule.kind === "month-day-range" && isMonthDayInRange(monthDay, rule.startMonthDay, rule.endMonthDay)) {
      seasonal = true;
      labels.push(label);
    }

    if (rule.kind === "single-date-by-year") {
      const entry = rule.datesByYear?.[year];
      if (entry && (entry.mainDate === iso || (entry.observedDates || []).includes(iso))) {
        if (item.publicHoliday) {
          publicHoliday = true;
        } else {
          eventDay = true;
        }
        labels.push(label);
      }
    }

    if (rule.kind === "date-range-by-year") {
      const entry = rule.datesByYear?.[year];
      if (entry && iso >= entry.start && iso <= entry.end) {
        if (item.publicHoliday) {
          publicHoliday = true;
        } else {
          eventDay = true;
        }
        labels.push(label);
      }
    }
  }

  return {
    publicHoliday,
    eventDay,
    seasonal,
    labelText: labels.join(", ")
  };
}
