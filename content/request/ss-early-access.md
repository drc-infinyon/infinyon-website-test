---
title: "InfinyOn | Stateful Data Flow Release Onboarding"
content:
  title: "Stateful Data Flow Release"
  subtitle: "Request early access"
  metadata:
    - type: "request-access"
    - source: "Stateful Services"
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
        label: "Work Email"
        required: true
      - field: "combobox"
        label: "Choose a release"
        id: "release"
        options:
          - "Public Beta"
          - "GA Release"
    button:
      label: "Request Access"
      action: "/subscribe"
    route:
      success: 
        link: "/stateful-streaming"
        text: "Your access request was successful."
      error: 
        link: "/stateful-streaming"
---