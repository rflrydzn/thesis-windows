# **SnapToApp Authentication Service**  

## **Introduction**  
SnapToApp Authentication Service is a **gRPC-based authentication microservice** designed for managing user authentication, authorization, and security-related processes. It integrates with **Keycloak for user authentication**, **JWT for token management**, and **Google OAuth** for third-party authentication. The service also provides functionalities for **user management, password resets, token validation, and account verification**.

---

## **Getting Started**  

### **Pre-requisites**  
Ensure you have the following installed before running the project:

- **Go** (>= 1.18)
- **PostgreSQL** (for the database)
- **Keycloak** (for authentication management)
- **gRPC** (for inter-service communication)
- **Docker** (for containerization)
- **Stripe API** (for subscription handling)
- **Google OAuth** (for third-party authentication)

---

## **Installation and Setup**  

### **1. Install and Set Up PostgreSQL**  

1. **Install PostgreSQL**  
   - Set the default **username** to `postgres` and **password** to `root`.

2. **Create the Database and Schemas**  
   - Open **PostgreSQL** and run:

   ```sql
   CREATE DATABASE snap_to_app;
   ```

   - Navigate to **Schemas** in `snap_to_app` and create **four schemas**:
     - `billing`
     - `keycloak`
     - `organization`
     - `public`

3. **Create the `admin` User and Assign Permissions**  
   - Open **PostgreSQL > Login/Group Roles**  
   - Run the following SQL queries:

   ```sql
   CREATE ROLE admin WITH LOGIN PASSWORD 'root';
   ALTER ROLE admin WITH SUPERUSER;
   ALTER ROLE admin WITH CREATEDB CREATEROLE;
   ALTER ROLE admin WITH REPLICATION;
   GRANT pg_read_all_data TO admin;
   GRANT pg_write_all_data TO admin;
   ```

   - Enable `uuid-ossp` extension:

   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

4. **Create `api_user` and Grant Permissions**  
   - Right-click `PostgreSQL > Create > Login/Group Role`  
   - Name it **api_user** with **password: root**  

   - Assign permissions using:

   ```sql
   GRANT ALL ON SCHEMA organization TO api_user;

   ALTER DEFAULT PRIVILEGES FOR ROLE admin IN SCHEMA organization
   GRANT ALL ON TABLES TO api_user;

   ALTER DEFAULT PRIVILEGES FOR ROLE admin IN SCHEMA organization
   GRANT ALL ON SEQUENCES TO api_user;

   ALTER DEFAULT PRIVILEGES FOR ROLE admin IN SCHEMA organization
   GRANT EXECUTE ON FUNCTIONS TO api_user;

   ALTER DEFAULT PRIVILEGES FOR ROLE admin IN SCHEMA organization
   GRANT USAGE ON TYPES TO api_user;

   ALTER ROLE api_user INHERIT;
   GRANT ALL PRIVILEGES ON DATABASE snap_to_app TO api_user;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA organization TO api_user;
   ALTER DEFAULT PRIVILEGES GRANT ALL ON TABLES TO api_user;

   GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA organization TO api_user;
   ```

---

### **2. Install and Run Docker**  

