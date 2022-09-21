require_relative "text"

class Audition
  def initialize(data)
    @data = data
  end

  def run
    lexicon = Hash[data["lexicon.txt"].split("\n").map { |line| line.split(/ +/)[0..1] }]

    lines = data["sample.txt"].split("\n")
    lines.map { |line|
      if line =~ /^>/
        line
      else
        Text.new(line).tokens.map { |w|
          gloss, *inflections = w.split("/")
          word = lexicon[gloss] || gloss
          if word =~ /\+/
            translated_morphemes = word.split("+")
              .map { |morpheme| lexicon[morpheme] || morpheme }
            word = data["morphology"]["compound"].call(*translated_morphemes)
          end
          inflections.reduce(word) { |w, inflection|
            inflect = data["morphology"][inflection]
            if inflect.nil?
              w + "/" + inflection
            else
              inflect.call(w)
            end
          }
        }.join("") 
      end
    }.join("\n")
  end

  private

  def data
    @data
  end
end
