'use client'

import { Color } from '@tiptap/extension-color'
import ListItem from '@tiptap/extension-list-item'
import TextStyle from '@tiptap/extension-text-style'
import Youtube from '@tiptap/extension-youtube'
import { CustomImage } from './replacers/customImage'
import { EditorProvider, useCurrentEditor, Extension } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import React, { useEffect, useState } from 'react'
import { 
  RiArrowGoBackFill, RiArrowGoForwardFill, RiBold, 
  RiFormatClear, RiH1, RiH2, RiH3, RiH4, RiH5, RiH6, RiItalic, 
  RiListOrdered2, RiListUnordered, RiPageSeparator, RiParagraph, 
  RiQuoteText, RiSeparator, RiStrikethrough 
} from 'react-icons/ri'
import { SmilieReplacer } from './replacers/smilie_replacer'
import EmojiMartButton from './emoji_mart_popover'

// TipTap Rich editor box
export default function TipTap(props) {
  // Track text content
  const [content, setContent] = useState((props.content) ? props.content : (`<p>You shouldnt see this</p>`))
  // Read props for textarea size
  const textAreaClassName = (props.textAreaClassName) ? props.textAreaClassName : "max-h-[200px]";

  // useEffect to update content on editor change
  useEffect(() => {
    // Call parent update callback
    props.updateCallback(content)
  }, [content])


  const MenuBar = () => {
    const { editor } = useCurrentEditor()
    const [expanded, setExpanded] = useState(false)

    const buttonTailwind = (button_name, level) => {
      const out = "font-extralight border border-black px-2 py-1 sm:py-0 hover:brightness-90 rounded-full mx-[2px]"
      // Determine if button is active or not and edit css
      const active = (level) ? editor.isActive(button_name, level) : editor.isActive(button_name)
      const bgTailwind = (button_name && active) ? "strong bg-slate-700" : "bg-slate-500"
      // Combine and return
      return `${out} ${bgTailwind}`
    }

    if (!editor) {
      return null
    }

    return (
      <div className="rounded-t-2xl -m-2 mb-2">
        <div className="flex flex-wrap px-3 pt-1 justify-center bg-slate-500/50 rounded-t-2xl pb-1">
          {/* Core buttons — always visible */}
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={buttonTailwind("bold")}
          >
            <RiBold />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={buttonTailwind("italic")}
          >
            <RiItalic />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={buttonTailwind('bulletList')}
          >
            <RiListUnordered />
          </button>

          {/* Extra buttons — always visible on sm+, hidden on mobile unless expanded */}
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            className={`${buttonTailwind("strike")} ${expanded ? "" : "hidden sm:inline-flex"}`}
          >
            <RiStrikethrough />
          </button>
          <button
            onClick={() => editor.chain().focus().unsetAllMarks().run()}
            className={`${buttonTailwind()} ${expanded ? "" : "hidden sm:inline-flex"}`}
          >
            <RiFormatClear />
          </button>
          <button
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={`${buttonTailwind('paragraph')} ${expanded ? "" : "hidden sm:inline-flex"}`}
          >
            <RiParagraph />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`${buttonTailwind('heading', { level: 1 })} ${expanded ? "" : "hidden sm:inline-flex"}`}
          >
            <RiH1 />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`${buttonTailwind('heading', { level: 2 })} ${expanded ? "" : "hidden sm:inline-flex"}`}
          >
            <RiH2 />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`${buttonTailwind('heading', { level: 3 })} ${expanded ? "" : "hidden sm:inline-flex"}`}
          >
            <RiH3 />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`${buttonTailwind('orderedList')} ${expanded ? "" : "hidden sm:inline-flex"}`}
          >
            <RiListOrdered2 />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`${buttonTailwind('blockquote')} ${expanded ? "" : "hidden sm:inline-flex"}`}
          >
            <RiQuoteText />
          </button>
          <button
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className={`${buttonTailwind()} ${expanded ? "" : "hidden sm:inline-flex"}`}
          >
            <RiSeparator />
          </button>
          <button
            onClick={() => editor.chain().focus().setHardBreak().run()}
            className={`${buttonTailwind()} ${expanded ? "" : "hidden sm:inline-flex"}`}
          >
            <RiPageSeparator />
          </button>

          {/* More / Collapse toggle — only shown on mobile */}
          {!expanded ? (
            <button
              onClick={() => setExpanded(true)}
              className={`${buttonTailwind()} sm:hidden`}
              aria-label="More formatting options"
            >
              ···
            </button>
          ) : (
            <button
              onClick={() => setExpanded(false)}
              className={`${buttonTailwind()} sm:hidden`}
              aria-label="Collapse formatting options"
            >
              ✕
            </button>
          )}
        </div>
        <div className="w-full flex justify-between -mt-[22px] px-3">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className={`${buttonTailwind()} rounded-full`}
          >
            <RiArrowGoBackFill />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className={`${buttonTailwind()} rounded-full`}
          >
            <RiArrowGoForwardFill />
          </button>
        </div>
      </div>
    )
  }

  // =============================================================================================================================
  // EXTENSIONS
  // =============================================================================================================================

  const extensions = [
    SmilieReplacer,
    Color.configure({ types: [TextStyle.name, ListItem.name] }),
    TextStyle.configure({ types: [ListItem.name] }),
    // Below is commented out because it causes conflicts with the tenor gif integration
    // Link.configure({
    //   defaultProtocol: 'https',
    // }),
    StarterKit.configure({
      bulletList: {
        keepMarks: true,
        keepAttributes: false, // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
      },
      orderedList: {
        keepMarks: true,
        keepAttributes: false, // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
      },
    }),
    // Support Youtube Videos
    Youtube.configure({
      controls: true,
      nocookie: false,
      width: 300,
      height: 168.75
    }),
    CustomImage.configure({
      inline: true,
    }),
  ]

  // =============================================================================================================================
  // BOTTOM BUTTONS
  // =============================================================================================================================
  
  const EmojiPicker = () => {
    const { editor } = useCurrentEditor()

    const addEmoji = (emojiObj) => {
      if (!editor) return
      // Set editor to content + new emoji
      // If there is a native object, it is not a custom emoji
      if(emojiObj.native != undefined) {
        editor.commands.insertContent(`${emojiObj.native}`)
      }
      else {
        // insert image node with attrs; this uses the schema and preserves attributes
        editor.chain().focus().insertContent({
          type: 'image',
          attrs: {
            src: emojiObj.src,
            class: 'customEmoji',
            alt: emojiObj.name || 'emoji'
          }
        }).run()
      }
    }

    return (
      <div className="hidden sm:block absolute -bottom-5 -right-2">
        <EmojiMartButton 
          selectionCallback={addEmoji}
        />
      </div>
    )
  }

  // =============================================================================================================================
  // RETURN STATEMENT
  // =============================================================================================================================

  return (
    <>
      <div className="relative h-full mt-3 p-2 rounded-2xl border border-neutral-800">
        <EditorProvider 
          slotBefore={<MenuBar />}
          slotAfter={<EmojiPicker />}
          extensions={extensions} 
          content={content}
          onUpdate={({ editor }) => {
            setContent(editor.getHTML())
          }}
          editorProps={{
            attributes: {
              class: `prose prose-invert prose-sm max-w-full focus:outline-none overflow-y-scroll overflow-x-auto ${textAreaClassName}`,
            }}
          }
        ></EditorProvider>
      </div>
    </>
  )
}
