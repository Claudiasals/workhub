import { useMemo, useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { it, enGB } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { CalendarIcon, MapPinIcon, UsersIcon, PlusCircleIcon, TrashIcon } from "@phosphor-icons/react";
import { useSelector, useDispatch } from "react-redux";

import Drawer from "../Drawer";
import AppFeedbackModal from "../AppFeedbackModal";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import {
  fetchEventsAsync,
  createEventAsync,
  updateEventAsync,
  deleteEventAsync,
} from "../../store/feature/eventsSlice";
import { generateCommunicationRequest } from "../../api/aiApi";
import { AiBadge } from "../ai/AiInsightPanel";

const locales = { it, en: enGB };

const localizer = dateFnsLocalizer({
  format,
  parse,
  getDay,
  startOfWeek: (date, culture) =>
    startOfWeek(date, { locale: locales[culture] || it, weekStartsOn: 1 }),
  locales,
});

const DEMO_EVENTS = [
  {
    id: "demo-1",
    title: "Riunione reparto vendite",
    dayOffset: 1,
    startHour: 9,
    endHour: 10,
    location: "Sede Milano",
    department: "Vendite",
    description: "Allineamento obiettivi mensili e review KPI.",
    audience: "Team vendite",
    isDemo: true,
  },
  {
    id: "demo-2",
    title: "Inventario trimestrale",
    dayOffset: 3,
    startHour: 8,
    endHour: 12,
    location: "Magazzino centrale",
    department: "Magazzino",
    description: "Conteggio completo categorie ad alto valore.",
    audience: "Magazzino + responsabili sede",
    isDemo: true,
  },
];

const emptyForm = () => ({
  _id: null,
  title: "",
  date: new Date().toISOString().slice(0, 10),
  startTime: "09:00",
  endTime: "10:00",
  location: "",
  department: "",
  audience: "",
  description: "",
});

function buildEventDescription(form) {
  const meta = [
    form.location && `Sede: ${form.location}`,
    form.department && `Reparto: ${form.department}`,
    form.audience && `Destinatari: ${form.audience}`,
  ]
    .filter(Boolean)
    .join("\n");
  return meta ? `${meta}\n\n${form.description}` : form.description;
}

function parseEventFields(ev) {
  const desc = ev.description || "";
  const lines = desc.split("\n");
  const meta = { location: "Tutte le sedi", department: "Aziendale", audience: "Team", text: desc };
  const metaLines = [];
  lines.forEach((line) => {
    if (line.startsWith("Sede: ")) meta.location = line.replace("Sede: ", "");
    else if (line.startsWith("Reparto: ")) meta.department = line.replace("Reparto: ", "");
    else if (line.startsWith("Destinatari: ")) meta.audience = line.replace("Destinatari: ", "");
    else metaLines.push(line);
  });
  meta.text = metaLines.join("\n").trim() || desc;
  return meta;
}

const CustomToolbar = ({ label, view, onView, onNavigate }) => {
  const { t } = useLanguage();
  return (
    <div className="calendar-toolbar w-full">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onNavigate("PREV")} className="calendar-btn">‹</button>
        <button type="button" onClick={() => onNavigate("NEXT")} className="calendar-btn">›</button>
      </div>
      <span className="text-xl font-extrabold">{label}</span>
      <div className="flex items-center gap-2">
        {["month", "week", "day"].map((v) => (
          <button key={v} type="button" onClick={() => onView(v)} className={`calendar-view-btn ${view === v ? "active" : ""}`}>
            {v === "month" ? t("mese") : v === "week" ? t("settimana") : t("giorno")}
          </button>
        ))}
      </div>
    </div>
  );
};

