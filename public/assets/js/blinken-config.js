var blinken_config = {
  "groups": [
    {
      "id": "govuk",
      "name": "",
      "environments": [
        {
          "name": "Production (AWS)",
          "url": "https://alert.blue.production.govuk.digital"
        },
        {
          "name": "Staging (AWS)",
          "url": "https://alert.blue.staging.govuk.digital"
        },
        {
          "name": "Integration",
          "url": "https://alert.integration.publishing.service.gov.uk"
        },
        {
          "name": "CI",
          "url": "https://alert.blue.integration.govuk.digital"
        }
      ]
    }
  ]
}