1. **Install Docker** if it's not installed.  
   - Download from [Docker Website](https://www.docker.com/) and install it.  

2. **Navigate to the Configuration Directory**  
   - Open a terminal and go to:

   ```sh
   cd snaptoapp-auth/pkg/config
   ```

3. **Run the Docker Compose Command**  

   ```sh
   docker compose up
   ```

---

### **3. Set Up Keycloak**  

1. **Open Keycloak** in your browser:  localhost:8080

2. **Log in to the Administration Console**  
- **Username:** `admin`  
- **Password:** `admin`  

3. **Switch to the `snap-to-app` Realm**  
- On the left sidebar, click the dropdown menu  
- **Switch from `master` to `snap-to-app`**  

4. **Import Clients (`public-rest-client` & `admin-rest-client`)**  
- **Go to the `Clients` tab**  
- Click `Import Client`  
- Browse to:  
  ```
  snaptoapp-auth/pkg/config/imports
  ```
- Select `public-rest-client.json` and click **Save**  
- Repeat the same for `admin-rest-client.json`  

5. **Assign Role to `service-account-public-rest-client`**  
- Go to **Users** → Select `service-account-public-rest-client`  
- Go to **Role Mappings** tab  
- Click **Assign Role** → Filter by **Clients**  
- Search for `manage-users`, assign, and save  

---

### **4. Configure Environment Variables**  
After setting up **Docker Compose**, you need to update the `.env` file with the correct secrets.

The `dev.env` file is already created. You only need to update the **secrets** by following these steps:

1. **Open the `dev.env` file** in the root directory of `snaptoapp-auth`.
2. **Uncomment the local configuration** and **comment out any development settings** to prevent conflicts.
3. **Update the following values**:

```sh
# LOCAL
DB_URL=postgres://postgres:root@localhost:5432/snap_to_app
JWT_SECRET_KEY=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA/RuoR3nRIUaVOBMNyW4q4YfnEUiAB//K7ZeF6zsJbPp/le0rSZEi00mU0faBiC++n5VcZKMRRmMhmtMm00MP6QUG5/n4jYgDDQ3DdrQto7uTUrkzM0pjA1AnWyt8EaDkhh/2h1Jf7d5cIPlp2jugKPqTuvIv52wXmpH4TiX/UrsMwJCTPqA8Uhbyboc1hW8UVExxPCg55b0tiJC/2wkPw8TA33BZWaDXMp2GVpFL4FM9GJHlPTXR43okFKfUtg7/tEDddI23xLrBS4fqFH1LQjlQNw3QvzkNsbyh0YG/UV1JkQZAByjqLv1Lkt3suwXmtH0NPA3w3X9IIlZ3tsg5YQIDAQAB
KC_CLIENT_SECRET=iqUwxzMDb84n6hdtTTVuyhkeYmBiPkuw
STRIPE_SECRET_KEY=sk_test_51PWDXML6hseWsEddcN1lJN6M1dOr54rrdKOyMEBM8IKjzW81ZisZHw2oCuGsSvrl2h4uxfy5SPnanI9rMNQPKsDh004B2w4szR
STRIPE_WEBHOOK_SECRET=whsec_ada8b79a84fa9d9ccd599841413195484eab934b998a86c5adab9818173ed2fa

# -------------------------------------------------------------------------------------------------------------------------

# DEV
# DB_URL=postgres://admin:psSnapToApp2023!@postgres-dev.postgres-dev:5432/snap_to_app_dev
# JWT_SECRET_KEY=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwhAxWxsb3xlk2uWStbUIT2xn5+uxFsz1m6X8/WK7JiXk5Fb+i6fN/isWjQEzB/fnj5o8qkblQIJGttOgItc6SHbyHNCV+rKiBuO0KvbjxhtsKswY1Z53dttjACbOTQllv1s/Qm/Y648UEDkIB9C7neZdiFPQynPHsyIV3FuCzHr+iSCjC25R3piMNmqYJG04JXuacbCmDfpzo/2ujVUea+p7SFiwYkfzWNchvWtEDBaAaDTiUKl3y1+xeiYLG67Wg7iKQ88mFTHbFDbQFvbwKPPs7omekv3TfS85uwl87AWZmxWOWteWq2/yd4hefZ9FzmKU8K8aPZa0T0HvKqhLMQIDAQAB
# KC_CLIENT_SECRET=iqUwxzMDb84n6hdtTTVuyhkeYmBiPkuw
# STRIPE_SECRET_KEY=sk_test_51IoLO3L34VbAPEjIGNQfbWJeCshTyULQaOh9VE9JEc1Ec2aC2NduxoxYGnDbBgMuwe6qCUZilnt8aDOIJMhndurq00EZ9jWF8R
# STRIPE_WEBHOOK_SECRET=we_1QhnZRL34VbAPEjIWA6iXygL
```

### **Update JWT Secret Key**
- Open **Keycloak**
- Go to **Realm Settings → Keys**
- Find **RS256**, copy the **public key**, and paste it into `JWT_SECRET_KEY` in the `dev.env` file.

### **Update Keycloak Client Secret**
- In **Keycloak**, go to **Clients → public-rest-client → Credentials**
- Copy the **Client Secret Key** and paste it into `KC_CLIENT_SECRET` in the `dev.env` file.

---

### **4. Start the Authentication Service**  
After updating the `.env` file, return to the root folder of `snaptoapp-auth` and run:

```sh
make server
```

