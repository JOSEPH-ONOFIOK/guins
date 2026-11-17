"use client";

import { useEffect, useState } from "react";
import { AIRDROP_POST } from "@/lib/airdrop";
import { X_HANDLE } from "@/lib/entry";
import { Icon } from "./Icon";
import { ArrowIcon, XIcon } from "./Nav";

// One simple $RPENG task: quote our post on X. The post is the airdrop post an
// admin sets at /admin, or AIRDROP_POST in the code until they do.
const TEXT = `$RPENG 🐧 The colony's gold.\n\n@${X_HANDLE}`;

export function QuotePost() {
  const [post, setPost] = useState(AIRDROP_POST);
  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => d.links?.airdropPost && setPost(d.links.airdropPost))
      .catch(() => {});
  }, []);

  const quote = `https://x.com/intent/post?${new URLSearchParams({ text: TEXT, url: post })}`;

  return (
    <div className="glass flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent text-accent-ink">
          <Icon name="repost" className="h-6 w-6" />
        </span>
        <div>
          <p className="label label-accent">$RPENG</p>
          <h2 className="mt-1 font-display text-3xl leading-none font-bold uppercase sm:text-4xl">Quote the post.</h2>
          <p className="mt-2 max-w-md text-dim">Quote our $RPENG post on X. That&apos;s it.</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <a href={quote} target="_blank" rel="noreferrer" className="btn btn-accent !px-6 !py-4">
          <XIcon /> Quote on X <ArrowIcon />
        </a>
        <a href={post} target="_blank" rel="noreferrer" className="text-sm font-bold text-dim underline underline-offset-4 hover:text-fg">
          View post
        </a>
      </div>
    </div>
  );
}
