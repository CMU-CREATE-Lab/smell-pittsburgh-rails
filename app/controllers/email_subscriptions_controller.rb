class EmailSubscriptionsController < ApplicationController

  skip_before_action :verify_authenticity_token, :only => [:subscribe, :api_subscribe_with_id, :api_unsubscribe]

  CHANNEL_BCAMP = "bcamp"


  def index
    response.headers.delete('X-Frame-Options')

    @subscription = EmailSubscription.new
  end


  # html+json accessible
  def subscribe
    response.headers.delete('X-Frame-Options')

    # handles both regular form data (priority) and web form
    if params[:email].blank? and (params[:email_subscription].blank? or params[:email_subscription][:email].blank?)
      respond_to do |format|
        format.json { render :json => {:success => false, :status_message => "no email provided"}, :layout => false }
        format.html { render "error" }
      end
      return
    end
    @email = params[:email].blank? ? params[:email_subscription][:email] : params[:email]

    @subscription = EmailSubscription.find_by(:email => @email)
    # already subscribed? (same webpage but don't send another email)
    skip_mailer = @subscription.nil? ? false : @subscription.subscribe_bcamp
    if @subscription.nil?
      @subscription = EmailSubscription.new
      @subscription.email = @email
    end
    @subscription.subscribe_bcamp = true
    subscription_is_updated = @subscription.save

    if subscription_is_updated
      SubscriptionMailer.welcome(@subscription).deliver_later unless skip_mailer
    end

    response = {
      :success => subscription_is_updated,
      :status_message => subscription_is_updated ? "success" : "could not update subscription" ,
    }
    respond_to do |format|
      format.json { render :json => response, :layout => false }
      format.html { subscription_is_updated ? (render "show") : (render "error") }
    end
  end


  # NOTE: html only
  def unsubscribe
    @subscription = EmailSubscription.find_by_token_to_unsubscribe(params[:token_id])
    if @subscription.nil?
      redirect_to "/bcamp/subscribe"
    else
      @subscription.subscribe_bcamp = false
      subscription_is_updated = @subscription.save
      subscription_is_updated ? (render "unsubscribe") : (redirect_to "/bcamp/subscribe")
    end
  end


  # NOTE: json only (NO welcome email)
  def api_subscribe_with_id
    @email = params[:email]
    @channel = params[:sub_id] # from URL

    @subscription = EmailSubscription.find_by(:email => @email)
    if @subscription.nil?
      @subscription = EmailSubscription.new
      @subscription.email = @email
    end

    if @channel == CHANNEL_BCAMP
      @subscription.subscribe_bcamp = true
      subscription_is_updated = @subscription.save

      response = {
        :success => subscription_is_updated,
        :status_message => subscription_is_updated ? "success" : "could not update subscription" ,
      }
    else
      # unknown/unimplemented channel
      response = {
        :success => false,
        :status_message => "cannot subscribe to channel named `#{@channel}`." ,
      }
    end

    render :json => response, :layout => false
  end


  # NOTE: json only
  def api_unsubscribe
    @token = params[:token]
    @channel = params[:sub_id] # from URL

    @subscription = EmailSubscription.find_by_token_to_unsubscribe(@token)
    if @subscription.nil?
      response = {
        :success => false,
        :status_message => "could not update subscription" ,
      }
    else
      if @channel == CHANNEL_BCAMP
        @subscription.subscribe_bcamp = false
        subscription_is_updated = @subscription.save
        response = {
          :success => subscription_is_updated,
          :status_message => subscription_is_updated ? "success" : "could not update subscription" ,
        }
      else
        # unknown/unimplemented channel
        response = {
          :success => false,
          :status_message => "cannot unsubscribe from channel named `#{@channel}`." ,
        }
      end
    end

    render :json => response, :layout => false
  end


  # NOTE: json only
  def get_subscription_status
    @token = params[:token_id] # from URL

    @subscription = EmailSubscription.find_by_token_to_unsubscribe(@token)
    if @subscription.nil?
      response = {
        :success => false,
        :status_message => "could not find subscription" ,
      }
    else
      response = {
        :success => true,
        :status_message => "success" ,
        :subscription => {
          :email => @subscription.email,
          :bcamp => @subscription.subscribe_bcamp,
          :admin => @subscription.subscribe_admin,
        }
      }
    end

    render :json => response, :layout => false
  end

end
