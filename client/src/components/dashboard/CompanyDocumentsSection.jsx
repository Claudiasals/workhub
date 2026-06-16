import { useMemo, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  FileTextIcon,
  MagnifyingGlassIcon,
  TagIcon,
  PlusCircleIcon,
  PencilSimpleIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import Drawer from "../Drawer";
import AppFeedbackModal from "../AppFeedbackModal";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import {
  loadCompanyDocuments,
  saveCompanyDocuments,
  createDocumentId,
} from "../../utils/companyDocumentsStorage";
import { markDocumentReadInNotifications } from "../../utils/notificationStorage";

const importanceClass = {
  critical: "doc-importance--critical",
  important: "doc-importance--important",
  normal: "doc-importance--normal",
};

const emptyForm = () => ({
  id: null,
  title: "",
  category: "",
  publishedAt: new Date().toISOString().slice(0, 10),
  author: "",
  importance: "normal",
  content: "",
});

export function CompanyDocumentsSection({ canManage = false }) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const authUser = useSelector((state) => state.auth.user);
  const userId = authUser?._id || authUser?.id;
  const textColor = theme === "dark" ? "text-white" : "text-[#090c64]";
  const iconColor = theme === "dark" ? "white" : "#090c64";

  const [documents, setDocuments] = useState(() => loadCompanyDocuments());
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm());
  const [docToDelete, setDocToDelete] = useState(null);

  useEffect(() => {
    saveCompanyDocuments(documents);
    window.dispatchEvent(new Event("workhub-documents-updated"));
  }, [documents]);

  const openDocument = (doc) => {
    if (userId) {
      markDocumentReadInNotifications(userId, doc.id);
      window.dispatchEvent(new Event("workhub-documents-updated"));
    }
    setSelectedDoc(doc);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter(
      (doc) =>
        doc.title.toLowerCase().includes(q) ||
        doc.category.toLowerCase().includes(q) ||
        doc.author.toLowerCase().includes(q)
    );
  }, [search, documents]);

  const openCreate = () => {
    setFormData(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (doc) => {
    setFormData({ ...doc });
    setFormOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (formData.id) {
      setDocuments((prev) =>
        prev.map((d) => (d.id === formData.id ? { ...formData } : d))
      );
    } else {
      setDocuments((prev) => [
        ...prev,
        { ...formData, id: createDocumentId() },
      ]);
    }
    setFormOpen(false);
    setFormData(emptyForm());
  };

  const confirmDelete = () => {
    if (!docToDelete) return;
    setDocuments((prev) => prev.filter((d) => d.id !== docToDelete.id));
    setDocToDelete(null);
  };

  return (
    <>
      <section className={`app-surface company-docs-section p-4 min-w-0 w-full ${textColor}`}>
        <div className="dashboard-card-header flex items-center gap-3 min-w-0 w-full mb-4">
          <FileTextIcon size={24} color={iconColor} weight="duotone" className="shrink-0" />
          <h3 className="text-sm font-bold shrink-0">{t("companyDocsTitle")}</h3>
          <div className="card-toolbar-actions ml-auto">
            <div className="relative">
              <MagnifyingGlassIcon
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50"
              />
              <input
                type="text"
                placeholder={t("cerca")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="table-search card-toolbar-search w-full min-w-0 !pl-9"
              />
            </div>
            {canManage && (
              <button type="button" onClick={openCreate} className="custom-button text-sm shrink-0">
                + {t("aggiungi")}
              </button>
            )}
          </div>
        </div>

        <div className="company-docs-grid">
          {filtered.map((doc) => (
            <article key={doc.id} className="company-doc-card">
              <div className="company-doc-card__head">
                <FileTextIcon size={20} weight="duotone" color={iconColor} />
                <span
                  className={`company-doc-importance ${
                    importanceClass[doc.importance] || importanceClass.normal
                  }`}
                >
                  {t(`docImportance_${doc.importance}`)}
                </span>
              </div>
              <h4 className="company-doc-card__title">{doc.title}</h4>
              <p className="company-doc-card__meta">
                <TagIcon size={14} />
                {doc.category}
              </p>
              <p className="company-doc-card__meta">
                {new Date(doc.publishedAt).toLocaleDateString("it-IT")} · {doc.author}
              </p>
              <div className="flex flex-wrap gap-2 mt-auto">
                <button
                  type="button"
                  className="custom-button company-doc-card__btn"
                  onClick={() => openDocument(doc)}
                >
                  {t("companyDocsRead")}
                </button>
                {canManage && (
                  <>
                    <button
                      type="button"
                      className="custom-button-light text-xs px-3 py-1"
                      onClick={() => openEdit(doc)}
                      aria-label={t("modifica")}
                    >
                      <PencilSimpleIcon size={16} />
                    </button>
                    <button
                      type="button"
                      className="text-red-500 px-2"
                      onClick={() => setDocToDelete(doc)}
                      aria-label={t("elimina")}
                    >
                      <TrashIcon size={18} weight="duotone" />
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <Drawer
        open={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
        title={selectedDoc?.title || ""}
      >
        {selectedDoc && (
          <div className="company-doc-drawer flex flex-col gap-4">
            <div className="company-doc-drawer__meta">
              <span>{selectedDoc.category}</span>
              <span>{new Date(selectedDoc.publishedAt).toLocaleDateString("it-IT")}</span>
              <span>{selectedDoc.author}</span>
            </div>
            <div className="company-doc-drawer__content whitespace-pre-wrap text-sm leading-relaxed">
              {selectedDoc.content}
            </div>
          </div>
        )}
      </Drawer>

      <Drawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={formData.id ? t("companyDocsEdit") : t("companyDocsAdd")}
      >
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <input
            className="custom-input"
            placeholder={t("titolo")}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <input
            className="custom-input"
            placeholder={t("companyDocsCategory")}
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          />
          <input
            className="custom-input"
            placeholder={t("companyDocsAuthor")}
            value={formData.author}
            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
          />
          <input
            type="date"
            className="custom-input"
            value={formData.publishedAt}
            onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
          />
          <select
            className="custom-input"
            value={formData.importance}
            onChange={(e) => setFormData({ ...formData, importance: e.target.value })}
          >
            <option value="normal">{t("docImportance_normal")}</option>
            <option value="important">{t("docImportance_important")}</option>
            <option value="critical">{t("docImportance_critical")}</option>
          </select>
          <textarea
            className="custom-input min-h-[160px]"
            placeholder={t("descrizione")}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <button type="button" className="custom-button-light" onClick={() => setFormOpen(false)}>
              {t("annulla")}
            </button>
            <button type="submit" className="custom-button">
              {t("salva")}
            </button>
          </div>
        </form>
      </Drawer>

      <AppFeedbackModal
        open={Boolean(docToDelete)}
        title={t("modaleAttenzione")}
        message={docToDelete ? `${t("companyDocsDeleteConfirm")} "${docToDelete.title}"?` : ""}
        tone="warning"
        onClose={() => setDocToDelete(null)}
        actions={[
          { label: t("annulla"), onClick: () => setDocToDelete(null), className: "custom-button-light" },
          {
            label: t("elimina"),
            onClick: confirmDelete,
            className: "rounded-xl bg-red-600 px-4 py-2 font-bold text-white",
          },
        ]}
      />
    </>
  );
}

export default CompanyDocumentsSection;
