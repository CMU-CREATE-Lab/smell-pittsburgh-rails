class ApplicationMailer < ActionMailer::Base


  def test_mail(to, from, subject, body)
    mail(:to => to, :from => from, :subject => subject, :body => body)
  end

end
