function renderInlineMarkdown(text, keyPrefix) {
  return text.split(/(\*\*[^*\n]+\*\*|`[^`\n]+`)/g).filter(Boolean).map((part, index) => {
    const key = `${keyPrefix}-${index}`

    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong className="font-semibold text-text" key={key}>{part.slice(2, -2)}</strong>
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return <code className="rounded-[2px] bg-surface-muted px-1 py-0.5 font-mono text-[0.9em]" key={key}>{part.slice(1, -1)}</code>
    }

    return part
  })
}

function markdownBlocks(content) {
  const lines = content.replace(/\r\n?/g, '\n').split('\n')
  const blocks = []
  let paragraph = []
  let list = []

  function flushParagraph() {
    if (paragraph.length === 0) return
    blocks.push({ type: 'paragraph', lines: paragraph })
    paragraph = []
  }

  function flushList() {
    if (list.length === 0) return
    blocks.push({ type: 'list', items: list })
    list = []
  }

  lines.forEach((line) => {
    const listItem = line.match(/^\s*[-*]\s+(.+)$/)

    if (listItem) {
      flushParagraph()
      list.push(listItem[1])
      return
    }

    if (line.trim() === '') {
      flushParagraph()
      flushList()
      return
    }

    flushList()
    paragraph.push(line.trim())
  })

  flushParagraph()
  flushList()

  return blocks
}

export default function AssistantMessageContent({ content }) {
  return (
    <div className="max-w-[760px] space-y-3 break-words bg-transparent text-base leading-[1.65] text-text">
      {markdownBlocks(content).map((block, blockIndex) => block.type === 'list' ? (
        <ul className="list-disc space-y-1 pl-6" key={`list-${blockIndex}`}>
          {block.items.map((item, itemIndex) => (
            <li key={`item-${blockIndex}-${itemIndex}`}>{renderInlineMarkdown(item, `item-${blockIndex}-${itemIndex}`)}</li>
          ))}
        </ul>
      ) : (
        <p className="bg-transparent" key={`paragraph-${blockIndex}`}>
          {renderInlineMarkdown(block.lines.join(' '), `paragraph-${blockIndex}`)}
        </p>
      ))}
    </div>
  )
}
