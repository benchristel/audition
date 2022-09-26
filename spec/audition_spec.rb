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

  it "compounds" do
    audition = Audition.new({
      "lexicon.txt" => <<~EOF,
        foo oof
        bar rab
      EOF
      "sample.txt" => <<~EOF,
        foo+bar
      EOF
      "morphology" => {
        "compound" => lambda { |a, b| a + b }
      },
    })
    expect(audition.run).to eq("oofrab")
  end

  it "allows compound words in the lexicon" do
    audition = Audition.new({
      "lexicon.txt" => <<~EOF,
        foo oof
        bar rab
        baz foo+bar
      EOF
      "sample.txt" => <<~EOF,
        baz
      EOF
      "morphology" => {
        "compound" => lambda { |a, b| a + b }
      },
    })
    expect(audition.run).to eq("oofrab")
  end

  it "allows compounds of compounds" do
    audition = Audition.new({
      "lexicon.txt" => <<~EOF,
        foo oof
        bar rab
        baz foo+bar
        kludge baz+baz
      EOF
      "sample.txt" => <<~EOF,
        kludge
      EOF
      "morphology" => {
        "compound" => lambda { |a, b| a + b }
      },
    })
    expect(audition.run).to eq("oofraboofrab")
  end

  it "dereferences words with a trailing plus" do
    audition = Audition.new({
      "lexicon.txt" => <<~EOF,
        see   fryn
        look  see+
      EOF
      "sample.txt" => <<~EOF,
        look
      EOF
      "morphology" => {
        "compound" => lambda { |a| a }
      },
    })
    expect(audition.run).to eq("fryn")
  end

  it "allows inflections in the lexicon" do
    audition = Audition.new({
      "lexicon.txt" => <<~EOF,
        visit   plef
        visitor plef/AGT
      EOF
      "sample.txt" => <<~EOF,
        visitor
      EOF
      "morphology" => {
        "compound" => lambda { |a| a },
        "AGT" => lambda { |w| "a" + w + "t" }
      },
    })
    expect(audition.run).to eq("apleft")
  end
end