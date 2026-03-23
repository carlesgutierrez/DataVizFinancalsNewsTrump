# Estado Actual del Proyecto: Trump Wealth Timeline

## Lo que se ha hecho hasta ahora
1. **Extracción de datos**: Se creó la lista cronológica de hitos financieros de Donald Trump.
2. **Hitos Históricos**: Se añadieron eventos clave como elecciones, asalto al Capitolio e inauguraciones.
3. **Interfaz GSAP Avanzada**: 
   - Se renderizan las tarjetas financieras con validación y enlaces de consulta.
   - Se añadió una barra acumulativa (gráfico que crece de 0 a 3.8B) en lugar de una línea abstracta, para que represente fielmente el porcentaje del enriquecimiento.
   - Las fechas clave tienen hitos tipográficos grandes que rompen el diseño horizontal (líneas divisorias).
4. Todo está integrado en `app.js` y `style.css`, obteniendo los datos cronológicamente.

## Lo que está pendiente (Siguientes Pasos)
- [x] Migrar a Vite.js para solucionar problemas de rutas en GitHub Pages.
- [ ] Automatizar despliegue con GitHub Actions (opcional).
- [ ] Ampliar base de datos con eventos de 2026.

## Instrucciones para reanudar
- Abre `npx serve .` y visualiza los cambios.
