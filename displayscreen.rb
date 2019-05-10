require 'sinatra'
require 'zendesk_api'

configure do
  set :protection, :except => :frame_options
end

helpers do
  def user_protected!
    return if user_authorized?

    headers['WWW-Authenticate'] = 'Basic realm="GOV.UK Zendesk Display Screen"'
    halt 401
  end

  def user_authorized?
    @auth ||= Rack::Auth::Basic::Request.new(request.env)
    @auth.provided? && @auth.basic? && @auth.credentials && @auth.credentials == [ENV['AUTH_USERNAME'], ENV['AUTH_PASSWORD']]
  end

  def zendesk
    @zendesk ||= ZendeskAPI::Client.new do |config|
      config.url = "https://#{ENV['ZENDESK_SUBDOMAIN']}.zendesk.com/api/v2"
      config.username = ENV['ZENDESK_API_USERNAME']
      config.token = ENV['ZENDESK_API_TOKEN']
    end
  end
end

unless ENV['ZENDESK_SUBDOMAIN'] && ENV['ZENDESK_API_USERNAME'] && ENV['ZENDESK_API_TOKEN'] && ENV['ZENDESK_VIEW_ID'] && ENV['AUTH_USERNAME'] && ENV['AUTH_PASSWORD']
  raise 'The ZENDESK_SUBDOMAIN, ZENDESK_API_USERNAME, ZENDESK_API_TOKEN, ZENDESK_VIEW_ID, AUTH_USERNAME and AUTH_PASSWORD environment variables must be set to run this application.'
end

get '/' do
  user_protected!
  dark_mode = true unless params[:dark_mode] && params[:dark_mode] == 'false'
  hide_low_queue = true unless params[:hide_low_queue] && params[:hide_low_queue] == 'false'
  number_of_tickets = {}
  # This would be much nicer if we could get ticket counts broken down by priority from the Zendesk API
  zendesk.view.find!(id: ENV['ZENDESK_VIEW_ID']).tickets.all! do |ticket|
    status = ticket.status.fetch("status", "new")
    next if %w(hold pending solved closed).include?(status)

    number_of_tickets[ticket['priority']] = number_of_tickets[ticket['priority']].to_i.next
  end
  erb :index, locals: { number_of_tickets: number_of_tickets, dark_mode: dark_mode, hide_low_queue: hide_low_queue }
end
