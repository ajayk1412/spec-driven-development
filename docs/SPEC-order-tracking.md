# Specification: Order Tracking (React Native + WatermelonDB)

**Version:** 1.0  
**Status:** Approved for implementation  
**Platform:** React Native (iOS + Android)  
**Data:** Local only — WatermelonDB (no HTTP/API)

---

## 1. Purpose

Build a **traditional** mobile app where users **manage orders** with full **CRUD**: create orders, list/search, view detail, edit, delete. All data persists on device via **WatermelonDB**.

---

## 2. Goals & non-goals

### Goals

- Offline-first order list and detail
- CRUD with clear confirmations on destructive actions
- Simple forms with validation
- Observable list updates when DB changes

### Non-goals (v1)

- Login, sync, cloud backup, push notifications
- Barcode/QR, maps, shipping carrier APIs
- Multi-user, roles, analytics SDK
- Custom design system — use **traditional** native-like patterns (lists, nav header, standard inputs)

---

## 3. Users & personas

| Persona | Need |
|--------|------|
| Shop / ops user | Record and update orders on the phone without internet |

---

## 4. Glossary

| Term | Meaning |
|------|---------|
| Order | One record: customer, items summary, status, dates, optional notes |
| CRUD | Create, Read, Update, Delete |
| Traditional UI | Stack navigation, flat list, header + back, primary button at bottom, system-like alerts |

---

## 5. User stories

| ID | Story | Priority |
|----|-------|----------|
| US-1 | As a user, I see all orders on a home list sorted by newest first | P0 |
| US-2 | As a user, I create a new order with required fields | P0 |
| US-3 | As a user, I open an order and see full details | P0 |
| US-4 | As a user, I edit an order and save changes | P0 |
| US-5 | As a user, I delete an order after confirmation | P0 |
| US-6 | As a user, I search orders by customer name or order number | P1 |
| US-7 | As a user, I filter list by status (All / Pending / Shipped / Delivered / Cancelled) | P1 |

---

## 6. Data model (WatermelonDB)

### 6.1 Table: `orders`

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `id` | string (UUID) | yes | Watermelon `id` |
| `order_number` | string | yes | Unique per device; auto-generated e.g. `ORD-YYYYMMDD-####` |
| `customer_name` | string | yes | Min 1 char, max 100 |
| `customer_phone` | string | no | Max 20 |
| `customer_email` | string | no | Basic email format if non-empty |
| `status` | string | yes | Enum: `pending`, `shipped`, `delivered`, `cancelled`; default `pending` |
| `items_summary` | string | yes | Free text, e.g. "2x Widget A, 1x Widget B"; max 500 |
| `total_amount` | number | yes | >= 0; store as number; display 2 decimal places |
| `currency` | string | yes | Default `INR`; allow `USD` in v1 dropdown |
| `notes` | string | no | Max 1000 |
| `created_at` | number | yes | Unix ms; set on create |
| `updated_at` | number | yes | Unix ms; set on create/update |

**Indexes:** `order_number` (unique), `customer_name`, `status`, `created_at` (for sort).

### 6.2 Sample record (JSON for agents/tests)

```json
{
  "id": "generated-by-db",
  "order_number": "ORD-20261126-0001",
  "customer_name": "Rahul Sharma",
  "customer_phone": "9876543210",
  "customer_email": "rahul@example.com",
  "status": "pending",
  "items_summary": "1x Router, 2x Cable",
  "total_amount": 2499.5,
  "currency": "INR",
  "notes": "Deliver before Friday",
  "created_at": 1732608000000,
  "updated_at": 1732608000000
}
```

### 6.3 Business rules

- **BR-1:** `order_number` unique; on conflict regenerate sequence for that day.
- **BR-2:** Cannot save without `customer_name`, `items_summary`, valid `total_amount` >= 0, `status`.
- **BR-3:** Delete is hard delete (no soft delete in v1).
- **BR-4:** List default sort: `created_at` descending.
- **BR-5:** Cancelled orders remain in list; filter can hide them.

---

## 7. Navigation & screens (traditional)

```text
[Order List]  --(+)-->  [Create Order]
      |
      +-- tap row --> [Order Detail]
                            |
                            +-- Edit --> [Edit Order] (same form as Create, prefilled)
                            +-- Delete --> Alert confirm --> back to List
```

### 7.1 Order List (Home)

- **Header:** title "Orders", right: search icon or inline search bar (P1)
- **Body:** `FlatList` — each row: `order_number`, `customer_name`, `status` badge, `total_amount` + currency, `created_at` (short date)
- **FAB or header "+"** → Create Order
- **Empty state:** "No orders yet" + button "Create order"
- **Pull to refresh:** optional no-op or re-query DB (same data)
- **Filter (P1):** horizontal chips: All | Pending | Shipped | Delivered | Cancelled

### 7.2 Create / Edit Order (single form screen)

Traditional form layout (scroll view):

| Field | Control |
|-------|---------|
| Order number | Read-only on Edit; hidden or read-only preview on Create (generated on save) |
| Customer name | TextInput |
| Phone | TextInput (phone pad) |
| Email | TextInput (email) |
| Status | Picker / dropdown |
| Items summary | TextInput multiline |
| Total amount | TextInput (decimal pad) |
| Currency | Picker: INR, USD |
| Notes | TextInput multiline |

- **Footer:** primary "Save"; secondary "Cancel" (go back, discard if no save — confirm if dirty)
- **Validation errors:** inline under field + block save

### 7.3 Order Detail

