/** Client-side mirror for demo mode (server: generateTicketReplyHeuristic). */
export function generateTicketReplyLocal({
  ticketTitle = "",
  ticketContent = "",
  keywords = "",
  lang = "it",
  userName = "",
}) {
  const kw = keywords.trim();
  const title = ticketTitle.trim() || (lang === "en" ? "your request" : "la sua segnalazione");
  const recipient = userName.trim() || (lang === "en" ? "colleague" : "collega");

  const keywordSentence = kw
    ? lang === "en"
      ? `Regarding the next steps: ${kw.charAt(0).toUpperCase()}${kw.slice(1)}${/[.!?]$/.test(kw) ? "" : "."}`
      : `In merito agli aggiornamenti: ${kw.charAt(0).toUpperCase()}${kw.slice(1)}${/[.!?]$/.test(kw) ? "" : "."}`
    : lang === "en"
    ? "We have taken charge of the report and are working on the resolution."
    : "Abbiamo preso in carico la segnalazione e stiamo lavorando alla risoluzione.";

  const contextHint =
    ticketContent.trim().length > 0
      ? lang === "en"
        ? `We reviewed the details you provided about "${title}".`
        : `Abbiamo analizzato i dettagli da lei indicati relativi a "${title}".`
      : lang === "en"
      ? `We reviewed ticket "${title}".`
      : `Abbiamo analizzato il ticket "${title}".`;

  const body =
    lang === "en"
      ? `Dear ${recipient},\n\nThank you for contacting us.\n\n${contextHint}\n\n${keywordSentence}\n\nIf the issue persists or you need further support, please reply to this ticket.\n\nBest regards,\nWorkHub Support Team`
      : `Gentile ${recipient},\n\nLa ringraziamo per la segnalazione.\n\n${contextHint}\n\n${keywordSentence}\n\nQualora il problema dovesse persistere o necessitasse di ulteriori chiarimenti, la invitiamo a rispondere a questo ticket.\n\nCordiali saluti,\nTeam di supporto WorkHub`;

  return { body, source: "heuristic", generatedAt: new Date().toISOString() };
}
