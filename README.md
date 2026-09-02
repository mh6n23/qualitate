# Qualitate

A web application for reviewing and analysing qualitative research data.
Video, audio, images and transcripts from a workshop are placed on a
single synchronised timeline, so a researcher can scrub to any moment
and see every source of data captured at that point together.

Built as my final year dissertation project at the University of
Southampton.

## The problem

Researchers running workshops capture data in several formats at once —
video of the room, audio recordings per group, photographs of artefacts,
and transcripts. Reviewing it afterwards normally means opening multiple
files in multiple applications and manually aligning them by timestamp.
Qualitate replaces that with one interface.

## Features

- **Synchronised timeline** — media of any type is positioned by its
  offset from the session start, and playback keeps every source aligned
- **Transcript support** — parses plain `.txt` and WebVTT files, with
  transcript segments shown against the timeline
- **Thematic annotation** — annotate segments, group them under codes and
  themes, with colour coding to distinguish them at a glance
- **Group and event structure** — media files are organised under specific groups of members and events/tasks
  within a workshop

## Stack

- **Next.js** and **React** with **TypeScript**
- **PostgreSQL** accessed via **Prisma**
- **Tailwind CSS**
- **Vitest** for unit tests

Media files are stored on the filesystem with metadata held relationally,
keeping timeline queries fast without loading large binaries through the
database.

## Running locally

Requires Node.js and a running PostgreSQL instance.

```bash
git clone https://github.com/mh6n23/qualitate.git
cd qualitate
npm install
```

Create `.env` with your database connection string and an auth secret:

```
DATABASE_URL="postgresql://user:password@localhost:5432/qualitate"
AUTH_SECRET="<random string, e.g. from `npx auth secret`>"

```

Then set up the database and start the dev server:

```bash
npx prisma migrate dev
npm run dev
```

The app runs at http://localhost:3000.

## Tests

```bash
npm run test:run
```

## Evaluation

The application was evaluated with five participants completing
task-based scenarios. The synchronised timeline scored 4.6/5 for
usefulness and the application scored 4/5 for overall usability.

## Note on data

Sample data in this repository is synthetic. Workshop recordings and
interview transcripts collected during the project were gathered under
university ethics approval and are not included.
