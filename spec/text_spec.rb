require_relative "../lib/text"

describe "Text.tokens" do
  it "splits the empty string into zero tokens" do
    expect(Text.new("").tokens).to eq []
  end

  it "splits a one-word text into one token" do
    expect(Text.new("asdf").tokens).to eq ["asdf"]
  end

  it "splits text into word and non-word segments" do
    expect(Text.new("There are 10 (ten) robots here!").tokens).to eq ["There", " ", "are", " ", "10", " (", "ten", ") ", "robots", " ", "here", "!"]
  end

  it "treats slashes as part of words" do
    expect(Text.new("robot/PL").tokens).to eq ["robot/PL"]
  end

  it "treats + as part of a word" do
    expect(Text.new("robot+chicken").tokens).to eq ["robot+chicken"]
  end
end