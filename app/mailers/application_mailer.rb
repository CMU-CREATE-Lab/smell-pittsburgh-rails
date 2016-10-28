class ApplicationMailer < ActionMailer::Base


  def test_mail(to, from, body)
    mail(:to => to, :from => from, :body => body)
  end

end
