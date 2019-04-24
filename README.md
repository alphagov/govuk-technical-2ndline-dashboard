# GOV.UK Zendesk Display Screen

Displays some high-level statistics from a given Zendesk view. Used to display the number of tickets currently on the 2nd line queue.

## Running

`ZENDESK_SUBDOMAIN=govuk ZENDESK_API_USERNAME=something@example.com ZENDESK_API_TOKEN=ABCDEFG ZENDESK_VIEW_ID=123456789 AUTH_USERNAME=username AUTH_PASSWORD=password bundle exec puma`

## Dark mode

Dark mode is set by default and results in a dark background and light text. To disable dark mode, add `?dark_mode=false` to the URL.

## Licence

[MIT License](LICENCE)
