export type Language = "es" | "en";

const english: Record<string, string> = {
  "Idioma": "Language", "Español": "Spanish", "Inglés": "English",
  "Configuración": "Settings", "Nueva Rifa": "New raffle", "Guardado local": "Saved locally", "Modo sin conexión": "Offline mode",
  "Configuración y respaldo": "Settings and backup", "Personaliza la aplicación o guarda una copia portátil de tus rifas.": "Customize the app or save a portable copy of your raffles.",
  "Descargar respaldo": "Download backup", "Restaurar respaldo": "Restore backup", "¿Restaurar este respaldo?": "Restore this backup?",
  "Cancelar": "Cancel", "Volver": "Back", "Imagen": "Image", "En Curso": "Active", "Finalizada": "Completed", "Cancelada": "Cancelled",
  "Precio CRC": "Price (CRC)", "Sorteo": "Draw", "Realizar Sorteo": "Run draw", "Números Vendidos": "Numbers sold", "Premios": "Prizes",
  "¡Ganadores!": "Winners!", "Premio": "Prize", "Sin teléfono": "No phone", "Cuadrícula (0-99)": "Number grid (0–99)", "Compradores": "Buyers",
  "Mostrar y descargar": "Display and download", "La imagen, el PDF y el Excel usarán esta misma vista.": "The image, PDF, and Excel will use this same view.",
  "Filtrar números": "Filter numbers", "Todos": "All", "Disponibles": "Available", "Vendidos": "Sold", "Selecciona los números disponibles.": "Select the available numbers.",
  "Cobrado": "Collected", "Pagados": "Paid", "Pendientes": "Pending", "El monto del premio ya está cubierto.": "The prize amount is now covered.",
  "Buscar por nombre o teléfono": "Search by name or phone", "Buscar comprador por nombre o teléfono": "Search buyer by name or phone", "Ordenar": "Sort",
  "Más recientes": "Most recent", "Nombre A–Z": "Name A–Z", "Más números": "Most numbers", "No hay compradores registrados aún.": "There are no registered buyers yet.",
  "No encontramos compradores con esa búsqueda.": "No buyers match that search.", "Pagado": "Paid", "Pendiente": "Pending", "Disponible": "Available", "Vendido": "Sold",
  "Privacidad primero": "Privacy first", "Funciona incluso cuando no hay internet.": "Works even when there is no internet.",
  "La aplicación y tus rifas permanecen en este dispositivo. Las actualizaciones no borran tu información.": "The app and your raffles stay on this device. Updates do not erase your information.",
  "Sin cuenta ni servidor": "No account or server", "Instalable como app": "Installable as an app", "Personalización": "Customization", "Configuración inicial": "Initial setup",
  "Hazla tuya": "Make it yours", "Puedes cambiar estos datos más adelante desde el botón de configuración.": "You can change these details later from Settings.",
  "Nombre de la aplicación": "App name", "Color principal": "Primary color", "Color de acento": "Accent color", "Apariencia": "Appearance",
  "Claro": "Light", "Oscuro": "Dark", "Sistema": "System", "Tus datos son locales.": "Your data is local.", "Guardar y comenzar": "Save and start",
  "Panel de Control": "Dashboard", "Tus Rifas": "Your raffles", "Aún no hay rifas": "No raffles yet", "Crear mi primera rifa": "Create my first raffle",
  "Crear Nueva Rifa": "Create new raffle", "Gestionar rifa": "Manage raffle", "Progreso": "Progress", "Activa": "Active", "Completada": "Completed",
  "Volver al Panel": "Back to dashboard", "Información General": "General information", "Nombre de la Rifa": "Raffle name", "Descripción (Opcional)": "Description (optional)",
  "Precio por Número (CRC)": "Price per number (CRC)", "Fecha del Sorteo (Opcional)": "Draw date (optional)", "Configuración de Premios": "Prize setup",
  "Premio en dinero": "Cash prize", "Premio(s) en especie": "Non-cash prize(s)", "Monto del Premio (CRC)": "Prize amount (CRC)", "Agregar otro premio": "Add another prize",
  "Generar Rifa y 100 Números": "Create raffle and 100 numbers", "Error al cargar la rifa": "Unable to load raffle",
};

export function translate(language: Language, text: string) {
  return language === "en" ? english[text] ?? text : text;
}
