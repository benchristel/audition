STATIC_DATA = {
  "lexicon.txt" => <<~END_LEXICON,
hole   toll
in     na
ground dor
dwell  derio
hobbit hobbit
of     a
past_p o
nothing óman úman gúnad
nasty  gasp
slimy  lhecui
wet    nimp
and_p  ha
fill   panna
use    be
end_n  medh
worm   lhug
and_n  ag
smell  boss
ooze   gatheb
dry    sarch
bare   baer
sand   delf
have   cel
3SG    ro
for_purpose gans
sit    hav
eat    mad
  END_LEXICON
  "sample.txt" => <<~END_SAMPLE,
    > In a hole in the ground there lived a hobbit.
    in/CAP hole in/M1/DEFOBJ ground past_p dwell hobbit.

    > Not a nasty, slimy, wet hole, full of the ends of worms and an oozy smell,
    nothing/CAP of/M1 hole nasty/M1, slimy, wet, and_p fill/PASS use/M1/DEFOBJ
    end_n/PL of/M1 worm/PL and_n smell ooze/ADJ/M1,

    > nor yet a dry, bare, sandy hole, with nothing in it to sit down on or to eat.
    and_n nothing of/M1 hole dry/M1, bare, sand/ADJ, have nothing in/M1 3SG for_purpose
    sit/INCH/GER and_n nothing for_purpose/M1 eat/GER.

  END_SAMPLE
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
      w.sub /^[^aeiou]+(?=[aeiou])/ do |init|
        case init
        when "p" then "b"
        when "t" then "d"
        when "c", "k" then "g"
        when "b" then "v"
        when "d" then "dh"
        when "g" then "'"
        else init
        end
      end
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
  }
}