- Read-only labels (label : value), traditional stacked rows
- **Actions:** "Edit", "Delete" (destructive)
- **Delete:** `Alert.alert` "Delete order?" / Cancel / Delete — then delete in DB and `navigation.goBack()`

---

## 8. CRUD flows (behavior)

### Create

1. User taps +
2. Fills form
3. Save → validate → generate `order_number` → insert → `created_at`/`updated_at` now → **navigate to Detail**

### Read

- List: observe `orders` query
- Detail: load by `id` from route params; show not-found message if missing

### Update

1. From Detail → Edit
2. Save → validate → update fields → `updated_at` now → back to Detail with refreshed data

### Delete

1. Confirm alert
2. Permanent delete via WatermelonDB
3. Return to List; row gone

---

## 9. UI / UX guidelines (traditional)

- React Navigation: **native stack**
- Colors: platform default or simple white/gray header, blue primary button
- Typography: default system font sizes (title 17–20, body 14–16)
- Status badges: text + light background (pending=amber, shipped=blue, delivered=green, cancelled=gray)
- No animations required beyond stack transitions
- Accessibility: `accessibilityLabel` on Save, Delete, list rows

---

## 10. Technical stack

| Layer | Choice |
|-------|--------|
| Framework | React Native (latest stable LTS per init template) |
| Language | TypeScript preferred (JavaScript acceptable if spec amended) |
| Navigation | `@react-navigation/native` + native-stack |
| DB | `@nozbe/watermelondb` + SQLite adapter |
| State | DB observables + minimal React state for forms |
| Forms | Controlled inputs; optional `react-hook-form` only if team prefers |

**No:** axios, fetch to remote URLs, redux-persist for orders (Watermelon is source of truth).

---

## 11. Project structure (empty folder target)

```text
/
├── docs/
│   └── SPEC-order-tracking.md          # this file
├── src/
│   ├── database/
│   │   ├── schema.ts
│   │   ├── models/Order.ts
│   │   ├── index.ts                    # Database provider
│   │   └── migrations/
│   ├── repositories/
│   │   └── orderRepository.ts          # CRUD + order_number generation
│   ├── screens/
│   │   ├── OrderListScreen.tsx
│   │   ├── OrderFormScreen.tsx         # create + edit via mode param
│   │   └── OrderDetailScreen.tsx
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   ├── components/
│   │   ├── OrderListItem.tsx
│   │   ├── StatusBadge.tsx
│   │   └── FormField.tsx
│   ├── utils/
│   │   ├── validation.ts
│   │   └── format.ts
│   └── App.tsx
├── package.json
└── README.md                           # how to run + Watermelon setup notes
```

---

## 12. Repository API (internal contract for RN)

Implement these functions; screens must use only this layer (not raw collection calls scattered):

```text
observeOrders({ search?, status? }): Observable<Order[]>
getOrderById(id): Promise<Order | null>
createOrder(input: CreateOrderInput): Promise<Order>
updateOrder(id, input: UpdateOrderInput): Promise<Order>
deleteOrder(id): Promise<void>
generateOrderNumber(): Promise<string>
```

`CreateOrderInput` / `UpdateOrderInput`: fields per §6.1 excluding `id`, `order_number` (create only auto), timestamps.

---

## 13. Validation rules

| Field | Rule |
|-------|------|
| customer_name | trim; length 1–100 |
| customer_email | if set, contains `@` and `.` |
| items_summary | trim; length 1–500 |
| total_amount | number, finite, >= 0 |
| status | one of enum |

---

## 14. Error handling

| Case | UX |
|------|-----|
| Save validation fail | Inline errors; no DB write |
| DB write fail | Alert "Could not save order" |
| Missing order on detail | "Order not found" + button Back |
| Delete fail | Alert "Could not delete order" |

---

## 15. Acceptance criteria (QA / dev checklist)

### P0

- [ ] Fresh install: list empty → create order → appears on list top
- [ ] Create: required validation blocks empty name/items/amount
- [ ] Detail shows all fields
- [ ] Edit changes persist after kill-and-relaunch app
- [ ] Delete removes order after confirm; list updated
- [ ] Works in airplane mode (no network required)
- [ ] `order_number` unique across 10 rapid creates

### P1

- [ ] Search filters by customer name and order number (case-insensitive)
- [ ] Status filter chips match list

---

## 16. Agent implementation instructions

When implementing in an **empty folder**:

1. Initialize RN app (TypeScript template).
2. Install and configure WatermelonDB per official docs (iOS Pod install, Android proguard if needed).
3. Implement schema + `Order` model per §6.
4. Implement `orderRepository` per §12 before UI.
5. Build screens in order: List → Form (create) → Detail → Edit → Delete.
6. **Do not** add API layer, Redux for orders, or redesign UI beyond §7–9.
7. **Minimal diff** philosophy: no extra features (attachments, PDF, login).
8. Add short README: install, run ios/android, DB location note.

**Prompt snippet for Cursor Agent:**

```text
Implement the React Native Order Tracking app exactly per docs/SPEC-order-tracking.md.
Use WatermelonDB only for persistence. Traditional UI with React Navigation native stack.
Implement orderRepository first, then screens. TypeScript. No API calls.
Verify all P0 acceptance criteria.
```

---

## 17. Future (out of scope v1)

- Export CSV, backup/restore
- Sync API
- Line items as child table
- Soft delete / archive

---

## 18. Sign-off

| Role | Responsibility |
|------|----------------|
| Product | Stories US-* and priorities |
| RN dev | Feasibility, structure §11 |
| QA | §15 execution |
| Agent | Code only per this spec |