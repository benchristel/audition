class Directory
  def initialize(path)
    @base = path
  end

  def [](name)
    abs_path = File.join(@base, name)
    wrapper =
      if File.directory? abs_path
        Directory
      else
        FileContents
      end
    
    wrapper.new(abs_path)
  end
end

class FileContents
  def initialize(path)
    @path = path
  end

  def to_s
    @s ||= File.read(@path)
  end

  def call(*args)
    IO.popen([@path, *args]).read.chomp
  end

  def method_missing(meth, *args, &block)
    to_s.send meth, *args, &block
  end
end