const SHIFT_PERIOD_ORDER = { early: 0, mid: 1, late: 2 };

/** Margine sinistro base e scarto orizzontale tra turni sovrapposti */
const LEFT_GUTTER_PX = 4;
const STAGGER_PX = 10;
const RIGHT_GUTTER_PX = 6;

function eventsOverlap(a, b, minimumStartDifference) {
  return (
    a.startMs < b.endMs - minimumStartDifference &&
    b.startMs < a.endMs - minimumStartDifference
  );
}

function getShiftPeriodRank(event) {
  if (!event?.isShift) return 0;
  return SHIFT_PERIOD_ORDER[event.period] ?? 0;
}

/**
 * Layout turni: tutte le pill hanno la stessa larghezza; in sovrapposizione
 * quelle sotto slittano di pochi px a destra per far vedere la fine del turno sopra.
 */
export function shiftStaggerDayLayout({
  events,
  minimumStartDifference = 10,
  slotMetrics,
  accessors,
}) {
  if (!events?.length) return [];

  const eventWidth = `calc(100% - ${RIGHT_GUTTER_PX}px)`;

  const items = events.map((event) => {
    const startDate = accessors.start(event);
    const endDate = accessors.end(event);
    const { top, height } = slotMetrics.getRange(startDate, endDate);

    return {
      event,
      startMs: +startDate,
      endMs: +endDate,
      top,
      height,
      periodRank: getShiftPeriodRank(event),
    };
  });

  items.sort((a, b) => {
    if (a.startMs !== b.startMs) return a.startMs - b.startMs;
    if (a.periodRank !== b.periodRank) return a.periodRank - b.periodRank;
    return b.endMs - a.endMs;
  });

  items.forEach((item, itemIndex) => {
    let depth = 0;

    for (let otherIndex = 0; otherIndex < items.length; otherIndex += 1) {
      const other = items[otherIndex];
      if (other === item) continue;
      if (!eventsOverlap(item, other, minimumStartDifference)) continue;

      if (item.periodRank < other.periodRank) {
        depth = Math.max(depth, (other.depth ?? 0) + 1);
      } else if (item.periodRank === other.periodRank && otherIndex < itemIndex) {
        depth = Math.max(depth, (other.depth ?? 0) + 1);
      }
    }

    item.depth = depth;
  });

  return items.map((item) => ({
    event: item.event,
    style: {
      top: item.top,
      height: item.height,
      width: eventWidth,
      xOffset:
        item.depth === 0
          ? `${LEFT_GUTTER_PX}px`
          : `calc(${LEFT_GUTTER_PX}px + ${item.depth * STAGGER_PX}px)`,
    },
  }));
}
