"use client";

import { useState } from "react";
import { ArticleMarkdown } from "@/components/ArticleMarkdown";

type Props = {
  body: string;
  /** 可滚动区域高度（默认适合单块预览）；侧栏双块时可传如 max-h-[calc((100dvh-14rem)/2)] */
  scrollBoxClassName?: string;
};

/** 管理端：正文 Markdown 实时预览。 */
export function AdminArticleMdPreview({ body, scrollBoxClassName }: Props) {
  const [open, setOpen] = useState(true);
  if (!open) {
    return (
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-stone-500 underline underline-offset-2 hover:text-stone-700"
        >
          显示 Markdown 预览
        </button>
      </div>
    );
  }
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-stone-500">Markdown 预览</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-stone-400 hover:text-stone-600"
        >
          收起
        </button>
      </div>
      <div
        className={`overflow-y-auto rounded-xl border border-stone-200/90 bg-stone-50/80 p-4 ${
          scrollBoxClassName ?? "max-h-[min(50vh,28rem)]"
        }`}
      >
        {body?.trim() ? (
          <ArticleMarkdown
            content={body}
            className="prose prose-sm prose-stone max-w-none text-[13px] leading-relaxed"
          />
        ) : (
          <p className="text-sm text-stone-400">暂无正文，可在上方编辑。</p>
        )}
      </div>
    </div>
  );
}
