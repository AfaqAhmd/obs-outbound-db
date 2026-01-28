## Outbound DB

Production-grade multi-client outbound database built with **Next.js (App Router)**, **JavaScript**, **Tailwind CSS**, **Postgres**, and **Prisma**.

### Tech stack

- **Framework**: Next.js 14 App Router (JavaScript only)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **CSV parsing**: PapaParse
- **Toasts**: react-hot-toast

### Prerequisites

- Node.js 18+
- PostgreSQL 13+

### Setup

1. **Install dependencies**

```bash
npm install
```

2. **Configure environment**

- Copy `env.example` to `.env` and adjust the `DATABASE_URL` for your Postgres instance.

3. **Prisma setup**

```bash
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
```

This will create the schema and add a sample client (`Acme Corp`).

4. **Run the dev server**

```bash
npm run dev
```

Visit `http://localhost:3000`.

### Data model

The Prisma schema implements the required tables:

- **clients**: `Client` model (id, name, created_at)
- **uploads**: `Upload` model with `dataType` (`row` / `enriched`) and `status` (`success` / `failed`)
- **row_data**: `RowData` model with `website` and `normalized_website` plus address and Google URL
- **enriched_data**: `EnrichedData` model with business and contact enrichment fields

Indexes are defined on:

- `client_id`, `upload_id`, `created_at` for row/enriched data and uploads
- `row_data.normalized_website`
- `enriched_data.normalized_website`

### Pages

- **/clients**
  - Table of clients
  - **Add Client** modal (unique, required name)
- **/upload**
  - CSV file upload
  - Required fields: Client, Niche, Uploader name, Type (row/enriched)
  - On submit: posts to `/api/upload`
- **/clients/[id]**
  - Tabs:
    - Row Data
    - Enriched Data
    - Uploads
  - Each tab supports:
    - Search (server-backed via API)
    - Pagination (page size 20)
    - Column sorting (safe whitelist)
  - Row details shown in a modal/drawer-style overlay

### Upload processing

- Implemented in `app/api/upload/route.js` using a **route handler**.
- Handles multipart form-data from the Upload page.
- Parses CSV with PapaParse (`header: true`, `skipEmptyLines: "greedy"`).
- **Header validation**
  - Case-insensitive, trims whitespace
  - **Row type required headers**:
    - `Company, Name, Street, City, State, country, Website, Google URL`
  - **Enriched type required headers**:
    - `Business name, Normalized website, Company LinkedIn (optional), Full name, First Name, Job title, Person LinkedIn, FME, E1, E2, E3, E4, Sub1, Sub2, Sub3, Sub4`
  - `Company LinkedIn` is treated as optional.
  - On missing required headers:
    - Creates a failed `Upload` record with `errorMessage`.
    - Returns `400` to the client.

### Website normalization

- Implemented in `lib/normalizeWebsite.js`.
- Rules for `row_data.normalized_website`:
  - Trim whitespace.
  - Empty/null/undefined → `null`.
  - Lowercase.
  - If no `http://` or `https://`, prepend `https://` for parsing.
  - Use `URL` to parse, then:
    - Extract hostname only (no path, query, hash).
    - Remove leading `www.`.
    - Remove trailing dot.
  - Require a dot in the hostname and no spaces; otherwise, store `null`.
  - Never keep trailing slash.

Examples:

- `https://www.Example.com/products?a=1` → `example.com`
- `example.com/` → `example.com`
- ` HTTP://WWW.GOOGLE.COM ` → `google.com`

For clearly invalid domains (no dot, spaces, etc.), `normalized_website` is `null` but original `website` is preserved.

### Transactions and data isolation

- Each upload is processed in a **single Prisma transaction**:
  - Creates an `Upload` record.
  - Bulk-inserts into `row_data` or `enriched_data` via `createMany`.
  - If any step fails, the transaction rolls back and a separate failed `Upload` record is created.
- All row/enriched records are linked both to:
  - `client_id` (for multi-tenant isolation)
  - `upload_id` (for upload history and traceability).

### Table APIs

The client detail page uses server-backed APIs for data tables:

- `GET /api/clients/[id]/row-data`
- `GET /api/clients/[id]/enriched-data`
- `GET /api/clients/[id]/uploads`

Each endpoint supports:

- `page`, `pageSize`
- `search`
- `sort`, `direction` (asc/desc)

Sorting is restricted to a safe set of columns per table.

### CSV and UX behavior

- Large CSVs are parsed on the server via PapaParse.
- The upload form shows:
  - Loading state while uploading (`Processing...`).
  - Toasts for success and failure via `react-hot-toast`.
- On successful upload:
  - Returns `uploadId` and `rowCount`.
  - The client shows a success toast and resets the form.

### Scripts

- `npm run dev` – start Next.js dev server
- `npm run build` – production build
- `npm start` – start production server
- `npm run prisma:generate` – generate Prisma client
- `npm run prisma:migrate` – run migrations
- `npm run prisma:seed` – seed database with sample client

