---
title: "InfinyOn | Book a Call"
content:
  title: "Book a Call"
  subtitle: "with a data streaming expert."
  metadata:
    - type: "book-call"
    - source: "Book a Call"
  form:
    fields:
      - field: "input"
        type: "text"
        id: "name"
        label: "Name"
        required: true
      - field: "input"
        type: "email"
        id: "email"
        label: "Email address"
        required: true
      - field: "textarea"
        id: "use-case"
        label: "Use case"
        required: true
    button:
      label: "Book Now"
      action: "/subscribe"
    route:
      success: 
        link: "/"
        text: "We'll reach out to schedule time."
      error: 
        link: "/"
---