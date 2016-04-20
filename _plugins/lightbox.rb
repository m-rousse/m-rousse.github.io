module Jekyll
  class LightBox < Liquid::Tag

    def initialize(tag_name, text, tokens)
      super
      @text = text
    end

    def render(context)
      "<div class=\"lightboximg\"><a href=\"/images/#{@text}\" data-lightbox=\"lightbox-image\" class=\"lightboximg\"><img src=\"/thumbs/#{@text}\" class=\"lightboximg\"/></a></div>"
    end
  end
end

Liquid::Template.register_tag('lightbox', Jekyll::LightBox)
