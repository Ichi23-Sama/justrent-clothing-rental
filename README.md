# JustRent - Clothing Rental Web Application

JustRent is a database-driven web application for a clothing rental shop. Customers can browse garments and make reservations, while staff manage the catalog, record pickups and returns, and track payments.

This was my first university group project, developed with classmates for **CSS326 Database Programming Laboratory**. The project brings together a browser interface, an Express API, and a relational MySQL database to demonstrate how database programming supports a working application.

### My contribution

My main contribution was working on the SQL queries used by the application. This was an opportunity to connect what I had learned about relational databases with features that people could use through a web interface.

The database work in the project includes retrieving related records with joins, filtering results, updating rental information, and calculating charges and outstanding balances. The application as a whole was developed collaboratively by our group.

### What the app does

- **Clothing catalog:** browse garment photos, categories, sizes, daily rates, and current rental status; open a garment's details before booking.
- **Accounts:** register, log in, and log out using session-based authentication.
- **Bookings:** select a garment and rental dates. The backend checks for overlapping reservations before saving the booking.
- **Rental management:** staff record pickup and return, moving a rental from `Reserved` to `Active` to `Completed`.
- **Payment records:** staff record payments and view the total charge, amount paid, and remaining balance. Amounts are displayed in Thai baht (THB).
- **Catalog management:** staff add, edit, and remove garments, including image uploads.
- **Developer tools:** view accounts, deactivate or reactivate User/Admin accounts, and review which staff member recorded each pickup or return.

Payments are records entered by staff. The application does not process real card payments or connect to a payment gateway.

### Tech stack

| Layer | Technologies |
|---|---|
| Frontend | HTML, CSS, vanilla JavaScript, Fetch API |
| Backend | Node.js, Express |
| Database | MySQL, accessed through `mysql2/promise` |
| Authentication | `express-session`, `bcryptjs` |
| Image uploads | Multer |
| Configuration | dotenv and environment variables |
| Development tools | MySQL Workbench, VS Code, npm |

### How the application works

Express serves the pages in `public/` and provides the `/api` endpoints. Browser JavaScript sends requests to these endpoints. Middleware and controllers perform the relevant account, permission, and input checks before executing SQL through the connection pool in `config/db.js`.

The controller returns JSON, and the browser updates the page with the result. The browser never connects directly to MySQL. SQL queries are written inside the controllers; the project does not use an ORM.

#### Example: booking a garment

1. A logged-in customer opens a garment's details and selects **Rent this garment**.
2. The booking page submits the clothing ID, start date, and due date to `POST /api/rentals`.
3. The controller validates the dates and starts a database transaction.
4. It locks the garment row and checks for an overlapping `Reserved` or `Active` rental.
5. If the dates are available, it inserts a `rental` and a related `rental_item`, storing the garment's rate at the time of booking.
6. The transaction commits, and the browser displays the new rental ID. If the operation fails, the transaction is rolled back.

The normal rental lifecycle is:

```text
Reserved → Active → Completed
Booking    Pickup   Return
```

Staff actions record the pickup/return time and the staff account responsible. The schema also contains a `Canceled` status, but the current interface does not provide a cancellation workflow.

### User roles

| Capability | User | Admin | Developer |
|---|:---:|:---:|:---:|
| Browse clothing and create bookings | Yes | Yes | Yes |
| View own rental history | Yes | Yes | Yes |
| View all customers' rentals | No | Yes | Yes |
| Add, edit, remove clothing, and upload photos | No | Yes | Yes |
| Record pickup, return, and payment | No | Yes | Yes |
| View accounts and change User/Admin account status | No | No | Yes |
| View staff pickup/return activity | No | No | Yes |

Guests can browse the catalog. Public registration always creates a `User` account. Role restrictions are checked on the server as well as reflected in the interface. Developer accounts cannot deactivate themselves or change another Developer account's status through the account-management endpoint.

### Database design

The application uses six main tables:

| Table | Purpose |
|---|---|
| `users` | Account details, password hashes, roles, and active status |
| `category` | Garment categories |
| `clothing` | Garment details, daily rates, image paths, and catalog active status |
| `rental` | Booking owner, planned dates, and rental status |
| `rental_item` | Links rentals to garments; stores agreed rates and pickup/return details |
| `payment` | Payment amounts, dates, and methods for a rental |

Relationships include one user to many rentals, one category to many garments, and one rental to many payments. `rental_item` resolves the many-to-many relationship between rentals and clothing: a rental can contain multiple items, and the same garment can appear in different rentals over time. The current booking interface creates one garment per submission.

Primary and foreign keys maintain the links between records. Other constraints include unique email addresses, valid rental date ordering, positive payment amounts, and a unique `(rental_id, clothing_id)` pair.


### Running locally

#### Requirements

- Node.js and npm.
- MySQL 8.x, with permission to create/import the schema, tables, trigger, and stored procedure.
- Optional: MySQL Workbench to inspect the ERD, run queries, and import SQL files.

#### 1. Install dependencies

Download or clone this repository, open a terminal in its root directory, and run:

```bash
npm ci
```

#### 2. Set Up the Database

