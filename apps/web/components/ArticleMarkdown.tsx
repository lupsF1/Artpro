"use client";

import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

type Props = {
  content: string;
  className?: string;
};

/**
 * 安全渲染 Markdown（GFM + 清洗 HTML），用于官网资讯与后台预览。
 */
export function ArticleMarkdown({ content, className }: Props) {
  return (
    <div
      className={
        className ??
        "prose prose-stone max-w-none prose-headings:font-serif prose-headings:font-semibold prose-a:text-stone-700 prose-a:underline-offset-2 prose-pre:bg-stone-100/90 prose-pre:text-stone-800"
      }
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          a: ({ href, children, ...rest }) => (
            <a
              href={href}
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noreferrer noopener" : undefined}
              {...rest}
            >
              {children}
            </a>
          ),
        }}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
  );
}
