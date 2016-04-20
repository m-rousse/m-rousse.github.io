module Jekyll
  class LightBox < Liquid::Tag

    def initialize(tag_name, text, tokens)
      super
      @text = text
    end

    def render(context)
      "<a href=\"/images/#{@text}\" data-lightbox=\"lightbox-image\"><img src=\"/thumbs/#{@text}\" /></a>"
    end
  end
end

Liquid::Template.register_tag('lightbox', Jekyll::LightBox)
