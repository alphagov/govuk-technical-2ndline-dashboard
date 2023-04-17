var blinken_config = {
  "groups": [
    {
      "id": "govuk",
      "name": "",
      "environments": [
        {
          "name": "Production (EC2)",
          "url": "https://alert.blue.production.govuk.digital"
        },
        {
          "name": "Staging (EC2)",
          "url": "https://alert.blue.staging.govuk.digital"
        },
        {
          "name": "Integration (EC2)",
          "url": "https://alert.integration.publishing.service.gov.uk"
        },
        {
          "name": "CI (EC2)",
          "url": "https://alert.blue.integration.govuk.digital"
        }
      ]
    }
  ]
}
