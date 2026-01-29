```mermaid

sequenceDiagram
  autonumber
  actor Student
  actor Staff as Faculty/Lab Manager/Admin
  participant FE as Frontend (React)
  participant API as Backend (Express)
  participant DB as MySQL
  participant FS as File Storage (Uploads/Cloud)
  participant N as Notification Service (Email + In-app)
  participant A as Audit Log Service
  participant S as Scheduler/Background Jobs

  %% -------------------------
  %% AUTHENTICATION
  %% -------------------------
  rect rgba(200, 230, 255, 0.35)
    Note over Student,FE: Register / Login
    alt Register
      Student->>FE: Fill signup form
      FE->>API: POST /api/register
      API->>DB: INSERT users (hashed password)
      DB-->>API: user_id
      API-->>FE: JWT token + user profile
      FE-->>Student: Redirect to Home
    end

    Student->>FE: Enter email + password
    FE->>API: POST /api/login
    API->>DB: SELECT user by email
    DB-->>API: user record
    API-->>FE: JWT token + user profile
    FE-->>Student: Logged in (token stored)

    FE->>API: GET /api/getUser (Bearer JWT)
    API->>DB: SELECT user profile
    DB-->>API: profile
    API-->>FE: profile
  end

  %% -------------------------
  %% BROWSE & AVAILABILITY
  %% -------------------------
  rect rgba(220, 255, 220, 0.35)
    Note over Student,FE: Browse Items + Optional Availability Filter
    Student->>FE: Open Browse Items
    FE->>API: GET /api/items (JWT)
    API->>DB: SELECT items + owner info
    DB-->>API: items list
    API-->>FE: items list
    FE-->>Student: Render items grid

    opt Filter by availability date range
      Student->>FE: Select start/end dates
      FE->>API: GET /api/items/availability?start&end (JWT)
      API->>DB: SELECT items NOT overlapping approved bookings
      DB-->>API: available items
      API-->>FE: available items
      FE-->>Student: Show filtered results
    end
  end

  %% -------------------------
  %% REQUEST BOOKING
  %% -------------------------
  rect rgba(255, 245, 200, 0.35)
    Note over Student,FE: Create Borrow Request (Pending)
    Student->>FE: Open item details + request form
    Student->>FE: Enter start/end + reason
    FE->>API: POST /api/book-item (JWT)
    API->>DB: INSERT borrowrequests(status=Pending)
    DB-->>API: request_id
    API-->>FE: success + request_id
    FE-->>Student: "Request submitted"

    Note over API,N: Event: RequestSubmitted -> notify Staff/Owner
    API-->>N: Create in-app notification for Staff
    N-->>DB: INSERT notifications (Staff)
    API-->>N: Send email to Staff (optional)
  end

  %% -------------------------
  %% STAFF VIEWS REQUESTS
  %% -------------------------
  rect rgba(230, 230, 255, 0.35)
    Note over Staff,FE: Staff sees incoming requests
    Staff->>FE: Open Incoming Requests
    FE->>API: GET /api/item-requests (JWT)
    API->>DB: SELECT requests for items owned by Staff
    DB-->>API: requests list
    API-->>FE: requests list
    FE-->>Staff: Display requests list
  end

  %% -------------------------
  %% APPROVE / REJECT
  %% -------------------------
  rect rgba(255, 220, 220, 0.35)
    Note over Staff,FE: Approve or Reject Request
    alt Approve Request
      Staff->>FE: Click Approve
      FE->>API: PUT /api/request-status {request_id, Approved} (JWT)
      API->>DB: UPDATE borrowrequests SET status='Approved'
      DB-->>API: ok

      API-->>A: Log APPROVE_REQUEST
      A-->>DB: INSERT audit_logs

      API-->>N: Notify Student (in-app + email)
      N-->>DB: INSERT notifications (Student)

      API-->>FE: success
      FE-->>Staff: Status updated (Approved)
    else Reject Request
      Staff->>FE: Click Reject (optional reason)
      FE->>API: PUT /api/request-status {request_id, Rejected} (JWT)
      API->>DB: UPDATE borrowrequests SET status='Rejected' + rejection reason
      DB-->>API: ok

      API-->>A: Log REJECT_REQUEST
      A-->>DB: INSERT audit_logs

      API-->>N: Notify Student (in-app + email)
      N-->>DB: INSERT notifications (Student)

      API-->>FE: success
      FE-->>Staff: Status updated (Rejected)
    end
  end

  %% -------------------------
  %% CHECKOUT (Before Images)
  %% -------------------------
  rect rgba(210, 255, 255, 0.35)
    Note over Staff,Student: Checkout = physically issuing equipment (after approval)
    opt Checkout (if Approved)
      Staff->>FE: Open Approved booking
      Staff->>FE: Click Checkout + upload BEFORE images
      FE->>API: POST /api/checkout (JWT + FormData)

      API->>FS: Store BEFORE images
      FS-->>API: image URLs

      API->>DB: UPDATE borrowrequests status='CheckedOut' + checkout timestamp
      API->>DB: INSERT conditionimages(type='Before', urls)
      DB-->>API: ok

      API-->>A: Log CHECKOUT
      A-->>DB: INSERT audit_logs

      API-->>N: Notify Student "Checked out"
      N-->>DB: INSERT notifications (Student)
      API-->>FE: success
      FE-->>Staff: Checkout completed
    end
  end

  %% -------------------------
  %% RETURN (After Images)
  %% -------------------------
  rect rgba(210, 230, 210, 0.35)
    Note over Staff,Student: Return = equipment received back and closed
    opt Return (after CheckedOut)
      Staff->>FE: Click Return + upload AFTER images + notes
      FE->>API: POST /api/return (JWT + FormData)

      API->>FS: Store AFTER images
      FS-->>API: image URLs

      API->>DB: UPDATE borrowrequests status='Returned' + return timestamp
      API->>DB: INSERT conditionimages(type='After', urls)
      DB-->>API: ok

      API-->>A: Log RETURN
      A-->>DB: INSERT audit_logs

      API-->>N: Notify Student "Returned"
      N-->>DB: INSERT notifications (Student)
      API-->>FE: success
      FE-->>Staff: Return completed
    end
  end

  %% -------------------------
  %% AUTOMATED REMINDERS / OVERDUE
  %% -------------------------
  rect rgba(255, 235, 205, 0.35)
    Note over S,API: Automated jobs run on schedule (reminders, overdue)
    loop Daily/Hourly scheduled job
      S-->>API: Run notifications/overdue job
      API->>DB: Find requests ending soon (reminders)
      DB-->>API: reminder targets
      API-->>N: Send reminder emails + in-app alerts
      N-->>DB: INSERT notifications

      API->>DB: Find requests past end date and not Returned
      DB-->>API: overdue targets
      API->>DB: UPDATE status='Overdue'
      API-->>N: Send overdue emails + in-app alerts
      N-->>DB: INSERT notifications
    end
  end

  %% -------------------------
  %% STUDENT DASHBOARD
  %% -------------------------
  rect rgba(235, 235, 255, 0.35)
    Note over Student,FE: Student views request history/status
    Student->>FE: Open My Bookings
    FE->>API: GET /api/my-requests (JWT)
    API->>DB: SELECT borrowrequests by borrower_id
    DB-->>API: requests
    API-->>FE: requests
    FE-->>Student: Show statuses (Pending/Approved/CheckedOut/Returned/Overdue)
  end

  %% -------------------------
  %% ANALYTICS DASHBOARD
  %% -------------------------
  rect rgba(245, 245, 245, 0.6)
    Note over Staff,FE: Analytics & Reporting
    Staff->>FE: Open Analytics Dashboard
    FE->>API: GET /api/analytics?range=... (JWT + RBAC)
    API->>DB: Aggregate usage metrics (most borrowed, overdue rate, trends)
    DB-->>API: analytics results
    API-->>FE: analytics JSON
    FE-->>Staff: Render charts + summary
  end
