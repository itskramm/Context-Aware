# Context Aware Database

Database schemas, migrations, and seed files.

## Structure

- `/schemas` - Database schema definitions
- `/migrations` - Database migration scripts
- `/seeds` - Seed data for development and testing

## Database Setup

### MongoDB

This project uses MongoDB. Make sure MongoDB is installed and running:

```bash
# Start MongoDB
mongod
```

### Database Connection

The connection string should be configured in the backend `.env` file:
```
DATABASE_URL=mongodb://localhost:27017/context-aware
```

## Running Migrations

Instructions for running migrations will be added here.

## Seeding Data

Instructions for seeding data will be added here.
