# TODO

- [ ] Implement client-side filtering UI + logic on `src/pages/ReportsAdmin.jsx`:
  - [ ] Add filter bar (Search, Payment Mode, City, Date From/To, Min/Max Value)
  - [ ] Include `createdAt` inside each flattened report row for date filtering
  - [ ] Use `useMemo` to derive `filteredRows`
  - [ ] Update stats (Rows + Total value) to reflect filtered results
  - [ ] Fix `colSpan` for empty state row
  - [ ] Add Reset filters button

- [ ] Implement client-side filtering UI + logic on `src/pages/Orders.jsx`:
  - [ ] Add filter bar (Search, Status, Date From/To, Min/Max Total)
  - [ ] Use `useMemo` to derive `filteredOrders`
  - [ ] Render filtered list
  - [ ] Show “No matching orders” empty state + Reset button when filters exclude all
  - [ ] Add Reset filters button

- [ ] Run build/lint to ensure JSX compiles.

