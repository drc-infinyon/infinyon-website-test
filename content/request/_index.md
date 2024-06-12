---
title: "InfinyOn | Subscribe for Newsletter"
content:
  title: "Subscribe to Newsletter"
  metadata:
    - type: "subscribe"
    - source: "Subscribe Page"
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
    button:
      label: "Subscribe"
      action: "/subscribe"
    route:
      success: 
        link: "/"
        text: "Welcome to the InfinyOn newsletter."
      error: 
        link: "/"
---