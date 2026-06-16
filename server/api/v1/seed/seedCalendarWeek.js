import EventModel from "../../../db/models/Event.js";
import UserShiftModel from "../../../db/models/UserShift.js";
import UserModel from "../../../db/models/User.js";

export const CALENDAR_WEEK_MARKER = "[AUTO_CALENDAR_WEEK]";

function startOfWeekMonday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const WEEK_EVENTS = [
  {
    title: "Briefing settimanale",
    kind: "meeting",
    dayOffset: 0,
    startH: 9,
    startM: 0,
    endH: 9,
    endM: 45,
    location: "Sala riunioni A",
    department: "Direzione",
    audience: "Responsabili di reparto",
    body: "Allineamento priorità e obiettivi della settimana.",
  },
  {
    title: "Riunione reparto vendite",
    kind: "meeting",
    dayOffset: 1,
    startH: 10,
    startM: 0,
    endH: 11,
    endM: 0,
    location: "Sede Milano",
    department: "Vendite",
    audience: "Team vendite",
    body: "Review pipeline commerciale e forecast mensile.",
  },
  {
    title: "Formazione sicurezza",
    kind: "event",
    dayOffset: 2,
    startH: 14,
    startM: 0,
    endH: 16,
    endM: 0,
    location: "Aula formazione",
    department: "HR",
    audience: "Personale operativo",
    body: "Aggiornamento procedure antincendio e DPI.",
  },
  {
    title: "Inventario rotativo",
    kind: "event",
    dayOffset: 3,
    startH: 8,
    startM: 0,
    endH: 12,
    endM: 0,
    location: "Magazzino centrale",
    department: "Magazzino",
    audience: "Team magazzino",
    body: "Conteggio campionario categorie ad alta rotazione.",
  },
  {
    title: "Town hall aziendale",
    kind: "event",
    dayOffset: 4,
    startH: 16,
    startM: 0,
    endH: 17,
    endM: 0,
    location: "Tutte le sedi",
    department: "Aziendale",
    audience: "Tutti i dipendenti",
    body: "Comunicazioni generali e Q&A con la direzione.",
  },
];

const SHIFT_PATTERNS = [
  {
    monday: { early: true, mid: false, late: false },
    tuesday: { early: false, mid: true, late: false },
    wednesday: { early: false, mid: false, late: true },
    thursday: { early: true, mid: false, late: false },
    friday: { early: false, mid: true, late: false },
    saturday: { early: false, mid: false, late: true },
  },
  {
    monday: { early: false, mid: true, late: false },
    tuesday: { early: false, mid: false, late: true },
    wednesday: { early: true, mid: false, late: false },
    thursday: { early: false, mid: true, late: false },
    friday: { early: false, mid: false, late: true },
    saturday: { early: true, mid: false, late: false },
  },
  {
    monday: { early: false, mid: false, late: true },
    tuesday: { early: true, mid: false, late: false },
    wednesday: { early: false, mid: true, late: false },
    thursday: { early: false, mid: false, late: true },
    friday: { early: true, mid: false, late: false },
    saturday: { early: false, mid: true, late: false },
  },
  {
    monday: { early: true, mid: false, late: false },
    tuesday: { early: false, mid: false, late: true },
    wednesday: { early: false, mid: true, late: false },
    thursday: { early: true, mid: false, late: false },
    friday: { early: false, mid: false, late: true },
    saturday: { early: false, mid: true, late: false },
  },
];

function buildEventDescription(ev) {
  const tipo = ev.kind === "meeting" ? "riunione" : "evento";
  const meta = [
    `Tipo: ${tipo}`,
    `Sede: ${ev.location}`,
    `Reparto: ${ev.department}`,
    `Destinatari: ${ev.audience}`,
  ].join("\n");
  return `${CALENDAR_WEEK_MARKER}\n${meta}\n\n${ev.body}`;
}

function buildEventDates(weekStart, ev) {
  const start = addDays(weekStart, ev.dayOffset);
  start.setHours(ev.startH, ev.startM, 0, 0);
  const end = addDays(weekStart, ev.dayOffset);
  end.setHours(ev.endH, ev.endM, 0, 0);
  if (end <= start) end.setHours(ev.endH + 1, 0, 0, 0);
  return { startDate: start, endDate: end };
}

/**
 * Ricrea eventi demo nella settimana corrente e garantisce turni settimanali
 * compilati per ogni utente attivo (si ripetono ogni settimana nel calendario).
 */
export async function seedCalendarWeek(referenceDate = new Date()) {
  const weekStart = startOfWeekMonday(referenceDate);

  await EventModel.deleteMany({
    description: { $regex: `^${CALENDAR_WEEK_MARKER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}` },
  });

  const eventDocs = WEEK_EVENTS.map((ev) => {
    const { startDate, endDate } = buildEventDates(weekStart, ev);
    return {
      title: ev.title,
      description: buildEventDescription(ev),
      startDate,
      endDate,
    };
  });

  const insertedEvents = await EventModel.insertMany(eventDocs);

  const users = await UserModel.find({ isActive: { $ne: false } })
    .select("_id firstName lastName role")
    .lean();

  let shiftsUpdated = 0;

  for (let i = 0; i < users.length; i += 1) {
    const pattern = SHIFT_PATTERNS[i % SHIFT_PATTERNS.length];
    await UserShiftModel.findOneAndUpdate(
      { user: users[i]._id },
      { $set: { shifts: pattern } },
      { upsert: true, new: true, runValidators: true }
    );
    shiftsUpdated += 1;
  }

  return {
    weekStart: weekStart.toISOString(),
    events: insertedEvents.length,
    shifts: shiftsUpdated,
    users: users.length,
  };
}

export default seedCalendarWeek;
