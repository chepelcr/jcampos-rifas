# 🚀 Prompt completo -- App de Rifas con Exportación

## 🎯 Objetivo

Crear una aplicación web para gestionar rifas (0--100 números), con
exportación a PDF/JPG.

------------------------------------------------------------------------

## 🧩 Funcionalidades

### 1. Gestión de rifas

-   Nombre
-   Descripción
-   Fecha del sorteo
-   Valor por número
-   Tipo:
    -   💰 Monto único
    -   🎁 Premios múltiples
-   Imagen del premio
-   Estado

------------------------------------------------------------------------

### 2. Números

-   Generar 0--100
-   Estados:
    -   Disponible
    -   Vendido

------------------------------------------------------------------------

### 3. Compradores

-   Nombre
-   Teléfono
-   Email
-   Compra múltiple
-   Validación sin duplicados

------------------------------------------------------------------------

### 4. Premios

-   Lista de premios o monto único

------------------------------------------------------------------------

### 5. Sorteo

-   Selección aleatoria
-   Mostrar ganadores

------------------------------------------------------------------------

## 🖼️ Plantilla HTML

Debe incluir: - Nombre - Fecha - Valor - Imagen - Grid de números

### Estados visuales:

-   Disponible: blanco
-   Vendido: ❌ gris

------------------------------------------------------------------------

## 📤 Exportación

### PDF

-   Puppeteer

### Imagen

-   html-to-image o screenshot

------------------------------------------------------------------------

## ⚙️ Endpoints

-   GET /raffles/{id}/template
-   GET /raffles/{id}/export/pdf
-   GET /raffles/{id}/export/image

------------------------------------------------------------------------

## 🧱 Reglas

-   No duplicar números
-   Sorteo único
-   Datos consistentes

------------------------------------------------------------------------

## ✨ Extras

-   QR
-   Marca de agua
-   Temas
