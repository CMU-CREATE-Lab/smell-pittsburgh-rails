class ApiController < ApplicationController

  # protect_from_forgery with: :null_session
  skip_before_action :verify_authenticity_token, :only => [:smell_report_create]


  def smell_report_create
    render :inline => "smell_report_create"
  end


  def smell_report_index
    render :inline => "smell_report_index"
  end


  # remove me later
  def post_crash
    # never executes unless :post_crash is added to "skip_before_action"
    render :inline => "this crashes because protect from forgery"
  end

end
