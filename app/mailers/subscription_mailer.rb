class SubscriptionMailer < ApplicationMailer

  default :from => "smellpgh-reports@cmucreatelab.org",
          :content_type => "text/html"


  def welcome(subscription)
    @subscription = subscription
    # TODO get actual domain/url?
    domain = "https://api.smellpittsburgh.org"
    @url = "#{domain}/bcamp/unsubscribe/#{@subscription.token_to_unsubscribe}"
    mail(:to => @subscription.email, :subject => "Welcome")
  end

  # TODO email helpers for BCAMP, admin (will replace calls to ActionMailer::Base.mail in raketask)

end
