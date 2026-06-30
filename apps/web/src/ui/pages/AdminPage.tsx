import type { User } from "@procura/shared";
import { Badge } from "../components/Badge.js";
import { PageHeader } from "../components/PageHeader.js";

export function AdminPage({ users }: { users: User[] }) {
  return (
    <>
      <PageHeader eyebrow="Module 18" title="Administration et RBAC" />
      <section className="panel">
        <div className="table">
          <div className="table-head users">
            <span>Utilisateur</span>
            <span>Email</span>
            <span>Role</span>
            <span>Departement</span>
            <span>Etat</span>
          </div>
          {users.map((user) => (
            <div className="table-row users" key={user.id}>
              <strong>{user.displayName}</strong>
              <span>{user.email}</span>
              <Badge value={user.role} />
              <span>{user.department}</span>
              <Badge value={user.active ? "active" : "blocked"} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
