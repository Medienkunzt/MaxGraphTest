export interface DiagramTask {
  /** Intern generierte, fortlaufende ID – wird nicht angezeigt */
  id: string
  /** Anzeige-Titel der Aufgabe */
  title: string
  /**
   * Aufgabentext als HTML-String (erzeugt vom Rich-Text-Editor).
   * Enthält klassische Formatierungen (fett, kursiv, Farbe, …) und
   * perspektivisch benutzerdefinierte Tags für die Interaktion mit
   * der Modellierungsfläche (z. B. Drag & Drop-Bezeichner).
   */
  content: string
  /** Erstellungszeitpunkt (ISO-String) */
  createdAt: string
  /** Letzter Änderungszeitpunkt (ISO-String) */
  updatedAt: string
  /**
   * Nutzerbezogene Markierungen fuer den Drawing-Canvas (z. B. farbige Highlights).
   * Wird separat gespeichert, damit Original-Aufgabentext und persoenliche Markierungen
   * getrennt persistiert werden koennen.
   */
  canvasMarkup?: DiagramTaskCanvasMarkup
}

export interface DiagramTaskCanvasMarkup {
  /** Aktueller HTML-Stand inklusive Markierungen */
  content: string
  /** Farbpalette, die fuer Markierungen genutzt wurde */
  highlightColors: string[]
  /** Letzter Aenderungszeitpunkt des Markup-Stands */
  updatedAt: string
}
