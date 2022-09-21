def sort filename
  order_by_column = 0
  order_by_column = 1 if ARGV.length > 0

  entries = File.read(filename).lines
    .map(&:chomp)
    .map { |line| line.split(/ +/, 2) }
    .sort { |a, b| a[order_by_column] <=> b[order_by_column] }

  max_first_column_length = entries.reduce(0) { |max, entry|
    [max, entry[0].length].max
  }

  File.write filename, entries
    .map { |first, second| first.ljust(max_first_column_length + 1) + second }
    .join("\n")
end