export function CompanyEventsCalendar({ canManage = false }) {
  const { theme } = useTheme();
  const { t, lang } = useLanguage();
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.token);
  const eventsData = useSelector((s) => s.events.events);
  const [view, setView] = useState("week");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm());
  const [eventToDelete, setEventToDelete] = useState(null);
  const [aiKeywords, setAiKeywords] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSource, setAiSource] = useState(null);

  useEffect(() => {
    if (token) dispatch(fetchEventsAsync({ token }));
  }, [dispatch, token]);

  const events = useMemo(() => {
    const monday = startOfWeek(new Date(), { locale: it, weekStartsOn: 1 });

    const dbEvents = (eventsData || []).map((ev) => {
      const start = new Date(ev.startDate);
      const end = new Date(ev.endDate);
      const meta = parseEventFields(ev);
      return {
        id: ev._id,
        _id: ev._id,
        title: ev.title,
        start,
        end,
        location: meta.location,
        department: meta.department,
        description: meta.text,
        audience: meta.audience,
        isDb: true,
        isDemo: false,
      };
    });

    const demo = DEMO_EVENTS.map((ev) => {
      const start = new Date(monday);
      start.setDate(monday.getDate() + ev.dayOffset);
      start.setHours(ev.startHour, 0, 0, 0);
      const end = new Date(start);
      end.setHours(ev.endHour, 0, 0, 0);
      return { ...ev, start, end };
    });

    const showDemo = !canManage && dbEvents.length === 0;
    return showDemo ? [...dbEvents, ...demo] : dbEvents;
  }, [eventsData, canManage]);

  const openCreate = () => {
    setFormData(emptyForm());
    setAiKeywords("");
    setAiSource(null);
    setFormOpen(true);
  };

  const openEditDbEvent = (event) => {
    if (!event.isDb) return;
    const meta = parseEventFields({ description: event.description });
    setFormData({
      _id: event._id,
      title: event.title,
      date: format(event.start, "yyyy-MM-dd"),
      startTime: format(event.start, "HH:mm"),
      endTime: format(event.end, "HH:mm"),
      location: event.location === "Tutte le sedi" ? "" : event.location,
      department: event.department === "Aziendale" ? "" : event.department,
      audience: event.audience === "Team" ? "" : event.audience,
      description: meta.text,
    });
    setFormOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!token || !formData.title.trim()) return;

    const start = new Date(`${formData.date}T${formData.startTime}`);
    const end = new Date(`${formData.date}T${formData.endTime}`);
    const payload = {
      title: formData.title,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      description: buildEventDescription(formData),
    };

    if (formData._id) {
      dispatch(updateEventAsync({ id: formData._id, data: payload, token }));
    } else {
      dispatch(createEventAsync({ data: payload, token }));
    }
    setFormOpen(false);
  };

  const handleGenerateAi = async () => {
    if (!token || aiKeywords.trim().length < 3) return;
    setAiLoading(true);
    try {
      const result = await generateCommunicationRequest({
        token,
        keywords: aiKeywords.trim(),
        lang,
      });
      setAiSource(result.source);
      setFormData((prev) => ({
        ...prev,
        title: result.title || prev.title,
        description: result.body || result.description || prev.description,
      }));
    } finally {
      setAiLoading(false);
    }
  };

  const confirmDelete = () => {
    if (!eventToDelete?._id || !token) return;
    dispatch(deleteEventAsync({ id: eventToDelete._id, token }));
    setEventToDelete(null);
    setSelectedEvent(null);
  };

  return (
    <>
      <section className={`app-surface company-events-calendar p-4 min-w-0 w-full ${theme === "dark" ? "text-white" : "text-[#090c64]"}`}>
        <div className="dashboard-card-header flex items-center gap-3 mb-4">
          <CalendarIcon size={24} color={theme === "dark" ? "white" : "#090c64"} weight="duotone" />
          <h3 className="text-sm font-bold">{t("companyCalendarTitle")}</h3>
          {canManage && (
            <button type="button" onClick={openCreate} className="custom-button text-sm ml-auto">
              + {t("companyEventAdd")}
            </button>
          )}
        </div>

        <div className={`company-events-calendar__body ${theme === "dark" ? "dark" : "light"}`}>
          <Calendar
            localizer={localizer}
            culture={lang === "en" ? "en" : "it"}
            events={events}
            view={view}
            onView={setView}
            defaultView="week"
            views={["month", "week", "day"]}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 420 }}
            eventPropGetter={() => ({
              style: {
                backgroundColor: "#F59E0B",
                color: "white",
                borderRadius: "8px",
                border: "none",
                fontSize: "12px",
              },
            })}
            onSelectEvent={(event) => setSelectedEvent(event)}
            components={{ toolbar: CustomToolbar }}
          />
        </div>
      </section>

      <Drawer open={Boolean(selectedEvent)} onClose={() => setSelectedEvent(null)} title={selectedEvent?.title || ""}>
        {selectedEvent && (
          <div className="company-event-drawer flex flex-col gap-3 text-sm">
            <p><strong>{t("data")}:</strong> {format(selectedEvent.start, "dd/MM/yyyy HH:mm")} – {format(selectedEvent.end, "HH:mm")}</p>
            <p className="flex items-center gap-2"><MapPinIcon size={16} />{selectedEvent.location}</p>
            <p><strong>{t("companyEventDepartment")}:</strong> {selectedEvent.department}</p>
            <p className="flex items-center gap-2"><UsersIcon size={16} />{selectedEvent.audience}</p>
            <p className="whitespace-pre-wrap leading-relaxed opacity-90">{selectedEvent.description}</p>
            {canManage && selectedEvent.isDb && (
              <div className="flex gap-2 pt-2">
                <button type="button" className="custom-button text-sm" onClick={() => { openEditDbEvent(selectedEvent); setSelectedEvent(null); }}>
                  {t("modifica")}
                </button>
                <button type="button" className="custom-button-light text-sm text-red-500" onClick={() => setEventToDelete(selectedEvent)}>
                  {t("elimina")}
                </button>
              </div>
            )}
            {selectedEvent.isDemo && (
              <p className="text-xs opacity-60">{t("companyEventDemoHint")}</p>
            )}
          </div>
        )}
      </Drawer>

      <Drawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={formData._id ? t("modificaEvento") : t("companyEventAdd")}
      >
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          {canManage && !formData._id && (
            <div className="rounded-xl border border-white/30 bg-white/10 p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{t("aiCommTitle")}</span>
                <AiBadge source={aiSource} />
              </div>
              <input className="custom-input" placeholder={t("aiCommKeywordsPlaceholder")} value={aiKeywords} onChange={(e) => setAiKeywords(e.target.value)} />
              <button type="button" className="custom-button w-fit text-sm" disabled={aiLoading || aiKeywords.trim().length < 3} onClick={handleGenerateAi}>
                {aiLoading ? t("aiLoading") : t("aiCommGenerate")}
              </button>
            </div>
          )}
          <input className="custom-input" placeholder={t("titolo")} value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
          <input type="date" className="custom-input" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <input type="time" className="custom-input" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} />
            <input type="time" className="custom-input" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} />
          </div>
          <input className="custom-input" placeholder={t("companyEventLocation")} value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
          <input className="custom-input" placeholder={t("companyEventDepartment")} value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
          <input className="custom-input" placeholder={t("companyEventAudience")} value={formData.audience} onChange={(e) => setFormData({ ...formData, audience: e.target.value })} />
          <textarea className="custom-input min-h-[100px]" placeholder={t("descrizione")} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          <div className="flex justify-end gap-2">
            <button type="button" className="custom-button-light" onClick={() => setFormOpen(false)}>{t("annulla")}</button>
            <button type="submit" className="custom-button">{t("salva")}</button>
          </div>
        </form>
      </Drawer>

      <AppFeedbackModal
        open={Boolean(eventToDelete)}
        title={t("modaleAttenzione")}
        message={eventToDelete ? `${t("seiSicuroEliminareEvento")} "${eventToDelete.title}"?` : ""}
        tone="warning"
        onClose={() => setEventToDelete(null)}
        actions={[
          { label: t("annulla"), onClick: () => setEventToDelete(null), className: "custom-button-light" },
          { label: t("elimina"), onClick: confirmDelete, className: "rounded-xl bg-red-600 px-4 py-2 font-bold text-white" },
        ]}
      />
    </>
  );
}

export default CompanyEventsCalendar;
