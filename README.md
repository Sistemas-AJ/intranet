# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

---

## Server configuration

The backend reads several values from environment variables so that
credentials and paths aren’t hard‑coded in `server.js`.

1. Copy `.env.example` to `.env` and edit values as needed.  Among the
   settings you can now override is `VITE_API_URL`, which tells the dev
   server where to proxy API calls (default: `http://localhost:3000`).
2. `config.js` exposes constants like `DB_PATH`, `ADMIN_USUARIO`,
   `ALLOWED_ORIGINS`, etc., which are consumed by the server.
3. You may change the database file name by setting `DB_FILE`.

By centralizing configuration in `.env`/`config.js`, you avoid the
“locura” of scattering constants throughout the codebase and make
production deployment safer.

### Development server note

The custom `vite-plugin-clientes.js` that previously simulated the backend
has been removed.  The Vite server now proxies `/api` to the real
backend (`VITE_API_URL`), so behavior during development closely matches
production and authentication is enforced.

### Security enhancements

* Passwords are now **hashed with bcrypt** (configurable salt rounds) instead
  of stored in plain text.  All writes to `companies.contrasena` are hashed
  automatically by the server.
* `POST /api/login` issues a **JWT bearer token** which the client must send
  in the `Authorization: Bearer <token>` header on subsequent requests.  This
  replaces the old `x-role`/`x-ruc` header scheme while remaining compatible.
* All `/api` routes except `/login` are now guarded by the token middleware.
  In particular, `/api/companies` — previously publicly readable — now only
  returns information to authenticated users (admins may list all companies,
  clients may only fetch their own).
* The database driver uses prepared statements throughout (`db.prepare(...?)`)
  which automatically parameterises inputs and protects against SQL
  injection.  Never concatenate user data into SQL strings.

Make sure to set a strong `JWT_SECRET` in production and never commit it to
source control.
