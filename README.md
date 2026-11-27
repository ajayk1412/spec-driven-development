# Order Tracking (React Native + WatermelonDB)

Offline order manager: create, list/search/filter, view, edit and delete orders.
All data is stored on the device with [WatermelonDB](https://watermelondb.dev) (SQLite). There is no network or API layer.

Spec: [docs/SPEC-order-tracking.md](docs/SPEC-order-tracking.md)

## Requirements

- Node >= 22.11
- iOS: Xcode >= 16.1, CocoaPods
- Android: Android Studio / SDK, JDK 17+

## Install and run

```sh
npm install

# iOS
cd ios && bundle install && bundle exec pod install && cd ..
npm run ios

# Android
npm run android
```

Other scripts: `npm start` (Metro), `npm test`, `npm run lint`, `npx tsc --noEmit`.

## WatermelonDB setup notes

- `babel.config.js` enables legacy decorators (`@babel/plugin-proposal-decorators`) plus loose class properties, and `tsconfig.json` sets `experimentalDecorators`.
- `ios/Podfile` adds the NPM-vendored `simdjson` pod (`../node_modules/@nozbe/simdjson`), as required by WatermelonDB. The native module itself is autolinked.
- The SQLite adapter runs in async-bridge mode (`jsi: false` in `src/database/index.ts`), so no manual Android/iOS JSI installer wiring is needed. Switch to `jsi: true` only after following the WatermelonDB JSI setup guide.
- Schema is in `src/database/schema.ts` (version 1). Add steps in `src/database/migrations/` when changing it.
- `order_number` uniqueness is enforced in `src/repositories/orderRepository.ts` inside the serialized write transaction (SQLite/Watermelon cannot declare unique columns).

## Where is the database?

SQLite file named `order_tracking` created by WatermelonDB in the app's private storage (iOS app Documents/Library directory, Android `databases/`). Uninstalling the app deletes it. To reset during development, uninstall the app or clear its storage.

## Structure

```text
src/
  App.tsx                      DatabaseProvider + navigation
  database/                    schema, Order model, adapter, migrations
  repositories/orderRepository.ts   only layer that touches the DB (CRUD, search/filter, order numbers)
  screens/                     OrderListScreen, OrderFormScreen (create/edit), OrderDetailScreen
  navigation/AppNavigator.tsx  native stack
  components/                  OrderListItem, StatusBadge, FormField (+ OptionSelect)
  utils/                       validation.ts, format.ts
__tests__/                     validation, format and repository tests (in-memory Loki adapter)
```
