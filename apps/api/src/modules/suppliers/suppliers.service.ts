import type { Supplier } from "@procura/shared";
import type { AppStore } from "../../core/store.js";

export class SuppliersService {
  constructor(private readonly store: AppStore) {}

  list(): Supplier[] {
    return [...this.store.suppliers.values()].sort((a, b) => a.legalName.localeCompare(b.legalName));
  }
}
