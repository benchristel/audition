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