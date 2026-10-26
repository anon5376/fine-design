"use client"

import type { ReactNode } from "react"
import { MACROS } from "./macros"
import { Shot, type ShotCam } from "./shot"
import { ScaleWipe, Title, WhipPan } from "./transitions"

// The engine's proof stills (see lab.tsx): case i shows at film time i + 0.5.
//   0-9    each macro's v1 framing through Shot (macro.Component), at 0.7 local: compare with the v1 renders of the same frames
//   10-19  each macro at a large zoom on one of its anchors, mid-action
//   20-29  every anchor of each macro drawn (debug), a moderate zoom, mid-action
//   30-32  zoom 30 and 40 on a 16px icon, and a tilted extreme close-up (crispness)
//   33-36  ScaleWipe (rect cover, circle reveal with a rim), WhipPan down, Title alignments, each at the middle of its move

type Case = (t: number) => ReactNode
const slug = (s: string) => MACROS.find(m => m.slug === s)!

// [slug, anchor, zoom, macro seconds, extra cam fields, options]
const CLOSE: [string, string, number, number, Partial<ShotCam>, Record<string, string | number>?][] = [
  ["copy-button", "check", 25, 0.75, {}],
  ["async-status", "label", 15, 0.8, { ry: -6 }],
  ["confirm-button", "question", 9, 0.7, { ry: -4 }],
  ["reaction-button", "starCount", 32, 0.9, { ry: -4 }, { first: "star" }],
  ["notification-bell", "badge", 30, 0.45, { ry: -6, rx: 2 }],
  ["password-input", "caret", 9, 0.45, {}],
  ["otp-input", "ring", 12, 0.5, { ry: -5 }, { every: 0.2 }],
  ["checklist", "strikeFront", 14, 0.55, { ry: -4 }],
  ["stepper", "ring", 7, 0.7, { rx: 6, ry: -8 }],
  ["auto-height", "bottom", 6, 0.5, { rx: -3, ry: 4 }],
]
const DEBUG: [string, number, number][] = [
  ["copy-button", 0.7, 3.4],
  ["async-status", 0.7, 4.4],
  ["confirm-button", 0.7, 2.6],
  ["reaction-button", 1.0, 4.2],
  ["notification-bell", 0.9, 5.2],
  ["password-input", 0.45, 2.7],
  ["otp-input", 0.5, 2.6],
  ["checklist", 0.55, 3.8],
  ["stepper", 0.7, 4.3],
  ["auto-height", 0.5, 3.4],
]

export const LAB_CASES: Case[] = [
  ...MACROS.map<Case>(m => () => <m.Component t={0.7} />),
  ...CLOSE.map<Case>(([s, anchor, zoom, mt, extra, options]) => () => {
    const { content, preset, scheme } = slug(s)
    return <Shot preset={preset} scheme={scheme} t={mt} content={content} options={options} cam={{ zoom, focus: content.anchors(mt, preset, options)[anchor], ...extra }} />
  }),
  ...DEBUG.map<Case>(([s, mt, zoom]) => () => {
    const { content, preset, scheme, } = slug(s)
    return <Shot preset={preset} scheme={scheme} t={mt} content={content} debug cam={{ zoom, focus: { x: content.size.w / 2, y: content.size.h / 2 } }} />
  }),
  () => {
    const { content, preset, scheme } = slug("copy-button")
    return <Shot preset={preset} scheme={scheme} t={0.9} content={content} cam={{ zoom: 30, focus: content.anchors(0.9, preset).icon }} />
  },
  () => {
    const { content, preset, scheme } = slug("copy-button")
    return <Shot preset={preset} scheme={scheme} t={0.9} content={content} cam={{ zoom: 40, focus: content.anchors(0.9, preset).icon, ry: 8, rx: -5, rz: 3, push: 1.05 }} />
  },
  () => {
    const { content, preset, scheme } = slug("checklist")
    return <Shot preset={preset} scheme={scheme} t={0.5} content={content} cam={{ zoom: 26, focus: content.anchors(0.5, preset).box, ry: -10, rx: 6, at: { x: 700, y: 540 } }} />
  },
  // 33-36: the transitions, mid-move. A and B are two different shots to move between.
  t => <ScaleWipe from={<A />} to={<B />} shape="rect" origin={{ x: 560, y: 540 }} colour="var(--primary)" t={t} at={0.2} dur={0.6} r0={60} radius={60} />,
  t => <ScaleWipe from={<A />} to={<B />} shape="circle" mode="reveal" origin={{ x: 1400, y: 300 }} colour="var(--primary)" rim={14} t={t} at={0.2} dur={0.6} />,
  t => <WhipPan from={<A />} to={<B />} dir="down" t={t} at={0.2} dur={0.6} />,
  t => (
    <A>
      <Title text="Center" t={t} at={0} preset="ledger" scheme="light" size={160} x={960} y={100} align="center" />
      <Title text="Right edge" t={t} at={0} preset="ledger" scheme="light" size={120} x={1824} y={700} align="right" tone="muted" />
      <Title text="Gone" t={t} at={0} preset="ledger" scheme="light" size={160} x={96} y={820} until={0.3} leave={0.4} />
    </A>
  ),
]

const A = ({ children }: { children?: ReactNode }) => {
  const { content, preset, scheme } = slug("copy-button")
  return (
    <Shot preset={preset} scheme={scheme} t={0.9} content={content} cam={{ zoom: 6, focus: { x: 120, y: 24 } }}>
      {children}
    </Shot>
  )
}
const B = () => {
  const { content, preset, scheme } = slug("password-input")
  return <Shot preset={preset} scheme={scheme} t={1.2} content={content} cam={{ zoom: 4, focus: { x: 140, y: 70 } }} />
}
