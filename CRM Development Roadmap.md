# CRM Development Roadmap

## Project Context

We already have:

* Authentication Module
* Users Management
* Roles & Permissions
* HR Module
* Firebase Authentication
* Firestore Database
* Firebase Storage
* Existing Design System
* Existing Layout & Navigation

Do NOT rebuild any of the above.

The goal is to build a complete CRM module integrated into the current system.

---

# Technical Stack

* React
* TypeScript
* Firebase Firestore
* Firebase Storage
* React Hook Form
* Zod
* TanStack Query
* Tailwind CSS

Follow Feature-Based Architecture.

---

# Phase 1 — CRM Foundation

## Task 1.1 CRM Module Setup

Create:

* CRM routes
* CRM navigation menu
* CRM permissions integration
* Shared CRM types

---

## Task 1.2 Firestore Collections

Create collections:

* leads
* contacts
* deals
* crmTasks
* notes
* attachments
* activities
* notifications

Create:

* TypeScript models
* Firestore services
* Validation schemas

---

# Phase 2 — Leads Management

## Task 2.1 Leads List

Features:

* Table view
* Search
* Pagination
* Sorting

Filters:

* Status
* Source
* Assigned User
* Date Range

---

## Task 2.2 Create Lead

Fields:

* Name
* Phone
* Email
* Company
* Source
* Priority
* Assigned User
* Notes

Validation using Zod.

---

## Task 2.3 Edit Lead

Features:

* Update lead information
* Save activity history

---

## Task 2.4 Lead Details Page

Sections:

* Overview
* Notes
* Activities
* Tasks
* Attachments

---

## Task 2.5 Lead Status Workflow

Statuses:

* New
* Contacted
* Qualified
* Proposal Sent
* Negotiation
* Won
* Lost

---

# Phase 3 — Lead Conversion

## Task 3.1 Convert Lead To Contact

Requirements:

When converting a lead:

* Create Contact
* Preserve Notes
* Preserve Attachments
* Preserve Activities
* Preserve Timeline

---

## Task 3.2 Conversion Activity Log

Automatically log:

Lead Converted To Contact

---

# Phase 4 — Contacts Management

## Task 4.1 Contacts List

Features:

* Search
* Filters
* Sorting

---

## Task 4.2 Contact Details

Sections:

* Overview
* Deals
* Tasks
* Notes
* Attachments
* Timeline

---

## Task 4.3 Edit Contact

Features:

* Update contact information
* Track modifications

---

# Phase 5 — Deals Management

## Task 5.1 Deals CRUD

Fields:

* Title
* Contact
* Value
* Stage
* Probability
* Expected Close Date
* Assigned User

---

## Task 5.2 Deal Pipeline

Stages:

* Lead
* Contacted
* Qualified
* Proposal Sent
* Negotiation
* Won
* Lost

---

## Task 5.3 Kanban Board

Features:

* Drag and Drop
* Move Between Stages
* Auto Save Changes

---

## Task 5.4 Deal Details

Sections:

* Overview
* Tasks
* Notes
* Attachments
* Timeline

---

# Phase 6 — Tasks & Follow Ups

## Task 6.1 CRM Tasks

Task Types:

* Call
* Meeting
* Email
* Follow Up
* Proposal

Statuses:

* Pending
* In Progress
* Completed
* Cancelled

---

## Task 6.2 Task Assignment

Features:

* Assign User
* Due Date
* Priority

Priority Levels:

* Low
* Medium
* High

---

## Task 6.3 Task Dashboard

Widgets:

* Today's Tasks
* Upcoming Tasks
* Overdue Tasks

---

# Phase 7 — Notes Module

## Task 7.1 Notes Management

Features:

* Create Note
* Edit Note
* Delete Note

Attach Notes To:

* Lead
* Contact
* Deal

---

# Phase 8 — Attachments Module

## Task 8.1 Firebase Storage Integration

Supported Files:

* Images
* PDF
* Excel
* Word Documents

---

## Task 8.2 File Management

Features:

* Upload
* Preview
* Download
* Delete

---

# Phase 9 — Activity Timeline

## Task 9.1 Automatic Activity Logging

Track:

* Lead Created
* Lead Updated
* Lead Converted
* Contact Updated
* Deal Created
* Deal Updated
* Deal Stage Changed
* Task Created
* Task Completed
* Note Added
* File Uploaded

---

## Task 9.2 Timeline Component

Display:

* Date
* User
* Action
* Details

---

# Phase 10 — Notifications

## Task 10.1 In-App Notifications

Notify users when:

* Lead Assigned
* Deal Assigned
* Task Assigned
* Task Due
* Deal Won
* Deal Lost

---

## Task 10.2 Notification Center

Features:

* Mark As Read
* Unread Counter
* Notification History

---

# Phase 11 — CRM Dashboard

## Task 11.1 KPI Cards

Display:

* Total Leads
* Total Contacts
* Active Deals
* Won Deals
* Lost Deals
* Expected Revenue

---

## Task 11.2 Sales Funnel

Stages:

* Leads
* Qualified
* Proposal
* Negotiation
* Won

---

## Task 11.3 Charts

Create:

* Leads By Source
* Deals By Stage
* Revenue By Month
* Conversion Rate

---

# Phase 12 — Reports

## Task 12.1 Lead Reports

Metrics:

* New Leads
* Conversion Rate
* Lead Sources

---

## Task 12.2 Sales Reports

Metrics:

* Won Deals
* Lost Deals
* Revenue

---

## Task 12.3 Team Performance

Metrics:

* Deals Closed Per Employee
* Tasks Completed Per Employee
* Conversion Rate Per Employee

---

# Phase 13 — QA & Final Review

## Task 13.1 Permissions Review

Rules:

* Sales Users can only access assigned records.
* Managers can access team records.
* Admins can access everything.

---

## Task 13.2 Responsive Design

Optimize:

* Tables
* Forms
* Kanban Board
* Dashboard

---

## Task 13.3 Full Testing

Test:

* Lead Lifecycle
* Contact Lifecycle
* Deal Lifecycle
* Task Lifecycle
* Permission Rules

---

# Cursor Instructions

Work phase by phase.

Do NOT start the next phase until the current phase is fully completed.

For every phase generate:

* TypeScript Types
* Firestore Services
* Validation Schemas
* Hooks
* UI Components
* Pages
* Tests

Always reuse existing project architecture, permissions, layouts, and design system.

