import Image from '@tiptap/extension-image'

export const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: null,
        parseHTML: element => element.getAttribute('class'),
        renderHTML: attributes => {
          if (!attributes.class) return {}
          return {
            class: attributes.class,
          }
        },
      },
      // Upload placeholder
      uploading: {
        default: null,
        parseHTML: element => element.getAttribute('data-uploading'),
        renderHTML: attributes => {
          if (!attributes.uploading) return {}
          return {
            'data-uploading': attributes.uploading,
          }
        },
      },
    }
  },
})