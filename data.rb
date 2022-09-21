STATIC_DATA = {
  "lexicon.txt" => File.read("lexicon.txt"),
  "sample.txt" => File.read("sample.txt"),
  "morphology" => {
    "PL" => lambda do |w|
      if w =~ /r$/
        w + "en"
      elsif w =~ /[aeiou]$/
        w + "r"
      else
        w + "ir"
      end
    end,
    "DEFOBJ" => lambda do |w|
      if w =~ /[aeiou]$/
        w + "n"
      else
        w + " i"
      end
    end,
    "CAP" => lambda do |w|
      w.capitalize
    end,
    "M1" => lambda do |w|
      lenit(w)
    end,
    "PASS" => lambda do |w|
      w + "s"
    end,
    "ADJ" => lambda do |w|
      w + "ui"
    end,
    "INCH" => lambda do |w|
      if w =~ /[aeiou]$/
        w + "tha"
      else
        w + "atha"
      end
    end,
    "GER" => lambda do |w|
      if w =~ /[aeiou]$/
        w + "d"
      else
        w + "ed"
      end
    end,
    "compound" => lambda do |ws|
      ws.each_with_index.map { |w, i|
        if i > 0 && ws[i-1] =~ /[aeioudbglrnm]$/
          lenit(w)
        else
          w
        end
      }.join("")
    end
  }
}

def lenit(w)
  w.sub /^[^aeiou]+(?=[aeiou])/ do |init|
    case init
    when "p" then "b"
    when "t" then "d"
    when "c", "k" then "g"
    when "b" then "v"
    when "br" then "vr"
    when "d" then "dh"
    when "g" then "'"
    when "s" then "h"
    when "rh" then "r"
    when "m" then "v"
    else init
    end
  end
end