class Text
  def initialize(str)
    @str = str
  end

  def tokens
    @str.scan(/[a-zA-Z0-9_\-\/]+|[^a-zA-Z0-9_\-\/]+/)
  end
end