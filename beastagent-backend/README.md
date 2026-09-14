# BeastAgent backend

A small Express API that the BeastAgent site talks to for placing orders.
Orders are stored in `data/orders.json` (no database setup needed).

## Run it

```bash
npm install
npm start
```

The API starts on **http://localhost:3000**. Change the port with
`PORT=4000 npm start` if 3000 is taken — and update `API_BASE` at the top
of the `<script>` tag in `beastagent.html` to match.

## Endpoints

| Method | Path                     | Description                                  |
|--------|--------------------------|-----------------------------------------------|
| GET    | `/api/health`            | Quick check that the server is up             |
| GET    | `/api/snacks`            | Returns the menu (id, name, price, desc)      |
| POST   | `/api/orders`            | Places an order, returns the saved order      |
| GET    | `/api/orders`            | Lists all orders, newest first                |
| GET    | `/api/orders/:id`        | Looks up one order by id                      |
| PATCH  | `/api/orders/:id/status` | Updates status (received/preparing/out for delivery/delivered) |

### Placing an order

```
POST /api/orders
Content-Type: application/json

{
  "items": [
    { "id": "meatpie", "qty": 2 },
    { "id": "puffpuff", "qty": 1 }
  ],
  "customer": {
    "name": "Ada Obi",
    "phone": "080xxxxxxx",
    "address": "12 Aso Drive, Abuja"
  }
}
```

Prices are always taken from `data/menu.json` on the server, never from
the request — so the frontend can't be tricked into paying less.

## Notes for going further

- Swap `data/orders.json` for a real database (Postgres/SQLite) once you
  need concurrent writes or querying beyond "list everything."
- Add auth on `/api/orders` (GET) and the status-update route before
  exposing this publicly — right now anyone can see or update all orders.
- Add a notifications step (SMS/WhatsApp) when an order's status changes.
