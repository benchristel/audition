require_relative "../lib/audition"

describe "Audition" do
  let :echxicon do
    <<~EOF
      bear  ech
      beer  bwuch
      not   yich
      order blech
    EOF
  end
  
  it "translates a sentence" do
    audition = Audition.new({
      "lexicon.txt" => echxicon,
      "sample.txt" => <<~EOF,
        bear not order beer
      EOF
    })
    expect(audition.run).to eq "ech yich blech bwuch"
  end

  it "translates multiple lines" do
    audition = Audition.new({
      "lexicon.txt" => echxicon,
      "sample.txt" => <<~EOF,
        bear not order beer
        beer not order bear
      EOF
    })
    expect(audition.run).to eq(
      "ech yich blech bwuch\n" +
      "bwuch yich blech ech"
    )
  end

  it "ignores lines starting with >" do
    audition = Audition.new({
      "lexicon.txt" => echxicon,
      "sample.txt" => <<~EOF,
        > Bears don't order beer.
        bear not order beer
      EOF
    })
    expect(audition.run).to eq(
      "> Bears don't order beer.\n" +
      "ech yich blech bwuch"
    )
  end

  it "inflects" do
    audition = Audition.new({
      "lexicon.txt" => echxicon,
      "sample.txt" => <<~EOF,
        bear/PL order/NEG beer
      EOF
      "morphology" => {
        "PL" => lambda { |w| w + "lar" },
        "NEG" => lambda { |w| "zu" + w + "ba" },
      },
    })
    expect(audition.run).to eq(
      "echlar zublechba bwuch"
    )
  end

  it "stacks multiple inflections" do
    audition = Audition.new({
      "lexicon.txt" => echxicon,
      "sample.txt" => <<~EOF,
        bear/PL/NEG beer/NEG/PL
      EOF
      "morphology" => {
        "PL" => lambda { |w| w + "lar" },
        "NEG" => lambda { |w| "zu" + w + "ba" },
      },
    })
    expect(audition.run).to eq(
      "zuechlarba zubwuchbalar"
    )
  end

  it "preserves unrecognized words and inflections" do
    audition = Audition.new({
      "lexicon.txt" => "",
      "sample.txt" => <<~EOF,
        goof/PL
      EOF
      "morphology" => {},
    })
    expect(audition.run).to eq(
      "goof/PL"
    )
  end
end