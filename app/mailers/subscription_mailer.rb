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
      # TODO get actual domain/url?
      domain = "https://api.smellpittsburgh.org"
      return "#{domain}/bcamp/unsubscribe/#{token}"
    end

end
