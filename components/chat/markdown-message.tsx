"use client"

import type { ReactNode } from "react"
import { useMemo } from "react"

type Block =
  | { type: "paragraph"; content: string }
  | { type: "heading"; depth: number; content: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "blockquote"; content: string }

const INLINE_TOKEN_REGEX = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`|\[[^\]]+\]\([^\)]+\))/g

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n")
  const blocks: Block[] = []
  let paragraphBuffer: string[] = []
  let listBuffer: { ordered: boolean; items: string[] } | null = null

  const flushParagraph = () => {
    if (paragraphBuffer.length) {
      blocks.push({ type: "paragraph", content: paragraphBuffer.join(" ") })
      paragraphBuffer = []
    }
  }

  const flushList = () => {
    if (listBuffer) {
      blocks.push({ type: "list", ordered: listBuffer.ordered, items: listBuffer.items })
      listBuffer = null
    }
  }

  lines.forEach((rawLine) => {
    const line = rawLine.trim()

    if (!line) {
      flushParagraph()
      flushList()
      return
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      flushParagraph()
      flushList()
      blocks.push({ type: "heading", depth: headingMatch[1].length, content: headingMatch[2].trim() })
      return
    }

    const blockquoteMatch = line.match(/^>\s?(.*)$/)
    if (blockquoteMatch) {
      flushParagraph()
      flushList()
      blocks.push({ type: "blockquote", content: blockquoteMatch[1] })
      return
    }

    const unorderedMatch = line.match(/^[-*+]\s+(.*)$/)
    if (unorderedMatch) {
      flushParagraph()
      if (!listBuffer || listBuffer.ordered) {
        flushList()
        listBuffer = { ordered: false, items: [] }
      }
      listBuffer!.items.push(unorderedMatch[1])
      return
    }

    const orderedMatch = line.match(/^(\d+)\.\s+(.*)$/)
    if (orderedMatch) {
      flushParagraph()
      if (!listBuffer || !listBuffer.ordered) {
        flushList()
        listBuffer = { ordered: true, items: [] }
      }
      listBuffer!.items.push(orderedMatch[2])
      return
    }

    paragraphBuffer.push(line)
  })

  flushParagraph()
  flushList()

  return blocks
}

function renderInline(content: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  const matches = content.matchAll(INLINE_TOKEN_REGEX)

  for (const match of matches) {
    const start = match.index ?? 0
    if (start > lastIndex) {
      nodes.push(content.slice(lastIndex, start))
    }

    const token = match[0]

    if (token.startsWith("**") || token.startsWith("__")) {
      nodes.push(<strong key={`${start}-strong`}>{renderInline(token.slice(2, -2))}</strong>)
    } else if (token.startsWith("*")) {
      nodes.push(<em key={`${start}-em`}>{renderInline(token.slice(1, -1))}</em>)
    } else if (token.startsWith("_")) {
      nodes.push(<em key={`${start}-em`}>{renderInline(token.slice(1, -1))}</em>)
    } else if (token.startsWith("`")) {
      nodes.push(
        <code key={`${start}-code`} className="rounded bg-black/10 px-1 py-0.5 text-xs font-mono">
          {token.slice(1, -1)}
        </code>,
      )
    } else if (token.startsWith("[")) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^\)]+)\)$/)
      if (linkMatch) {
        nodes.push(
          <a key={`${start}-link`} href={linkMatch[2]} target="_blank" rel="noreferrer" className="underline">
            {renderInline(linkMatch[1])}
          </a>,
        )
      } else {
        nodes.push(token)
      }
    }

    lastIndex = start + token.length
  }

  if (lastIndex < content.length) {
    nodes.push(content.slice(lastIndex))
  }

  return nodes
}

export function MarkdownMessage({ content }: { content: string }) {
  const blocks = useMemo(() => parseBlocks(content), [content])

  if (blocks.length === 0) {
    return <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
  }

  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading": {
            const HeadingTag = (`h${Math.min(block.depth, 4)}` as keyof JSX.IntrinsicElements) || "h4"
            return (
              <HeadingTag key={`heading-${index}`} className="text-base font-semibold">
                {renderInline(block.content)}
              </HeadingTag>
            )
          }
          case "list": {
            const ListTag = block.ordered ? "ol" : "ul"
            return (
              <ListTag
                key={`list-${index}`}
                className={`ml-4 space-y-1 ${block.ordered ? "list-decimal" : "list-disc"}`}
              >
                {block.items.map((item, itemIndex) => (
                  <li key={`list-${index}-${itemIndex}`} className="marker:text-current">
                    {renderInline(item)}
                  </li>
                ))}
              </ListTag>
            )
          }
          case "blockquote": {
            return (
              <blockquote
                key={`blockquote-${index}`}
                className="border-l-4 border-border/60 pl-3 italic text-muted-foreground"
              >
                {renderInline(block.content)}
              </blockquote>
            )
          }
          case "paragraph":
          default:
            return (
              <p key={`paragraph-${index}`} className="whitespace-pre-wrap">
                {renderInline(block.content)}
              </p>
            )
        }
      })}
    </div>
  )
}

