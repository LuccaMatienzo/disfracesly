# DisfracesLy

DisfracesLy es un **Sistema de Gestión Interna** desarrollado específicamente para la administración integral de una tienda de alquiler de disfraces.

Este proyecto fue realizado como **Tesis de Grado**, con el objetivo de sistematizar, agilizar y modernizar el control operativo y administrativo del negocio.

## Características Principales

*   **Gestión de Catálogo y Stock**: Control preciso de inventario de piezas, conjuntos de disfraces y su disponibilidad en tiempo real.
*   **Gestión de Operaciones**: Administración del ciclo completo de alquileres, reservas, entregas y devoluciones.
*   **Gestión de Clientes**: Registro y administración de datos de clientes, historial de alquileres y reportes.
*   **Módulo Financiero**: Control de pagos, señas, caja diaria y análisis de KPIs con gráficos y reportes.
*   **Seguridad y Roles**: Sistema RBAC (Role-Based Access Control) para restringir accesos según el tipo de usuario (Administrador, Jefe, Empleado).
*   **Interfaz Moderna y Reactiva**: Desarrollado con las últimas tecnologías web, ofreciendo una experiencia de usuario fluida con micro-interacciones y animaciones avanzadas (anime.js), diseño glassmorphism y navegación sin interrupciones.

## Tecnologías Utilizadas

*   **Frontend**: React (Vite), TailwindCSS, React Query, React Router, Recharts, Anime.js, React Hook Form + Zod.
*   **Backend & Base de Datos**: (Servicios integrados en el directorio `/backend`).
*   **Contenedores**: Dockerizado para despliegue unificado con `docker-compose`.

## Estructura del Proyecto

*   `/frontend`: Código fuente de la aplicación React (Portal de Administración).
*   `/backend`: API y servicios de backend.
*   `/informe`: Documentación referida al desarrollo de la tesis.

## Inicialización (Entorno de Desarrollo)

Para levantar el entorno completo utilizando Docker, puedes ejecutar:
```bash
docker-compose up --build
```
Para ejecutar el frontend de forma independiente:
```bash
cd frontend
npm install
npm run dev
```
