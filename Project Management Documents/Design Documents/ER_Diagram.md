```mermaid

erDiagram
  USERS {
    INT user_id PK
    VARCHAR email "UNIQUE"
    VARCHAR password
    ENUM user_type "Faculty|Student"
    VARCHAR username "UNIQUE"
    VARCHAR first_name
    VARCHAR last_name
    INT student_id
  }

  FACULTIES {
    INT faculty_id PK
    VARCHAR name "UNIQUE"
    TEXT description
  }

  CATEGORIES {
    INT category_id PK
    VARCHAR name "UNIQUE"
    TEXT description
  }

  ITEMS {
    INT item_id PK
    VARCHAR name
    TEXT description
    VARCHAR image_url
    INT faculty_id FK
    INT owner_id FK
    VARCHAR serial_number
    INT category_id FK
  }

  BORROWREQUESTS {
    INT request_id PK
    INT borrower_id FK
    INT item_id FK
    DATETIME requested_start
    DATETIME requested_end
    TEXT reason
    ENUM status "Pending|Approved|Rejected"
    TEXT rejectionReason
  }

  CONDITIONIMAGES {
    INT image_id PK
    INT borrow_request_id FK
    VARCHAR image_url
    ENUM image_type "Before|After"
    DATETIME timestamp
  }

  NOTIFICATIONS {
    INT notification_id PK
    INT user_id FK
    VARCHAR type
    VARCHAR title
    TEXT message
    BOOLEAN is_read
    DATETIME created_at
  }

  AUDIT_LOGS {
    INT audit_id PK
    INT actor_user_id FK
    VARCHAR action
    VARCHAR entity_type
    INT entity_id
    TEXT metadata
    DATETIME created_at
  }

  FACULTIES ||--o{ ITEMS : has
  CATEGORIES ||--o{ ITEMS : categorizes
  USERS ||--o{ ITEMS : owns
  USERS ||--o{ BORROWREQUESTS : submits
  ITEMS ||--o{ BORROWREQUESTS : requested_for
  BORROWREQUESTS ||--o{ CONDITIONIMAGES : has

  USERS ||--o{ NOTIFICATIONS : receives
  USERS ||--o{ AUDIT_LOGS : performs
