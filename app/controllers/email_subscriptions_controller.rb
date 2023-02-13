class EmailSubscriptionsController < ApplicationController

  def index
  end

  def new
    @subscription = EmailSubscription.new
  end

  def create
    @email = params[:email_subscription][:email]
    @subscription = EmailSubscription.find_by(:email => @email)
    # already subscribed? (same webpage but don't send another email)
    skip_mailer = @subscription.nil? ? false : @subscription.subscribe_bcamp
    if @subscription.nil?
      @subscription = EmailSubscription.new
      @subscription.email = @email
    end
    @subscription.subscribe_bcamp = true
    if @subscription.save
      # TODO determine mailer call that does not wait for response (my VM takes 1-2 minutes to respond here)
      SubscriptionMailer.welcome(@subscription).deliver_later unless skip_mailer
      render "show"
    else
      render "error"
    end
  end

  def unsubscribe
    @subscription = EmailSubscription.find_by_token_to_unsubscribe(params[:token_id])
    if @subscription.nil?
      redirect_to "/bcamp/subscribe"
    else
      @subscription.subscribe_bcamp = false
      @subscription.save
      render "unsubscribe"
    end
  end

end
