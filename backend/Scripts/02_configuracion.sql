--
-- PostgreSQL database dump
--

\restrict ChsgSHgV8MBloa4G02vxQSraPf0dlYETHfce4kFGy2ajOMBWPg9OocRqdjArhEQ

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: permiso; Type: TABLE DATA; Schema: gestion; Owner: postgres
--

COPY gestion.permiso (id_permiso, nombre, descripcion) FROM stdin;
\.


--
-- Data for Name: rol; Type: TABLE DATA; Schema: gestion; Owner: postgres
--

COPY gestion.rol (id_rol, nombre, descripcion) FROM stdin;
2	Empleado	Empleado del sistema
4	Jefe	Acceso a casi todos los módulos excepto gestión de usuarios
1	Administrador	Administrador total del sistema
\.


--
-- Data for Name: rol_permiso; Type: TABLE DATA; Schema: gestion; Owner: postgres
--

COPY gestion.rol_permiso (id_rol, id_permiso) FROM stdin;
\.


--
-- Name: permiso_id_permiso_seq; Type: SEQUENCE SET; Schema: gestion; Owner: postgres
--

SELECT pg_catalog.setval('gestion.permiso_id_permiso_seq', 1, false);


--
-- Name: rol_id_rol_seq; Type: SEQUENCE SET; Schema: gestion; Owner: postgres
--

SELECT pg_catalog.setval('gestion.rol_id_rol_seq', 4, true);


--
-- PostgreSQL database dump complete
--

\unrestrict ChsgSHgV8MBloa4G02vxQSraPf0dlYETHfce4kFGy2ajOMBWPg9OocRqdjArhEQ

