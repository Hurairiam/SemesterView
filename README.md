# SemesterView

**A unified academic assistant for university students — built and shipped in 3 hours.**

🏆 **1st Place — ULAB UCPC Hackathon (Club Week Challenge 2026)** · August 15, 2026
Team: *The Special One*

[Report an Issue](https://github.com/Hurairiam/SemesterView/issues)

---

## 🔗 Live Demo

**[https://data-analyzer--saifhasankhan19.replit.app/login](https://data-analyzer--saifhasankhan19.replit.app/login)**

## The Problem

University academic information is scattered across course routines in Excel, exam schedules in PDFs, academic calendars in separate PDFs, faculty details in disconnected systems, and research interests shared as images. Students juggle multiple sources just to answer simple questions like *"What's my next class?"* or *"Is this room free right now?"*

## The Solution

SemesterView consolidates schedules, exams, room availability, faculty information, and research opportunities into a single, personalized academic assistant — built and demonstrated using real ULAB CSE department data.

## Key Features

- **Personalized schedule** — students select their current courses and get a generated semester timetable
- **Free room finder** — cross-references the timetable to surface which rooms are open at a given time
- **Exam schedule & academic calendar** — pulled into one consistent view
- **Faculty directory & advisor selection** — with CSE research-area discovery
- **Research interest matching** — students indicate interests, relevant faculty can view them
- **Faculty view** — a separate login lets faculty check their day-by-day and full-semester schedule
- **Structured data pipeline** — university data (Excel, PDF, JSON) is normalized into structured JSON, making the app data-driven rather than hardcoded

## Why It Stood Out

Most student-assistant concepts at the event relied on hardcoded demo screens. SemesterView's structured JSON pipeline demonstrated that the same interface could scale to real, changing university data — a distinction the judges specifically called out.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, Tailwind CSS |
| Backend | Next.js API routes (no separate server) |
| Database | SQLite |
| Hosting | Replit |

**Architecture:**
```
User → Next.js/React Frontend → Next.js API Routes → SQLite
```

Academic data (courses, schedules, exams) is treated as refreshable per semester, while user data (selections, preferences) is designed to persist independently.

## Getting Started

```bash
# Clone the repository
git clone https://github.com/Hurairiam/SemesterView.git
cd SemesterView

# Install dependencies
pnpm install

# Run the development server
pnpm dev
```

Visit `http://localhost:3000` to view the app locally.

## Roadmap

This was built as a hackathon prototype within a strict 3-hour window. Planned next steps include:

- University authentication with role-based access control (student / faculty / admin)
- Persistent database-backed course, advisor, and research selections
- Live university API integration in place of static data imports
- Faculty email notifications for matched research interests
- Support for departments beyond CSE
- Optional AI-powered natural-language query layer on top of verified data

## Team — The Special One

| Name | Contribution |
|---|---|
| **Abu Huraira** | Core idea, product direction, feature planning, data structure & technical decisions |
| **Saif Hasan Khan** | JSON/data architecture, presentation & pitching |
| **Tanvir** | Presentation preparation and delivery |

## Event Details

Built in a 3-hour sprint on **August 15, 2026** for the **ULAB UCPC Hackathon — Club Week Challenge 2026**, organized by the ULAB Computer Programming Club (UCPC), competing against ~9 teams on problem understanding, technical implementation, functionality, UX, and presentation.

## Gallery

<table>
  <tr>
    <td align="center">
      <img src="hackathon-photos/teamphoto.jpg" alt="The Special One - Team Photo" width="520"><br>
      <sub><em>The Special One at the ULAB UCPC Hackathon</em></sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="hackathon-photos/crest.jpg" alt="Winning Crest" width="220"><br>
      <sub><em>Champion Crest</em></sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="hackathon-photos/certifcate_huraira.jpg" alt="Certificate of Achievement" width="450"><br>
      <sub><em>Certificate of Achievement</em></sub>
    </td>
  </tr>
</table>

---

<p align="center">Built with ☕ and a strict 4:00 PM deadline.</p>