The JustRent database can be prepared by running the included SQL files in **MySQL Workbench**.

##### Create the Database

1. Open MySQL Workbench and connect to your local MySQL server.
2. Create a new schema named `just_rent`.
3. Right-click the `just_rent` schema and select **Set as Default Schema**.

Alternatively, create and select the database by running:

```sql
CREATE DATABASE IF NOT EXISTS just_rent;
USE just_rent;
```

##### Import the Main Database

Open and run:

```text
sql/justrenttry.sql
```

This file creates the main database tables, relationships, sample data, trigger, and stored procedure.

##### Add the Latest Clothing Fields

After the main script finishes, run:

```sql
USE just_rent;

ALTER TABLE clothing
    ADD COLUMN image_path VARCHAR(255) NULL,
    ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;
```

These fields are required for clothing images and soft deletion.

##### Add the Account and Staff-Activity Fields

Open and run:

```text
sql/sql6_account_activity.sql
```

This script adds account-status management and records which staff member processes garment pickups and returns.

##### Correct Execution Order

```text
1. justrenttry.sql
2. Clothing update query
3. sql6_account_activity.sql
```

##### Verify the Setup

Refresh the **Schemas** panel and confirm that the following tables exist:

- `category`
- `clothing`
- `users`
- `rental`
- `rental_item`
- `payment`

The prepared Admin and Developer accounts can then be accessed through the application’s login page using the provided demo credentials.

> Use a new development database when running the setup script because the main export may replace existing tables and data.


#### 3. Configure environment variables

Create a `.env` file in the repository root using your local connection details:

```dotenv
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=just_rent
SESSION_SECRET=replace_with_a_long_random_secret
```

The application reads these values in `config/db.js` and `server.js`. Keep actual credentials out of Git; `.env` is included in `.gitignore`.

#### 4. Start the application

```bash
npm run dev
```

Open **http://localhost:3000** in your browser. MySQL must be running before using database-backed features.

#### 5. Prepared Demo Accounts

Admin and Developer accounts have already been prepared for testing. You can access them through the **Login** page in the application.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `1234567890` |
| Developer | `dev@example.com` | `1234567890` |

#### Suggested Run-Through

1. Start the application and open `http://localhost:3000`.
2. Browse the clothing catalog as a guest.
3. Open the **Login** page.
4. Sign in with the Admin account to demonstrate rental management, clothing management, payments, pickups, and returns.
5. Log out, then sign in with the Developer account to demonstrate developer-only features such as account-status management and staff activity.
6. Log out before testing another role so the previous session does not affect the demonstration.

> These accounts are for demonstration purposes only. If the project is publicly hosted, use unique demo passwords and do not reuse personal credentials.

### Project structure

```text
.
├── README.md                 # Project overview and setup instructions
├── server.js                 # Express app, sessions, static pages, and API routes
├── package.json              # Project metadata, scripts, and dependencies
├── package-lock.json         # Exact installed dependency versions
├── .gitignore                # Files excluded from Git
├── config/
│   ├── db.js                 # MySQL connection pool used by controllers
│   └── upload.js             # Image-upload configuration
├── controllers/
│   ├── auth.controller.js
│   ├── categories.controller.js
│   ├── clothing.controller.js
│   ├── payments.controller.js
│   ├── rentals.controller.js
│   ├── upload.controller.js
│   └── users.controller.js   # Request handling, validation, and SQL queries
├── middleware/
│   ├── permissions.js        # Admin/Developer permission checks
│   └── requireActiveAccount.js
├── routes/                   # Authentication, catalog, rental, payment, and user routes
├── public/
│   ├── index.html            # Catalog and management sections
│   ├── login.html            # Login and registration
│   ├── booking.html          # Booking form
│   ├── rentals.html          # Rental history, staff actions, and payments
│   └── images/               # Garment images and uploaded files
├── sql/
│   ├── justrenttry.sql       # Main schema, sample data, trigger, and procedure
│   └── sql6_account_activity.sql # Account and staff-activity additions
└── justtrydb.mwb             # MySQL Workbench database model
```

All controllers connect to MySQL through **`config/db.js`**. For an overview of the SQL-related implementation, start with `controllers/clothing.controller.js`, `controllers/rentals.controller.js`, `controllers/payments.controller.js`, and the trigger and stored-procedure definitions in `sql/justrenttry.sql`.

### Current limitations and improvements

- The booking interface accepts one garment per submission, although the schema supports multiple items per rental.
- Cancellation, late fees, and refunds are not implemented. Charges use planned rental dates rather than actual return time.
- Sessions use the default in-memory store, so restarting the server clears login sessions.
- Uploaded images are stored on the server's local filesystem. A hosted deployment needs persistent file storage.
- Catalog filtering hides inactive garments, but the booking controller still needs an explicit active-status check for manually submitted clothing IDs.
- Error handling is implemented in controllers and middleware; a final custom Express error handler would make handling more consistent across all routes.
- Database initialization could be consolidated into one repeatable setup script, and the project would benefit from automated tests.

This project represents my early experience building software as part of a team and applying SQL to an end-to-end web application.
