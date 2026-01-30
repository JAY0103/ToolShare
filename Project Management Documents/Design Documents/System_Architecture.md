```mermaid

flowchart TB

  subgraph Users
    S["Student"]
    F["Faculty/Staff"]
    L["Lab Manager"]
    A["Admin"]
  end

  subgraph ToolShare_System["ToolShare System"]
    UI["Web UI<br/>React (Vite)"]
    API["Backend API<br/>Node.js + Express"]
    DB[("MySQL Database")]
    FS[("File Storage<br/>Item + Condition Images")]
    NOTIF["Notifications<br/>In-app + Email Triggers"]
    ANALYTICS["Analytics/Reports"]
    AUDIT[("Audit Logs")]
  end

  subgraph External_Services["External Services"]
    EMAIL["Email Provider<br/>SMTP/3rd-party"]
    CRON["Scheduler/Cron Jobs<br/>Reminders + Overdue"]
  end

  %% User access
  S --> UI
  F --> UI
  L --> UI
  A --> UI

  %% Core connections
  UI -->|REST API + JWT| API
  API --> DB
  API --> FS
  API --> NOTIF
  API --> ANALYTICS
  API --> AUDIT

  %% External integrations
  NOTIF --> EMAIL
  CRON --> API