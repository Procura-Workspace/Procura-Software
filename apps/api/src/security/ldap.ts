import ldap from "ldapjs";
import { loadEnv } from "../config/env.js";
import { logger } from "../core/logger.js";

const env = loadEnv();

export type LdapUser = {
  displayName: string;
  role: string;
  department: string;
};

export function authenticateAD(
  email: string,
  password: string,
): Promise<LdapUser | null> {
  return new Promise((resolve) => {
    // Return early if LDAP_URL is dummy or unconfigured
    if (env.LDAP_URL.includes("localhost") || !env.LDAP_URL) {
      return resolve(null);
    }

    try {
      const client = ldap.createClient({
        url: env.LDAP_URL,
        tlsOptions: { rejectUnauthorized: false },
      });

      client.on("error", (err) => {
        logger.error(err, "LDAP connection error");
        resolve(null);
      });

      client.bind(env.LDAP_BIND_DN, env.LDAP_BIND_PASSWORD, (err) => {
        if (err) {
          logger.error(err, "LDAP system bind failed");
          client.destroy();
          return resolve(null);
        }

        const searchOptions: ldap.SearchOptions = {
          filter: `(mail=${email})`,
          scope: "sub",
          attributes: ["dn", "displayName", "department"],
        };

        client.search(
          "dc=procura,dc=local",
          searchOptions,
          (searchErr, res) => {
            if (searchErr) {
              logger.error(searchErr, "LDAP search failed");
              client.destroy();
              return resolve(null);
            }

            let matchedEntry: any = null;

            res.on("searchEntry", (entry) => {
              matchedEntry = entry;
            });

            res.on("error", (err) => {
              logger.error(err, "LDAP search stream error");
              client.destroy();
              resolve(null);
            });

            res.on("end", (result) => {
              if (!matchedEntry) {
                client.destroy();
                return resolve(null);
              }

              const userDn = matchedEntry.dn.toString();
              // Bind as user to verify password
              client.bind(userDn, password, (userBindErr) => {
                client.destroy();
                if (userBindErr) {
                  logger.warn(
                    { email, userDn, err: userBindErr.message || userBindErr },
                    "LDAP user password verify failed",
                  );
                  return resolve(null);
                }

                // Extract attributes
                const attrs = matchedEntry.pojo.attributes.reduce(
                  (acc: any, attr: any) => {
                    acc[attr.type] = attr.values[0];
                    return acc;
                  },
                  {},
                );

                const department = attrs.department || "Technique";
                const role = department.toLowerCase().includes("achat")
                  ? "buyer"
                  : "requester";

                resolve({
                  displayName: attrs.displayName || email.split("@")[0],
                  role,
                  department,
                });
              });
            });
          },
        );
      });
    } catch (e) {
      logger.error(e, "LDAP authenticator exception");
      resolve(null);
    }
  });
}
