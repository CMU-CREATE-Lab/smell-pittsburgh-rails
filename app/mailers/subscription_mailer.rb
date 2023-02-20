class SubscriptionMailer < ApplicationMailer

  default :from => "smellpgh-reports@cmucreatelab.org",
          :content_type => "text/html"


  def welcome(subscription)
    @subscription = subscription
    @url = generate_unsubscribe_url(@subscription.token_to_unsubscribe)
    mail(:to => @subscription.email, :subject => "Welcome")
  end


  def notify_bcamp(subscription, list_notifications)
    @subscription = subscription
    @url = generate_unsubscribe_url(@subscription.token_to_unsubscribe)
    @list = list_notifications
    mail(:to => @subscription.email, :subject => "BCAMP Events Notification")
  end


  def notify_admin(subscription, list_notifications)
    @subscription = subscription
    @url = generate_unsubscribe_url(@subscription.token_to_unsubscribe)
    @list = list_notifications
    mail(:to => @subscription.email, :subject => "BCAMP Admin Notification")
  end


  private

    def generate_unsubscribe_url(token)
      # NOTE: You can only call `request.base_url` from within a controller, so we have to manually define the domain in environments
      domain = BASE_URL_UNSUBSCRIBE
      return "#{domain}/notifications/unsubscribe/#{token}"
    end

end
