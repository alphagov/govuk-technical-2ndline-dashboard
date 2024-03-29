require "sinatra"
require "zendesk_api"

DISPLAY_SCREEN_TITLE = "GOV.UK Technical 2nd line dashboard".freeze
DISPLAY_SCREEN_LAYOUT = "2col".freeze
DISPLAY_SCREEN_FRAMES = [
  "/summary",
  "/zendesk?hide_low_queue=false",
].freeze

configure do
  set :protection, except: :frame_options
end

helpers do
  def user_authorized?
    @auth ||= Rack::Auth::Basic::Request.new(request.env)
    @auth.provided? && @auth.basic? && @auth.credentials && @auth.credentials == [ENV["AUTH_USERNAME"], ENV["AUTH_PASSWORD"]]
  end

  def zendesk
    @zendesk ||= ZendeskAPI::Client.new do |config|
      config.url = "https://#{ENV['ZENDESK_SUBDOMAIN']}.zendesk.com/api/v2"
      config.username = ENV["ZENDESK_API_USERNAME"]
      config.token = ENV["ZENDESK_API_TOKEN"]
    end
  end
end

unless ENV["ZENDESK_SUBDOMAIN"] && ENV["ZENDESK_API_USERNAME"] && ENV["ZENDESK_API_TOKEN"] && ENV["ZENDESK_VIEW_ID"] && ENV["AUTH_USERNAME"] && ENV["AUTH_PASSWORD"]
  raise "The ZENDESK_SUBDOMAIN, ZENDESK_API_USERNAME, ZENDESK_API_TOKEN, ZENDESK_VIEW_ID, AUTH_USERNAME and AUTH_PASSWORD environment variables must be set to run this application."
end

get "/" do
  frames = DISPLAY_SCREEN_FRAMES.map { |frame| "&url%5B%5D=#{ERB::Util.url_encode(frame)}" }.join("")
  [302, { "Location" => "/frame-splits?title=#{ERB::Util.url_encode(DISPLAY_SCREEN_TITLE)}&layout=#{ERB::Util.url_encode(DISPLAY_SCREEN_LAYOUT)}&#{frames}" }, []]
end

get "/frame-splits" do
  # the intention is for this page to only be arrived at via `/`, which redirects with the required parameters
  erb "frame-splits".to_sym, locals: {}
end

get "/summary" do
  dark_mode = true unless params[:dark_mode] && params[:dark_mode] == "false"

  erb :summary, locals: { dark_mode: dark_mode }
end

get "/zendesk" do
  dark_mode = true unless params[:dark_mode] && params[:dark_mode] == "false"
  hide_low_queue = true unless params[:hide_low_queue] && params[:hide_low_queue] == "false"
  number_of_tickets = { "high" => 0, "normal" => 0, "low" => 0 }
  # This would be much nicer if we could get ticket counts broken down by priority from the Zendesk API
  zendesk.view.find!(id: ENV["ZENDESK_VIEW_ID"]).tickets.all! do |ticket|
    status = ticket.fetch("status", "new")
    next if %w[hold pending solved closed].include?(status)

    number_of_tickets[ticket["priority"]] = number_of_tickets[ticket["priority"]].to_i.next
  end
  erb :zendesk, locals: { zendesk_url: "https://govuk.zendesk.com/agent/filters/#{ENV['ZENDESK_VIEW_ID']}", number_of_tickets: number_of_tickets, dark_mode: dark_mode, hide_low_queue: hide_low_queue }
end

get "/build" do
  erb :build, locals: {}
end
